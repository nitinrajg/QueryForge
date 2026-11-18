import { supabase, isSupabaseConfigured, UserProgressRow, SubmissionRow, CustomTestCaseRow } from '@/lib/supabase';
import { db, ProblemProgressRecord, PendingSyncRecord } from '@/lib/db';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

type StatusListener = (status: SyncStatus) => void;

class SyncService {
  private status: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced';
  private listeners: Set<StatusListener> = new Set();
  private draftDebounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isFlushingQueue = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('syncing');
        this.flushOfflineQueue().catch(() => this.setStatus('error'));
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });
    }
  }

  public getStatus(): SyncStatus {
    return this.status;
  }

  public subscribe(listener: StatusListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private setStatus(newStatus: SyncStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.listeners.forEach((fn) => fn(newStatus));
    }
  }

  /**
   * Resolves problem status monotonically.
   * A problem marked 'solved' CAN NEVER regress back to 'attempted' or 'not_started'.
   */
  public resolveMonotonicStatus(
    localStatus: 'not_started' | 'attempted' | 'solved',
    remoteStatus?: 'not_started' | 'attempted' | 'solved'
  ): 'not_started' | 'attempted' | 'solved' {
    if (localStatus === 'solved' || remoteStatus === 'solved') return 'solved';
    if (localStatus === 'attempted' || remoteStatus === 'attempted') return 'attempted';
    return 'not_started';
  }

  /**
   * Debounced sync for code drafts (500ms delay to avoid API thrashing while typing).
   */
  public scheduleDraftSync(userId: string, record: ProblemProgressRecord): void {
    if (!isSupabaseConfigured || !userId) return;

    const existing = this.draftDebounceTimers.get(record.id);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.draftDebounceTimers.delete(record.id);
      this.syncProblemProgress(userId, record).catch((err) => {
        console.warn('Draft sync failure:', err);
      });
    }, 500);

    this.draftDebounceTimers.set(record.id, timer);
  }

  /**
   * Immediately syncs problem progress to Supabase with monotonic status latch.
   */
  public async syncProblemProgress(userId: string, record: ProblemProgressRecord): Promise<void> {
    if (!isSupabaseConfigured || !userId) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await this.enqueueOffline('user_progress', { userId, record });
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      // 1. Fetch remote record to resolve potential concurrent updates
      const { data: remoteData, error: fetchError } = await supabase
        .from('user_progress')
        .select('status, attempts, hints_used, time_spent_seconds, last_code, updated_at')
        .eq('user_id', userId)
        .eq('problem_id', record.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      const remoteStatus = remoteData?.status as 'not_started' | 'attempted' | 'solved' | undefined;
      const finalStatus = this.resolveMonotonicStatus(record.status, remoteStatus);

      // Determine latest code: if remote updated_at is newer, prefer remote last_code unless local has recent code
      let finalCode = record.lastCode;
      if (remoteData?.updated_at && record.updatedAt) {
        const remoteTime = new Date(remoteData.updated_at).getTime();
        const localTime = new Date(record.updatedAt).getTime();
        if (remoteTime > localTime && remoteData.last_code) {
          finalCode = remoteData.last_code;
        }
      }

      const row: UserProgressRow = {
        user_id: userId,
        problem_id: record.id,
        status: finalStatus,
        attempts: Math.max(record.attempts, remoteData?.attempts || 0),
        time_spent_seconds: Math.max(record.timeSpentSeconds, remoteData?.time_spent_seconds || 0),
        hints_used: Math.max(record.hintsUsed, remoteData?.hints_used || 0),
        last_code: finalCode,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('user_progress')
        .upsert(row, { onConflict: 'user_id,problem_id' });

      if (upsertError) throw upsertError;

      this.setStatus('synced');
    } catch (err: any) {
      console.error('Error syncing problem progress to Supabase:', err);
      await this.enqueueOffline('user_progress', { userId, record });
      this.setStatus('error');
    }
  }

  /**
   * Persists a query submission execution record to Supabase.
   */
  public async syncSubmission(userId: string, submission: Omit<SubmissionRow, 'user_id'>): Promise<void> {
    if (!isSupabaseConfigured || !userId) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await this.enqueueOffline('submission', { userId, submission });
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      const { error } = await supabase
        .from('submissions')
        .insert([{ ...submission, user_id: userId }]);

      if (error) throw error;
      this.setStatus('synced');
    } catch (err: any) {
      console.error('Error syncing submission to Supabase:', err);
      await this.enqueueOffline('submission', { userId, submission });
      this.setStatus('error');
    }
  }

  /**
   * Syncs user-created custom test cases for a problem.
   */
  public async syncCustomTestcase(userId: string, testcase: Omit<CustomTestCaseRow, 'user_id'>): Promise<void> {
    if (!isSupabaseConfigured || !userId) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      await this.enqueueOffline('custom_testcase', { userId, testcase });
      this.setStatus('offline');
      return;
    }

    this.setStatus('syncing');

    try {
      const { error } = await supabase
        .from('custom_testcases')
        .upsert({
          ...testcase,
          user_id: userId,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      this.setStatus('synced');
    } catch (err: any) {
      console.error('Error syncing custom test case to Supabase:', err);
      await this.enqueueOffline('custom_testcase', { userId, testcase });
      this.setStatus('error');
    }
  }

  /**
   * Enqueues a failed or offline mutation into IndexedDB.
   */
  private async enqueueOffline(entity: PendingSyncRecord['entity'], payload: any): Promise<void> {
    try {
      await db.pendingSync.add({
        entity,
        payload,
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Failed to enqueue offline item:', e);
    }
  }

  /**
   * Flushes offline queue on reconnect.
   */
  public async flushOfflineQueue(userId?: string): Promise<void> {
    if (!isSupabaseConfigured || this.isFlushingQueue) return;
    this.isFlushingQueue = true;

    try {
      const pendingItems = await db.pendingSync.toArray();
      if (!pendingItems.length) {
        this.setStatus('synced');
        this.isFlushingQueue = false;
        return;
      }

      this.setStatus('syncing');

      for (const item of pendingItems) {
        try {
          const targetUserId = item.payload.userId || userId;
          if (!targetUserId) continue;

          if (item.entity === 'user_progress') {
            await this.syncProblemProgress(targetUserId, item.payload.record);
          } else if (item.entity === 'submission') {
            await this.syncSubmission(targetUserId, item.payload.submission);
          } else if (item.entity === 'custom_testcase') {
            await this.syncCustomTestcase(targetUserId, item.payload.testcase);
          }

          if (item.id) {
            await db.pendingSync.delete(item.id);
          }
        } catch (innerErr) {
          console.warn('Could not flush item, retaining for next retry:', innerErr);
        }
      }

      const remaining = await db.pendingSync.count();
      this.setStatus(remaining === 0 ? 'synced' : 'error');
    } finally {
      this.isFlushingQueue = false;
    }
  }

  /**
   * Merges local guest progress into the authenticated user's account.
   */
  public async mergeGuestProgress(userId: string): Promise<{ mergedCount: number }> {
    if (!isSupabaseConfigured || !userId) return { mergedCount: 0 };

    const localProblems = await db.problemProgress.toArray();
    if (!localProblems.length) return { mergedCount: 0 };

    this.setStatus('syncing');

    // Fetch existing user progress from Supabase
    const { data: remoteData } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    const remoteMap = new Map<string, any>();
    if (remoteData) {
      for (const row of remoteData) {
        remoteMap.set(row.problem_id, row);
      }
    }

    let mergedCount = 0;
    const upsertRows: UserProgressRow[] = [];

    for (const local of localProblems) {
      const remote = remoteMap.get(local.id);
      const finalStatus = this.resolveMonotonicStatus(local.status, remote?.status);

      upsertRows.push({
        user_id: userId,
        problem_id: local.id,
        status: finalStatus,
        attempts: Math.max(local.attempts, remote?.attempts || 0),
        time_spent_seconds: Math.max(local.timeSpentSeconds, remote?.time_spent_seconds || 0),
        hints_used: Math.max(local.hintsUsed, remote?.hints_used || 0),
        last_code: local.lastCode || remote?.last_code || '',
        updated_at: new Date().toISOString(),
      });
      mergedCount++;
    }

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from('user_progress')
        .upsert(upsertRows, { onConflict: 'user_id,problem_id' });

      if (error) {
        console.error('Failed to merge guest progress to Supabase:', error);
        this.setStatus('error');
        throw error;
      }
    }

    this.setStatus('synced');
    return { mergedCount };
  }
}

export const syncService = new SyncService();
