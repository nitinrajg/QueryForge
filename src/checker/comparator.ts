import { QueryResult } from '@/engines/types';
import { ExpectedOutput } from '@/content/types';

export interface CheckOptions {
  ordered?: boolean;
  numericTolerance?: number;
  caseSensitiveColumns?: boolean;
}

export interface CheckResult {
  passed: boolean;
  message: string;
  differences?: {
    expectedRowCount: number;
    actualRowCount: number;
    expectedColumns: string[];
    actualColumns: string[];
    missingColumns?: string[];
    mismatchedRowIndex?: number;
    expectedRow?: (string | number | boolean | null)[];
    actualRow?: (string | number | boolean | null)[];
  };
}

/**
 * Normalizes values for resilient comparison:
 * - Trims whitespace on strings
 * - Handles numeric equality with tolerance
 * - Reconciles null / undefined / empty string equivalents
 */
function valuesMatch(a: any, b: any, tolerance = 0.02): boolean {
  if (a === b) return true;
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;

  // Numeric check
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB) && typeof a !== 'boolean' && typeof b !== 'boolean') {
    return Math.abs(numA - numB) <= tolerance;
  }

  // String comparison
  const strA = String(a).trim().toLowerCase();
  const strB = String(b).trim().toLowerCase();
  return strA === strB;
}

/**
 * Stable row serialization for order-insensitive comparison.
 */
function serializeRow(row: any[]): string {
  return row
    .map((v) => {
      if (v === null || v === undefined) return 'null';
      const num = Number(v);
      if (!isNaN(num)) return num.toFixed(2);
      return String(v).trim().toLowerCase();
    })
    .join('||');
}

/**
 * Compares an actual QueryResult with the ExpectedOutput.
 * 
 * Logic & Approach:
 * 1. Column matching:
 *    Compares column headers case-insensitively. Verifies all expected columns exist.
 * 2. Row count matching:
 *    Ensures row count matches before element-by-element deep comparison.
 * 3. Sorting & Order-insensitivity:
 *    If `ordered: false` (default for SQL queries without explicit ORDER BY requirements),
 *    both actual and expected row sets are canonically sorted before comparing rows.
 * 4. Value Tolerance:
 *    Supports floating point arithmetic differences (e.g. 33.33% vs 33.333) with configurable tolerance.
 */
export function compareResults(
  actual: QueryResult,
  expected: ExpectedOutput,
  options: CheckOptions = {}
): CheckResult {
  const {
    ordered = false,
    numericTolerance = 0.02,
    caseSensitiveColumns = false,
  } = options;

  if (actual.error) {
    return {
      passed: false,
      message: `SQL Execution Error: ${actual.error}`,
    };
  }

  // 1. Column Verification
  const expCols = expected.columns || [];
  const actCols = actual.columns || [];

  if (expCols.length > 0) {
    const normalizeCol = (c: string) => (caseSensitiveColumns ? c : c.toLowerCase().trim());
    const actColsNorm = actCols.map(normalizeCol);

    const missing = expCols.filter((c) => !actColsNorm.includes(normalizeCol(c)));
    if (missing.length > 0) {
      return {
        passed: false,
        message: `Missing expected column(s): ${missing.join(', ')}`,
        differences: {
          expectedRowCount: expected.rows.length,
          actualRowCount: actual.rowCount,
          expectedColumns: expCols,
          actualColumns: actCols,
          missingColumns: missing,
        },
      };
    }
  }

  // 2. Row Count Verification
  const expRows = expected.rows || [];
  const actRows = actual.rows || [];

  if (actRows.length !== expRows.length) {
    return {
      passed: false,
      message: `Row count mismatch: expected ${expRows.length} row(s), but got ${actRows.length}.`,
      differences: {
        expectedRowCount: expRows.length,
        actualRowCount: actRows.length,
        expectedColumns: expCols,
        actualColumns: actCols,
      },
    };
  }

  if (expRows.length === 0 && actRows.length === 0) {
    return {
      passed: true,
      message: 'Query returned expected empty result set.',
    };
  }

  // 3. Row Data Comparison
  let processedActual = actRows;
  let processedExpected = expRows;

  if (!ordered) {
    processedActual = [...actRows].sort((a, b) =>
      serializeRow(a).localeCompare(serializeRow(b))
    );
    processedExpected = [...expRows].sort((a, b) =>
      serializeRow(a).localeCompare(serializeRow(b))
    );
  }

  for (let i = 0; i < processedExpected.length; i++) {
    const eRow = processedExpected[i];
    const aRow = processedActual[i];

    for (let j = 0; j < expCols.length; j++) {
      if (!valuesMatch(aRow[j], eRow[j], numericTolerance)) {
        return {
          passed: false,
          message: `Mismatch in row ${i + 1}, column "${expCols[j]}": expected "${eRow[j]}", got "${aRow[j]}".`,
          differences: {
            expectedRowCount: expRows.length,
            actualRowCount: actRows.length,
            expectedColumns: expCols,
            actualColumns: actCols,
            mismatchedRowIndex: i + 1,
            expectedRow: eRow,
            actualRow: aRow,
          },
        };
      }
    }
  }

  return {
    passed: true,
    message: 'Correct! All expected rows and columns matched.',
  };
}

