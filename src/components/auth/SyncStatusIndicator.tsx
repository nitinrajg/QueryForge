import React, { useEffect, useState } from 'react';
import { Cloud, CloudCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { syncService, SyncStatus } from '@/services/syncService';
import { useAuth } from '@/context/AuthContext';

/**
 * Discreet cloud synchronization status indicator.
 * Renders in the top navigation bar to give learners real-time
 * confidence that their code, progress, and verdicts are safely backed up.
 */
export const SyncStatusIndicator: React.FC = () => {
  const { user, isConfigured } = useAuth();
  const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    return syncService.subscribe((newStatus) => {
      setStatus(newStatus);
    });
  }, []);

  if (!isConfigured || !user) {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        title="Guest mode: All progress is stored locally in IndexedDB"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--faint)]" />
        <span className="hidden sm:inline">Guest (Local)</span>
      </div>
    );
  }

  const handleRetry = () => {
    syncService.flushOfflineQueue(user.id);
  };

  if (status === 'synced') {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-[var(--positive)] transition-colors"
        title="Cloud Synced: All drafts and solved problems are saved to your account"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--positive)] animate-pulse" />
        <span className="hidden sm:inline">Synced</span>
      </div>
    );
  }

  if (status === 'syncing') {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-[var(--accent)] transition-colors"
        title="Syncing progress to your Supabase account..."
      >
        <RefreshCw className="w-3 h-3 animate-spin text-[var(--accent)]" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    );
  }

  if (status === 'offline') {
    return (
      <div 
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-[var(--muted)] transition-colors"
        title="You are currently offline. Changes are saved locally and will sync when you reconnect."
      >
        <Cloud className="w-3 h-3 text-[var(--muted)]" />
        <span className="hidden sm:inline">Offline (Cached)</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleRetry}
      className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
      title="Sync failed. Click to retry syncing with Supabase."
    >
      <AlertCircle className="w-3 h-3 text-red-400" />
      <span className="hidden sm:inline">Sync Error (Retry)</span>
    </button>
  );
};
