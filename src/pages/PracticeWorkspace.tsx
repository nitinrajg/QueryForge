import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Play,
  Send,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  Database,
  Copy,
  Check,
  List,
  Shuffle,
  FileText,
  BookOpen,
  Code2,
  Lightbulb,
  Tag,
  Building2,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  AArrowDown,
  AArrowUp,
  Sun,
  Moon,
  Terminal,
  History,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { ResultsPanel } from '@/components/editor/ResultsPanel';
import { SchemaViewer } from '@/components/editor/SchemaViewer';
import { ResizeHandle } from '@/components/workspace/ResizeHandle';
import { SessionTimer } from '@/components/workspace/SessionTimer';
import { useSplitPanes } from '@/components/workspace/useSplitPanes';
import { engineManager } from '@/engines/engine-manager';
import { QueryResult, TableSchema, SupportedEngine } from '@/engines/types';
import { compareResults, CheckResult } from '@/checker/comparator';
import { parseSqlError } from '@/checker/error-parser';
import { TestCaseModel, CustomTableInput, CaseVerdict } from '@/types/testcase';
import { useProgressStore } from '@/store/useProgressStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useThemeStore } from '@/store/useThemeStore';
import problemsData from '@/content/problems.json';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { syncService } from '@/services/syncService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * LeetCode-Inspired SQL Practice Workspace.
 * 
 * Performance & Architecture:
 * - Draggable, Resizable Split Panes (Pointer Capture + rAF CSS variables, 60fps locked).
 * - LeetCode Top Bar: Problem list nav, Shuffle random, Session stopwatch timer,
 *   centered Run & Submit buttons, Dialect selector, and Theme toggle.
 * - Left Pane: Tabbed spec panel (Description, Editorial, Solutions, Schema, Hints)
 *   with independent scroll and panel maximize/collapse controls.
 * - Right Pane:
 *   - Top: Code editor with toolbar (Dialect, font size, format code, reset, maximize).
 *   - Bottom: Testcase & Result console with runtime metrics and Output vs Expected diff.
 * - Responsive: below 900px, switches to a stacked tabbed layout with no resize handles.
 * - Full-viewport app shell (100dvh), zero page scroll, only internal panel scrolls.
 */
export const PracticeWorkspace: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const problem = (problemsData as any)[id || ''];
  const allProblems = useMemo(() => Object.values(problemsData) as any[], []);
  const currentIndex = allProblems.findIndex((p) => p.id === id);

  const prevProblem = currentIndex > 0 ? allProblems[currentIndex - 1] : null;
  const nextProblem = currentIndex < allProblems.length - 1 ? allProblems[currentIndex + 1] : null;

  const { problems: progressProblems, markProblem, saveDraft } = useProgressStore();
  const { engine, setEngine, fontSize, setFontSize } = useEditorStore();
  const { theme, toggleTheme } = useThemeStore();

  // Split-panes state & high-performance resize engine
  const {
    containerRef,
    layoutState,
    verticalProps,
    horizontalProps,
    toggleMaximize,
    toggleCollapseLeft,
    toggleCollapseConsole,
  } = useSplitPanes();

  // Mobile layout state (< 900px)
  const [mobileTab, setMobileTab] = useState<'description' | 'code' | 'console'>('description');

  const [code, setCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [revealedHints, setRevealedHints] = useState<number>(0);
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);
  const [leftTab, setLeftTab] = useState<'description' | 'editorial' | 'solution' | 'submissions'>('description');
  const [showTopics, setShowTopics] = useState(false);
  const [showSqlSchemaModal, setShowSqlSchemaModal] = useState(false);
  const [openHints, setOpenHints] = useState<Record<number, boolean>>({});
  const [copiedSchemaSql, setCopiedSchemaSql] = useState(false);

  // LeetCode-style Testcase & Verdict State
  const [testCases, setTestCases] = useState<TestCaseModel[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>('case_1');
  const [consoleTab, setConsoleTab] = useState<'testcase' | 'result'>('result');
  const [verdicts, setVerdicts] = useState<CaseVerdict[]>([]);
  const [activeVerdictIndex, setActiveVerdictIndex] = useState<number>(0);
  const [cloudSubmissions, setCloudSubmissions] = useState<any[]>([]);

  const { user } = useAuth();

  const copySchemaSql = () => {
    if (problem?.datasetSql) {
      navigator.clipboard.writeText(problem.datasetSql);
      setCopiedSchemaSql(true);
      setTimeout(() => setCopiedSchemaSql(false), 2000);
    }
  };

  const problemProgress = problem ? progressProblems[problem.id] : null;
  const isSolved = problemProgress?.status === 'solved';

  // Persistence helper for test cases
  const saveTestCasesToStorage = (casesToSave: TestCaseModel[]) => {
    if (!problem) return;
    try {
      localStorage.setItem(`queryforge-testcases-${problem.id}`, JSON.stringify(casesToSave));
    } catch (e) {
      console.warn('Failed to save test cases to storage:', e);
    }

    // Sync custom test cases to Supabase if authenticated
    if (user && isSupabaseConfigured) {
      casesToSave.forEach((tc) => {
        if (!tc.isDefault) {
          const inputData: Record<string, (string | number | boolean | null)[][]> = {};
          tc.inputs.forEach((inp) => {
            inputData[inp.tableName] = inp.rows.map((r) => Object.values(r.values));
          });
          syncService.syncCustomTestcase(user.id, {
            problem_id: problem.id,
            name: tc.label,
            input_data: inputData,
            expected_output: tc.expectedOutput ? {
              columns: tc.expectedOutput.columns,
              rows: tc.expectedOutput.rows,
            } : null,
            updated_at: new Date().toISOString(),
          }).catch((err) => console.warn('Testcase sync failed:', err));
        }
      });
    }
  };

  // 1. Initialize Problem Dataset, Draft Code, and Testcases
  useEffect(() => {
    if (!problem) return;

    const initialCode = problemProgress?.lastCode || '-- Write your SQL query here\n';
    setCode(initialCode);
    setQueryResult(null);
    setCheckResult(null);
    setVerdicts([]);
    setActiveVerdictIndex(0);
    setRevealedHints(0);
    setIsSolutionUnlocked(isSolved);

    const setupDataset = async () => {
      try {
        await engineManager.loadDataset(problem.datasetSql);
        const currentSchema = await engineManager.getSchema();
        setSchema(currentSchema);

        // Load or initialize test cases
        const storageKey = `queryforge-testcases-${problem.id}`;
        let loadedCases: TestCaseModel[] | null = null;
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            loadedCases = JSON.parse(raw);
          }
        } catch (e) {
          console.warn('Failed to parse cached testcases:', e);
        }

        if (loadedCases && Array.isArray(loadedCases) && loadedCases.length > 0) {
          setTestCases(loadedCases);
          setActiveCaseId(loadedCases[0].id);
        } else {
          const defaultCase: TestCaseModel = {
            id: 'case_1',
            label: 'Case 1',
            isDefault: true,
            inputs: currentSchema.map((tbl) => ({
              tableName: tbl.name,
              rows: (tbl.sampleRows && tbl.sampleRows.length > 0 ? tbl.sampleRows : [[]]).map((row, rIdx) => {
                const values: Record<string, any> = {};
                tbl.columns.forEach((col, cIdx) => {
                  values[col.name] = row[cIdx] ?? null;
                });
                return {
                  id: `row_${rIdx + 1}`,
                  values,
                };
              }),
            })),
            expectedOutput: problem.expectedOutput,
          };
          setTestCases([defaultCase]);
          setActiveCaseId('case_1');
        }
      } catch (err) {
        console.error('Failed to load dataset into SQL engine:', err);
      }
    };

    setupDataset();
  }, [id, problem]);

  // Fetch Cloud Submissions for this problem when Submissions tab is open
  useEffect(() => {
    if (leftTab === 'submissions' && user && isSupabaseConfigured && problem) {
      supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('problem_id', problem.id)
        .order('submitted_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (data) setCloudSubmissions(data);
        });
    }
  }, [leftTab, user, problem]);

  // 2. Auto-save code drafts
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (problem) {
      saveDraft(problem.id, newCode);
    }
  };

  // SQL Value Formatter for custom case queries
  const formatSqlValue = (val: any): string => {
    if (val === null || val === undefined || val === '') return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    const str = String(val).replace(/'/g, "''");
    return `'${str}'`;
  };

  // Execute a single test case (default or custom)
  const executeSingleCase = async (caseModel: TestCaseModel, sqlCode: string): Promise<CaseVerdict> => {
    if (!problem) throw new Error('No problem active');

    // 1. Prepare engine dataset for this case
    if (caseModel.isDefault) {
      await engineManager.loadDataset(problem.datasetSql);
    } else {
      const tableCreates = schema.map((tbl) => {
        const colDefs = tbl.columns.map((c) => `"${c.name}" ${c.type || 'TEXT'}`).join(', ');
        return `CREATE TABLE "${tbl.name}" (${colDefs});`;
      }).join('\n');

      const inserts: string[] = [];
      for (const inp of caseModel.inputs) {
        if (inp.rawInsertSql && inp.rawInsertSql.trim()) {
          inserts.push(inp.rawInsertSql.trim());
        } else if (inp.rows && inp.rows.length > 0) {
          const tblSchema = schema.find((s) => s.name === inp.tableName);
          const colNames = tblSchema ? tblSchema.columns.map((c) => c.name) : Object.keys(inp.rows[0].values);

          for (const row of inp.rows) {
            const vals = colNames.map((col) => formatSqlValue(row.values[col]));
            inserts.push(`INSERT INTO "${inp.tableName}" (${colNames.map((c) => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')});`);
          }
        }
      }

      const customSeed = `${tableCreates}\n${inserts.join('\n')}`;
      await engineManager.loadDataset(customSeed);
    }

    // 2. Run user query
    const res = await engineManager.run(sqlCode);

    // 3. Handle runtime or syntax errors
    if (res.error) {
      const parsedErr = parseSqlError(res.error, schema);
      return {
        caseId: caseModel.id,
        caseLabel: caseModel.label,
        status: 'error',
        runtimeMs: res.timeMs || 0,
        userResult: res,
        expectedOutput: caseModel.expectedOutput,
        errorDiagnostic: parsedErr,
      };
    }

    // 4. Handle neutral 'executed' (if case has no expected output defined)
    if (!caseModel.expectedOutput || !caseModel.expectedOutput.columns || caseModel.expectedOutput.columns.length === 0) {
      return {
        caseId: caseModel.id,
        caseLabel: caseModel.label,
        status: 'executed',
        runtimeMs: res.timeMs,
        userResult: res,
      };
    }

    // 5. Compare result with expected output
    const comparison = compareResults(res, caseModel.expectedOutput);
    return {
      caseId: caseModel.id,
      caseLabel: caseModel.label,
      status: comparison.verdictStatus,
      runtimeMs: res.timeMs,
      userResult: res,
      expectedOutput: caseModel.expectedOutput,
      mismatch: comparison.mismatch,
      diffMatrix: comparison.diffMatrix,
    };
  };

  // 3. Run Query against Selected Test Case
  const handleRunSelectedCase = async () => {
    if (!code.trim() || !problem) return;
    setIsRunning(true);
    setConsoleTab('result');
    setMobileTab('console');

    try {
      const activeCase = testCases.find((c) => c.id === activeCaseId) || testCases[0];
      const verdict = await executeSingleCase(activeCase, code);
      setVerdicts([verdict]);
      setActiveVerdictIndex(0);
      setQueryResult(verdict.userResult || null);
      setCheckResult(verdict.status === 'accepted' ? { passed: true, message: 'Accepted' } : { passed: false, message: verdict.mismatch?.summary || 'Wrong Answer' });
    } catch (err: any) {
      const parsedErr = parseSqlError(err.message || String(err), schema);
      setVerdicts([{
        caseId: activeCaseId,
        caseLabel: 'Selected Case',
        status: 'error',
        runtimeMs: 0,
        userResult: { columns: [], rows: [], rowCount: 0, timeMs: 0, error: err.message },
        errorDiagnostic: parsedErr,
      }]);
    } finally {
      setIsRunning(false);
    }
  };

  // Run All Test Cases in Sequence
  const handleRunAllCases = async () => {
    if (!code.trim() || !problem || testCases.length === 0) return;
    setIsRunning(true);
    setConsoleTab('result');
    setMobileTab('console');

    try {
      const allVerdicts: CaseVerdict[] = [];
      for (const testCase of testCases) {
        const v = await executeSingleCase(testCase, code);
        allVerdicts.push(v);
      }
      setVerdicts(allVerdicts);
      setActiveVerdictIndex(0);
      if (allVerdicts[0]?.userResult) {
        setQueryResult(allVerdicts[0].userResult);
      }
    } catch (err: any) {
      console.error('Run all cases error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // 4. Submit & Auto-Grade Answer against Problem Expectations
  const handleSubmit = async () => {
    if (!code.trim() || !problem) return;
    setIsRunning(true);
    setConsoleTab('result');
    setMobileTab('console');

    try {
      const defaultCase = testCases.find((c) => c.isDefault) || testCases[0];
      const verdict = await executeSingleCase(defaultCase, code);
      setVerdicts([verdict]);
      setActiveVerdictIndex(0);
      setQueryResult(verdict.userResult || null);

      if (verdict.status === 'accepted') {
        setCheckResult({ passed: true, message: 'All assertions verified.' });
        markProblem(problem.id, 'solved', code);
        setIsSolutionUnlocked(true);
      } else {
        setCheckResult({ passed: false, message: verdict.mismatch?.summary || verdict.errorDiagnostic?.title || 'Execution failed' });
        markProblem(problem.id, 'attempted', code);
      }

      // Sync submission to Supabase
      if (user && isSupabaseConfigured) {
        const submissionVerdict = verdict.status === 'accepted' ? 'Accepted'
          : verdict.status === 'wrong_answer' ? 'Wrong Answer'
          : verdict.status === 'error' ? 'Runtime Error'
          : 'Executed';

        syncService.syncSubmission(user.id, {
          problem_id: problem.id,
          verdict: submissionVerdict,
          code,
          runtime_ms: verdict.runtimeMs,
          row_count: verdict.userResult?.rowCount || 0,
        }).then(() => {
          // Refresh submissions if on submissions tab
          supabase
            .from('submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('problem_id', problem.id)
            .order('submitted_at', { ascending: false })
            .limit(20)
            .then(({ data }) => {
              if (data) setCloudSubmissions(data);
            });
        }).catch((err) => console.warn('Submission sync failed:', err));
      }
    } catch (err: any) {
      const parsedErr = parseSqlError(err.message || String(err), schema);
      setVerdicts([{
        caseId: 'submit_eval',
        caseLabel: 'Submission',
        status: 'error',
        runtimeMs: 0,
        userResult: { columns: [], rows: [], rowCount: 0, timeMs: 0, error: err.message },
        errorDiagnostic: parsedErr,
      }]);
      markProblem(problem.id, 'attempted', code);
    } finally {
      setIsRunning(false);
    }
  };

  // Test Case Management Handlers
  const handleAddCase = () => {
    const nextNum = testCases.length + 1;
    const newCaseId = `case_${Date.now()}`;
    const newCase: TestCaseModel = {
      id: newCaseId,
      label: `Case ${nextNum}`,
      isDefault: false,
      inputs: schema.map((tbl) => ({
        tableName: tbl.name,
        rows: (tbl.sampleRows && tbl.sampleRows.length > 0 ? tbl.sampleRows : [[]]).map((row, rIdx) => {
          const values: Record<string, any> = {};
          tbl.columns.forEach((col, cIdx) => {
            values[col.name] = row[cIdx] ?? null;
          });
          return {
            id: `row_${rIdx + 1}`,
            values,
          };
        }),
      })),
    };
    const updated = [...testCases, newCase];
    setTestCases(updated);
    setActiveCaseId(newCaseId);
    saveTestCasesToStorage(updated);
  };

  const handleDuplicateCase = (caseId: string) => {
    const target = testCases.find((c) => c.id === caseId);
    if (!target) return;
    const newCaseId = `case_${Date.now()}`;
    const copy: TestCaseModel = {
      ...JSON.parse(JSON.stringify(target)),
      id: newCaseId,
      label: `${target.label} (Copy)`,
      isDefault: false,
    };
    const updated = [...testCases, copy];
    setTestCases(updated);
    setActiveCaseId(newCaseId);
    saveTestCasesToStorage(updated);
  };

  const handleDeleteCase = (caseId: string) => {
    const target = testCases.find((c) => c.id === caseId);
    if (!target || target.isDefault) return;
    const updated = testCases.filter((c) => c.id !== caseId);
    setTestCases(updated);
    if (activeCaseId === caseId) {
      setActiveCaseId(updated[0]?.id || 'case_1');
    }
    saveTestCasesToStorage(updated);
  };

  const handleRenameCase = (caseId: string, newLabel: string) => {
    const updated = testCases.map((c) => (c.id === caseId ? { ...c, label: newLabel } : c));
    setTestCases(updated);
    saveTestCasesToStorage(updated);
  };

  const handleUpdateCaseInputs = (caseId: string, inputs: CustomTableInput[]) => {
    const updated = testCases.map((c) => (c.id === caseId ? { ...c, inputs } : c));
    setTestCases(updated);
    saveTestCasesToStorage(updated);
  };

  const handleUpdateCaseExpected = (
    caseId: string,
    expected?: { columns: string[]; rows: (string | number | boolean | null)[][] }
  ) => {
    const updated = testCases.map((c) => (c.id === caseId ? { ...c, expectedOutput: expected } : c));
    setTestCases(updated);
    saveTestCasesToStorage(updated);
  };

  const handleUseQueryOutputAsExpected = (caseId: string) => {
    const currentVerdict = verdicts[activeVerdictIndex];
    if (!currentVerdict?.userResult || currentVerdict.userResult.error) return;

    const userRes = currentVerdict.userResult;
    const nextCases = testCases.map((c) => {
      if (c.id !== caseId) return c;
      return {
        ...c,
        expectedOutput: {
          columns: [...userRes.columns],
          rows: userRes.rows.map((r) => [...r]),
        },
      };
    });
    setTestCases(nextCases);
    saveTestCasesToStorage(nextCases);
  };

  // 5. Reset Dataset to original state
  const handleReset = async () => {
    if (!problem) return;
    try {
      await engineManager.loadDataset(problem.datasetSql);
      const currentSchema = await engineManager.getSchema();
      setSchema(currentSchema);
      setQueryResult(null);
      setCheckResult(null);
    } catch (err) {
      console.error('Failed to reset dataset:', err);
    }
  };

  // Reset SQL code to initial template
  const handleResetCode = () => {
    setCode('-- Write your SQL query here\n');
  };

  // Format SQL Query keywords
  const handleFormatCode = () => {
    if (!code.trim()) return;
    const keywords = [
      'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN',
      'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'UNION ALL',
      'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
      'DROP TABLE', 'AND', 'OR', 'NOT', 'IN', 'IS NULL', 'IS NOT NULL', 'AS',
      'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX'
    ];
    let formatted = code;
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      formatted = formatted.replace(regex, kw);
    });
    handleCodeChange(formatted);
  };

  // Random problem navigation
  const handleShuffle = () => {
    const pool = allProblems.filter((p) => p.id !== id);
    if (pool.length > 0) {
      const random = pool[Math.floor(Math.random() * pool.length)];
      navigate(`/practice/${random.id}`);
    }
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

  const copySolutionToClipboard = () => {
    if (!problem.solutionSql) return;
    navigator.clipboard.writeText(problem.solutionSql);
    setCopiedSolution(true);
    setTimeout(() => setCopiedSolution(false), 2000);
  };

  const loadSolutionIntoEditor = () => {
    if (!problem.solutionSql) return;
    setCode(problem.solutionSql);
    saveDraft(problem.id, problem.solutionSql);
  };

  if (!problem) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] bg-[var(--bg)] text-[var(--ink)]">
        <h2 className="text-2xl font-bold font-display mb-2">Problem Not Found</h2>
        <p className="text-xs text-[var(--muted)] mb-6">The requested interview question does not exist in the catalog.</p>
        <Link to="/practice">
          <Button size="sm">Back to Practice Catalog</Button>
        </Link>
      </div>
    );
  }

  // Difficulty badge styling
  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'easy':
        return 'text-[#00b8a3] bg-[#00b8a3]/10 border border-[#00b8a3]/20';
      case 'medium':
        return 'text-[#ffc01e] bg-[#ffc01e]/10 border border-[#ffc01e]/20';
      case 'hard':
        return 'text-[#ff375f] bg-[#ff375f]/10 border border-[#ff375f]/20';
      default:
        return 'text-[var(--muted)] bg-[var(--raised)] border border-[var(--border)]';
    }
  };

  const { maximizedPane, isLeftCollapsed, isConsoleCollapsed } = layoutState;

  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 bg-[var(--bg)] overflow-hidden select-none">

      {/* ================= LEETCODE WORKSPACE TOP-BAR ================= */}
      <header className="h-11 px-3 border-b border-[var(--border)] bg-[var(--surface)] flex items-center justify-between shrink-0 select-none z-20">

        {/* Left: Problem List, Prev/Next & Shuffle */}
        <div className="flex items-center gap-1.5">
          <Link
            to="/practice"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
            title="Back to All Problems"
          >
            <List className="h-3.5 w-3.5" />
            <span className="font-semibold hidden sm:inline">Problem List</span>
          </Link>

          <div className="h-3.5 w-px bg-[var(--border)] mx-1" />

          {/* Prev Problem */}
          {prevProblem ? (
            <button
              type="button"
              onClick={() => navigate(`/practice/${prevProblem.id}`)}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              title={`#${prevProblem.number}. ${prevProblem.title}`}
              aria-label="Previous Problem"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          ) : (
            <button disabled className="p-1 text-[var(--faint)] cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Next Problem */}
          {nextProblem ? (
            <button
              type="button"
              onClick={() => navigate(`/practice/${nextProblem.id}`)}
              className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              title={`#${nextProblem.number}. ${nextProblem.title}`}
              aria-label="Next Problem"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button disabled className="p-1 text-[var(--faint)] cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Shuffle Random Problem */}
          <button
            type="button"
            onClick={handleShuffle}
            className="p-1 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer ml-0.5"
            title="Pick Random Problem"
            aria-label="Pick Random Problem"
          >
            <Shuffle className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Center: Run & Submit Actions + Session Timer */}
        <div className="flex items-center gap-2">
          {/* Run Button */}
          <button
            type="button"
            onClick={handleRunSelectedCase}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-[var(--raised)] hover:bg-[var(--control)]/40 text-[var(--ink)] border border-[var(--border)] transition-[color,background-color,border-color,transform] duration-150 ease-out cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            title="Run query against selected testcase (Ctrl+Enter)"
          >
            {isRunning ? (
              <div className="w-3 h-3 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="h-3 w-3 fill-current text-[var(--muted)]" />
            )}
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3.5 py-1 rounded-md text-xs font-semibold bg-[#2cbb5d] hover:bg-[#25a552] text-white shadow-xs transition-[color,background-color,border-color,transform] duration-150 ease-out cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            title="Submit and grade answer"
          >
            <Send className="h-3 w-3" />
            <span>Submit</span>
          </button>

          <div className="h-3.5 w-px bg-[var(--border)] mx-1 hidden sm:block" />

          {/* Interview Stopwatch Timer */}
          <div className="hidden sm:inline-flex">
            <SessionTimer />
          </div>
        </div>

        {/* Right: Engine Dialect Switcher, DB Reset & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Engine Selector */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[var(--raised)] border border-[var(--border)] text-xs">
            <Database className="h-3 w-3 text-[var(--muted)]" />
            <select
              value={engine}
              onChange={(e) => handleEngineChange(e.target.value as SupportedEngine)}
              aria-label="Execution engine"
              className="bg-transparent text-xs text-[var(--ink)] font-medium focus:outline-none cursor-pointer py-0.5"
            >
              <option value="sqlite" className="bg-[var(--surface)] text-[var(--ink)]">SQLite (WASM)</option>
              <option value="mysql" className="bg-[var(--surface)] text-[var(--ink)]">MySQL</option>
              <option value="pglite" className="bg-[var(--surface)] text-[var(--ink)]">PostgreSQL</option>
              <option value="pandas" className="bg-[var(--surface)] text-[var(--ink)]">pandas</option>
            </select>
          </div>

          {/* Reset DB Button */}
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
            title="Reset Database to original tables"
            aria-label="Reset Database"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
            title={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to graphite theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5 text-[var(--warning)]" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </header>

      {/* ================= MOBILE SWITCHER BAR (< 900px) ================= */}
      <div className="flex lg:hidden items-center border-b border-[var(--border)] bg-[var(--surface)] px-2 py-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('description')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors',
            mobileTab === 'description' ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold' : 'text-[var(--muted)]'
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Description</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('code')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors',
            mobileTab === 'code' ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold' : 'text-[var(--muted)]'
          )}
        >
          <Code2 className="h-3.5 w-3.5" />
          <span>Code</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('console')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-colors relative',
            mobileTab === 'console' ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold' : 'text-[var(--muted)]'
          )}
        >
          <Terminal className="h-3.5 w-3.5" />
          <span>Console</span>
          {checkResult && (
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full inline-block ml-1',
                checkResult.passed ? 'bg-[#2cbb5d]' : 'bg-[#ef4444]'
              )}
            />
          )}
        </button>
      </div>

      {/* ================= RESIZABLE SPLIT-PANE WORKSPACE ================= */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 h-full relative flex flex-col lg:flex-row p-2 sm:p-2.5 overflow-hidden bg-[var(--bg)]"
        style={{
          // Default fallbacks for CSS custom properties updated by rAF
          ['--left-panel-width' as any]: `${layoutState.leftWidthPct}%`,
          ['--editor-panel-height' as any]: `${layoutState.editorHeightPct}%`,
        }}
      >

        {/* ================= LEFT PANE: PROBLEM SPEC CARD ================= */}
        <div
          className={cn(
            'workspace-pane flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs shrink-0 min-h-0',
            // Mobile visibility
            mobileTab !== 'description' ? 'hidden lg:flex' : 'flex',
            // Maximized logic
            maximizedPane === 'problem' ? 'w-full h-full z-30' : '',
            maximizedPane === 'editor' || maximizedPane === 'console' ? 'hidden' : '',
            // Collapsed logic
            isLeftCollapsed && maximizedPane === 'none' ? 'w-10' : ''
          )}
          style={{
            width: maximizedPane === 'none' && !isLeftCollapsed ? 'var(--left-panel-width, 45%)' : undefined,
          }}
        >
          {/* Collapsed Left View (Slim Column with expand button) */}
          {isLeftCollapsed && maximizedPane === 'none' ? (
            <div className="h-full flex flex-col items-center py-3 space-y-4">
              <button
                type="button"
                onClick={toggleCollapseLeft}
                className="p-1.5 rounded-md hover:bg-[var(--raised)] text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                title="Expand Problem Description"
                aria-label="Expand Problem Description"
              >
                <PanelLeftOpen className="h-4 w-4 text-[var(--accent)]" />
              </button>
              <span className="text-[10px] font-mono font-semibold uppercase text-[var(--muted)] [writing-mode:vertical-lr] tracking-wider">
                Problem Spec
              </span>
            </div>
          ) : (
            <>
              {/* LeetCode Header Tab Bar with Collapse & Maximize Controls */}
              <div className="flex items-center justify-between px-2.5 h-10 border-b border-[var(--border)] bg-[var(--raised)]/40 shrink-0 select-none">
                <div className="flex items-center gap-1 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setLeftTab('description')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      leftTab === 'description'
                        ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Description</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('editorial')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      leftTab === 'editorial'
                        ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    )}
                  >
                    <BookOpen className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span>Editorial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('solution')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      leftTab === 'solution'
                        ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    )}
                  >
                    <Code2 className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span>Solutions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLeftTab('submissions')}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      leftTab === 'submissions'
                        ? 'bg-[var(--surface)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    )}
                  >
                    <History className="h-3.5 w-3.5 text-[var(--muted)]" />
                    <span>Submissions</span>
                  </button>
                </div>

                {/* Left Panel Actions: Collapse & Maximize */}
                <div className="hidden lg:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleMaximize('problem')}
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
                    title={maximizedPane === 'problem' ? 'Restore Panel' : 'Maximize Problem Panel'}
                    aria-label="Maximize Problem Panel"
                  >
                    {maximizedPane === 'problem' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleCollapseLeft}
                    className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
                    title="Collapse Left Panel"
                    aria-label="Collapse Left Panel"
                  >
                    <PanelLeftClose className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Left Pane Content Body (Scrolls Independently) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-left text-xs leading-relaxed text-[var(--ink)] select-text">

                {/* 1. DESCRIPTION TAB (LeetCode Structured Format) */}
                {leftTab === 'description' && (
                  <div className="space-y-5">
                    {/* Problem Title & Meta Header */}
                    <div className="space-y-3">
                      <h2 className="text-xl font-bold font-display text-[var(--ink)] tracking-tight">
                        #{problem.number}. {problem.title}
                      </h2>

                      {/* LeetCode Status & Difficulty Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Solved / Unsolved Badge */}
                        {isSolved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-[#2cbb5d]/10 border border-[#2cbb5d]/30 text-[#2cbb5d] rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Solved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] rounded-full">
                            <span>Unsolved</span>
                          </span>
                        )}

                        {/* Difficulty Pill */}
                        <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize', getDifficultyBadge(problem.difficulty))}>
                          {problem.difficulty}
                        </span>

                        {/* Topics Pill */}
                        <button
                          type="button"
                          onClick={() => setShowTopics(!showTopics)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--raised)] hover:bg-[var(--control)]/40 border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        >
                          <Tag className="h-3 w-3" />
                          <span>Topics</span>
                        </button>

                        {/* Companies Pill */}
                        <button
                          type="button"
                          onClick={() => setShowTopics(!showTopics)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--raised)] hover:bg-[var(--control)]/40 border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                        >
                          <Building2 className="h-3 w-3" />
                          <span>Companies</span>
                        </button>

                        {/* SQL Schema Button */}
                        <button
                          type="button"
                          onClick={() => setShowSqlSchemaModal(true)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--raised)] hover:bg-[var(--control)]/40 border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                          title="View raw DDL and dataset SQL"
                        >
                          <Database className="h-3 w-3 text-[var(--accent)]" />
                          <span>SQL Schema</span>
                        </button>

                        {/* Original Source Reference */}
                        {problem.sourceUrl && (
                          <a
                            href={problem.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[var(--raised)] hover:bg-[var(--control)]/40 border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors ml-auto sm:ml-0"
                          >
                            <span>Original Problem</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Expandable Topics List */}
                      {showTopics && (
                        <div className="flex flex-wrap gap-1.5 p-2.5 rounded-md bg-[var(--raised)]/50 border border-[var(--border)] animate-enter">
                          {(problem.tags || ['SQL', 'Select']).map((tag: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] text-[11px] font-mono text-[var(--ink)]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Table Column Schema Definitions (Signature LeetCode Schema Format) */}
                    {schema && schema.length > 0 && (
                      <div className="space-y-4 pt-1">
                        {schema.map((tbl) => {
                          const pkCols = tbl.columns.filter((c) => c.primaryKey).map((c) => c.name);
                          return (
                            <div key={tbl.name} className="space-y-2">
                              <div className="font-semibold text-xs text-[var(--ink)] font-mono">
                                Table: <span className="text-[var(--accent)] font-bold">{tbl.name}</span>
                              </div>
                              <div className="overflow-x-auto border border-[var(--border)] rounded-md bg-[var(--surface-app)]">
                                <table className="w-full text-left border-collapse font-mono text-xs">
                                  <thead className="bg-[var(--raised)] border-b border-[var(--border)] text-[var(--muted)]">
                                    <tr>
                                      <th className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)]">Column Name</th>
                                      <th className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)]">Type</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--border)]">
                                    {tbl.columns.map((col, cIdx) => (
                                      <tr key={cIdx} className="hover:bg-[var(--raised)]/40 transition-colors">
                                        <td className="py-1.5 px-3 text-[11px] font-medium text-[var(--ink)]">
                                          {col.name}
                                          {col.primaryKey && (
                                            <span className="ml-2 text-[9px] px-1 py-0.2 rounded bg-[var(--accent-subtle)] text-[var(--accent)] font-sans font-semibold">
                                              PK
                                            </span>
                                          )}
                                        </td>
                                        <td className="py-1.5 px-3 text-[11px] text-[var(--muted)] font-mono">
                                          {col.type || 'varchar'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="text-[11px] text-[var(--muted)] leading-relaxed font-sans">
                                {pkCols.length > 0 ? (
                                  <p>
                                    <span className="font-mono font-medium text-[var(--ink)]">{pkCols.join(', ')}</span> is the primary key (column with unique values) for this table.
                                  </p>
                                ) : (
                                  <p>
                                    This table may contain duplicate rows.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Problem Statement with ReactMarkdown */}
                    <div className="space-y-3 pt-1 text-xs leading-relaxed text-[var(--ink)]">
                      <div className="editorial-prose text-left">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {problem.description}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Example 1 Container with Sample Input Values & Output (LeetCode Signature Format) */}
                    <div className="space-y-3 pt-2 font-sans">
                      <div className="font-semibold text-xs text-[var(--ink)]">Example 1:</div>

                      <div className="rounded-lg bg-[var(--raised)]/30 border border-[var(--border)] p-4 space-y-4 font-mono text-xs">
                        {/* Input Tables with Actual Sample Rows */}
                        <div className="space-y-3">
                          <div className="font-bold text-[11px] font-sans text-[var(--muted)] uppercase tracking-wider">
                            Input:
                          </div>

                          {schema.map((tbl) => (
                            <div key={tbl.name} className="space-y-1.5">
                              <div className="text-[11px] text-[var(--ink)] font-sans">
                                <span className="font-semibold text-[var(--accent)] font-mono">{tbl.name}</span>{' '}table:
                              </div>
                              <div className="overflow-x-auto border border-[var(--border)] rounded-md bg-[var(--surface-app)]">
                                <table className="w-full text-left border-collapse font-mono text-xs">
                                  <thead className="bg-[var(--raised)] border-b border-[var(--border)] text-[var(--muted)]">
                                    <tr>
                                      {tbl.columns.map((c, cIdx) => (
                                        <th key={cIdx} className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)] whitespace-nowrap">
                                          {c.name}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[var(--border)]">
                                    {tbl.sampleRows && tbl.sampleRows.length > 0 ? (
                                      tbl.sampleRows.slice(0, 8).map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-[var(--raised)]/30 transition-colors">
                                          {row.map((val, cIdx) => (
                                            <td key={cIdx} className="py-1.5 px-3 text-[11px] text-[var(--ink)] whitespace-nowrap">
                                              {val === null ? (
                                                <span className="text-[var(--warning)] italic">null</span>
                                              ) : (
                                                String(val)
                                              )}
                                            </td>
                                          ))}
                                        </tr>
                                      ))
                                    ) : (
                                      <tr>
                                        <td colSpan={tbl.columns.length} className="py-2.5 px-3 text-center text-[11px] text-[var(--muted)] italic">
                                          No sample rows
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Expected Output Table */}
                        {problem.expectedOutput?.columns?.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <div className="font-bold text-[11px] font-sans text-[var(--muted)] uppercase tracking-wider">
                              Output:
                            </div>
                            <div className="overflow-x-auto border border-[var(--border)] rounded-md bg-[var(--surface-app)]">
                              <table className="w-full text-left border-collapse font-mono text-xs">
                                <thead className="bg-[var(--raised)] border-b border-[var(--border)] text-[var(--muted)]">
                                  <tr>
                                    {problem.expectedOutput.columns.map((col: string, idx: number) => (
                                      <th key={idx} className="py-1.5 px-3 font-semibold text-[11px] text-[var(--ink)] whitespace-nowrap">
                                        {col}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                  {problem.expectedOutput.rows.slice(0, 8).map((row: any[], rIdx: number) => (
                                    <tr key={rIdx} className="hover:bg-[var(--raised)]/30 transition-colors">
                                      {row.map((val: any, cIdx: number) => (
                                        <td key={cIdx} className="py-1.5 px-3 text-[11px] text-[var(--ink)] whitespace-nowrap">
                                          {val === null ? (
                                            <span className="text-[var(--warning)] italic">null</span>
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

                        {/* Explanation */}
                        {problem.explanation && (
                          <div className="space-y-1 pt-2 border-t border-[var(--border)] font-sans text-xs">
                            <span className="font-semibold text-[var(--ink)]">Explanation:</span>
                            <div className="text-xs leading-relaxed text-[var(--ink)]/90">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {problem.explanation.split('\n')[0] || problem.explanation}
                              </ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LeetCode Accordion Hints (At Bottom of Description Tab) */}
                    {problem.hints && problem.hints.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                        <div className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider font-mono">
                          Hints ({problem.hints.length})
                        </div>
                        <div className="space-y-2">
                          {problem.hints.map((hint: string, hIdx: number) => {
                            const isOpen = Boolean(openHints[hIdx]);
                            return (
                              <div
                                key={hIdx}
                                className="border border-[var(--border)] rounded-lg bg-[var(--surface-app)] overflow-hidden transition-colors"
                              >
                                <button
                                  type="button"
                                  onClick={() => setOpenHints((prev) => ({ ...prev, [hIdx]: !prev[hIdx] }))}
                                  className="w-full flex items-center justify-between p-3 text-left text-xs font-medium text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2">
                                    <Lightbulb className="h-3.5 w-3.5 text-[var(--accent)]" />
                                    <span className="font-semibold">Hint {hIdx + 1}</span>
                                  </div>
                                  <ChevronDown
                                    className={cn('h-3.5 w-3.5 text-[var(--muted)] transition-transform duration-200', isOpen && 'rotate-180')}
                                  />
                                </button>
                                {isOpen && (
                                  <div className="p-3 text-xs text-[var(--ink)]/90 leading-relaxed border-t border-[var(--border)] bg-[var(--surface)]">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{hint}</ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. EDITORIAL TAB */}
                {leftTab === 'editorial' && (
                  <div className="space-y-4">
                    <div className="space-y-1 pb-3 border-b border-[var(--border)]">
                      <h3 className="text-sm font-bold text-[var(--ink)]">Official Editorial & Algorithmic Strategy</h3>
                      <p className="text-xs text-[var(--muted)]">Structured breakdown of the relational query approach.</p>
                    </div>

                    {problem.explanation ? (
                      <div className="editorial-prose text-xs leading-relaxed text-[var(--ink)] space-y-3">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {problem.explanation}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs text-[var(--muted)] italic">No editorial analysis currently published for this problem.</p>
                    )}
                  </div>
                )}

                {/* 3. SOLUTIONS TAB */}
                {leftTab === 'solution' && (
                  <div className="space-y-4">
                    {!isSolutionUnlocked ? (
                      <div className="p-8 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] text-center space-y-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center mx-auto text-[var(--muted)]">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-sm font-semibold text-[var(--ink)]">Solution is Locked</h3>
                          <p className="text-xs text-[var(--muted)] max-w-xs mx-auto leading-relaxed">
                            Submit an accepted query to unlock the reference solution, or choose to reveal it now.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsSolutionUnlocked(true)}
                          className="text-xs"
                        >
                          Reveal Solution
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
                          <div className="flex items-center gap-1.5 text-xs text-[#2cbb5d] font-semibold">
                            <Unlock className="h-4 w-4" />
                            <span>Official Reference Solution</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={copySolutionToClipboard}
                              className="h-7 px-2 text-xs gap-1"
                            >
                              {copiedSolution ? <Check className="h-3 w-3 text-[#2cbb5d]" /> : <Copy className="h-3 w-3" />}
                              <span>{copiedSolution ? 'Copied' : 'Copy'}</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={loadSolutionIntoEditor}
                              className="h-7 px-2 text-xs"
                            >
                              Load in Editor
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-app)] p-3.5 overflow-x-auto">
                          <pre className="font-mono text-xs text-[var(--ink)] leading-relaxed">
                            <code>{problem.solutionSql}</code>
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. SUBMISSIONS TAB */}
                {leftTab === 'submissions' && (
                  <div className="space-y-4">
                    <div className="space-y-1 pb-3 border-b border-[var(--border)]">
                      <h3 className="text-sm font-bold text-[var(--ink)]">Submission History</h3>
                      <p className="text-xs text-[var(--muted)]">Track your local attempt evaluations and grading timestamps.</p>
                    </div>

                    {cloudSubmissions.length > 0 ? (
                      <div className="space-y-3">
                        {cloudSubmissions.map((sub, idx) => {
                          const isAcc = sub.verdict === 'Accepted';
                          const subDate = new Date(sub.submitted_at);
                          return (
                            <div key={sub.id || idx} className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      'px-2.5 py-0.5 rounded-full text-xs font-semibold',
                                      isAcc ? 'bg-[#2cbb5d]/10 text-[#2cbb5d] border border-[#2cbb5d]/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                                    )}
                                  >
                                    {sub.verdict}
                                  </span>
                                  <span className="text-[11px] text-[var(--muted)]">
                                    {subDate.toLocaleDateString()} at {subDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-mono text-[var(--muted)]">
                                  <span>{sub.runtime_ms} ms</span>
                                  <span>•</span>
                                  <span>{sub.row_count} rows</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono pt-1">
                                <span className="text-[10px] uppercase tracking-wider">Submitted Code</span>
                                <button
                                  type="button"
                                  onClick={() => setCode(sub.code)}
                                  className="text-[var(--accent)] hover:underline text-xs font-sans cursor-pointer"
                                >
                                  Load into Editor
                                </button>
                              </div>
                              <pre className="p-2.5 rounded-md bg-[var(--raised)] border border-[var(--border)] font-mono text-xs overflow-x-auto text-[var(--ink)] max-h-28">
                                <code>{sub.code}</code>
                              </pre>
                            </div>
                          );
                        })}
                      </div>
                    ) : problemProgress ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize',
                                  isSolved ? 'bg-[#2cbb5d]/10 text-[#2cbb5d] border border-[#2cbb5d]/30' : 'bg-[var(--pill-warning-bg)] text-[var(--warning)]'
                                )}
                              >
                                {isSolved ? 'Accepted' : 'Attempted'}
                              </span>
                              <span className="text-[11px] text-[var(--muted)]">
                                {new Date(problemProgress.updatedAt).toLocaleDateString()} at {new Date(problemProgress.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span className="text-xs font-mono text-[var(--muted)]">
                              {problemProgress.attempts} {problemProgress.attempts === 1 ? 'attempt' : 'attempts'}
                            </span>
                          </div>

                          {problemProgress.lastCode && (
                            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                              <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono">
                                <span>Submitted Query</span>
                                <button
                                  type="button"
                                  onClick={() => setCode(problemProgress.lastCode)}
                                  className="text-[var(--accent)] hover:underline text-xs font-sans cursor-pointer"
                                >
                                  Load into Editor
                                </button>
                              </div>
                              <pre className="p-3 rounded-md bg-[var(--raised)] border border-[var(--border)] font-mono text-xs overflow-x-auto text-[var(--ink)]">
                                <code>{problemProgress.lastCode}</code>
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-xs text-[var(--muted)] space-y-2 border border-dashed border-[var(--border)] rounded-lg">
                        <History className="h-6 w-6 text-[var(--muted)] mx-auto opacity-50" />
                        <p className="font-semibold text-[var(--ink)]">No Submissions Recorded</p>
                        <p className="text-[11px]">Click Submit in the top bar to evaluate your solution.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ================= VERTICAL DIVIDER RESIZER ================= */}
        {maximizedPane === 'none' && !isLeftCollapsed && (
          <ResizeHandle
            direction="vertical"
            {...verticalProps}
            className="hidden lg:flex"
          />
        )}

        {/* ================= RIGHT COLUMN: EDITOR + CONSOLE GROUP ================= */}
        <div
          className={cn(
            'flex-1 min-w-0 flex flex-col overflow-hidden h-full gap-2',
            // Mobile visibility
            mobileTab === 'description' ? 'hidden lg:flex' : 'flex',
            // Maximized logic
            maximizedPane === 'problem' ? 'hidden' : '',
            maximizedPane === 'editor' || maximizedPane === 'console' ? 'w-full h-full' : ''
          )}
          style={{
            width: maximizedPane === 'none' && !isLeftCollapsed
              ? 'calc(100% - var(--left-panel-width, 45%) - 8px)'
              : undefined,
          }}
        >
          {/* TOP RIGHT: CODE EDITOR CARD */}
          <div
            className={cn(
              'workspace-pane flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs shrink-0 min-h-0',
              // Mobile visibility
              mobileTab === 'console' ? 'hidden lg:flex' : 'flex',
              // Maximized logic
              maximizedPane === 'editor' ? 'w-full h-full z-30' : '',
              maximizedPane === 'console' ? 'hidden' : '',
              // Collapsed console
              isConsoleCollapsed && maximizedPane === 'none' ? 'h-full flex-1' : ''
            )}
            style={{
              height: maximizedPane === 'none' && !isConsoleCollapsed
                ? 'var(--editor-panel-height, 58%)'
                : undefined,
            }}
          >
            {/* Editor Toolbar Header */}
            <div className="h-10 px-3 border-b border-[var(--border)] bg-[var(--raised)]/40 flex items-center justify-between shrink-0 select-none">
              <div className="flex items-center gap-2">
                <Code2 className="h-3.5 w-3.5 text-[var(--accent)]" />
                <span className="text-xs font-semibold text-[var(--ink)] font-mono">
                  Code ({engine.toUpperCase()})
                </span>
              </div>

              {/* Toolbar Controls: Font Size, Format, Reset, Maximize */}
              <div className="flex items-center gap-1">
                {/* Font Size Adjuster */}
                <div className="flex items-center border border-[var(--border)] rounded bg-[var(--surface)] px-1 mr-1">
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.max(11, fontSize - 1))}
                    className="p-1 text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    title="Decrease font size"
                    aria-label="Decrease font size"
                  >
                    <AArrowDown className="h-3 w-3" />
                  </button>
                  <span className="text-[10px] font-mono px-1 text-[var(--muted)] select-none">
                    {fontSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.min(18, fontSize + 1))}
                    className="p-1 text-[var(--muted)] hover:text-[var(--ink)] transition-colors cursor-pointer"
                    title="Increase font size"
                    aria-label="Increase font size"
                  >
                    <AArrowUp className="h-3 w-3" />
                  </button>
                </div>

                {/* Format SQL */}
                <button
                  type="button"
                  onClick={handleFormatCode}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
                  title="Format SQL query keywords"
                  aria-label="Format SQL query keywords"
                >
                  <Sparkles className="h-3 w-3" />
                  <span className="hidden sm:inline">Format</span>
                </button>

                {/* Reset Code */}
                <button
                  type="button"
                  onClick={handleResetCode}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[11px] text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
                  title="Reset code to default"
                  aria-label="Reset code to default"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>

                {/* Maximize Editor Button */}
                <button
                  type="button"
                  onClick={() => toggleMaximize('editor')}
                  className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer hidden lg:inline-flex"
                  title={maximizedPane === 'editor' ? 'Restore Editor' : 'Maximize Editor Panel'}
                  aria-label="Maximize Editor Panel"
                >
                  {maximizedPane === 'editor' ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {/* CodeMirror 6 Editor Container */}
            <div className="flex-1 p-2 overflow-hidden">
              <SqlEditor
                value={code}
                onChange={handleCodeChange}
                onRun={handleRunSelectedCase}
                schema={schema}
                engine={engine}
                fontSize={fontSize}
                minHeight="100%"
              />
            </div>
          </div>

          {/* ================= HORIZONTAL DIVIDER RESIZER ================= */}
          {maximizedPane === 'none' && !isConsoleCollapsed && (
            <ResizeHandle
              direction="horizontal"
              {...horizontalProps}
              className="hidden lg:flex"
            />
          )}

          {/* BOTTOM RIGHT: LEETCODE TESTCASE & RESULTS CONSOLE */}
          <div
            className={cn(
              'workspace-pane flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs min-h-0',
              // Mobile visibility
              mobileTab === 'code' ? 'hidden lg:flex' : 'flex',
              // Maximized logic
              maximizedPane === 'console' ? 'w-full h-full z-30' : '',
              maximizedPane === 'editor' ? 'hidden' : '',
              // Collapsed console
              isConsoleCollapsed && maximizedPane === 'none' ? 'h-10 shrink-0' : 'flex-1'
            )}
            style={{
              height: maximizedPane === 'none' && !isConsoleCollapsed
                ? 'calc(100% - var(--editor-panel-height, 58%) - 8px)'
                : undefined,
            }}
          >
            <ResultsPanel
              activeTab={consoleTab}
              onTabChange={setConsoleTab}
              cases={testCases}
              activeCaseId={activeCaseId}
              onSelectCase={setActiveCaseId}
              onAddCase={handleAddCase}
              onDeleteCase={handleDeleteCase}
              onDuplicateCase={handleDuplicateCase}
              onRenameCase={handleRenameCase}
              onUpdateCaseInputs={handleUpdateCaseInputs}
              onUpdateCaseExpected={handleUpdateCaseExpected}
              onUseQueryOutputAsExpected={handleUseQueryOutputAsExpected}
              schema={schema}
              onRunSelectedCase={handleRunSelectedCase}
              onRunAllCases={handleRunAllCases}
              isLoading={isRunning}
              onCancelExecution={() => setIsRunning(false)}
              verdicts={verdicts}
              activeVerdictIndex={activeVerdictIndex}
              onSelectVerdictIndex={setActiveVerdictIndex}
              result={queryResult}
              checkResult={checkResult}
              expectedOutput={problem.expectedOutput}
              onToggleMaximize={() => toggleMaximize('console')}
              isMaximized={maximizedPane === 'console'}
              onToggleCollapse={toggleCollapseConsole}
              isCollapsed={isConsoleCollapsed}
            />
          </div>
        </div>

      </div>

      {/* SQL Schema DDL Modal Dialog */}
      {showSqlSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-enter">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl max-w-xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--raised)]/40">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--accent)]" />
                <span className="text-sm font-semibold text-[var(--ink)]">SQL Schema & Dataset DDL</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlSchemaModal(false)}
                className="p-1 rounded text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
                aria-label="Close SQL Schema Modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-[var(--ink)] leading-relaxed bg-[var(--surface-app)]">
              <pre className="whitespace-pre-wrap selection:bg-[var(--accent)]/30">
                <code>{problem.datasetSql}</code>
              </pre>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[var(--border)] bg-[var(--raised)]/20">
              <Button
                variant="outline"
                size="sm"
                onClick={copySchemaSql}
                className="text-xs gap-1.5"
              >
                {copiedSchemaSql ? <Check className="h-3.5 w-3.5 text-[#2cbb5d]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSchemaSql ? 'Copied' : 'Copy SQL'}</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSqlSchemaModal(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
