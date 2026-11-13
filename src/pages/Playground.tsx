import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, Database, Code2, Sparkles, Terminal, Cpu, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
 * Free SQL Playground.
 * 
 * Logic & Approach:
 * - Unrestricted SQL sandbox running locally in browser WebAssembly.
 * - Preloaded with the full relational 'employer_database' dataset.
 * - Multi-engine switcher (SQLite, MySQL compatibility mode, PostgreSQL, pandas).
 * - Preset queries for instant discovery and experimentation.
 */
export const Playground: React.FC = () => {
  const { engine, setEngine, sql, setSql } = useEditorStore();
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
      const currentSchema = await engineManager.getSchema();
      setSchema(currentSchema);
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

  const handleEngineChange = async (newEngine: SupportedEngine) => {
    setEngine(newEngine);
    await engineManager.setActiveEngine(newEngine);
    if (defaultDataset?.sql) {
      await engineManager.loadDataset(defaultDataset.sql);
      const currentSchema = await engineManager.getSchema();
      setSchema(currentSchema);
    }
  };

  const loadPreset = (presetName: string, querySql: string) => {
    setActivePreset(presetName);
    setCode(querySql);
    setSql(querySql);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-[#07090E]">
      {/* Top Header Bar */}
      <header className="h-12 border-b border-[#1C2438] bg-[#0C1019] px-4 flex items-center justify-between shrink-0 light:bg-white light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-xs text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30 font-semibold uppercase">
            Playground
          </span>
          <span className="text-xs font-heading font-semibold text-[#F1F5F9] light:text-slate-800">
            Client-Side Sandbox
          </span>
          <span className="text-[11px] text-[#64748B] font-mono hidden md:inline">
            (Connected to: employer_database)
          </span>
        </div>

        {/* Preset Selectors */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#07090E] border border-[#1C2438] p-1 rounded-lg">
          {QUERY_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => loadPreset(p.name, p.sql)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                activePreset === p.name
                  ? 'bg-[#161F30] text-[#22D3EE] border border-[#26354D]'
                  : 'text-[#94A3B8] hover:text-[#F1F5F9]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Engine switcher + Controls */}
        <div className="flex items-center gap-2">
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs font-mono gap-1 text-[#94A3B8] hover:text-[#F1F5F9]"
            title="Reset dataset to initial state"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset DB</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="gap-1.5 text-xs font-mono bg-[#06B6D4] hover:bg-[#0891B2] text-[#07090E] font-semibold"
          >
            <Play className="h-3.5 w-3.5 text-[#07090E] fill-[#07090E]" />
            <span>Run Query</span>
          </Button>
        </div>
      </header>

      {/* Main Grid: Schema Sidebar (Left) + Editor & Results (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Schema Sidebar */}
        <aside className="lg:col-span-3 border-r border-[#1C2438] bg-[#0C1019] p-4 overflow-y-auto light:bg-slate-50 light:border-slate-200">
          <SchemaViewer schema={schema} />
        </aside>

        {/* Editor + Results */}
        <div className="lg:col-span-9 flex flex-col h-full bg-[#07090E] overflow-hidden">
          {/* Top Half: CodeMirror Editor */}
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
              minHeight="100%"
            />
          </div>

          {/* Bottom Half: Results Table */}
          <div className="h-[280px] border-t border-[#1C2438] bg-[#0C1019] p-3 overflow-hidden flex flex-col shrink-0 light:bg-white light:border-slate-200">
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
