import { useState, useEffect } from 'react';
import { useOfflineSync } from './useOfflineSync';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const { isSyncing, pendingCount, syncNow } = useOfflineSync();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute derived status text matching UI specifications
  let statusText = 'Connected';
  if (!isOnline) {
    statusText = 'Working Offline';
  } else if (isSyncing) {
    statusText = `Syncing... [${pendingCount} remaining]`;
  } else if (pendingCount > 0) {
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
