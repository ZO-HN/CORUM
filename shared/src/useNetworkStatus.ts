import { useSyncExternalStore } from 'react';
import { useOfflineSync } from './useOfflineSync';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

function getServerSnapshot() {
  return true;
}

export function useNetworkStatus() {
  // ponytail: standard library useSyncExternalStore solves window event state tracking in one go.
  // Ceiling: single window subscriber. Upgrade path: custom ping checks if standard onLine isn't sufficient.
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { isSyncing, pendingCount, syncNow } = useOfflineSync();

  let statusText = 'Connected';
  if (!isOnline) {
    statusText = 'Working Offline';
  } else if (isSyncing || pendingCount > 0) {
    statusText = `Syncing... [${pendingCount} remaining]`;
  }

  return {
    isOnline,
    isSyncing,
    pendingCount,
    statusText,
    syncNow
  };
}
