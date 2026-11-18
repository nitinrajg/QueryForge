/**
 * Core content data models for QueryForge.
 * Matches the Track > Module > Lesson / Problem hierarchy defined in PRD Section 4.
 */

export interface ExpectedOutput {
  columns: string[];
  rows: (string | number | boolean | null)[][];
}

export interface ProblemItem {
  id: string;
  number: number;
  title: string;
  trackId: string;
  moduleId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  description: string;
  datasetSql: string;
  expectedOutput: ExpectedOutput;
  solutionSql: string;
  hints: string[];
  explanation: string;
  engines: string[];
  sourceUrl?: string;
}

export interface TocItem {
  level: number;
  text: string;
  id: string;
}

export interface LessonItem {
  id: string;
  slug: string;
  title: string;
  trackId: string;
  moduleId: string;
  order: number;
  content: string;
  toc: TocItem[];
}

export interface ModuleItem {
  id: string;
  title: string;
  trackId: string;
  order: number;
  description: string;
  lessonIds: string[];
  problemIds: string[];
}

export interface TrackItem {
  id: string;
  title: string;
  order: number;
  description: string;
  modules: ModuleItem[];
  totalLessons: number;
  totalProblems: number;
}

export interface SharedDataset {
  name: string;
  description: string;
  sql: string;
}

