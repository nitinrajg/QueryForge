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
  HelpCircle, 
  Code2, 
  Database, 
  FileText,
  Lock,
  Unlock,
  ExternalLink,
  Cpu,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
 * Problem Practice Workspace.
 * 
 * Logic & Approach:
 * - Loads problem metadata, seed dataset SQL, and expected test case output.
 * - Seeds the selected in-browser WebAssembly SQL engine with dataset schema and rows.
 * - Manages user query execution (Run) and automatic test-case grading (Submit).
 * - Implements progressive hints reveal and solution unlocking safeguards.
 * - Auto-persists drafts to IndexedDB so learner code is never lost on refresh.
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

    // Load saved draft or boilerplate
    const initialCode = problemProgress?.lastCode || '-- Write your SQL query here\n';
    setCode(initialCode);
    setQueryResult(null);
    setCheckResult(null);
    setRevealedHints(0);
    setIsSolutionUnlocked(isSolved);

    // Initialize Engine with Problem Dataset
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
      setCheckResult(null); // Clear previous check on raw test run
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

      // Persist status in IndexedDB
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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#07090E]">
        <h2 className="text-2xl font-bold font-heading text-[#F1F5F9] mb-2">Problem Not Found</h2>
        <p className="text-xs text-[#94A3B8] font-mono mb-6">The requested problem identifier does not exist in content index.</p>
        <Link to="/practice">
          <Button variant="default">Back to Problem Catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#07090E]">
      {/* Top Cockpit Header Bar */}
      <header className="h-12 border-b border-[#1C2438] bg-[#0C1019] px-4 flex items-center justify-between shrink-0 light:bg-white light:border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link 
            to="/practice" 
            className="text-xs font-mono text-[#94A3B8] hover:text-[#06B6D4] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Catalog</span>
          </Link>
          <span className="text-[#334155] select-none">/</span>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-xs text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.5 rounded border border-[#06B6D4]/30 shrink-0">
              #{String(problem.number).padStart(3, '0')}
            </span>
            <span className="font-heading font-semibold text-xs text-[#F1F5F9] truncate light:text-slate-800">
              {problem.title}
            </span>
            <Badge variant={problem.difficulty as any} className="text-[10px] uppercase font-mono shrink-0">
              {problem.difficulty}
            </Badge>
            {isSolved && (
              <Badge variant="easy" className="gap-1 text-[10px] font-mono shrink-0">
                <CheckCircle2 className="h-3 w-3" />
                Solved
              </Badge>
            )}
          </div>
        </div>

        {/* Engine Switcher & Problem Pagination */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#07090E] border border-[#1C2438] rounded-lg px-2 py-1 text-xs">
            <Cpu className="h-3 w-3 text-[#06B6D4]" />
            <select
              value={engine}
              onChange={(e) => handleEngineChange(e.target.value as SupportedEngine)}
              aria-label="Execution engine"
              className="bg-transparent text-xs font-mono text-[#F1F5F9] focus:outline-none cursor-pointer light:text-slate-900"
            >
              <option value="sqlite" className="bg-[#0C1019] text-[#F1F5F9]">SQLite (WASM)</option>
              <option value="mysql" className="bg-[#0C1019] text-[#F1F5F9]">MySQL (compat)</option>
              <option value="pglite" className="bg-[#0C1019] text-[#F1F5F9]">PostgreSQL</option>
              <option value="pandas" className="bg-[#0C1019] text-[#F1F5F9]">pandas (Python)</option>
            </select>
          </div>

          <div className="flex items-center gap-1 border-l border-[#1C2438] pl-2">
            {prevProblem && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(`/practice/${prevProblem.id}`)}
                title={`Previous: #${prevProblem.number} ${prevProblem.title}`}
                className="h-7 w-7 text-[#94A3B8] hover:text-[#F1F5F9]"
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
                className="h-7 w-7 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Split: Left Tabs (Description, Schema, Hints, Solution) + Right Editor & Results */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Problem Details */}
        <div className="lg:col-span-5 border-r border-[#1C2438] flex flex-col bg-[#0C1019] overflow-hidden light:bg-slate-50 light:border-slate-200">
          {/* Navigation Tabs */}
          <div className="p-2 border-b border-[#1C2438] shrink-0 bg-[#07090E]">
            <div className="grid grid-cols-4 gap-1 p-1 bg-[#0C1019] rounded-lg border border-[#1C2438] text-xs font-mono">
              <button
                type="button"
                onClick={() => setLeftTab('description')}
                className={`py-1.5 px-2 rounded font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                  leftTab === 'description'
                    ? 'bg-[#161F30] text-[#22D3EE] border border-[#26354D]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                <FileText className="h-3 w-3" />
                <span>Problem</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('schema')}
                className={`py-1.5 px-2 rounded font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                  leftTab === 'schema'
                    ? 'bg-[#161F30] text-[#22D3EE] border border-[#26354D]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                <Database className="h-3 w-3" />
                <span>Schema</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('hints')}
                className={`py-1.5 px-2 rounded font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                  leftTab === 'hints'
                    ? 'bg-[#161F30] text-[#22D3EE] border border-[#26354D]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                <HelpCircle className="h-3 w-3" />
                <span>Hints ({problem.hints?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setLeftTab('solution')}
                className={`py-1.5 px-2 rounded font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-[11px] ${
                  leftTab === 'solution'
                    ? 'bg-[#161F30] text-[#22D3EE] border border-[#26354D]'
                    : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                }`}
              >
                {isSolutionUnlocked ? <Unlock className="h-3 w-3 text-emerald-400" /> : <Lock className="h-3 w-3" />}
                <span>Solution</span>
              </button>
            </div>
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* 1. Description */}
            {leftTab === 'description' && (
              <div className="space-y-4 text-xs leading-relaxed text-[#CBD5E1] light:text-slate-700">
                <div className="space-y-1">
                  <h2 className="text-base font-bold font-heading text-[#F1F5F9] light:text-slate-900">
                    {problem.title}
                  </h2>
                  {problem.sourceUrl && (
                    <a
                      href={problem.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-[#06B6D4] hover:underline"
                    >
                      <span>LeetCode / Original Source Link</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                <div className="p-4 rounded-xl border border-[#1C2438] bg-[#07090E] space-y-2 light:bg-white light:border-slate-200">
                  <h4 className="font-mono font-semibold text-[#06B6D4] uppercase text-[10px] tracking-wider">
                    Question Statement
                  </h4>
                  <p className="whitespace-pre-wrap leading-relaxed text-[#CBD5E1] font-sans text-xs">
                    {problem.description}
                  </p>
                </div>

                {/* Expected Output Table Preview */}
                {problem.expectedOutput?.columns?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-mono font-semibold text-[#94A3B8] uppercase text-[10px] tracking-wider">
                      Expected Output Structure
                    </h4>
                    <div className="border border-[#1C2438] rounded-xl overflow-x-auto bg-[#07090E] light:bg-white light:border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-[#0C1019] text-[#94A3B8] border-b border-[#1C2438] light:bg-slate-100">
                          <tr>
                            {problem.expectedOutput.columns.map((c: string, idx: number) => (
                              <th key={idx} className="py-1.5 px-2.5 font-mono text-[11px] text-[#22D3EE]">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1C2438]/50 light:divide-slate-200">
                          {problem.expectedOutput.rows.slice(0, 5).map((row: any[], rIdx: number) => (
                            <tr key={rIdx}>
                              {row.map((val: any, cIdx: number) => (
                                <td key={cIdx} className="py-1.5 px-2.5 font-mono text-[11px] text-[#CBD5E1] light:text-slate-800">
                                  {val === null ? (
                                    <span className="text-amber-400 italic text-[10px]">NULL</span>
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
                <p className="text-xs text-[#94A3B8]">
                  Stuck on this problem? Reveal hints progressively to guide your reasoning without spoiling the solution.
                </p>

                {(!problem.hints || problem.hints.length === 0) ? (
                  <p className="text-xs text-[#94A3B8] font-mono italic">No hints available for this problem.</p>
                ) : (
                  <div className="space-y-3">
                    {problem.hints.slice(0, revealedHints + 1).map((hint: string, hIdx: number) => (
                      <div
                        key={hIdx}
                        className="p-3.5 rounded-xl border border-[#06B6D4]/30 bg-[#06B6D4]/5 text-xs text-[#F1F5F9] space-y-1.5"
                      >
                        <span className="font-mono font-semibold text-[#06B6D4] uppercase text-[10px] tracking-wider">
                          Hint {hIdx + 1}
                        </span>
                        <div className="prose prose-invert max-w-none text-xs text-[#CBD5E1]">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{hint}</ReactMarkdown>
                        </div>
                      </div>
                    ))}

                    {revealedHints + 1 < problem.hints.length && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setRevealedHints((prev) => prev + 1)}
                        className="w-full text-xs font-mono"
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
                  <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3">
                    <Lock className="h-8 w-8 mx-auto text-amber-400" />
                    <h3 className="text-sm font-bold font-heading text-[#F1F5F9] light:text-slate-900">Solution Locked</h3>
                    <p className="text-xs text-[#94A3B8] max-w-xs mx-auto">
                      Submit an accepted solution to unlock the official reference code, or give up to view it immediately.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsSolutionUnlocked(true)}
                      className="text-xs font-mono border-amber-500/40 text-amber-300 hover:bg-amber-500/20"
                    >
                      Give Up & Reveal Solution
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
                      <Unlock className="h-4 w-4" />
                      <span>Official Reference Solution</span>
                    </div>

                    <div className="rounded-xl border border-[#1C2438] bg-[#07090E] p-4 overflow-x-auto">
                      <pre className="font-mono text-xs text-[#22D3EE] leading-relaxed">
                        <code>{problem.solutionSql}</code>
                      </pre>
                    </div>

                    {problem.explanation && (
                      <div className="p-4 rounded-xl border border-[#1C2438] bg-[#07090E] text-xs space-y-2 light:bg-white">
                        <h4 className="font-mono font-semibold text-[#06B6D4] uppercase text-[10px] tracking-wider">
                          Explanation & Trade-offs
                        </h4>
                        <div className="prose prose-invert max-w-none text-xs text-[#CBD5E1]">
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
        <div className="lg:col-span-7 flex flex-col h-full bg-[#07090E] overflow-hidden">
          {/* Editor Header Bar with Run & Submit */}
          <div className="h-12 border-b border-[#1C2438] bg-[#0C1019] px-4 flex items-center justify-between shrink-0 light:bg-slate-100 light:border-slate-200">
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-[#06B6D4]" />
              <span className="text-xs font-mono font-medium text-[#F1F5F9] light:text-slate-800">
                SQL Console
              </span>
              <span className="text-[10px] text-[#64748B] font-mono hidden sm:inline-block">
                (Ctrl+Enter to Execute)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                title="Reset Database to original seed"
                className="text-xs font-mono gap-1 text-[#94A3B8] hover:text-[#F1F5F9]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset DB</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleRun}
                disabled={isRunning}
                className="gap-1.5 text-xs font-mono border-[#1C2438]"
              >
                <Play className="h-3.5 w-3.5 text-[#22D3EE] fill-[#22D3EE]" />
                <span>Run</span>
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={handleSubmit}
                disabled={isRunning}
                className="gap-1.5 text-xs font-mono bg-[#06B6D4] hover:bg-[#0891B2] text-[#07090E] font-semibold"
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
          <div className="h-[280px] border-t border-[#1C2438] bg-[#0C1019] p-3 overflow-hidden flex flex-col shrink-0 light:bg-white light:border-slate-200">
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
