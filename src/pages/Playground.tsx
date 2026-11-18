import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Terminal, Cpu, Database, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SqlEditor } from '@/components/editor/SqlEditor';
import { ResultsPanel } from '@/components/editor/ResultsPanel';
import { SchemaViewer } from '@/components/editor/SchemaViewer';
import { engineManager } from '@/engines/engine-manager';
import { QueryResult, TableSchema, SupportedEngine } from '@/engines/types';
import { useEditorStore } from '@/store/useEditorStore';
import datasetsData from '@/content/datasets.json';

const QUERY_PRESETS = [
  {
    name: 'Top Earners',
    sql: `-- 1. Top 10 Earners with Active Projects
SELECT 
    e.employee_id,
    e.employee_name,
    e.department,
    e.salary,
    COUNT(ep.project_id) AS active_projects
FROM employees e
LEFT JOIN employee_projects ep ON e.employee_id = ep.employee_id
GROUP BY e.employee_id
ORDER BY e.salary DESC
LIMIT 10;`,
  },
  {
    name: 'Dept Compensation',
    sql: `-- 2. Department Salary & Headcount Statistics
SELECT 
    department,
    COUNT(*) AS total_employees,
    ROUND(AVG(salary), 2) AS avg_salary,
    MIN(salary) AS min_salary,
    MAX(salary) AS max_salary,
    SUM(salary) AS total_payroll
FROM employees
GROUP BY department
ORDER BY total_payroll DESC;`,
  },
  {
    name: 'Salary Window Ranks',
    sql: `-- 3. Salary Ranking within each Department (Window Functions)
SELECT 
    employee_name,
    department,
    salary,
    DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) AS dept_salary_rank
FROM employees
ORDER BY department, dept_salary_rank;`,
  },
  {
    name: 'Clean Buffer',
    sql: `-- Write custom SQL statements below (DDL, DML, or SELECT)
SELECT * FROM employees LIMIT 10;`,
  },
];

/**
 * Cohesive Free SQL Playground Component.
 * 
 * Rules:
 * - Unrestricted SQL sandbox running locally in browser WebAssembly.
 * - Multi-engine switcher (SQLite WASM, MySQL compatibility, PostgreSQL, pandas).
 * - Preset queries formatted as clean tabs.
 * - Schema explorer sidebar on the left, CodeMirror editor and results on the right.
 */
export const Playground: React.FC = () => {
  const { engine, setEngine, sql, setSql, fontSize } = useEditorStore();
  const [code, setCode] = useState(sql || QUERY_PRESETS[0].sql);
  const [isRunning, setIsRunning] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [activePreset, setActivePreset] = useState<string>('Top Earners');

  const defaultDataset = (datasetsData as any).employer_database;

  useEffect(() => {
    const initPlayground = async () => {
      try {
        if (defaultDataset?.sql) {
          await engineManager.loadDataset(defaultDataset.sql);
          const currentSchema = await engineManager.getSchema();
          setSchema(currentSchema);
        }
      } catch (err) {
        console.error('Failed to initialize playground dataset:', err);
      }
    };

    initPlayground();
  }, []);

  const handleRun = async () => {
    if (!code.trim()) return;
    setIsRunning(true);
    try {
      const res = await engineManager.run(code);
      setQueryResult(res);
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

  const handleReset = async () => {
    if (defaultDataset?.sql) {
      await engineManager.loadDataset(defaultDataset.sql);
      const currentSchema = await engineManager.getSchema();
      setSchema(currentSchema);
      setQueryResult(null);
    }
  };

  const handleClear = () => {
    setCode('-- Clean editor buffer\n');
    setQueryResult(null);
  };

  const handleSelectPreset = (preset: typeof QUERY_PRESETS[0]) => {
    setActivePreset(preset.name);
    setCode(preset.sql);
    setSql(preset.sql);
  };

  const handleEngineChange = async (newEngine: SupportedEngine) => {
    setEngine(newEngine);
    await engineManager.setActiveEngine(newEngine);
    if (defaultDataset?.sql) {
      await engineManager.loadDataset(defaultDataset.sql);
      const currentSchema = await engineManager.getSchema();
      setSchema(currentSchema);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Playground Header Bar */}
      <header className="h-12 border-b border-[var(--border)] bg-[var(--surface)] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-xs font-bold text-[var(--ink)]">
              SQL Playground
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1 border-l border-[var(--border)] pl-3">
            {QUERY_PRESETS.map((p) => (
              <button
                key={p.name}
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  activePreset === p.name
                    ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Engine Switcher & Primary Run */}
        <div className="flex items-center gap-2">
          {/* Engine select */}
          <div className="flex items-center gap-1.5 border border-[var(--border)] bg-[var(--raised)] px-2.5 py-1 rounded-md text-xs">
            <Cpu className="h-3.5 w-3.5 text-[var(--muted)]" />
            <select
              value={engine}
              onChange={(e) => handleEngineChange(e.target.value as SupportedEngine)}
              aria-label="Execution engine"
              className="bg-transparent text-xs text-[var(--ink)] font-medium focus:outline-none cursor-pointer"
            >
              <option value="sqlite" className="bg-[var(--surface)] text-[var(--ink)]">SQLite (WASM)</option>
              <option value="mysql" className="bg-[var(--surface)] text-[var(--ink)]">MySQL (compat)</option>
              <option value="pglite" className="bg-[var(--surface)] text-[var(--ink)]">PostgreSQL</option>
              <option value="pandas" className="bg-[var(--surface)] text-[var(--ink)]">pandas (Python)</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            title="Clear editor code"
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)] h-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            title="Reset Database to original schema"
            className="text-xs text-[var(--muted)] hover:text-[var(--ink)] h-8"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset DB</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1.5 text-xs h-8 font-semibold shadow-xs"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run Query</span>
          </Button>
        </div>
      </header>

      {/* Main Split: Left Schema Explorer + Right Editor & Results */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Schema Viewer (4 cols) */}
        <div className="lg:col-span-4 border-r border-[var(--border)] bg-[var(--surface)] p-4 overflow-y-auto">
          <SchemaViewer schema={schema} />
        </div>

        {/* Right Column: CodeMirror Editor & Results (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-full bg-[var(--bg)] overflow-hidden">
          {/* Top Half: CodeMirror */}
          <div className="flex-1 p-3 overflow-hidden min-h-[220px]">
            <SqlEditor
              value={code}
              onChange={(val) => {
                setCode(val);
                setSql(val);
              }}
              onRun={handleRun}
              schema={schema}
              engine={engine}
              fontSize={fontSize}
              minHeight="100%"
            />
          </div>

          {/* Bottom Half: Results Table */}
          <div className="h-[300px] border-t border-[var(--border)] bg-[var(--surface)] p-3 overflow-hidden flex flex-col shrink-0">
            <ResultsPanel
              result={queryResult}
              isLoading={isRunning}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
