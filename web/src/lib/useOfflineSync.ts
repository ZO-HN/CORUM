import { useState, useEffect } from 'react';
import { subscribeToSync, syncOfflineQueue, getOfflineQueue, isSyncingNow, OfflineMutation } from './offlineSync';

export function useOfflineSync() {
  const [syncState, setSyncState] = useState<{ queue: OfflineMutation[]; isSyncing: boolean }>({
    queue: getOfflineQueue(),
    isSyncing: isSyncingNow()
  });

  useEffect(() => {
    const unsubscribe = subscribeToSync((state) => {
      setSyncState(state);
    });
    return unsubscribe;
  }, []);

  return {
    queue: syncState.queue,
    isSyncing: syncState.isSyncing,
    pendingCount: syncState.queue.length,
    syncNow: syncOfflineQueue
  };
}
