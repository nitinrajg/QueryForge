import Dexie, { type EntityTable } from 'dexie';

export interface ProblemProgressRecord {
  id: string;
  status: 'not_started' | 'attempted' | 'solved';
  attempts: number;
  timeSpentSeconds: number;
  hintsUsed: number;
  lastCode: string;
  updatedAt: string;
}

export interface LessonProgressRecord {
  id: string;
  read: boolean;
  updatedAt: string;
}

export interface ActivityRecord {
  id?: number;
  type: 'solved_problem' | 'attempted_problem' | 'read_lesson';
  targetId: string;
  title: string;
  timestamp: string;
}

export interface PendingSyncRecord {
  id?: number;
  entity: 'user_progress' | 'submission' | 'custom_testcase';
  payload: any;
  timestamp: string;
}

/**
 * Client-Side Dexie (IndexedDB) Database.
 * 
 * Logic & Approach:
 * Stores all progress locally on the learner's machine with 0 backend dependencies.
 * Provides offline queue and instant optimistic mutations.
 */
class QueryForgeDatabase extends Dexie {
  problemProgress!: EntityTable<ProblemProgressRecord, 'id'>;
  lessonProgress!: EntityTable<LessonProgressRecord, 'id'>;
  activity!: EntityTable<ActivityRecord, 'id'>;
  pendingSync!: EntityTable<PendingSyncRecord, 'id'>;

  constructor() {
    super('QueryForgeDatabase');
    this.version(1).stores({
      problemProgress: 'id, status, attempts, updatedAt',
      lessonProgress: 'id, read, updatedAt',
      activity: '++id, type, targetId, timestamp',
    });
    this.version(2).stores({
      problemProgress: 'id, status, attempts, updatedAt',
      lessonProgress: 'id, read, updatedAt',
      activity: '++id, type, targetId, timestamp',
      pendingSync: '++id, entity, timestamp',
    });
  }
}

export const db = new QueryForgeDatabase();
