import React, { useState, useEffect } from 'react';
import { engineManager } from '@/engines/engine-manager';
import { QueryResult } from '@/engines/types';
import datasetsData from '@/content/datasets.json';
import { cn } from '@/lib/cn';

const EXAMPLE_QUERIES = [
  {
    label: 'Top 5 salaries by department',
    sql: 'SELECT employee_name, department, salary FROM employees ORDER BY salary DESC LIMIT 5;',
  },
  {
    label: 'Department headcount and payroll',
    sql: 'SELECT department, count(*) as staff, sum(salary) as payroll FROM employees GROUP BY department;',
  },
  {
    label: 'Employees with active projects',
    sql: 'SELECT e.employee_name, count(ep.project_id) as projects FROM employees e JOIN employee_projects ep ON e.employee_id = ep.employee_id GROUP BY e.employee_id LIMIT 5;',
  },
];

interface QueryInputProps {
  className?: string;
}

/**
 * Interactive Showcase Component: 'Headline you can type'.
 * A query typed directly into the headline input executes against in-browser WebAssembly engine
 * in real-time, rendering real rows from the employer_database.
 */
export const QueryInput: React.FC<QueryInputProps> = ({ className }) => {
  const [query, setQuery] = useState(EXAMPLE_QUERIES[0].sql);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Initialize dataset on mount
  useEffect(() => {
    const initEngine = async () => {
      try {
        const defaultDataset = (datasetsData as any).employer_database;
        if (defaultDataset?.sql) {
          await engineManager.loadDataset(defaultDataset.sql);
          executeLiveQuery(query);
        }
      } catch (err: any) {
        console.error('Failed to load initial dataset for headline input:', err);
      }
    };
    initEngine();
  }, []);

  const executeLiveQuery = async (sqlToRun: string) => {
    if (!sqlToRun.trim()) {
      setResult(null);
      setError(null);
      return;
    }
    setIsRunning(true);
    setError(null);
    try {
      const res = await engineManager.run(sqlToRun);
      if (res.error) {
        setError(res.error);
        setResult(null);
      } else {
        setResult(res);
      }
    } catch (err: any) {
      setError(err.message || String(err));
      setResult(null);
    } finally {
      setIsRunning(false);
    }
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    executeLiveQuery(val);
  };

  const setExample = (sql: string) => {
    setQuery(sql);
    executeLiveQuery(sql);
  };

  return (
    <div data-ui="query-input" className={cn('w-full space-y-6', className)}>
      {/* Headline Input (The sentence is a real query) */}
      <div className="space-y-2">
        <label htmlFor="headline-sql-input" className="block text-xs text-[var(--muted)]">
          Type any SQL statement against the 9-table sample database:
        </label>
        <div className="relative">
          <input
            id="headline-sql-input"
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="SELECT * FROM employees LIMIT 5;"
            className="w-full bg-[var(--surface)] text-[var(--ink)] font-mono text-base sm:text-lg lg:text-xl p-4 rounded-none border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
          />
          {isRunning && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono text-[var(--accent)]">
              executing...
            </span>
          )}
        </div>
      </div>

      {/* Example Query Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--muted)]">Try preset:</span>
        {EXAMPLE_QUERIES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setExample(ex.sql)}
            className={cn(
              'px-2.5 py-1 text-xs transition-colors rounded-none border border-[var(--border)] cursor-pointer',
              query === ex.sql
                ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold'
                : 'bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Live Result Output */}
      {error && (
        <div className="p-3 bg-[var(--pill-negative-bg)] border border-[var(--negative)] text-[var(--pill-negative-ink)] font-mono text-xs">
          {error}
        </div>
      )}

      {result && result.columns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="tabular-nums">
              {result.rowCount} row{result.rowCount === 1 ? '' : 's'} returned in {result.timeMs}ms
            </span>
            <span className="text-[11px] text-[var(--muted)]">in-memory WebAssembly</span>
          </div>

          <div className="overflow-x-auto border border-[var(--border)] bg-[var(--surface)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                <tr>
                  {result.columns.map((col, idx) => (
                    <th key={idx} className="py-2.5 px-3 font-normal">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {result.rows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[var(--raised)] transition-colors">
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          'py-2 px-3 text-[var(--ink)]',
                          typeof val === 'number' ? 'tabular-nums text-right' : ''
                        )}
                      >
                        {val === null ? <span className="text-[var(--muted)]">NULL</span> : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
