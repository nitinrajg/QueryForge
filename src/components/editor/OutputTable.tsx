import React, { useState } from 'react';
import { Copy, Check, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface OutputTableProps {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  diffMatrix?: ('match' | 'differ' | 'missing' | 'extra')[][];
  showOnlyDifferences?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
  className?: string;
  footerInfo?: {
    timeMs?: number;
    rowCount?: number;
  };
}

/**
 * High-performance, high-density data grid table.
 * 
 * Features:
 * - Sticky headers with subtle backdrop blur
 * - Zebra striping for optimal readability
 * - Muted NULL chip representation
 * - Cell copy and full CSV export button
 * - Visual diff highlighting for side-by-side verification
 * - Truncated cell tooltip support
 */
export const OutputTable: React.FC<OutputTableProps> = ({
  columns,
  rows,
  diffMatrix,
  showOnlyDifferences = false,
  maxHeight = '320px',
  emptyMessage = 'Empty result set',
  className,
  footerInfo,
}) => {
  const [copiedCsv, setCopiedCsv] = useState(false);

  // Copy table as CSV
  const handleCopyCsv = () => {
    if (columns.length === 0) return;
    const headerRow = columns.join(',');
    const bodyRows = rows.map((r) =>
      r
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    );
    const csvContent = [headerRow, ...bodyRows].join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  // Filter rows if "Show only differences" is active
  const displayRowIndices = React.useMemo(() => {
    if (!showOnlyDifferences || !diffMatrix) {
      return rows.map((_, idx) => idx);
    }
    return rows
      .map((_, idx) => idx)
      .filter((idx) => {
        const rowDiffs = diffMatrix[idx];
        return rowDiffs && rowDiffs.some((d) => d === 'differ' || d === 'missing' || d === 'extra');
      });
  }, [rows, diffMatrix, showOnlyDifferences]);

  if (!columns || columns.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--border)] rounded-md font-mono">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col border border-[var(--border)] rounded-lg bg-[var(--surface-app)] overflow-hidden', className)}>
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--border)] bg-[var(--raised)]/30 text-[11px] font-mono text-[var(--muted)] shrink-0">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--ink)]">
          <TableIcon className="h-3 w-3 text-[var(--accent)]" />
          <span>{rows.length} {rows.length === 1 ? 'row' : 'rows'}</span>
          {showOnlyDifferences && displayRowIndices.length !== rows.length && (
            <span className="text-[10px] text-[var(--warning)]">
              (showing {displayRowIndices.length} differences)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyCsv}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
          title="Copy table data as CSV"
        >
          {copiedCsv ? <Check className="h-3 w-3 text-[#2cbb5d]" /> : <Copy className="h-3 w-3" />}
          <span>{copiedCsv ? 'Copied CSV' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Scrollable Data Grid Container */}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full text-left border-collapse font-mono text-xs">
          {/* Sticky Header */}
          <thead className="sticky top-0 z-10 bg-[var(--raised)]/95 backdrop-blur-xs border-b border-[var(--border)] text-[var(--muted)] shadow-xs select-none">
            <tr>
              <th className="py-1.5 px-3 w-10 text-center text-[10px] text-[var(--muted)]/70 border-r border-[var(--border)]">
                #
              </th>
              {columns.map((col, cIdx) => (
                <th
                  key={cIdx}
                  className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)] whitespace-nowrap tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-[var(--border)]/60">
            {displayRowIndices.length > 0 ? (
              displayRowIndices.map((rowIdx, visualIdx) => {
                const row = rows[rowIdx] || [];
                const rowDiffs = diffMatrix ? diffMatrix[rowIdx] : undefined;
                const hasDiff = rowDiffs && rowDiffs.some((d) => d === 'differ');

                return (
                  <tr
                    key={rowIdx}
                    className={cn(
                      'transition-colors duration-100',
                      visualIdx % 2 === 1 ? 'bg-[var(--raised)]/20' : 'bg-transparent',
                      'hover:bg-[var(--raised)]/50',
                      hasDiff && 'bg-[var(--diff-differ-bg)] hover:bg-[var(--diff-differ-bg)]'
                    )}
                  >
                    <td className="py-1.5 px-3 w-10 text-center text-[10px] text-[var(--muted)]/60 border-r border-[var(--border)]/60 tabular-nums">
                      {rowIdx + 1}
                    </td>

                    {columns.map((_, colIdx) => {
                      const val = row[colIdx];
                      const cellDiff = rowDiffs ? rowDiffs[colIdx] : undefined;
                      const isCellDiffer = cellDiff === 'differ';

                      return (
                        <td
                          key={colIdx}
                          className={cn(
                            'py-1.5 px-3 text-[11px] tabular-nums whitespace-nowrap max-w-[240px] truncate',
                            isCellDiffer && 'bg-[var(--diff-differ-bg)] border-b border-b-[var(--diff-differ-border)] text-[var(--diff-differ-ink)] font-semibold'
                          )}
                          title={val !== null && val !== undefined ? String(val) : 'NULL'}
                        >
                          {val === null || val === undefined ? (
                            <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-sans italic bg-[var(--raised)] text-[var(--muted)]">
                              NULL
                            </span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="py-4 text-center text-xs text-[var(--muted)] italic">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Meta (Runtime, Total rows) */}
      {footerInfo && (
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[var(--border)] bg-[var(--raised)]/20 text-[10px] font-mono text-[var(--muted)]">
          <span>{footerInfo.rowCount ?? rows.length} total rows</span>
          {footerInfo.timeMs !== undefined && (
            <span>Execution time: {footerInfo.timeMs} ms</span>
          )}
        </div>
      )}
    </div>
  );
};
