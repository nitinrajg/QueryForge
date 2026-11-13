import React from 'react';
import { QueryResult } from '@/engines/types';
import { CheckResult } from '@/checker/comparator';
import { CheckCircle2, XCircle, Clock, Database, AlertTriangle, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface ResultsPanelProps {
  result: QueryResult | null;
  isLoading?: boolean;
  checkResult?: CheckResult | null;
  expectedOutput?: { columns: string[]; rows: any[][] };
}

/**
 * Results Panel Component.
 * 
 * Logic & Approach:
 * - Renders SQL query execution output in an obsidian dark developer table.
 * - Displays performance benchmarks (runtime in milliseconds and row count).
 * - Visualizes pass/fail evaluation when submitted against problem test cases.
 * - Highlights differences between expected and actual result sets on failure.
 */
export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  result,
  isLoading = false,
  checkResult,
  expectedOutput,
}) => {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-[#94A3B8]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#06B6D4] border-t-transparent mb-3" />
        <p className="text-xs font-mono tracking-wide">Executing in WebAssembly worker...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-[#94A3B8] border border-dashed border-[#1C2438] rounded-xl light:border-slate-300">
        <Database className="h-8 w-8 mb-2 opacity-30 text-[#06B6D4]" />
        <p className="text-xs font-semibold text-[#F1F5F9] light:text-slate-800 tracking-wide uppercase font-mono">
          No Query Output
        </p>
        <p className="text-[11px] text-[#94A3B8] mt-1 font-mono">
          Press <kbd className="px-1.5 py-0.5 rounded bg-[#161F30] border border-[#26354D] text-[#22D3EE] text-[10px]">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-[#161F30] border border-[#26354D] text-[#22D3EE] text-[10px]">Enter</kbd> to run your query.
        </p>
      </div>
    );
  }

  if (result.error) {
    return (
      <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 font-mono text-xs space-y-2">
        <div className="flex items-center gap-2 font-semibold text-rose-400">
          <XCircle className="h-4 w-4 shrink-0" />
          <span className="font-mono uppercase tracking-wider text-[11px]">SQL Execution Error</span>
          <span className="ml-auto text-[10px] text-[#94A3B8] font-mono">{result.timeMs}ms</span>
        </div>
        <pre className="whitespace-pre-wrap leading-relaxed text-[11px] p-3 rounded-lg bg-[#07090E]/60 border border-rose-500/20 text-rose-200 overflow-x-auto">
          {result.error}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-2.5 overflow-hidden">
      {/* Submission Status Banner (if checked) */}
      {checkResult && (
        <div
          className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-colors shrink-0 ${
            checkResult.passed
              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/40 bg-rose-500/10 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-xs">
            {checkResult.passed ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-mono uppercase tracking-wider">Accepted! All Test Assertions Passed</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-rose-400" />
                <span className="text-rose-400 font-mono uppercase tracking-wider">Evaluation Failed — Output Mismatch</span>
              </>
            )}
            <span className="text-[11px] font-mono opacity-80 ml-auto">{result.timeMs}ms</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">{checkResult.message}</p>
        </div>
      )}

      {/* Meta Bar */}
      <div className="flex items-center justify-between text-[11px] text-[#94A3B8] px-1 shrink-0 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#F1F5F9] light:text-slate-800">
            <Layers className="h-3.5 w-3.5 text-[#06B6D4]" />
            <span>{result.rowCount} row{result.rowCount === 1 ? '' : 's'}</span>
          </span>
          <span className="text-[#334155]">•</span>
          <span className="flex items-center gap-1 text-[#94A3B8]">
            <Clock className="h-3 w-3" />
            <span>{result.timeMs} ms</span>
          </span>
        </div>
        <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Local In-Memory WASM</span>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto rounded-xl border border-[#1C2438] bg-[#07090E] light:border-slate-200 light:bg-white">
        {result.columns.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#94A3B8] font-mono">
            Statement executed successfully. No rows returned.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-[#0C1019] text-[#94A3B8] border-b border-[#1C2438] light:bg-slate-100 light:border-slate-200">
              <tr>
                <th className="py-2 px-3 w-10 text-[10px] uppercase font-mono text-[#475569]">#</th>
                {result.columns.map((col, idx) => (
                  <th key={idx} className="py-2 px-3 font-mono text-[11px] font-semibold text-[#F1F5F9] light:text-slate-800">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C2438]/60 light:divide-slate-200">
              {result.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[#121826]/70 transition-colors light:hover:bg-slate-50">
                  <td className="py-1.5 px-3 font-mono text-[10px] text-[#475569] select-none">{rIdx + 1}</td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className="py-1.5 px-3 font-mono text-xs text-[#E2E8F0] light:text-slate-800">
                      {val === null || val === undefined ? (
                        <span className="text-amber-400/90 italic font-mono text-[10px] bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
                          NULL
                        </span>
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

      {/* Expected vs Actual Diff if Failed */}
      {checkResult && !checkResult.passed && expectedOutput && expectedOutput.rows.length > 0 && (
        <div className="p-3 rounded-xl border border-[#1C2438] bg-[#0C1019] text-xs space-y-2 shrink-0 light:bg-slate-50 light:border-slate-200">
          <div className="flex items-center gap-1.5 font-semibold text-[#F1F5F9] light:text-slate-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-mono text-[11px] uppercase tracking-wider">Expected Output Reference (First 5 Rows)</span>
          </div>
          <div className="overflow-x-auto max-h-32 border border-[#1C2438] rounded-lg bg-[#07090E]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#121826] text-[#94A3B8] border-b border-[#1C2438]">
                <tr>
                  {expectedOutput.columns.map((c, idx) => (
                    <th key={idx} className="py-1 px-2 font-mono text-[10px] text-[#22D3EE]">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2438]/50">
                {expectedOutput.rows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((val, cIdx) => (
                      <td key={cIdx} className="py-1 px-2 font-mono text-[10px] text-[#94A3B8]">
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
