// syncs offline changes back to supabase.
// processes mutations in order with a small delay to avoid rate limits.

import { createClient } from '@supabase/supabase-js';
import { getSecureCache, setSecureCache } from './secureCache';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export interface OfflineMutation {
  id: string;
  operation: 'INSERT' | 'UPDATE';
  table: 'youth_profiles' | 'programs' | 'registration_submissions';
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
  operation: 'INSERT' | 'UPDATE',
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
  const { data: remoteData, error: fetchError } = await supabase
    .from(table)
    .select('*')
    .eq('id', recordId)
    .maybeSingle();

  if (fetchError) {
    console.error(`Fetch error during sync for ${table}/${recordId}:`, fetchError);
    throw fetchError;
  }

  // check if remote has newer updates
  if (remoteData && remoteData.updated_at) {
    const remoteTime = new Date(remoteData.updated_at).getTime();
    const localTime = new Date(localUpdatedAt).getTime();

    if (localTime < remoteTime) {
      console.warn(`LWW Conflict: Remote record in ${table} (${recordId}) is newer (${remoteData.updated_at}) than local update (${localUpdatedAt}). Discarding local update.`);
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
      const insertPayload = { ...payload };
      const isMockId = recordId.startsWith('PROG-') || recordId.startsWith('SUB-');
      if (isMockId) {
        delete insertPayload.id;
      } else {
        insertPayload.id = recordId;
      }
      insertPayload.updated_at = localUpdatedAt;

      const { data: insertedData, error: insertError } = await supabase
        .from(table)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error(`Sync insert error for ${table}/${recordId}:`, insertError);
        if (isTransientError(insertError)) throw insertError;
        return false;
      }

      if (insertedData && isMockId) {
        await replaceLocalMockId(table, recordId, insertedData);
      }
    }
  } else if (operation === 'UPDATE') {
    if (!remoteData) {
      const insertPayload = { ...payload };
      const isMockId = recordId.startsWith('PROG-') || recordId.startsWith('SUB-');
      if (isMockId) {
        delete insertPayload.id;
      } else {
        insertPayload.id = recordId;
      }
      insertPayload.updated_at = localUpdatedAt;

      const { data: insertedData, error: insertError } = await supabase
        .from(table)
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.error(`Sync update-as-insert error for ${table}/${recordId}:`, insertError);
        if (isTransientError(insertError)) throw insertError;
        return false;
      }

      if (insertedData && isMockId) {
        await replaceLocalMockId(table, recordId, insertedData);
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

function mapDbProfileToClient(p: any): any {
  return {
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    middleName: p.middle_name,
    age: p.age,
    gender: p.gender,
    dob: p.date_of_birth,
    civilStatus: p.civil_status,
    bloodType: p.blood_type,
    nationality: p.nationality,
    contactNumber: p.contact_number,
    email: p.email,
    additionalEmail: p.additional_email || '',
    address: p.home_address,
    purok: p.purok,
    isRegisteredVoter: p.is_registered_voter,
    precinctNumber: p.precinct_number,
    educationLevel: p.education_level,
    educationalStatus: p.educational_status,
    scholarshipStatus: p.scholarship_status,
    youthClassification: p.youth_classification || '',
    workStatus: p.work_status || '',
    workSpecify: p.work_specify || '',
    educationBackground: p.education_background || '',
    educationSpecify: p.education_specify || '',
    hasScholarship: p.has_scholarship || '',
    scholarshipSpecify: p.scholarship_specify || '',
    participatedLastKKElection: p.participated_last_kk_election || '',
    attendedKKAssembly: p.attended_kk_assembly || '',
    kkAssemblyCount: p.kk_assembly_count || 0,
    skills: p.skills || [],
    facebookLink: p.facebook_link || '',
    avatarUrl: p.profile_picture_url || '',
    status: p.status,
    participationRate: 90,
    joinedDate: p.joined_date ? new Date(p.joined_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown',
    attendanceLogs: []
  };
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
    mapper = mapDbProfileToClient;
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

async function replaceLocalMockId(table: string, mockId: string, remoteRecord: any) {
  let cacheKey = '';
  let mapper: (item: any) => any;

  if (table === 'programs') {
    cacheKey = 'kk_programs';
    mapper = mapDbProgramToClient;
  } else if (table === 'registration_submissions') {
    cacheKey = 'kk_web_submissions';
    mapper = mapDbSubmissionToClient;
  } else {
    return;
  }

  const list = await getSecureCache<any[]>(cacheKey, []);
  const idx = list.findIndex((x: any) => x.id === mockId);
  if (idx !== -1) {
    list[idx] = mapper(remoteRecord);
    await setSecureCache(cacheKey, list);
  }
}

async function saveSyncFailureAuditLog(item: OfflineMutation) {
  const logs = await getSecureCache<any[]>('kk_audit_logs', []);
  const fullLog = {
    id: `LOG-${Math.floor(Math.random() * 900000) + 100000}`,
    action: 'SYNC_FAILURE',
    table_name: item.table,
    old_values: null,
    new_values: {
      queueId: item.id,
      recordId: item.recordId,
      operation: item.operation,
      payloadSize: JSON.stringify(item.payload).length,
      error: `Sync failed after 3 retries. Record discarded.`
    },
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
