import { QueryResult, TableSchema } from '@/engines/types';

/**
 * Data models for LeetCode-style test cases and verdicts.
 */

export interface CustomRowData {
  id: string;
  values: Record<string, string | number | boolean | null>;
}

export interface CustomTableInput {
  tableName: string;
  rows: CustomRowData[];
  rawInsertSql?: string; // Manual SQL INSERT override
}

export interface TestCaseModel {
  id: string;
  label: string; // "Case 1", "Case 2", "Edge Case - Nulls"
  isDefault: boolean; // Case 1 is read-only generated from problem dataset
  inputs: CustomTableInput[];
  expectedOutput?: {
    columns: string[];
    rows: (string | number | boolean | null)[][];
  };
}

export type MismatchCategory =
  | 'row_count'
  | 'column_mismatch'
  | 'value_mismatch'
  | 'order_mismatch'
  | 'duplicate_rows'
  | 'empty_result';

export interface MismatchDetails {
  category: MismatchCategory;
  summary: string;
  expectedCount?: number;
  actualCount?: number;
  differingColumnIndex?: number;
  differingRowIndex?: number;
  expectedVal?: any;
  actualVal?: any;
  missingColumns?: string[];
  extraColumns?: string[];
  orderDiffRowIndex?: number;
}

export type SqlErrorCategory =
  | 'syntax_error'
  | 'unknown_column'
  | 'unknown_table'
  | 'ambiguous_column'
  | 'type_mismatch'
  | 'division_by_zero'
  | 'unsupported_statement'
  | 'timeout'
  | 'runtime_error';

export interface ParsedSqlError {
  category: SqlErrorCategory;
  badgeLabel: string;
  title: string;
  plainEnglishFix: string;
  rawMessage: string;
  line?: number;
  column?: number;
  token?: string;
  suggestion?: string; // e.g. "Did you mean 'product_id'?"
}

export interface CaseVerdict {
  caseId: string;
  caseLabel: string;
  status: 'accepted' | 'wrong_answer' | 'error' | 'executed' | 'running';
  runtimeMs: number;
  userResult?: QueryResult;
  expectedOutput?: {
    columns: string[];
    rows: (string | number | boolean | null)[][];
  };
  mismatch?: MismatchDetails;
  errorDiagnostic?: ParsedSqlError;
  diffMatrix?: ('match' | 'differ' | 'missing' | 'extra')[][];
}
