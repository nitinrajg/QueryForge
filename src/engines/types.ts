/**
 * Engine Interface and Data Types for QueryForge.
 * Standardizes execution across SQLite, MySQL compatibility mode, PostgreSQL, and pandas.
 */

export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  timeMs: number;
  error?: string;
}

export interface TableColumn {
  name: string;
  type: string;
  primaryKey?: boolean;
}

export interface TableSchema {
  name: string;
  columns: TableColumn[];
  rowCount?: number;
  sampleRows?: (string | number | boolean | null)[][];
}

export type SupportedEngine = 'sqlite' | 'mysql' | 'pglite' | 'pandas';

export interface EngineInterface {
  id: SupportedEngine;
  name: string;
  isReady: boolean;
  init(): Promise<void>;
  loadDataset(sql: string): Promise<void>;
  run(code: string): Promise<QueryResult>;
  reset(): Promise<void>;
  cancel(): void;
  getSchema(): Promise<TableSchema[]>;
}

