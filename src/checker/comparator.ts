import { QueryResult } from '@/engines/types';
import { ExpectedOutput } from '@/content/types';
import { MismatchCategory, MismatchDetails } from '@/types/testcase';

export interface CheckOptions {
  ordered?: boolean;
  numericTolerance?: number;
  caseSensitiveColumns?: boolean;
}

export interface DetailedComparisonResult {
  passed: boolean;
  verdictStatus: 'accepted' | 'wrong_answer' | 'error' | 'executed';
  message: string;
  mismatch?: MismatchDetails;
  diffMatrix?: ('match' | 'differ' | 'missing' | 'extra')[][];
}

/**
 * Normalizes values for resilient comparison:
 * - Trims whitespace on strings
 * - Handles numeric equality with tolerance (e.g., 1e-4)
 * - Standardizes null / undefined equivalents
 */
export function valuesMatch(a: any, b: any, tolerance = 1e-4): boolean {
  if (a === b) return true;
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;

  // Numeric check with floating point tolerance
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB) && typeof a !== 'boolean' && typeof b !== 'boolean') {
    return Math.abs(numA - numB) <= tolerance;
  }

  // String comparison trimmed
  const strA = String(a).trim();
  const strB = String(b).trim();
  return strA.toLowerCase() === strB.toLowerCase();
}

/**
 * Compares two row arrays column by column using tolerance.
 */
function rowsMatch(rowA: any[], rowB: any[], numCols: number, tolerance: number): boolean {
  if (!rowA || !rowB) return false;
  for (let c = 0; c < numCols; c++) {
    if (!valuesMatch(rowA[c], rowB[c], tolerance)) return false;
  }
  return true;
}

/**
 * Order-independent multiset equivalence checker with floating point tolerance.
 */
function multisetEquals(rowsA: any[][], rowsB: any[][], numCols: number, tolerance: number): boolean {
  if (rowsA.length !== rowsB.length) return false;
  const usedB = new Set<number>();
  for (let i = 0; i < rowsA.length; i++) {
    let found = false;
    for (let j = 0; j < rowsB.length; j++) {
      if (!usedB.has(j) && rowsMatch(rowsA[i], rowsB[j], numCols, tolerance)) {
        usedB.add(j);
        found = true;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}

/**
 * Pure, comprehensive comparator that classifies result discrepancies into 6 distinct mismatch types:
 * - empty_result
 * - column_mismatch
 * - row_count
 * - order_mismatch
 * - duplicate_rows
 * - value_mismatch
 */
export function compareResults(
  actual: QueryResult,
  expected?: ExpectedOutput | null,
  options: CheckOptions = {}
): DetailedComparisonResult {
  // If no expected output is provided, mark as neutral 'executed'
  if (!expected || !expected.columns || expected.columns.length === 0) {
    return {
      passed: true,
      verdictStatus: 'executed',
      message: 'Query executed successfully. (No expected output testcase defined for verification)',
    };
  }

  if (actual.error) {
    return {
      passed: false,
      verdictStatus: 'error',
      message: `SQL Execution Error: ${actual.error}`,
    };
  }

  const {
    ordered = false,
    numericTolerance = 1e-4,
    caseSensitiveColumns = false,
  } = options;

  const expCols = expected.columns || [];
  const actCols = actual.columns || [];
  const expRows = expected.rows || [];
  const actRows = actual.rows || [];

  // 1. Column Verification
  const normalizeCol = (c: string) => (caseSensitiveColumns ? c.trim() : c.toLowerCase().trim());
  const actColsNorm = actCols.map(normalizeCol);
  const expColsNorm = expCols.map(normalizeCol);

  const missingColumns = expCols.filter((c) => !actColsNorm.includes(normalizeCol(c)));
  const extraColumns = actCols.filter((c) => !expColsNorm.includes(normalizeCol(c)));

  if (missingColumns.length > 0 || (actCols.length !== expCols.length && actCols.length > 0)) {
    return {
      passed: false,
      verdictStatus: 'wrong_answer',
      message: missingColumns.length > 0
        ? `Column mismatch: Missing expected column(s): ${missingColumns.join(', ')}.`
        : `Column mismatch: Expected ${expCols.length} column(s), but query returned ${actCols.length}.`,
      mismatch: {
        category: 'column_mismatch',
        summary: missingColumns.length > 0
          ? `Missing expected column(s): ${missingColumns.join(', ')}`
          : `Expected columns [${expCols.join(', ')}], got [${actCols.join(', ')}]`,
        missingColumns,
        extraColumns,
      },
    };
  }

  // 2. Empty Result Check
  if (actRows.length === 0 && expRows.length > 0) {
    return {
      passed: false,
      verdictStatus: 'wrong_answer',
      message: `Empty result: Query returned 0 rows, but expected ${expRows.length} row(s).`,
      mismatch: {
        category: 'empty_result',
        summary: `Query returned 0 rows (expected ${expRows.length})`,
        expectedCount: expRows.length,
        actualCount: 0,
      },
    };
  }

  // 3. Row Count Mismatch
  if (actRows.length !== expRows.length) {
    return {
      passed: false,
      verdictStatus: 'wrong_answer',
      message: `Row count mismatch: Expected ${expRows.length} row(s), but got ${actRows.length}.`,
      mismatch: {
        category: 'row_count',
        summary: `Expected ${expRows.length} rows, got ${actRows.length}`,
        expectedCount: expRows.length,
        actualCount: actRows.length,
      },
    };
  }

  // Both empty
  if (expRows.length === 0 && actRows.length === 0) {
    return {
      passed: true,
      verdictStatus: 'accepted',
      message: 'Accepted! Correct: Query returned expected empty result set.',
    };
  }

  // 4. Sequential Row Check and Diff Matrix Generation
  let sequentialMatches = true;
  let firstMismatchRow = -1;
  let firstMismatchCol = -1;
  let expectedMismatchVal: any = null;
  let actualMismatchVal: any = null;

  const diffMatrix: ('match' | 'differ' | 'missing' | 'extra')[][] = [];

  for (let r = 0; r < expRows.length; r++) {
    const rowDiff: ('match' | 'differ' | 'missing' | 'extra')[] = [];
    const aRow = actRows[r] || [];
    const eRow = expRows[r] || [];

    for (let c = 0; c < expCols.length; c++) {
      const match = valuesMatch(aRow[c], eRow[c], numericTolerance);
      if (match) {
        rowDiff.push('match');
      } else {
        rowDiff.push('differ');
        sequentialMatches = false;
        if (firstMismatchRow === -1) {
          firstMismatchRow = r;
          firstMismatchCol = c;
          actualMismatchVal = aRow[c];
          expectedMismatchVal = eRow[c];
        }
      }
    }
    diffMatrix.push(rowDiff);
  }

  // Check if multiset matches regardless of sequence
  const multisetMatches = multisetEquals(actRows, expRows, expCols.length, numericTolerance);

  // If order matters and sequential order differed
  if (multisetMatches && !sequentialMatches && ordered) {
    return {
      passed: false,
      verdictStatus: 'wrong_answer',
      message: `Order mismatch: Rows match expected data, but returned in different sort order.`,
      mismatch: {
        category: 'order_mismatch',
        summary: 'Correct rows, but sorting differs (check ORDER BY clause)',
        orderDiffRowIndex: firstMismatchRow,
      },
      diffMatrix,
    };
  }

  // If multiset matches and (order doesn't matter OR sequence matched exactly)
  if (multisetMatches && (!ordered || sequentialMatches)) {
    return {
      passed: true,
      verdictStatus: 'accepted',
      message: 'Accepted! Correct answer: All test assertions passed with matching rows and columns.',
    };
  }

  // Check for duplicate rows mismatch
  const countRowMatches = (row: any[], rowsList: any[][]) =>
    rowsList.filter((r) => rowsMatch(row, r, expCols.length, numericTolerance)).length;

  let hasDuplicateMismatch = false;
  for (const aRow of actRows) {
    const aCount = countRowMatches(aRow, actRows);
    const eCount = countRowMatches(aRow, expRows);
    if (aCount > 1 && aCount > eCount) {
      hasDuplicateMismatch = true;
      break;
    }
  }

  if (hasDuplicateMismatch) {
    return {
      passed: false,
      verdictStatus: 'wrong_answer',
      message: 'Duplicate rows mismatch: Output contains redundant rows not present in expected answer.',
      mismatch: {
        category: 'duplicate_rows',
        summary: 'Query contains duplicate rows (check your JOIN or DISTINCT clause)',
        expectedCount: expRows.length,
        actualCount: actRows.length,
      },
      diffMatrix,
    };
  }

  // 6. Value Mismatch
  return {
    passed: false,
    verdictStatus: 'wrong_answer',
    message: `Value mismatch at row ${firstMismatchRow + 1}, column "${expCols[firstMismatchCol]}": expected "${expectedMismatchVal ?? 'null'}", got "${actualMismatchVal ?? 'null'}".`,
    mismatch: {
      category: 'value_mismatch',
      summary: `Cell mismatch in row ${firstMismatchRow + 1}: expected '${expectedMismatchVal ?? 'null'}', got '${actualMismatchVal ?? 'null'}'`,
      differingRowIndex: firstMismatchRow,
      differingColumnIndex: firstMismatchCol,
      expectedVal: expectedMismatchVal,
      actualVal: actualMismatchVal,
    },
    diffMatrix,
  };
}

// Backward compatibility alias
export type CheckResult = {
  passed: boolean;
  message: string;
  differences?: any;
};