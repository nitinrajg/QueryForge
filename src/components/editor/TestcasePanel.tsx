import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Edit2,
  Code2,
  Table as TableIcon,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Check
} from 'lucide-react';
import { TableSchema, QueryResult } from '@/engines/types';
import { TestCaseModel, CustomTableInput, CustomRowData } from '@/types/testcase';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

interface TestcasePanelProps {
  cases: TestCaseModel[];
  activeCaseId: string;
  onSelectCase: (caseId: string) => void;
  onAddCase: () => void;
  onDeleteCase: (caseId: string) => void;
  onDuplicateCase: (caseId: string) => void;
  onRenameCase: (caseId: string, newLabel: string) => void;
  onUpdateCaseInputs: (caseId: string, inputs: CustomTableInput[]) => void;
  onUpdateCaseExpected: (caseId: string, expected?: { columns: string[]; rows: (string | number | boolean | null)[][] }) => void;
  onUseQueryOutputAsExpected: (caseId: string) => void;
  schema: TableSchema[];
  lastSuccessfulResult?: QueryResult | null;
  onRunSelectedCase: () => void;
  onRunAllCases: () => void;
  isRunning: boolean;
}

export const TestcasePanel: React.FC<TestcasePanelProps> = ({
  cases,
  activeCaseId,
  onSelectCase,
  onAddCase,
  onDeleteCase,
  onDuplicateCase,
  onRenameCase,
  onUpdateCaseInputs,
  onUpdateCaseExpected,
  onUseQueryOutputAsExpected,
  schema,
  lastSuccessfulResult,
  onRunSelectedCase,
  onRunAllCases,
  isRunning,
}) => {
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [isSqlMode, setIsSqlMode] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');
  const [hasExpectedToggle, setHasExpectedToggle] = useState(Boolean(activeCase?.expectedOutput));

  if (!activeCase) {
    return <div className="p-4 text-xs text-[var(--muted)]">No test cases found.</div>;
  }

  const isDefault = activeCase.isDefault;
  const activeTableInput = activeCase.inputs[selectedTableIdx] || activeCase.inputs[0];
  const activeTableSchema = schema.find((s) => s.name === activeTableInput?.tableName) || schema[selectedTableIdx];

  // Cell editing in Custom Case Grid
  const handleCellChange = (rowId: string, colName: string, value: string) => {
    if (isDefault) return;
    const nextInputs = activeCase.inputs.map((inp, idx) => {
      if (idx !== selectedTableIdx) return inp;
      const nextRows = inp.rows.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          values: {
            ...r.values,
            [colName]: value === '' || value.toLowerCase() === 'null' ? null : value,
          },
        };
      });
      return { ...inp, rows: nextRows };
    });
    onUpdateCaseInputs(activeCase.id, nextInputs);
  };

  // Add new row to active table
  const handleAddRow = () => {
    if (isDefault || !activeTableSchema) return;
    const newRowId = `row_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const initialValues: Record<string, any> = {};
    activeTableSchema.columns.forEach((c) => {
      initialValues[c.name] = null;
    });

    const nextInputs = activeCase.inputs.map((inp, idx) => {
      if (idx !== selectedTableIdx) return inp;
      return {
        ...inp,
        rows: [...inp.rows, { id: newRowId, values: initialValues }],
      };
    });
    onUpdateCaseInputs(activeCase.id, nextInputs);
  };

  // Remove row from active table
  const handleRemoveRow = (rowId: string) => {
    if (isDefault) return;
    const nextInputs = activeCase.inputs.map((inp, idx) => {
      if (idx !== selectedTableIdx) return inp;
      return {
        ...inp,
        rows: inp.rows.filter((r) => r.id !== rowId),
      };
    });
    onUpdateCaseInputs(activeCase.id, nextInputs);
  };

  // Manual SQL INSERT statement editing
  const handleRawSqlChange = (newSql: string) => {
    if (isDefault) return;
    const nextInputs = activeCase.inputs.map((inp, idx) => {
      if (idx !== selectedTableIdx) return inp;
      return { ...inp, rawInsertSql: newSql };
    });
    onUpdateCaseInputs(activeCase.id, nextInputs);
  };

  // Save label rename
  const handleSaveRename = () => {
    if (labelDraft.trim() && !isDefault) {
      onRenameCase(activeCase.id, labelDraft.trim());
    }
    setEditingLabel(false);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--ink)] overflow-hidden text-xs select-text">
      {/* 1. Case Tab Pills Strip */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--border)] bg-[var(--raised)]/40 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {cases.map((c) => {
            const isSelected = c.id === activeCase.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelectCase(c.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer shrink-0',
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs border border-[var(--border)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]'
                )}
              >
                <span>{c.label}</span>
                {c.isDefault && (
                  <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-[var(--raised)] text-[var(--muted)]">
                    Default
                  </span>
                )}
              </button>
            );
          })}

          {/* Add Custom Test Case Button */}
          <button
            type="button"
            onClick={onAddCase}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--muted)] hover:text-[var(--accent)] hover:bg-[var(--raised)] transition-colors cursor-pointer shrink-0"
            title="Add your own custom test case"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Case</span>
          </button>
        </div>

        {/* Dual Execution Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onRunAllCases}
            disabled={isRunning}
            className="h-7 px-2.5 text-xs font-medium gap-1 text-[var(--ink)] hover:border-[var(--control)]"
            title="Execute query against all test cases"
          >
            <Play className="h-3 w-3 fill-current text-[var(--accent)]" />
            <span className="hidden sm:inline">Run All Cases</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={onRunSelectedCase}
            disabled={isRunning}
            className="h-7 px-2.5 text-xs font-semibold gap-1"
            title="Execute query against selected case"
          >
            <Play className="h-3 w-3 fill-current" />
            <span>Run {activeCase.label}</span>
          </Button>
        </div>
      </div>

      {/* 2. Active Case Management Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--surface-app)] shrink-0 gap-2">
        <div className="flex items-center gap-2">
          {editingLabel && !isDefault ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={labelDraft}
                onChange={(e) => setLabelDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                className="px-2 py-0.5 rounded border border-[var(--accent)] bg-[var(--surface)] text-xs font-mono text-[var(--ink)] focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveRename}
                className="p-1 rounded text-[#2cbb5d] hover:bg-[var(--raised)]"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--ink)] font-mono">
              <span>{activeCase.label}</span>
              {!isDefault && (
                <button
                  type="button"
                  onClick={() => {
                    setLabelDraft(activeCase.label);
                    setEditingLabel(true);
                  }}
                  className="p-0.5 rounded text-[var(--muted)] hover:text-[var(--ink)]"
                  title="Rename Case"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}

          {isDefault ? (
            <span className="text-[11px] text-[var(--muted)] italic flex items-center gap-1">
              <Info className="h-3 w-3" />
              Example dataset (read-only)
            </span>
          ) : (
            <span className="text-[10px] text-[var(--muted)] font-mono px-1.5 py-0.5 rounded bg-[var(--raised)]">
              Custom Dataset
            </span>
          )}
        </div>

        {/* Action Controls for Custom Cases */}
        {!isDefault && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsSqlMode(!isSqlMode)}
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer',
                isSqlMode
                  ? 'bg-[var(--raised)] border-[var(--control)] text-[var(--ink)]'
                  : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
              )}
              title="Toggle between Interactive Grid and raw SQL INSERT mode"
            >
              {isSqlMode ? <TableIcon className="h-3 w-3" /> : <Code2 className="h-3 w-3" />}
              <span>{isSqlMode ? 'Grid Mode' : 'Edit as SQL'}</span>
            </button>

            <button
              type="button"
              onClick={() => onDuplicateCase(activeCase.id)}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              title="Duplicate Case"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDeleteCase(activeCase.id)}
              className="p-1 rounded text-[var(--negative)] hover:bg-[var(--pill-negative-bg)] transition-colors cursor-pointer"
              title="Delete Case"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 3. Input Tables Workbench */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Table Selector (for multi-table datasets) */}
        {schema.length > 1 && (
          <div className="flex items-center gap-1 border-b border-[var(--border)] pb-2">
            <span className="text-[11px] text-[var(--muted)] font-sans mr-1">Table:</span>
            {schema.map((tbl, idx) => (
              <button
                key={tbl.name}
                type="button"
                onClick={() => setSelectedTableIdx(idx)}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer',
                  selectedTableIdx === idx
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold'
                    : 'bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--ink)]'
                )}
              >
                {tbl.name}
              </button>
            ))}
          </div>
        )}

        {/* Table Input Data Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--ink)]">
              <span>Table:</span>
              <span className="text-[var(--accent)]">{activeTableSchema?.name}</span>
            </div>

            {!isDefault && !isSqlMode && (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-[var(--accent)] hover:bg-[var(--raised)] rounded transition-colors cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add Row</span>
              </button>
            )}
          </div>

          {/* Mode A: SQL INSERT Statements */}
          {isSqlMode && !isDefault ? (
            <div className="space-y-1.5">
              <textarea
                value={
                  activeTableInput?.rawInsertSql ||
                  `INSERT INTO ${activeTableSchema?.name} VALUES\n` +
                    activeTableInput.rows
                      .map((r) => `(${Object.values(r.values).map((v) => (v === null ? 'NULL' : `'${v}'`)).join(', ')})`)
                      .join(',\n') +
                    ';'
                }
                onChange={(e) => handleRawSqlChange(e.target.value)}
                rows={5}
                className="w-full font-mono text-xs p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] leading-relaxed"
                placeholder={`INSERT INTO ${activeTableSchema?.name} VALUES ...`}
              />
              <span className="text-[10px] text-[var(--muted)] font-sans block">
                Type standard SQL INSERT statements for this table. Executed on Run.
              </span>
            </div>
          ) : (
            /* Mode B: Interactive Data Grid */
            <div className="overflow-x-auto border border-[var(--border)] rounded-lg bg-[var(--surface-app)]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead className="bg-[var(--raised)] border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    <th className="py-1.5 px-3 w-8 text-center text-[10px] text-[var(--muted)]/60">#</th>
                    {activeTableSchema?.columns.map((c, cIdx) => (
                      <th key={cIdx} className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span>{c.name}</span>
                          <span className="text-[9px] text-[var(--muted)] font-normal">({c.type || 'text'})</span>
                        </div>
                      </th>
                    ))}
                    {!isDefault && <th className="py-1.5 px-3 w-10 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {activeTableInput?.rows.length > 0 ? (
                    activeTableInput.rows.map((row, rIdx) => (
                      <tr key={row.id} className="hover:bg-[var(--raised)]/30 transition-colors">
                        <td className="py-1 px-3 text-center text-[10px] text-[var(--muted)]/60 tabular-nums">
                          {rIdx + 1}
                        </td>
                        {activeTableSchema?.columns.map((col) => {
                          const val = row.values[col.name];
                          return (
                            <td key={col.name} className="py-1 px-2">
                              {isDefault ? (
                                <span className="px-1 text-[11px] tabular-nums">
                                  {val === null ? <span className="text-[var(--muted)] italic">null</span> : String(val)}
                                </span>
                              ) : (
                                <input
                                  type="text"
                                  value={val === null || val === undefined ? '' : String(val)}
                                  onChange={(e) => handleCellChange(row.id, col.name, e.target.value)}
                                  placeholder="NULL"
                                  className="w-full px-2 py-0.5 rounded border border-[var(--border)] focus:border-[var(--accent)] bg-[var(--surface)] text-[11px] font-mono text-[var(--ink)] focus:outline-none"
                                />
                              )}
                            </td>
                          );
                        })}
                        {!isDefault && (
                          <td className="py-1 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(row.id)}
                              className="p-1 rounded text-[var(--muted)] hover:text-[var(--negative)] hover:bg-[var(--pill-negative-bg)] transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={(activeTableSchema?.columns.length || 0) + 2} className="py-4 text-center text-xs text-[var(--muted)] italic">
                        No rows in this table. Click "+ Add Row" to define input data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Expected Output Builder (Optional) */}
        <div className="space-y-3 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-[var(--ink)] block">
                Expected Output Testcase
              </span>
              <span className="text-[11px] text-[var(--muted)] block">
                {isDefault
                  ? 'Official testcase assertion'
                  : 'Define expected output to verify correctness. If left empty, query runs with neutral "Executed" verdict.'}
              </span>
            </div>

            {/* Quick Fill Button */}
            {!isDefault && lastSuccessfulResult && lastSuccessfulResult.rows.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUseQueryOutputAsExpected(activeCase.id)}
                className="h-7 text-xs gap-1.5 border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent-subtle)]"
                title="Fill expected output with current query result"
              >
                <Sparkles className="h-3 w-3" />
                <span>Use Last Query Result</span>
              </Button>
            )}
          </div>

          {activeCase.expectedOutput ? (
            <div className="overflow-x-auto border border-[var(--border)] rounded-lg bg-[var(--surface-app)]">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead className="bg-[var(--raised)] border-b border-[var(--border)] text-[var(--muted)]">
                  <tr>
                    {activeCase.expectedOutput.columns.map((c, idx) => (
                      <th key={idx} className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)] whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {activeCase.expectedOutput.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[var(--raised)]/30">
                      {row.map((val, cIdx) => (
                        <td key={cIdx} className="py-1.5 px-3 text-[11px] tabular-nums whitespace-nowrap">
                          {val === null ? <span className="text-[var(--muted)] italic">null</span> : String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-3 text-center border border-dashed border-[var(--border)] rounded-md text-[11px] text-[var(--muted)] italic">
              No expected output defined for this case. Running will return a neutral "Executed" verdict.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
