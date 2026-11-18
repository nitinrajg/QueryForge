import { create } from 'zustand';
import { db, ProblemProgressRecord, LessonProgressRecord, ActivityRecord } from '@/lib/db';
import { supabase, isSupabaseConfigured, UserProgressRow } from '@/lib/supabase';
import { syncService } from '@/services/syncService';

export interface ProgressState {
  problems: Record<string, ProblemProgressRecord>;
  lessons: Record<string, LessonProgressRecord>;
  activities: ActivityRecord[];
  isLoaded: boolean;

  // Actions
  init: () => Promise<void>;
  hydrateFromCloud: (userId: string) => Promise<void>;
  markProblem: (id: string, status: 'attempted' | 'solved', code?: string, title?: string) => Promise<void>;
  saveDraft: (id: string, code: string) => Promise<void>;
  markLessonRead: (id: string, title?: string) => Promise<void>;
  useHint: (id: string) => Promise<void>;
  exportProgress: () => Promise<string>;
  importProgress: (jsonData: string) => Promise<boolean>;
  resetAllProgress: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>((set, get) => ({
  problems: {},
  lessons: {},
  activities: [],
  isLoaded: false,

  init: async () => {
    try {
      const problemList = await db.problemProgress.toArray();
      const lessonList = await db.lessonProgress.toArray();
      const recentActivities = await db.activity.orderBy('timestamp').reverse().limit(30).toArray();

      const problems: Record<string, ProblemProgressRecord> = {};
      for (const p of problemList) problems[p.id] = p;

      const lessons: Record<string, LessonProgressRecord> = {};
      for (const l of lessonList) lessons[l.id] = l;

      set({
        problems,
        lessons,
        activities: recentActivities,
        isLoaded: true,
      });

      // If user is currently authenticated in Supabase, hydrate cloud updates
      if (isSupabaseConfigured) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await get().hydrateFromCloud(session.user.id);
        }
      }
    } catch (err) {
      console.warn('Failed to load progress from IndexedDB:', err);
      set({ isLoaded: true });
    }
  },

  hydrateFromCloud: async (userId: string) => {
    if (!isSupabaseConfigured || !userId) return;

    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('Error fetching cloud progress:', error);
        return;
      }

      if (!data || !data.length) return;

      const currentProblems = { ...get().problems };
      const recordsToPut: ProblemProgressRecord[] = [];

      for (const row of data as UserProgressRow[]) {
        const local = currentProblems[row.problem_id];
        const mergedStatus = syncService.resolveMonotonicStatus(
          local?.status || 'not_started',
          row.status
        );

        // Code resolution: if remote is newer or local is empty, take remote
        let mergedCode = local?.lastCode || '';
        if (row.last_code) {
          if (!local?.lastCode) {
            mergedCode = row.last_code;
          } else if (row.updated_at && local.updatedAt) {
            const remoteTime = new Date(row.updated_at).getTime();
            const localTime = new Date(local.updatedAt).getTime();
            if (remoteTime > localTime) {
              mergedCode = row.last_code;
            } else {
              mergedCode = local.lastCode;
            }
          }
        }

        const mergedRecord: ProblemProgressRecord = {
          id: row.problem_id,
          status: mergedStatus,
          attempts: Math.max(local?.attempts || 0, row.attempts || 0),
          timeSpentSeconds: Math.max(local?.timeSpentSeconds || 0, row.time_spent_seconds || 0),
          hintsUsed: Math.max(local?.hintsUsed || 0, row.hints_used || 0),
          lastCode: mergedCode,
          updatedAt: row.updated_at || new Date().toISOString(),
        };

        currentProblems[row.problem_id] = mergedRecord;
        recordsToPut.push(mergedRecord);
      }

      // Update in-memory state
      set({ problems: currentProblems });

      // Save to Dexie cache
      if (recordsToPut.length > 0) {
        await db.problemProgress.bulkPut(recordsToPut);
      }
    } catch (err) {
      console.warn('Exception during cloud progress hydration:', err);
    }
  },

  markProblem: async (id, status, code, title = id) => {
    const now = new Date().toISOString();
    const existing = get().problems[id] || {
      id,
      status: 'not_started',
      attempts: 0,
      timeSpentSeconds: 0,
      hintsUsed: 0,
      lastCode: '',
      updatedAt: now,
    };

    const nextStatus = syncService.resolveMonotonicStatus(existing.status, status);
    const updated: ProblemProgressRecord = {
      ...existing,
      status: nextStatus,
      attempts: existing.attempts + 1,
      lastCode: code !== undefined ? code : existing.lastCode,
      updatedAt: now,
    };

    // Update memory
    set((state) => ({
      problems: { ...state.problems, [id]: updated },
    }));

    // Persist to IndexedDB
    try {
      await db.problemProgress.put(updated);
      const activity: ActivityRecord = {
        type: status === 'solved' ? 'solved_problem' : 'attempted_problem',
        targetId: id,
        title,
        timestamp: now,
      };
      await db.activity.add(activity);
      const recent = await db.activity.orderBy('timestamp').reverse().limit(30).toArray();
      set({ activities: recent });
    } catch (e) {
      console.error('Error saving problem progress:', e);
    }

    // Cloud synchronization
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          syncService.syncProblemProgress(session.user.id, updated).catch(() => {});
        }
      } catch (e) {}
    }
  },

  saveDraft: async (id, code) => {
    const existing = get().problems[id];
    if (existing && existing.lastCode === code) return;

    const now = new Date().toISOString();
    const updated: ProblemProgressRecord = {
      ...(existing || {
        id,
        status: 'not_started',
        attempts: 0,
        timeSpentSeconds: 0,
        hintsUsed: 0,
      }),
      lastCode: code,
      updatedAt: now,
    };

    set((state) => ({
      problems: { ...state.problems, [id]: updated },
    }));

    try {
      await db.problemProgress.put(updated);
    } catch (e) {}

    // Debounced cloud synchronization
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          syncService.scheduleDraftSync(session.user.id, updated);
        }
      } catch (e) {}
    }
  },

  markLessonRead: async (id, title = id) => {
    const now = new Date().toISOString();
    const updated: LessonProgressRecord = {
      id,
      read: true,
      updatedAt: now,
    };

    set((state) => ({
      lessons: { ...state.lessons, [id]: updated },
    }));

    try {
      await db.lessonProgress.put(updated);
      await db.activity.add({
        type: 'read_lesson',
        targetId: id,
        title,
        timestamp: now,
      });
      const recent = await db.activity.orderBy('timestamp').reverse().limit(30).toArray();
      set({ activities: recent });
    } catch (e) {}
  },

  useHint: async (id) => {
    const existing = get().problems[id];
    if (!existing) return;
    const updated: ProblemProgressRecord = {
      ...existing,
      hintsUsed: (existing.hintsUsed || 0) + 1,
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({
      problems: { ...state.problems, [id]: updated },
    }));
    try {
      await db.problemProgress.put(updated);
    } catch (e) {}

    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          syncService.scheduleDraftSync(session.user.id, updated);
        }
      } catch (e) {}
    }
  },

  exportProgress: async () => {
    const state = get();
    const exportData = {
      exportedAt: new Date().toISOString(),
      problems: state.problems,
      lessons: state.lessons,
      activities: state.activities,
    };
    return JSON.stringify(exportData, null, 2);
  },

  importProgress: async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.problems && !parsed.lessons) return false;

      // Clear current DB
      await db.problemProgress.clear();
      await db.lessonProgress.clear();
      await db.activity.clear();

      // Repopulate
      if (parsed.problems) {
        await db.problemProgress.bulkPut(Object.values(parsed.problems));
      }
      if (parsed.lessons) {
        await db.lessonProgress.bulkPut(Object.values(parsed.lessons));
      }
      if (parsed.activities && Array.isArray(parsed.activities)) {
        await db.activity.bulkAdd(parsed.activities);
      }

      await get().init();
      return true;
    } catch (err) {
      console.error('Failed to import progress data:', err);
      return false;
    }
  },

  resetAllProgress: async () => {
    try {
      await db.problemProgress.clear();
      await db.lessonProgress.clear();
      await db.activity.clear();
      set({
        problems: {},
        lessons: {},
        activities: [],
      });
    } catch (err) {
      console.error('Failed to reset progress:', err);
    }
  },
}));
