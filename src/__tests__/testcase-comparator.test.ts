import { describe, it, expect } from 'vitest';
import { compareResults } from '@/checker/comparator';
import { parseSqlError } from '@/checker/error-parser';
import { TableSchema, QueryResult } from '@/engines/types';

describe('Error Parser & Levenshtein Fuzzy Matching', () => {
  const schema: TableSchema[] = [
    {
      name: 'Products',
      rowCount: 5,
      columns: [
        { name: 'product_id', type: 'INT', primaryKey: true },
        { name: 'low_fats', type: 'TEXT' },
        { name: 'recyclable', type: 'TEXT' },
      ],
    },
    {
      name: 'Orders',
      rowCount: 10,
      columns: [
        { name: 'order_id', type: 'INT', primaryKey: true },
        { name: 'customer_id', type: 'INT' },
      ],
    },
  ];

  it('detects unknown column and provides fuzzy suggestion', () => {
    const rawError = 'no such column: produc_id';
    const parsed = parseSqlError(rawError, schema);

    expect(parsed.category).toBe('unknown_column');
    expect(parsed.badgeLabel).toBe('Unknown Column');
    expect(parsed.suggestion).toBe('product_id');
    expect(parsed.plainEnglishFix).toContain("Did you mean 'product_id'?");
  });

  it('detects unknown table and provides schema feedback', () => {
    const rawError = 'no such table: Prducts';
    const parsed = parseSqlError(rawError, schema);

    expect(parsed.category).toBe('unknown_table');
    expect(parsed.badgeLabel).toBe('Table Not Found');
    expect(parsed.suggestion).toBe('Products');
  });

  it('extracts line and token coordinates from syntax errors', () => {
    const rawError = 'near "WHER": syntax error at line 3, column 5';
    const parsed = parseSqlError(rawError, schema);

    expect(parsed.category).toBe('syntax_error');
    expect(parsed.token).toBe('WHER');
    expect(parsed.line).toBe(3);
    expect(parsed.column).toBe(5);
  });
});

describe('Enhanced Comparator (6 Mismatch Categories & Diff Matrix)', () => {
  it('identifies value_mismatch and generates cell-level diff matrix', () => {
    const actual: QueryResult = {
      columns: ['id', 'val'],
      rows: [
        [1, 'A'],
        [2, 'WrongVal'],
      ],
      rowCount: 2,
      timeMs: 2,
    };

    const expected = {
      columns: ['id', 'val'],
      rows: [
        [1, 'A'],
        [2, 'B'],
      ],
    };

    const result = compareResults(actual, expected);
    expect(result.passed).toBe(false);
    expect(result.verdictStatus).toBe('wrong_answer');
    expect(result.mismatch?.category).toBe('value_mismatch');
    expect(result.mismatch?.differingRowIndex).toBe(1);
    expect(result.mismatch?.differingColumnIndex).toBe(1);

    // Diff matrix checks
    expect(result.diffMatrix).toBeDefined();
    expect(result.diffMatrix![0]).toEqual(['match', 'match']);
    expect(result.diffMatrix![1]).toEqual(['match', 'differ']);
  });

  it('identifies order_mismatch when ordered=true', () => {
    const actual: QueryResult = {
      columns: ['id'],
      rows: [[3], [2], [1]],
      rowCount: 3,
      timeMs: 1,
    };

    const expected = {
      columns: ['id'],
      rows: [[1], [2], [3]],
    };

    const result = compareResults(actual, expected, { ordered: true });
    expect(result.passed).toBe(false);
    expect(result.mismatch?.category).toBe('order_mismatch');
  });

  it('identifies duplicate_rows when query returns duplicates absent from expected', () => {
    const actual: QueryResult = {
      columns: ['id'],
      rows: [[1], [1]],
      rowCount: 2,
      timeMs: 1,
    };

    const expected = {
      columns: ['id'],
      rows: [[1], [2]],
    };

    // Row count matches (2 and 2), but actual has duplicate [1] and misses [2]
    const result = compareResults(actual, expected);
    expect(result.passed).toBe(false);
    expect(result.mismatch?.category).toBe('duplicate_rows');
  });

  it('returns neutral executed verdict when no expected output is defined', () => {
    const actual: QueryResult = {
      columns: ['custom_metric'],
      rows: [[42]],
      rowCount: 1,
      timeMs: 1,
    };

    const result = compareResults(actual, undefined);
    expect(result.passed).toBe(true);
    expect(result.verdictStatus).toBe('executed');
    expect(result.message).toContain('No expected output testcase defined');
  });
});
