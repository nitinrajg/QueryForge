import React from 'react';
import { QueryResult } from '@/engines/types';
import { CheckResult } from '@/checker/comparator';
import { cn } from '@/lib/cn';

interface ResultsPanelProps {
  result: QueryResult | null;
  isLoading?: boolean;
  checkResult?: CheckResult | null;
  expectedOutput?: { columns: string[]; rows: any[][] };
}

/**
 * Data Terminal Results Panel.
 * 
 * Rules:
 * - No fill header; 12-13px grey sentence-case column labels.
 * - Numbers right-aligned in tabular figures with muted units.
 * - Rows: 42px height.
 * - Thin row rules only 3-7% darker than ground (border-[var(--rule)]).
 * - Honest text for missing values: plain grey "NULL" (no amber badge).
 * - Expected-vs-actual diff shown as two aligned comparison tables.
 */
export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  isLoading = false,
  checkResult,
  expectedOutput,
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-xs text-[var(--muted)]">
        <span>Executing query in WebAssembly worker...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-xs text-[var(--muted)] border border-dashed border-[var(--border)]">
        <span>Ready. Press Ctrl+Enter or click Run to execute.</span>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-4 bg-[var(--pill-negative-bg)] border border-[var(--negative)] text-[var(--pill-negative-ink)] text-xs space-y-2">
        <div className="flex items-center justify-between font-medium">
          <span>Execution error</span>
          <span className="tabular-nums text-[var(--muted)]">{result.timeMs}ms</span>
        </div>
        <pre className="font-mono text-xs whitespace-pre-wrap leading-relaxed text-[var(--pill-negative-ink)] overflow-x-auto">
          {result.error}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3 overflow-hidden text-xs">
      {/* Submission Status Message */}
      {checkResult && (
        <div
          className={cn(
            'p-3 border text-xs',
            checkResult.passed
              ? 'bg-[var(--pill-positive-bg)] border-[var(--positive)] text-[var(--pill-positive-ink)]'
              : 'bg-[var(--pill-negative-bg)] border-[var(--negative)] text-[var(--pill-negative-ink)]'
          )}
        >
          <div className="flex items-center justify-between font-medium">
            <span>{checkResult.passed ? 'Accepted!' : 'Wrong answer'}</span>
            <span className="tabular-nums opacity-80">{result.timeMs}ms</span>
          </div>
          <p className="mt-1 opacity-90">{checkResult.message}</p>
        </div>
      )}

      {/* Meta readout */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)] px-1 shrink-0">
        <span className="tabular-nums">
          {result.rowCount} row{result.rowCount === 1 ? '' : 's'} in {result.timeMs}ms
        </span>
        <span>Local engine</span>
      </div>

      {/* Output Table */}
      <div className="flex-1 overflow-auto border border-[var(--border)] bg-[var(--surface-app)]">
        {result.columns.length === 0 ? (
          <div className="p-6 text-center text-xs text-[var(--muted)]">
            Statement executed successfully. No rows returned.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[var(--surface-app)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-[var(--muted)] font-normal select-none">#</th>
                {result.columns.map((col, idx) => (
                  <th key={idx} className="py-2.5 px-3 font-normal text-[var(--muted)]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)]">
              {result.rows.map((row, rIdx) => (
                <tr key={rIdx} className="h-[42px] hover:bg-[var(--raised)] transition-colors">
                  <td className="py-2 px-3 text-[var(--muted)] select-none tabular-nums">{rIdx + 1}</td>
                  {row.map((val, cIdx) => (
                    <td
                      key={cIdx}
                      className={cn(
                        'py-2 px-3 text-[var(--text)]',
                        typeof val === 'number' ? 'tabular-nums text-right' : ''
                      )}
                    >
                      {val === null || val === undefined ? (
                        <span className="text-[var(--muted)]">NULL</span>
                      ) : (
                        String(val)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Expected vs Actual Diff (Two Aligned Tables) */}
      {checkResult && !checkResult.passed && expectedOutput && expectedOutput.rows.length > 0 && (
        <div className="p-3 border border-[var(--border)] bg-[var(--surface-app)] space-y-2 shrink-0">
          <span className="text-xs text-[var(--muted)]">Expected output reference:</span>
          <div className="overflow-x-auto max-h-32 border border-[var(--rule)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--raised)] text-[var(--muted)] border-b border-[var(--border)]">
                <tr>
                  {expectedOutput.columns.map((c, idx) => (
                    <th key={idx} className="py-1 px-2 font-normal">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--rule)]">
                {expectedOutput.rows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx} className="h-8">
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={cn(
                          'py-1 px-2 text-[var(--muted)]',
                          typeof val === 'number' ? 'tabular-nums text-right' : ''
                        )}
                      >
                        {val === null ? 'NULL' : String(val)}
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
