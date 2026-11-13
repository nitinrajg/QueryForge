import { describe, it, expect } from 'vitest';
import { compareResults } from '@/checker/comparator';
import { QueryResult } from '@/engines/types';
import { ExpectedOutput } from '@/content/types';

describe('Answer Checker (compareResults)', () => {
  it('passes on identical rows and columns', () => {
    const actual: QueryResult = {
      columns: ['id', 'name', 'salary'],
      rows: [
        [1, 'Alice', 100000],
        [2, 'Bob', 90000],
      ],
      rowCount: 2,
      timeMs: 4,
    };

    const expected: ExpectedOutput = {
      columns: ['id', 'name', 'salary'],
      rows: [
        [1, 'Alice', 100000],
        [2, 'Bob', 90000],
      ],
    };

    const res = compareResults(actual, expected);
    expect(res.passed).toBe(true);
    expect(res.message).toContain('Correct');
  });

  it('passes on case-insensitive column headers and whitespace normalization', () => {
    const actual: QueryResult = {
      columns: ['ID', 'Employee_Name'],
      rows: [[101, 'John Doe']],
      rowCount: 1,
      timeMs: 2,
    };

    const expected: ExpectedOutput = {
      columns: ['id', 'employee_name'],
      rows: [[101, 'John Doe ']],
    };

    const res = compareResults(actual, expected);
    expect(res.passed).toBe(true);
  });

  it('passes when row order differs if ordered=false', () => {
    const actual: QueryResult = {
      columns: ['id'],
      rows: [[2], [1], [3]],
      rowCount: 3,
      timeMs: 2,
    };

    const expected: ExpectedOutput = {
      columns: ['id'],
      rows: [[1], [2], [3]],
    };

    const res = compareResults(actual, expected, { ordered: false });
    expect(res.passed).toBe(true);
  });

  it('fails when row count mismatches', () => {
    const actual: QueryResult = {
      columns: ['id'],
      rows: [[1], [2]],
      rowCount: 2,
      timeMs: 1,
    };

    const expected: ExpectedOutput = {
      columns: ['id'],
      rows: [[1], [2], [3]],
    };

    const res = compareResults(actual, expected);
    expect(res.passed).toBe(false);
    expect(res.message).toContain('Row count mismatch');
  });

  it('handles numeric floating point tolerance (e.g. percentages / averages)', () => {
    const actual: QueryResult = {
      columns: ['rate'],
      rows: [[33.3333]],
      rowCount: 1,
      timeMs: 1,
    };

    const expected: ExpectedOutput = {
      columns: ['rate'],
      rows: [[33.33]],
    };

    const res = compareResults(actual, expected, { numericTolerance: 0.02 });
    expect(res.passed).toBe(true);
  });

  it('reports missing expected columns with clear feedback', () => {
    const actual: QueryResult = {
      columns: ['first_name'],
      rows: [['Alice']],
      rowCount: 1,
      timeMs: 1,
    };

    const expected: ExpectedOutput = {
      columns: ['first_name', 'department'],
      rows: [['Alice', 'IT']],
    };

    const res = compareResults(actual, expected);
    expect(res.passed).toBe(false);
    expect(res.message).toContain('Missing expected column(s): department');
  });

  it('handles SQL execution errors gracefully', () => {
    const actual: QueryResult = {
      columns: [],
      rows: [],
      rowCount: 0,
      timeMs: 1,
      error: 'no such table: unknown_table',
    };

    const expected: ExpectedOutput = {
      columns: ['id'],
      rows: [[1]],
    };

    const res = compareResults(actual, expected);
    expect(res.passed).toBe(false);
    expect(res.message).toContain('SQL Execution Error: no such table: unknown_table');
  });
});

