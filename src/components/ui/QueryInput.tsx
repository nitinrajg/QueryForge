import React, { useState, useEffect } from 'react';
import { engineManager } from '@/engines/engine-manager';
import { QueryResult } from '@/engines/types';
import { Terminal, Play, AlertCircle, Clock, Database, Check } from 'lucide-react';
import datasetsData from '@/content/datasets.json';
import { cn } from '@/lib/cn';

const EXAMPLE_QUERIES = [
  {
    label: 'Top 5 salaries by department',
    sql: 'SELECT employee_name, department, salary FROM employees ORDER BY salary DESC LIMIT 5;',
  },
  {
    label: 'Department headcount & payroll',
    sql: 'SELECT department, count(*) as staff, sum(salary) as payroll FROM employees GROUP BY department ORDER BY payroll DESC;',
  },
  {
    label: 'Employees with active projects',
    sql: 'SELECT e.employee_name, count(ep.project_id) as active_projects FROM employees e JOIN employee_projects ep ON e.employee_id = ep.employee_id GROUP BY e.employee_id LIMIT 5;',
  },
];

interface QueryInputProps {
  className?: string;
}

/**
 * Interactive Live SQL Input Component.
 * Runs instantly inside in-memory WebAssembly SQLite engine.
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
    <div data-ui="query-input" className={cn('w-full space-y-5', className)}>
      {/* Query Bar */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between text-xs text-[var(--muted)]">
          <label htmlFor="headline-sql-input" className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
            <Terminal className="h-4 w-4 text-[var(--accent)]" />
            <span>Interactive SQL Prompt</span>
          </label>
          <span className="font-mono text-[11px] text-[var(--muted)]">Schema: employer_database</span>
        </div>

        <div className="relative">
          <input
            id="headline-sql-input"
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="SELECT * FROM employees LIMIT 5;"
            className="w-full bg-[var(--surface-app)] text-[var(--ink)] font-mono text-sm sm:text-base p-3.5 pr-24 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors shadow-xs"
          />
          <button
            onClick={() => executeLiveQuery(query)}
            disabled={isRunning}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            {isRunning ? (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5 fill-current" />
            )}
            <span>Run</span>
          </button>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap items-center gap-2 text-left">
        <span className="text-xs text-[var(--muted)] font-medium">Quick examples:</span>
        {EXAMPLE_QUERIES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => setExample(ex.sql)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-colors border cursor-pointer',
              query === ex.sql
                ? 'bg-[var(--accent-subtle)] border-[var(--accent)]/40 text-[var(--accent)] font-semibold shadow-xs'
                : 'bg-[var(--surface-app)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--control)]'
            )}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* Live Error Display */}
      {error && (
        <div className="p-3.5 bg-[var(--pill-negative-bg)] border border-[var(--negative)]/30 rounded-lg text-[var(--pill-negative-ink)] font-mono text-xs text-left flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-[var(--negative)]" />
          <pre className="whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {/* Live Table Result Output */}
      {result && result.columns.length > 0 && (
        <div className="space-y-2 text-left">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]">
            <span className="tabular-nums font-mono">
              {result.rowCount} {result.rowCount === 1 ? 'row' : 'rows'} returned in {result.timeMs}ms
            </span>
            <span className="text-[11px] font-mono text-[var(--positive)] flex items-center gap-1">
              <Check className="h-3 w-3" />
              WebAssembly execution
            </span>
          </div>

          <div className="overflow-x-auto border border-[var(--border)] rounded-lg bg-[var(--surface-app)]">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="border-b border-[var(--border)] bg-[var(--raised)] text-[var(--muted)]">
                <tr>
                  {result.columns.map((col, idx) => (
                    <th key={idx} className="py-2.5 px-3.5 font-semibold text-[11px] text-[var(--ink)]">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {result.rows.slice(0, 6).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[var(--raised)]/40 transition-colors">
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          'py-2 px-3.5 text-[var(--ink)] text-[11px]',
                          typeof val === 'number' ? 'tabular-nums text-right' : ''
                        )}
                      >
                        {val === null ? <span className="text-[var(--warning)] italic">NULL</span> : String(val)}
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
