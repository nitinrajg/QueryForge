import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Terminal,
  CheckSquare,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Check,
  Sparkles,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { QueryResult, TableSchema } from '@/engines/types';
import { CheckResult } from '@/checker/comparator';
import { TestCaseModel, CustomTableInput, CaseVerdict, ParsedSqlError } from '@/types/testcase';
import { OutputTable } from './OutputTable';
import { TestcasePanel } from './TestcasePanel';
import { parseSqlError } from '@/checker/error-parser';
import { cn } from '@/lib/cn';

export interface ResultsPanelProps {
  // Navigation / Tabs
  activeTab?: 'testcase' | 'result';
  onTabChange?: (tab: 'testcase' | 'result') => void;

  // Testcase tab props
  cases?: TestCaseModel[];
  activeCaseId?: string;
  onSelectCase?: (caseId: string) => void;
  onAddCase?: () => void;
  onDeleteCase?: (caseId: string) => void;
  onDuplicateCase?: (caseId: string) => void;
  onRenameCase?: (caseId: string, newLabel: string) => void;
  onUpdateCaseInputs?: (caseId: string, inputs: CustomTableInput[]) => void;
  onUpdateCaseExpected?: (caseId: string, expected?: { columns: string[]; rows: (string | number | boolean | null)[][] }) => void;
  onUseQueryOutputAsExpected?: (caseId: string) => void;
  schema?: TableSchema[];
  onRunSelectedCase?: () => void;
  onRunAllCases?: () => void;

  // Multi-case Verdicts & Execution
  isLoading?: boolean;
  onCancelExecution?: () => void;
  verdicts?: CaseVerdict[];
  activeVerdictIndex?: number;
  onSelectVerdictIndex?: (index: number) => void;

  // Legacy fallback props
  result?: QueryResult | null;
  checkResult?: CheckResult | null;
  expectedOutput?: { columns: string[]; rows: any[][] };

  // Panel sizing / actions
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

/**
 * LeetCode-Inspired SQL Practice Results & Testcase Console.
 * 
 * Logic & Architecture:
 * 1. Dual Console Navigation:
 *    - "Testcase": Interactive test case builder (Case 1 default, Case 2+ custom,
 *      cell-editing data grids, raw SQL INSERT override, auto-fill expected output).
 *    - "Test Result": Comprehensive grading console with 5 distinct states
 *      (Idle, Running Shimmer with Cancel, Accepted with pop animation,
 *      Wrong Answer with 6 distinct mismatch badges & diff toggle, and
 *      SQL Error with fuzzy Levenshtein schema suggestions).
 * 2. Multi-Case Summary Strip:
 *    - When running all cases, renders interactive pills (e.g. Case 1 ✓, Case 2 ✗)
 *      allowing users to click and inspect each case's output and diff matrices.
 * 3. High Performance & Accessibility:
 *    - Zero layout shift during animations (transform and opacity only).
 *    - Sticky header data grids with zebra striping and CSV export.
 */
export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  activeTab: externalActiveTab,
  onTabChange,
  cases = [],
  activeCaseId,
  onSelectCase,
  onAddCase,
  onDeleteCase,
  onDuplicateCase,
  onRenameCase,
  onUpdateCaseInputs,
  onUpdateCaseExpected,
  onUseQueryOutputAsExpected,
  schema = [],
  onRunSelectedCase,
  onRunAllCases,
  isLoading = false,
  onCancelExecution,
  verdicts = [],
  activeVerdictIndex: externalActiveVerdictIndex,
  onSelectVerdictIndex,
  result,
  checkResult,
  expectedOutput,
  onToggleMaximize,
  isMaximized = false,
  onToggleCollapse,
  isCollapsed = false,
}) => {
  // Local state fallbacks if not controlled from parent
  const [internalTab, setInternalTab] = useState<'testcase' | 'result'>('result');
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalTab;

  const handleTabChange = (tab: 'testcase' | 'result') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [internalVerdictIdx, setInternalVerdictIdx] = useState(0);
  const activeVerdictIdx = externalActiveVerdictIndex !== undefined ? externalActiveVerdictIndex : internalVerdictIdx;

  const handleSelectVerdict = (idx: number) => {
    if (onSelectVerdictIndex) {
      onSelectVerdictIndex(idx);
    } else {
      setInternalVerdictIdx(idx);
    }
  };

  // Diff inspection filters
  const [showOnlyDifferences, setShowOnlyDifferences] = useState(false);
  const [showRawError, setShowRawError] = useState(false);
  const [copiedRawError, setCopiedRawError] = useState(false);

  // Normalize legacy props into a CaseVerdict if verdicts array is empty
  const activeVerdict: CaseVerdict | null = useMemo(() => {
    if (verdicts && verdicts.length > 0) {
      return verdicts[activeVerdictIdx] || verdicts[0];
    }

    if (result || checkResult) {
      let status: CaseVerdict['status'] = 'executed';
      let errorDiagnostic: ParsedSqlError | undefined;

      if (result?.error) {
        status = 'error';
        errorDiagnostic = parseSqlError(result.error, schema);
      } else if (checkResult) {
        status = checkResult.passed ? 'accepted' : 'wrong_answer';
      }

      return {
        caseId: 'legacy_case',
        caseLabel: 'Case 1',
        status,
        runtimeMs: result?.timeMs || 0,
        userResult: result || undefined,
        expectedOutput: expectedOutput || undefined,
        errorDiagnostic,
      };
    }

    return null;
  }, [verdicts, activeVerdictIdx, result, checkResult, expectedOutput, schema]);

  // Overall verdict status for the header tab badge dot
  const overallStatus = useMemo(() => {
    if (verdicts.length === 0) {
      if (!activeVerdict) return null;
      return activeVerdict.status;
    }
    const hasError = verdicts.some((v) => v.status === 'error');
    if (hasError) return 'error';
    const hasFail = verdicts.some((v) => v.status === 'wrong_answer');
    if (hasFail) return 'wrong_answer';
    const allPassed = verdicts.every((v) => v.status === 'accepted');
    if (allPassed) return 'accepted';
    return 'executed';
  }, [verdicts, activeVerdict]);

  // Copy raw error message
  const handleCopyRawError = () => {
    const rawMsg = activeVerdict?.errorDiagnostic?.rawMessage || activeVerdict?.userResult?.error || '';
    if (rawMsg) {
      navigator.clipboard.writeText(rawMsg);
      setCopiedRawError(true);
      setTimeout(() => setCopiedRawError(false), 2000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--surface)] text-[var(--ink)] overflow-hidden text-xs">
      {/* ================= LEETCODE CONSOLE HEADER BAR ================= */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-[var(--border)] bg-[var(--raised)]/40 shrink-0 select-none">
        {/* Left: Tab Switcher (Testcase vs Test Result) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleTabChange('testcase')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer',
              activeTab === 'testcase'
                ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Testcase</span>
            {cases.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[var(--raised)] text-[var(--muted)]">
                {cases.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('result')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer relative',
              activeTab === 'result'
                ? 'bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <CheckSquare className="h-3.5 w-3.5" />
            <span>Test Result</span>
            {overallStatus && (
              <span
                className={cn(
                  'w-2 h-2 rounded-full inline-block ml-0.5',
                  overallStatus === 'accepted' && 'bg-[#2cbb5d]',
                  overallStatus === 'wrong_answer' && 'bg-[#ef4444]',
                  overallStatus === 'error' && 'bg-[#f59e0b]',
                  overallStatus === 'executed' && 'bg-[var(--muted)]'
                )}
              />
            )}
          </button>
        </div>

        {/* Right side controls: Runtime metrics, Maximize & Collapse */}
        <div className="flex items-center gap-2">
          {activeVerdict?.userResult && !activeVerdict.userResult.error && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--muted)]">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{activeVerdict.runtimeMs} ms</span>
              </span>
              <span className="text-[var(--border)]">|</span>
              <span>
                {activeVerdict.userResult.rowCount} {activeVerdict.userResult.rowCount === 1 ? 'row' : 'rows'}
              </span>
            </div>
          )}

          {/* Maximize Console Button */}
          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              title={isMaximized ? 'Restore Console Panel' : 'Maximize Console Panel'}
              aria-label={isMaximized ? 'Restore Console Panel' : 'Maximize Console Panel'}
            >
              {isMaximized ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* Collapse Console Button */}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand Console' : 'Collapse Console'}
              aria-label={isCollapsed ? 'Expand Console' : 'Collapse Console'}
            >
              {isCollapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ================= MAIN BODY CONTAINER ================= */}
      <div className="flex-1 overflow-auto p-4 text-xs select-text">
        {/* ================= TAB 1: TESTCASE TAB ================= */}
        {activeTab === 'testcase' && (
          <TestcasePanel
            cases={cases}
            activeCaseId={activeCaseId || cases[0]?.id || ''}
            onSelectCase={onSelectCase || (() => {})}
            onAddCase={onAddCase || (() => {})}
            onDeleteCase={onDeleteCase || (() => {})}
            onDuplicateCase={onDuplicateCase || (() => {})}
            onRenameCase={onRenameCase || (() => {})}
            onUpdateCaseInputs={onUpdateCaseInputs || (() => {})}
            onUpdateCaseExpected={onUpdateCaseExpected || (() => {})}
            onUseQueryOutputAsExpected={onUseQueryOutputAsExpected || (() => {})}
            schema={schema}
            lastSuccessfulResult={activeVerdict?.userResult}
            onRunSelectedCase={onRunSelectedCase || (() => {})}
            onRunAllCases={onRunAllCases || (() => {})}
            isRunning={isLoading}
          />
        )}

        {/* ================= TAB 2: TEST RESULT TAB ================= */}
        {activeTab === 'result' && (
          <>
            {/* STATE 1: RUNNING PROGRESS SHIMMER WITH CANCEL BUTTON */}
            {isLoading && (
              <div className="h-full flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-full max-w-md space-y-3">
                  <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono">
                    <span className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                      <span>Executing in WebAssembly engine...</span>
                    </span>
                    {onCancelExecution && (
                      <button
                        type="button"
                        onClick={onCancelExecution}
                        className="px-2 py-0.5 rounded text-[11px] font-sans font-medium text-[var(--negative)] hover:bg-[var(--pill-negative-bg)] border border-[var(--negative)]/30 transition-colors cursor-pointer"
                      >
                        Cancel Execution
                      </button>
                    )}
                  </div>

                  {/* Skeleton Shimmer Grid */}
                  <div className="relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface-app)] p-3 space-y-2">
                    <div className="h-4 bg-[var(--raised)] rounded w-3/4 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border)]/60 to-transparent animate-shimmer" />
                    </div>
                    <div className="h-4 bg-[var(--raised)] rounded w-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border)]/60 to-transparent animate-shimmer" />
                    </div>
                    <div className="h-4 bg-[var(--raised)] rounded w-5/6 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border)]/60 to-transparent animate-shimmer" />
                    </div>
                    <div className="h-4 bg-[var(--raised)] rounded w-2/3 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--border)]/60 to-transparent animate-shimmer" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STATE 2: IDLE CONSOLE (No queries evaluated yet) */}
            {!isLoading && !activeVerdict && (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-xs text-[var(--muted)] space-y-2 animate-enter">
                <div className="w-10 h-10 rounded-full bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--faint)]">
                  <Terminal className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <span className="font-semibold text-[var(--ink)] block">Run your query to see results</span>
                  <span className="text-[11px] text-[var(--muted)] block max-w-sm">
                    Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-[var(--raised)] border border-[var(--border)] rounded text-[var(--ink)]">Ctrl+Enter</kbd> or click <span className="font-semibold text-[var(--ink)]">Run</span> in the top bar.
                  </span>
                </div>
              </div>
            )}

            {/* STATE 3, 4, 5, 6: EVALUATED VERDICTS */}
            {!isLoading && activeVerdict && (
              <div className="space-y-4 animate-enter">
                {/* Multi-Case Summary Strip (When 2+ cases were executed) */}
                {verdicts.length > 1 && (
                  <div className="flex items-center gap-1.5 pb-3 border-b border-[var(--border)] overflow-x-auto">
                    {verdicts.map((v, idx) => {
                      const isActive = idx === activeVerdictIdx;
                      return (
                        <button
                          key={v.caseId || idx}
                          type="button"
                          onClick={() => handleSelectVerdict(idx)}
                          className={cn(
                            'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-colors cursor-pointer shrink-0',
                            isActive
                              ? 'bg-[var(--raised)] border border-[var(--control)] text-[var(--ink)] font-bold shadow-xs'
                              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]/50'
                          )}
                        >
                          {v.status === 'accepted' && <CheckCircle2 className="h-3.5 w-3.5 text-[#2cbb5d]" />}
                          {v.status === 'wrong_answer' && <AlertCircle className="h-3.5 w-3.5 text-[#ef4444]" />}
                          {v.status === 'error' && <AlertTriangle className="h-3.5 w-3.5 text-[#f59e0b]" />}
                          {v.status === 'executed' && <Terminal className="h-3.5 w-3.5 text-[var(--muted)]" />}
                          <span>{v.caseLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* ================= VERDICT HEADLINE & STATUS ================= */}
                {/* 1. ACCEPTED STATE */}
                {activeVerdict.status === 'accepted' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#2cbb5d]/10 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-[#2cbb5d] animate-check" />
                        </div>
                        <span className="text-lg font-bold text-[#2cbb5d] tracking-tight font-display">
                          Accepted!
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[var(--raised)] border border-[var(--border)] font-mono text-[11px] text-[var(--muted)] flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-[var(--ink)] font-semibold">{activeVerdict.runtimeMs} ms</span>
                        </span>
                      </div>
                    </div>

                    {/* Result Output Table */}
                    {activeVerdict.userResult && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider font-semibold">
                          Your Output
                        </div>
                        <OutputTable
                          columns={activeVerdict.userResult.columns}
                          rows={activeVerdict.userResult.rows}
                          footerInfo={{
                            timeMs: activeVerdict.runtimeMs,
                            rowCount: activeVerdict.userResult.rowCount,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 2. WRONG ANSWER STATE */}
                {activeVerdict.status === 'wrong_answer' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-[#ef4444]" />
                        </div>
                        <span className="text-lg font-bold text-[#ef4444] tracking-tight font-display">
                          Wrong Answer
                        </span>
                      </div>

                      {/* Diff Toggle: Show Only Differences */}
                      <button
                        type="button"
                        onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                        className={cn(
                          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-sans transition-colors cursor-pointer border',
                          showOnlyDifferences
                            ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/40 font-semibold'
                            : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--ink)]'
                        )}
                      >
                        <Filter className="h-3 w-3" />
                        <span>{showOnlyDifferences ? 'Showing Differences Only' : 'Show Only Differences'}</span>
                      </button>
                    </div>

                    {/* Mismatch Reason Badge */}
                    {activeVerdict.mismatch && (
                      <div className="p-3 rounded-lg bg-[var(--pill-negative-bg)] border border-[var(--negative)]/25 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[var(--negative)] text-white">
                            {activeVerdict.mismatch.category.replace('_', ' ')}
                          </span>
                          <span className="text-xs font-semibold text-[var(--pill-negative-ink)]">
                            {activeVerdict.mismatch.summary}
                          </span>
                        </div>
                        {activeVerdict.mismatch.expectedVal !== undefined && (
                          <div className="text-[11px] font-mono text-[var(--pill-negative-ink)]/90 pt-1">
                            Expected: <code className="bg-white/80 dark:bg-black/30 px-1 py-0.2 rounded font-bold">{String(activeVerdict.mismatch.expectedVal)}</code>,
                            Got: <code className="bg-white/80 dark:bg-black/30 px-1 py-0.2 rounded font-bold">{String(activeVerdict.mismatch.actualVal)}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Side-by-Side or Stacked Diff Output Tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* User's Output */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider font-semibold">
                          <span>Your Output</span>
                          <span>{activeVerdict.userResult?.rowCount || 0} rows</span>
                        </div>
                        <OutputTable
                          columns={activeVerdict.userResult?.columns || []}
                          rows={activeVerdict.userResult?.rows || []}
                          diffMatrix={activeVerdict.diffMatrix}
                          showOnlyDifferences={showOnlyDifferences}
                          emptyMessage="Your query returned 0 rows"
                        />
                      </div>

                      {/* Expected Output */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider font-semibold">
                          <span>Expected Output</span>
                          <span>{activeVerdict.expectedOutput?.rows.length || 0} rows</span>
                        </div>
                        <OutputTable
                          columns={activeVerdict.expectedOutput?.columns || []}
                          rows={activeVerdict.expectedOutput?.rows || []}
                          emptyMessage="No expected rows specified"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. SQL ERROR STATE */}
                {activeVerdict.status === 'error' && (
                  <div className="space-y-4">
                    {/* Error Headline with Category Badge */}
                    <div className="p-4 rounded-lg bg-[var(--pill-warning-bg)] border border-[var(--warning)]/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-[var(--warning)] shrink-0" />
                          <span className="text-base font-bold text-[var(--pill-warning-ink)] font-display">
                            {activeVerdict.errorDiagnostic?.title || 'Execution Error'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--warning)] text-white">
                          {activeVerdict.errorDiagnostic?.badgeLabel || 'SQL ERROR'}
                        </span>
                      </div>

                      {/* Plain English Explanation */}
                      <p className="text-xs leading-relaxed text-[var(--pill-warning-ink)]">
                        {activeVerdict.errorDiagnostic?.plainEnglishFix ||
                          activeVerdict.userResult?.error ||
                          'An unexpected error halted query execution.'}
                      </p>

                      {/* Offending token / coordinate if available */}
                      {(activeVerdict.errorDiagnostic?.token || activeVerdict.errorDiagnostic?.line) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-[var(--muted)]">
                          {activeVerdict.errorDiagnostic.line && (
                            <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)]">
                              Line {activeVerdict.errorDiagnostic.line}
                              {activeVerdict.errorDiagnostic.column ? `, Col ${activeVerdict.errorDiagnostic.column}` : ''}
                            </span>
                          )}
                          {activeVerdict.errorDiagnostic.token && (
                            <span className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[var(--negative)]">
                              Token: {activeVerdict.errorDiagnostic.token}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Fuzzy Did You Mean Suggestion */}
                      {activeVerdict.errorDiagnostic?.suggestion && (
                        <div className="p-2.5 rounded bg-[var(--surface)] border border-[var(--accent)]/30 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" />
                            <span className="font-medium text-[var(--ink)]">
                              Did you mean{' '}
                              <span className="font-mono font-bold text-[var(--accent)]">
                                {activeVerdict.errorDiagnostic.suggestion}
                              </span>
                              ?
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Collapsible Raw Error Message */}
                      <div className="pt-2 border-t border-[var(--warning)]/20">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setShowRawError(!showRawError)}
                            className="flex items-center gap-1 text-[11px] font-medium text-[var(--pill-warning-ink)] hover:underline cursor-pointer"
                          >
                            <span>Raw Engine Diagnostic</span>
                            {showRawError ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          <button
                            type="button"
                            onClick={handleCopyRawError}
                            className="flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                          >
                            {copiedRawError ? <Check className="h-3 w-3 text-[#2cbb5d]" /> : <Copy className="h-3 w-3" />}
                            <span>{copiedRawError ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>

                        {showRawError && (
                          <pre className="mt-2 p-3 rounded bg-[var(--surface)] border border-[var(--border)] font-mono text-[11px] text-[var(--ink)] overflow-x-auto leading-relaxed whitespace-pre-wrap">
                            {activeVerdict.errorDiagnostic?.rawMessage || activeVerdict.userResult?.error}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. EXECUTED (NEUTRAL) STATE (No expected output testcase defined) */}
                {activeVerdict.status === 'executed' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-5 w-5 text-[var(--muted)]" />
                        <div>
                          <span className="text-sm font-bold text-[var(--ink)] font-display block">
                            Query Executed
                          </span>
                          <span className="text-[10px] text-[var(--muted)]">
                            No expected output defined for this case to verify correctness.
                          </span>
                        </div>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--muted)]">
                        {activeVerdict.runtimeMs} ms
                      </span>
                    </div>

                    {/* Result Output Table */}
                    {activeVerdict.userResult && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider font-semibold">
                          Your Output
                        </div>
                        <OutputTable
                          columns={activeVerdict.userResult.columns}
                          rows={activeVerdict.userResult.rows}
                          footerInfo={{
                            timeMs: activeVerdict.runtimeMs,
                            rowCount: activeVerdict.userResult.rowCount,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};