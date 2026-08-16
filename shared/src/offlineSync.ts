// syncs offline changes back to supabase.
// processes mutations in order with a small delay to avoid rate limits.

import { getSecureCache, setSecureCache } from './secureCache';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { mapDbRowToProfileFields } from './profileMapper';

export interface OfflineMutation {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table: 'youth_profiles' | 'programs' | 'registration_submissions' | 'documents';
  recordId: string;
  payload: any;
  localUpdatedAt: string;
  enqueuedAt: string;
  retries: number;
}

// state for sync queue and status
let currentQueue: OfflineMutation[] = [];
let currentIsSyncing = false;

type Listener = (state: { queue: OfflineMutation[]; isSyncing: boolean }) => void;
const listeners = new Set<Listener>();

export function subscribeToSync(listener: Listener) {
  listeners.add(listener);
  listener({ queue: currentQueue, isSyncing: currentIsSyncing });
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  for (const listener of listeners) {
    listener({ queue: [...currentQueue], isSyncing: currentIsSyncing });
  }
}

// queue up local changes to sync later
export async function enqueueMutation(
  operation: OfflineMutation['operation'],
  table: OfflineMutation['table'],
  recordId: string,
  payload: any
): Promise<void> {
  const localUpdatedAt = new Date().toISOString();
  const newMutation: OfflineMutation = {
    id: `MUT-${Math.floor(Math.random() * 900000) + 100000}`,
    operation,
    table,
    recordId,
    payload,
    localUpdatedAt,
    enqueuedAt: localUpdatedAt,
    retries: 0,
  };

  currentQueue.push(newMutation);
  await setSecureCache('kk_offline_queue', currentQueue);
  notifyListeners();

  // try syncing immediately if online
  if (navigator.onLine) {
    syncOfflineQueue();
  }
}

// get all pending queue items
export function getOfflineQueue(): OfflineMutation[] {
  return currentQueue;
}

export function isSyncingNow(): boolean {
  return currentIsSyncing;
}

// wipe the queue (like when logging out)
export async function clearOfflineQueue(): Promise<void> {
  currentQueue = [];
  await setSecureCache('kk_offline_queue', []);
  notifyListeners();
}

// sync loop to process queue items sequentially
export async function syncOfflineQueue(): Promise<void> {
  if (currentIsSyncing) return;
  if (!navigator.onLine || !supabase) return;

  currentIsSyncing = true;
  notifyListeners();

  try {
    // reload queue from cache
    currentQueue = await getSecureCache<OfflineMutation[]>('kk_offline_queue', []);

    let index = 0;
    while (index < currentQueue.length) {
      if (!navigator.onLine) {
        break; // stop if we gone offline
      }

      const item = currentQueue[index];
      let success = false;
      let shouldRetry = false;

      try {
        success = await processQueueItem(item);
      } catch (err) {
        console.error(`Error processing sync queue item ${item.id}:`, err);
        shouldRetry = true;
      }

      if (success) {
        currentQueue.splice(index, 1);
        await setSecureCache('kk_offline_queue', currentQueue);
        notifyListeners();
      } else {
        if (shouldRetry) {
          item.retries = (item.retries || 0) + 1;
          if (item.retries > 3) {
            console.error(`Sync queue item ${item.id} exceeded max retries. Discarding.`);
            currentQueue.splice(index, 1);
            await setSecureCache('kk_offline_queue', currentQueue);
            await saveSyncFailureAuditLog(item);
            notifyListeners();
          } else {
            await setSecureCache('kk_offline_queue', currentQueue);
            notifyListeners();
            break; // stop sync on network error
          }
        } else {
          // bad error or discarded by lww, just drop it
          currentQueue.splice(index, 1);
          await setSecureCache('kk_offline_queue', currentQueue);
          notifyListeners();
        }
      }

      // pace requests to avoid hitting rate limits
      if (currentQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
  } finally {
    currentIsSyncing = false;
    notifyListeners();
  }
}

// process a single queue item with last-write-wins conflict checks
async function processQueueItem(item: OfflineMutation): Promise<boolean> {
  if (!supabase) return false;

  const { table, operation, recordId, payload, localUpdatedAt } = item;

  // fetch remote record's updated time to check for conflicts
  const { data: fetchedData, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', recordId)
    .maybeSingle();

  let remoteData = fetchedData;

  if (fetchError) {
    // some roles (e.g. anon submitting registration_submissions) only ever
    // have INSERT on a table by design, with no SELECT grant at all — the
    // conflict check above is then impossible to run, not just empty. For a
    // fresh INSERT that's fine: there's nothing to conflict with from this
    // role's perspective, so proceed as if no remote row was found instead
    // of permanently failing every sync attempt for these records.
    if (fetchError.code === '42501' && operation === 'INSERT') {
      console.warn(`No SELECT permission to check for conflicts on ${table}/${recordId} — proceeding with plain insert.`);
      remoteData = null;
    } else {
      console.error(`Fetch error during sync for ${table}/${recordId}:`, fetchError);
      throw fetchError;
    }
  }

  // check if remote has newer updates
  if (remoteData && remoteData.updated_at) {
    const remoteTime = new Date(remoteData.updated_at).getTime();
    const localTime = new Date(localUpdatedAt).getTime();

    if (localTime < remoteTime) {
      console.warn(`LWW Conflict: Remote record in ${table} (${recordId}) is newer (${remoteData.updated_at}) than local update (${localUpdatedAt}). Discarding local update.`);
      await logSyncEventToServer('SYNC_CONFLICT_DISCARD', table, {
        recordId,
        localUpdatedAt,
        remoteUpdatedAt: remoteData.updated_at,
        note: 'Local offline change discarded — remote record was newer (last-write-wins).'
      });
      await updateLocalRecord(table, recordId, remoteData);
      return true;
    }
  }

  if (operation === 'INSERT') {
    if (remoteData) {
      const { error: updateError } = await supabase
        .from(table)
        .update({ ...payload, updated_at: localUpdatedAt })
        .eq('id', recordId);

      if (updateError) {
        console.error(`Sync update (converted from insert) error for ${table}/${recordId}:`, updateError);
        if (isTransientError(updateError)) throw updateError;
        return false;
      }
    } else {
      // record IDs are always client-generated UUIDs (crypto.randomUUID()),
      // matching what's already stored in the local cache, so the insert
      // uses that same id rather than letting the DB generate a new one.
      const insertPayload = { ...payload, id: recordId, updated_at: localUpdatedAt };

      const { error: insertError } = await supabase
        .from(table)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error(`Sync insert error for ${table}/${recordId}:`, insertError);
        if (isTransientError(insertError)) throw insertError;
        return false;
      }
    }
  } else if (operation === 'UPDATE') {
    if (!remoteData) {
      const insertPayload = { ...payload, id: recordId, updated_at: localUpdatedAt };

      const { error: insertError } = await supabase
        .from(table)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error(`Sync update-as-insert error for ${table}/${recordId}:`, insertError);
        if (isTransientError(insertError)) throw insertError;
        return false;
      }
    } else {
      const { error: updateError } = await supabase
        .from(table)
        .update({ ...payload, updated_at: localUpdatedAt })
        .eq('id', recordId);

      if (updateError) {
        console.error(`Sync update error for ${table}/${recordId}:`, updateError);
        if (isTransientError(updateError)) throw updateError;
        return false;
      }
    }
  } else if (operation === 'DELETE') {
    if (remoteData) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        console.error(`Sync delete error for ${table}/${recordId}:`, deleteError);
        if (isTransientError(deleteError)) throw deleteError;
        return false;
      }
    }
    // remoteData already gone — delete is idempotent, nothing to do
  }

  return true;
}

function isTransientError(error: any): boolean {
  if (!error) return false;
  const status = error.status || (error.code ? parseInt(error.code) : null);
  if (status === 0 || status === 429 || status === 503 || status === 504 || error.message?.toLowerCase().includes('fetch')) {
    return true;
  }
  return false;
}

function mapDbProgramToClient(p: any): any {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    startDate: new Date(p.start_date).toISOString().split('T')[0],
    endDate: new Date(p.end_date).toISOString().split('T')[0],
    status: p.status,
    registeredCount: 0,
    presentCount: 0,
    budget: p.budget || 10000
  };
}

function mapDbSubmissionToClient(s: any): any {
  return {
    id: s.id,
    formData: s.form_data,
    status: s.status,
    reviewerNotes: s.reviewer_notes,
    createdAt: s.created_at
  };
}

async function updateLocalRecord(table: string, recordId: string, remoteRecord: any) {
  let cacheKey = '';
  let mapper: (item: any) => any;
  
  if (table === 'youth_profiles') {
    cacheKey = 'kk_youth_profiles';
    mapper = mapDbRowToProfileFields;
  } else if (table === 'programs') {
    cacheKey = 'kk_programs';
    mapper = mapDbProgramToClient;
  } else if (table === 'registration_submissions') {
    cacheKey = 'kk_web_submissions';
    mapper = mapDbSubmissionToClient;
  } else {
    return;
  }

  const list = await getSecureCache<any[]>(cacheKey, []);
  const idx = list.findIndex((x: any) => x.id === recordId);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...mapper(remoteRecord) };
    await setSecureCache(cacheKey, list);
  }
}

// Best-effort write to the server audit_logs table, so admins reviewing
// history from a different device can see sync conflicts/failures that
// happened on this one. Requires an authenticated admin/staff session
// (al_allow_admin_staff_insert RLS policy) — silently skipped otherwise,
// e.g. anonymous resident sessions on the web portal, which always fall
// back to the local-only log below.
async function logSyncEventToServer(action: string, tableName: string, details: any) {
  if (!supabase) return;
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    await supabase.from('audit_logs').insert({
      user_id: userData.user.id,
      action,
      table_name: tableName,
      new_values: details
    });
  } catch (err) {
    console.error('Failed to write sync event to server audit_logs:', err);
  }
}

async function saveSyncFailureAuditLog(item: OfflineMutation) {
  const errorDetails = {
    queueId: item.id,
    recordId: item.recordId,
    operation: item.operation,
    payloadSize: JSON.stringify(item.payload).length,
    error: `Sync failed after 3 retries. Record discarded.`
  };

  await logSyncEventToServer('SYNC_FAILURE', item.table, errorDetails);

  const logs = await getSecureCache<any[]>('kk_audit_logs', []);
  const fullLog = {
    id: `LOG-${Math.floor(Math.random() * 900000) + 100000}`,
    action: 'SYNC_FAILURE',
    table_name: item.table,
    old_values: null,
    new_values: errorDetails,
    created_at: new Date().toISOString()
  };
  logs.unshift(fullLog);
  await setSecureCache('kk_audit_logs', logs);
}

// bootstrap sync engine
export async function initializeSyncEngine() {
  currentQueue = await getSecureCache<OfflineMutation[]>('kk_offline_queue', []);
  notifyListeners();

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      syncOfflineQueue();
    });
  }
}

if (typeof window !== 'undefined') {
  initializeSyncEngine();
}
