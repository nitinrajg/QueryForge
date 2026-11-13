import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Play, 
  Send, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Lock,
  Unlock,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { ResultsPanel } from '@/components/editor/ResultsPanel';
import { SchemaViewer } from '@/components/editor/SchemaViewer';
import { engineManager } from '@/engines/engine-manager';
import { QueryResult, TableSchema, SupportedEngine } from '@/engines/types';
import { compareResults, CheckResult } from '@/checker/comparator';
import { useProgressStore } from '@/store/useProgressStore';
import { useEditorStore } from '@/store/useEditorStore';
import problemsData from '@/content/problems.json';

/**
 * Problem Practice Workspace — Data Terminal Split Layout.
 * 
 * Logic & Approach:
 * - Top toolbar: unpadded problem identifier, plain sentence-case difficulty, engine switcher, prev/next.
 * - Left pane: full-width underline tabs (Question, Schema, Hints, Solution) with 1px accent selection indicator.
 * - Progressive hint reveal with count tracker, solution locked until passed or explicitly revealed.
 * - Right pane: CodeMirror 6 workspace with Run (secondary) and Submit (primary safety orange).
 * - Client-side verification and schema-aware autocomplete via Dexie and SQLite WASM.
 */
export const PracticeWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const problem = (problemsData as any)[id || ''];
  const allProblems = Object.values(problemsData) as any[];
  const currentIndex = allProblems.findIndex((p) => p.id === id);

  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  const { problems: progressProblems, markProblem, saveDraft } = useProgressStore();
  const { engine, setEngine } = useEditorStore();

  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState(false);
  const [leftTab, setLeftTab] = useState<'description' | 'schema' | 'hints' | 'solution'>('description');

  const problemProgress = problem ? progressProblems[problem.id] : null;
  const isSolved = problemProgress?.status === 'solved';

  // 1. Initialize Problem Dataset and Draft Code
  useEffect(() => {
    if (!problem) return;

    const initialCode = problemProgress?.lastCode || '-- Write your SQL query here\n';
    setCode(initialCode);
    setQueryResult(null);
    setCheckResult(null);
    setRevealedHints(0);
    setIsSolutionUnlocked(isSolved);

    const setupDataset = async () => {
      try {
        await engineManager.loadDataset(problem.datasetSql);
        const currentSchema = await engineManager.getSchema();
        setSchema(currentSchema);
      } catch (err) {
        console.error('Failed to load dataset into SQL engine:', err);
      }
    };

    setupDataset();
  }, [id, problem]);

  // 2. Auto-save code drafts
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (problem) {
      saveDraft(problem.id, newCode);
    }
  };

  // 3. Run Query in Browser Engine
  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    try {
      const res = await engineManager.run(code);
      setQueryResult(res);
      setCheckResult(null);
    } catch (err: any) {
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        timeMs: 0,
        error: err.message || String(err),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 4. Submit & Auto-Grade Answer
  const handleSubmit = async () => {
    if (!code.trim() || !problem) return;
    setIsRunning(true);

    try {
      const res = await engineManager.run(code);
      setQueryResult(res);

      const evaluation = compareResults(res, problem.expectedOutput);
      setCheckResult(evaluation);

      await markProblem(
        problem.id,
        evaluation.passed ? 'solved' : 'attempted',
        code,
        problem.title
      );

      if (evaluation.passed) {
        setIsSolutionUnlocked(true);
      }
    } catch (err: any) {
      setQueryResult({
        columns: [],
        rows: [],
        rowCount: 0,
        timeMs: 0,
        error: err.message || String(err),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 5. Reset Database Session
  const handleReset = async () => {
    if (!problem) return;
    await engineManager.reset();
    const currentSchema = await engineManager.getSchema();
    setSchema(currentSchema);
    setQueryResult(null);
    setCheckResult(null);
  };

  const handleEngineChange = async (newEngine: SupportedEngine) => {
    setEngine(newEngine);
    await engineManager.setActiveEngine(newEngine);
    if (problem) {
      await engineManager.loadDataset(problem.datasetSql);
      const currentSchema = await engineManager.getSchema();
      setSchema(currentSchema);
    }
  };

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--bg)] text-[var(--ink)]">
        <h2 className="text-2xl font-normal font-display mb-2">Problem Not Located</h2>
        <p className="text-xs text-[var(--muted)] mb-6">The requested problem identifier does not exist in the catalog.</p>
        <Link to="/practice">
          <Button variant="default">Back to Problem Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[var(--ground)] text-[var(--ink)]">
      {/* Top Data Terminal Header Bar */}
      <header className="h-12 border-b border-[var(--border)] bg-[var(--surface-app)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            to="/practice" 
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Catalog</span>
          </Link>
          <span className="text-[var(--rule)] select-none">/</span>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xs tabular-nums text-[var(--muted)] shrink-0 font-medium">
              {problem.number}.
            </span>
            <span className="font-medium text-xs text-[var(--ink)] truncate">
              {problem.title}
            </span>

            {/* Plain Difficulty Word */}
            <span className={`text-xs capitalize shrink-0 ${
              problem.difficulty === 'easy'
                ? 'text-[var(--positive)]'
                : problem.difficulty === 'medium'
                ? 'text-[var(--warning)]'
                : 'text-[var(--negative)]'
            }`}>
              {problem.difficulty}
            </span>

            {isSolved && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[var(--pill-positive-bg)] text-[var(--positive)] rounded-none shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                <span>Solved</span>
              </span>
            )}
          </div>
        </div>

        {/* Engine Switcher & Problem Pagination */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--ground)] px-2 py-1 text-xs">
            <span className="text-[10px] text-[var(--muted)] uppercase">Engine:</span>
            <select
              value={engine}
              onChange={(e) => handleEngineChange(e.target.value as SupportedEngine)}
              aria-label="Execution engine"
              className="bg-transparent text-xs text-[var(--ink)] focus:outline-none cursor-pointer"
            >
              <option value="sqlite" className="bg-[var(--surface-app)] text-[var(--ink)]">SQLite (WASM)</option>
              <option value="mysql" className="bg-[var(--surface-app)] text-[var(--ink)]">MySQL (compat)</option>
              <option value="pglite" className="bg-[var(--surface-app)] text-[var(--ink)]">PostgreSQL</option>
              <option value="pandas" className="bg-[var(--surface-app)] text-[var(--ink)]">pandas (Python)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 border-l border-[var(--border)] pl-2">
            {prevProblem && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/practice/${prevProblem.id}`)}
                title={`Previous: #${prevProblem.number} ${prevProblem.title}`}
                className="h-7 w-7 text-[var(--muted)] hover:text-[var(--ink)] rounded-none"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Button>
            )}
            {nextProblem && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/practice/${nextProblem.id}`)}
                title={`Next: #${nextProblem.number} ${nextProblem.title}`}
                className="h-7 w-7 text-[var(--muted)] hover:text-[var(--ink)] rounded-none"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Split: Left Tabs + Right Editor & Results */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Problem Details */}
        <div className="lg:col-span-5 border-r border-[var(--border)] flex flex-col bg-[var(--surface-app)] overflow-hidden">
          {/* Underline Tabs */}
          <div className="flex items-center gap-6 px-4 border-b border-[var(--border)] bg-[var(--ground)] shrink-0 overflow-x-auto -mb-px">
            <button
              type="button"
              onClick={() => setLeftTab('description')}
              className={`py-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                leftTab === 'description'
                  ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Question
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('schema')}
              className={`py-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                leftTab === 'schema'
                  ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Schema ({schema.length})
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('hints')}
              className={`py-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                leftTab === 'hints'
                  ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Hints ({problem.hints?.length || 0})
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('solution')}
              className={`py-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                leftTab === 'solution'
                  ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              {isSolutionUnlocked ? <Unlock className="h-3 w-3 text-[var(--positive)]" /> : <Lock className="h-3 w-3" />}
              <span>Solution</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Description */}
            {leftTab === 'description' && (
              <div className="space-y-4 text-xs leading-relaxed text-[var(--ink)]">
                <div className="space-y-1">
                  <h2 className="text-base font-normal font-display text-[var(--ink)]">
                    {problem.title}
                  </h2>
                  {problem.sourceUrl && (
                    <a
                      href={problem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
                    >
                      <span>External Problem Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 border border-[var(--border)] bg-[var(--ground)] space-y-2">
                  <div className="font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider">
                    Question Statement
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed text-[var(--ink)] text-xs">
                    {problem.description}
                  </p>
                </div>

                {/* Expected Output Table Preview */}
                {problem.expectedOutput?.columns?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider">
                      Expected Output Columns
                    </div>
                    <div className="border border-[var(--border)] overflow-x-auto bg-[var(--ground)]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[var(--surface-app)] text-[var(--muted)] border-b border-[var(--border)]">
                          <tr>
                            {problem.expectedOutput.columns.map((c: string, idx: number) => (
                              <th key={idx} className="py-1.5 px-2.5 font-mono text-[11px] font-semibold text-[var(--ink)]">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--rule)]">
                          {problem.expectedOutput.rows.slice(0, 5).map((row: any[], rIdx: number) => (
                            <tr key={rIdx}>
                              {row.map((val: any, cIdx: number) => (
                                <td key={cIdx} className="py-1.5 px-2.5 font-mono text-[11px] text-[var(--ink)]">
                                  {val === null ? (
                                    <span className="text-[var(--warning)] italic text-[10px]">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
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
            )}

            {/* 2. Schema Tab */}
            {leftTab === 'schema' && (
              <SchemaViewer schema={schema} />
            )}

            {/* 3. Hints Tab */}
            {leftTab === 'hints' && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--muted)]">
                  Reveal progressive hints to guide your formulation without spoiling the final answer.
                </p>

                {(!problem.hints || problem.hints.length === 0) ? (
                  <p className="text-xs text-[var(--muted)] italic">No hints available for this problem.</p>
                ) : (
                  <div className="space-y-3">
                    {problem.hints.slice(0, revealedHints + 1).map((hint: string, hIdx: number) => (
                      <div
                        key={hIdx}
                        className="p-3.5 border border-[var(--border)] bg-[var(--ground)] text-xs text-[var(--ink)] space-y-1.5"
                      >
                        <span className="font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider">
                          Hint {hIdx + 1} of {problem.hints.length}
                        </span>
                        <div className="text-xs leading-relaxed opacity-95">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{hint}</ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    {revealedHints + 1 < problem.hints.length && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRevealedHints((prev) => prev + 1)}
                        className="w-full text-xs rounded-none"
                      >
                        Reveal Next Hint ({revealedHints + 2}/{problem.hints.length})
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. Solution Tab */}
            {leftTab === 'solution' && (
              <div className="space-y-4">
                {!isSolutionUnlocked ? (
                  <div className="p-6 border border-[var(--border)] bg-[var(--ground)] text-center space-y-3">
                    <Lock className="h-6 w-6 mx-auto text-[var(--muted)]" />
                    <h3 className="text-sm font-medium text-[var(--ink)]">Solution Locked</h3>
                    <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
                      Submit an accepted solution to automatically unlock the reference query, or choose to reveal it now.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSolutionUnlocked(true)}
                      className="text-xs rounded-none border-[var(--border)] text-[var(--ink)]"
                    >
                      Reveal Reference Solution
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs text-[var(--positive)] font-medium">
                      <Unlock className="h-4 w-4" />
                      <span>Official Reference Query</span>
                    </div>

                    <div className="border border-[var(--border)] bg-[var(--ground)] p-4 overflow-x-auto">
                      <pre className="font-mono text-xs text-[var(--ink)] leading-relaxed">
                        <code>{problem.solutionSql}</code>
                      </pre>
                    </div>

                    {problem.explanation && (
                      <div className="p-4 border border-[var(--border)] bg-[var(--ground)] text-xs space-y-2">
                        <div className="font-mono text-[10px] uppercase text-[var(--muted)] tracking-wider">
                          Approach and Reasoning
                        </div>
                        <div className="text-xs leading-relaxed opacity-95">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.explanation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CodeMirror Editor & Results Table */}
        <div className="lg:col-span-7 flex flex-col h-full bg-[var(--ground)] overflow-hidden">
          {/* Editor Header Bar with Run & Submit */}
          <div className="h-12 border-b border-[var(--border)] bg-[var(--surface-app)] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[var(--ink)]">
                SQL Console
              </span>
              <span className="text-[11px] text-[var(--muted)] hidden sm:inline-block">
                (Ctrl+Enter to Execute)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                title="Reset Database to original seed"
                className="text-xs gap-1 text-[var(--muted)] hover:text-[var(--ink)] rounded-none"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset DB</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                className="gap-1.5 text-xs rounded-none border-[var(--border)]"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Run</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={isRunning}
                className="gap-1.5 text-xs rounded-none font-medium"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit</span>
              </Button>
            </div>
          </div>

          {/* Top Half: CodeMirror Editor */}
          <div className="flex-1 p-3 overflow-hidden min-h-[220px]">
            <SqlEditor
              value={code}
              onChange={handleCodeChange}
              onRun={handleRun}
              schema={schema}
              engine={engine}
              minHeight="100%"
            />
          </div>

          {/* Bottom Half: Results Panel */}
          <div className="h-[280px] border-t border-[var(--border)] bg-[var(--surface-app)] p-3 overflow-hidden flex flex-col shrink-0">
            <ResultsPanel
              result={queryResult}
              isLoading={isRunning}
              checkResult={checkResult}
              expectedOutput={problem.expectedOutput}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
