import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Terminal, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  Zap, 
  Database, 
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
  Search,
  Code2,
  Clock,
  Sparkles,
  ServerOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import manifestData from '@/content/manifest.json';

const HERO_SNIPPETS = [
  {
    title: 'Window Functions (DENSE_RANK)',
    sql: `SELECT employee_name, department, salary,
       DENSE_RANK() OVER (
         PARTITION BY department 
         ORDER BY salary DESC
       ) AS dept_rank
FROM employees
WHERE salary > 75000;`,
    output: [
      { name: 'Raj Sharma', dept: 'IT', salary: '120,000', rank: '1' },
      { name: 'Sneha Kapoor', dept: 'IT', salary: '115,000', rank: '2' },
      { name: 'Kunal Shah', dept: 'Finance', salary: '105,000', rank: '1' },
    ],
    time: '2.1ms'
  },
  {
    title: 'Anti-Join (Unmatched Customers)',
    sql: `SELECT c.customer_id, c.customer_name
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_id IS NULL;`,
    output: [
      { id: '3', name: 'Vikram Singh', city: 'Pune' },
      { id: '6', name: 'Priya Nair', city: 'Hyderabad' },
      { id: '7', name: 'Amit Verma', city: 'Mumbai' },
    ],
    time: '1.4ms'
  },
  {
    title: 'Recursive Date Spine (Calendar Gaps)',
    sql: `WITH RECURSIVE calendar AS (
  SELECT MIN(sale_date) AS dt FROM sales
  UNION ALL
  SELECT DATE_ADD(dt, INTERVAL 1 DAY) FROM calendar
  WHERE dt < (SELECT MAX(sale_date) FROM sales)
)
SELECT c.dt, COALESCE(s.amount, 0) AS daily_rev
FROM calendar c LEFT JOIN sales s ON c.dt = s.sale_date;`,
    output: [
      { date: '2025-01-01', rev: '$1,200' },
      { date: '2025-01-02', rev: '$850' },
      { date: '2025-01-03', rev: '$0 (Filled)' },
    ],
    time: '3.8ms'
  }
];

export const Home: React.FC = () => {
  const { problems, lessons } = useProgressStore();
  const [activeSnippetIdx, setActiveSnippetIdx] = useState(0);

  const solvedCount = Object.values(problems).filter((p) => p.status === 'solved').length;
  const attemptedCount = Object.values(problems).length;
  const readLessonsCount = Object.values(lessons).filter((l) => l.read).length;

  const tracks = tracksData as any[];
  const stats = manifestData.stats;
  const activeSnippet = HERO_SNIPPETS[activeSnippetIdx];

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* 1. ASYMMETRIC ENGINEERING HERO */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-24 px-4 sm:px-6 lg:px-8 border-b border-[#1C2438] bg-grid-pattern">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left: 58% Width Technical Pitch */}
            <div className="lg:col-span-7 space-y-5 text-left">
              {/* Telemetry Status Bar */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-[#1C2438] bg-[#0C1019] text-[11px] font-mono text-[#7E8B9F]">
                <ServerOff className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-white font-medium">100% Client-Side WASM</span>
                <span className="text-[#3E4A63]">•</span>
                <span className="text-emerald-400 font-mono">0ms Network Latency</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white light:text-slate-900 leading-[1.12]">
                The Zero-Server SQL Forge.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400">
                  Real WebAssembly Sandbox.
                </span>
              </h1>

              <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl leading-relaxed light:text-slate-600">
                Practice 111+ LeetCode and real product company SQL challenges directly in your browser.
                Run queries against SQLite WebAssembly and MySQL compatibility mode. Instant auto-grading, 
                progressive hints, and local IndexedDB progress persistence. No accounts, no paywalls.
              </p>

              {/* Action Buttons with Tactile Feedback */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link to="/practice">
                  <Button size="lg" className="h-10 px-5 text-xs font-bold gap-2">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Start Practice ({stats.problemsCount} Problems)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                <Link to="/learn">
                  <Button variant="secondary" size="lg" className="h-10 px-5 text-xs font-semibold gap-2">
                    <BookOpen className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Read Theory (14 Guides)</span>
                  </Button>
                </Link>

                <Link to="/playground">
                  <Button variant="outline" size="lg" className="h-10 px-5 text-xs font-semibold gap-2">
                    <Play className="h-3.5 w-3.5 text-emerald-400" />
                    <span>SQL Playground</span>
                  </Button>
                </Link>
              </div>

              {/* Hardware & Spec Micro-Strip */}
              <div className="pt-4 flex flex-wrap items-center gap-4 text-[11px] font-mono text-[#7E8B9F]">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>SQLite 3.45 (WASM)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>LeetCode Top SQL 50</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span>Accenture & TCS Tests</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  <span>Zero Telemetry</span>
                </div>
              </div>
            </div>

            {/* Right: 42% Width Interactive Live Cockpit */}
            <div className="lg:col-span-5">
              <div className="rounded-xl border border-[#1C2438] bg-[#0C1019] shadow-[0_8px_32px_rgba(0,0,0,0.8)] overflow-hidden surface-cockpit">
                {/* Cockpit Top Bar */}
                <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1C2438] bg-[#07090E]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="font-mono text-[11px] text-[#F1F5F9] font-medium">QUERY_CONSOLE.SQL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#121826] border border-[#1C2438] text-cyan-300">
                      EXEC: {activeSnippet.time}
                    </span>
                  </div>
                </div>

                {/* Snippet Switcher Tabs */}
                <div className="flex border-b border-[#1C2438] bg-[#0C1019]/80 px-2 py-1 gap-1 overflow-x-auto text-[11px] font-mono">
                  {HERO_SNIPPETS.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSnippetIdx(idx)}
                      className={`px-2.5 py-1 rounded text-[10px] whitespace-nowrap transition-colors cursor-pointer ${
                        activeSnippetIdx === idx
                          ? 'bg-[#161D2E] text-cyan-300 font-semibold border border-[#1C2438]'
                          : 'text-[#7E8B9F] hover:text-[#F1F5F9]'
                      }`}
                    >
                      {s.title.split(' ')[0]}
                    </button>
                  ))}
                </div>

                {/* Code Window */}
                <div className="p-3.5 bg-[#07090E] font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[170px] border-b border-[#1C2438]">
                  <pre className="text-cyan-300/90 whitespace-pre">
                    <code>{activeSnippet.sql}</code>
                  </pre>
                </div>

                {/* Instant Output Simulation */}
                <div className="p-3 bg-[#0C1019] space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#7E8B9F]">
                    <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      ACCEPTED • 3 ROWS RETURNED
                    </span>
                    <span>MEMORY: 1.2MB</span>
                  </div>

                  <div className="border border-[#1C2438] rounded-md overflow-hidden bg-[#07090E]">
                    <table className="w-full text-left text-[10px] font-mono">
                      <thead className="bg-[#121826] text-[#7E8B9F] border-b border-[#1C2438]">
                        <tr>
                          {Object.keys(activeSnippet.output[0]).map((col) => (
                            <th key={col} className="py-1 px-2 uppercase font-medium">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#161D2E]">
                        {activeSnippet.output.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-[#121826]/40">
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx} className="py-1 px-2 text-[#CBD5E1]">
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. PERSISTENT PROGRESS JUMP (CONDITIONAL) */}
      {attemptedCount > 0 && (
        <section className="py-3 px-4 sm:px-6 lg:px-8 border-b border-[#1C2438] bg-[#0C1019]">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="font-mono text-[#7E8B9F]">LOCAL PROGRESS:</span>
              <span className="font-semibold text-white light:text-slate-900">
                {solvedCount} solved ({Math.round((solvedCount / stats.problemsCount) * 100)}%) • {readLessonsCount} guides completed
              </span>
            </div>
            <Link to="/practice">
              <Button size="sm" variant="secondary" className="h-7 text-xs font-mono gap-1">
                <span>Resume Session</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* 3. HARDWARE-GRADE ENGINE SPECIFICATION MATRIX */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-[#1C2438] bg-[#080B11]">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                Browser Sandboxing
              </p>
              <h2 className="text-2xl font-bold font-display text-white light:text-slate-900">
                In-Browser Execution Stack
              </h2>
            </div>
            <span className="text-xs font-mono text-[#7E8B9F]">ZERO CLOUD EGRESS • COMPLETE ISOLATION</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-[#1C2438] bg-[#0C1019] space-y-2 surface-cockpit">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-400">SQLite (WASM)</span>
                <Badge variant="easy">Native</Badge>
              </div>
              <p className="text-[11px] text-[#7E8B9F] leading-relaxed">
                Official WebAssembly SQLite compiled with full window function, CTE, and JSON support. 
              </p>
              <div className="pt-2 border-t border-[#161D2E] font-mono text-[10px] text-[#94A3B8] flex justify-between">
                <span>Latency: ~1.5ms</span>
                <span>Size: 688 KB</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#1C2438] bg-[#0C1019] space-y-2 surface-cockpit">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-cyan-400">MySQL (Compat)</span>
                <Badge variant="accent">AST Bridge</Badge>
              </div>
              <p className="text-[11px] text-[#7E8B9F] leading-relaxed">
                AST-level transpiler translating MySQL DDL/DML, date arithmetic, and string idioms on-the-fly.
              </p>
              <div className="pt-2 border-t border-[#161D2E] font-mono text-[10px] text-[#94A3B8] flex justify-between">
                <span>Mode: Transpiled</span>
                <span>Dialect: MySQL 8+</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#1C2438] bg-[#0C1019] space-y-2 surface-cockpit">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-sky-400">PostgreSQL (PGlite)</span>
                <Badge variant="outline">WASM</Badge>
              </div>
              <p className="text-[11px] text-[#7E8B9F] leading-relaxed">
                PostgreSQL kernel in WASM. Full support for Postgres date math, regex matching, and CTEs.
              </p>
              <div className="pt-2 border-t border-[#161D2E] font-mono text-[10px] text-[#94A3B8] flex justify-between">
                <span>Dialect: ANSI SQL</span>
                <span>Sandbox: Isolated</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-[#1C2438] bg-[#0C1019] space-y-2 surface-cockpit">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-amber-400">Python & pandas</span>
                <Badge variant="medium">Pyodide</Badge>
              </div>
              <p className="text-[11px] text-[#7E8B9F] leading-relaxed">
                Run data analysis code with DataFrames directly in client memory without server compute bills.
              </p>
              <div className="pt-2 border-t border-[#161D2E] font-mono text-[10px] text-[#94A3B8] flex justify-between">
                <span>Engine: Python 3.11</span>
                <span>Type: In-Memory</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. ASYMMETRIC BENTO GRID (CURRICULUM) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#1C2438] bg-[#07090E]">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                Curriculum Matrix
              </p>
              <h2 className="text-3xl font-bold font-display text-white light:text-slate-900">
                Structured Practice Tracks
              </h2>
            </div>
            <Link to="/practice">
              <Button variant="outline" size="sm" className="gap-2 font-mono text-xs">
                <span>View Full Catalog</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Cell 1: LeetCode SQL 50 (Span 7 cols) */}
            <div className="md:col-span-7 rounded-xl border border-[#1C2438] bg-[#0C1019] p-6 flex flex-col justify-between surface-cockpit space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                    HIGH FREQUENCY
                  </span>
                  <span className="text-xs font-mono text-[#7E8B9F]">50 PROBLEMS</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white light:text-slate-900">
                  LeetCode Top SQL 50 Study Plan
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
                  Full walkthroughs of all 50 questions from LeetCode's official study plan. Includes original LeetCode schema, verified inputs, approaches explaining the transferable mental model, and zero-compromise solutions.
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121826] text-[#7E8B9F]">Set 1: Basic Select</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121826] text-[#7E8B9F]">Set 2: Aggregation</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121826] text-[#7E8B9F]">Set 3: Windows</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121826] text-[#7E8B9F]">Set 4: Advanced Logic</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#121826] text-[#7E8B9F]">Set 5: Subqueries</span>
                </div>
              </div>
              <Link to="/practice?track=leetcode-sql-50">
                <Button className="w-full sm:w-auto font-mono text-xs gap-2">
                  <span>Enter LeetCode Arena</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Cell 2: Product Company Interviews (Span 5 cols) */}
            <div className="md:col-span-5 rounded-xl border border-[#1C2438] bg-[#0C1019] p-6 flex flex-col justify-between surface-cockpit space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    PRODUCT TECH
                  </span>
                  <span className="text-xs font-mono text-[#7E8B9F]">31 QUESTIONS</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white light:text-slate-900">
                  Product Interview Problem Sets
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Real business scenarios: food delivery lag time, wallet running balances, monthly active user deduplication, and driver cancellation rates.
                </p>
              </div>
              <Link to="/practice?track=interview-questions">
                <Button variant="secondary" className="w-full sm:w-auto font-mono text-xs gap-2">
                  <span>Explore Problem Sets</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Cell 3: Company-Specific Tech Rounds (Span 5 cols) */}
            <div className="md:col-span-5 rounded-xl border border-[#1C2438] bg-[#0C1019] p-6 flex flex-col justify-between surface-cockpit space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                    ENTERPRISE
                  </span>
                  <span className="text-xs font-mono text-[#7E8B9F]">27 QUESTIONS</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white light:text-slate-900">
                  Accenture & TCS Technical Rounds
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Screening classics reported on AmbitionBox: Nth-highest salary, self-joins on managers, duplicate removal via self-delete, and pivot/unpivot operations.
                </p>
              </div>
              <Link to="/practice?track=company-questions">
                <Button variant="secondary" className="w-full sm:w-auto font-mono text-xs gap-2">
                  <span>Open Company Rounds</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {/* Cell 4: Theory Masterclass Deep Dives (Span 7 cols) */}
            <div className="md:col-span-7 rounded-xl border border-[#1C2438] bg-[#0C1019] p-6 flex flex-col justify-between surface-cockpit space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-semibold">
                    DEEP REFERENCE
                  </span>
                  <span className="text-xs font-mono text-[#7E8B9F]">14 GUIDES</span>
                </div>
                <h3 className="text-xl font-bold font-display text-white light:text-slate-900">
                  Complete SQL Theory & Documentation
                </h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed max-w-xl">
                  Step-by-step guides from schema basics to indexing internals. Every code block is directly runnable in the playground or ready to copy into production.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] font-mono text-[#CBD5E1]">
                  <div className="flex items-center gap-1.5">• Window Functions</div>
                  <div className="flex items-center gap-1.5">• Recursive CTEs</div>
                  <div className="flex items-center gap-1.5">• Multi-Table Joins</div>
                  <div className="flex items-center gap-1.5">• Index Execution Plans</div>
                </div>
              </div>
              <Link to="/learn">
                <Button variant="outline" className="w-full sm:w-auto font-mono text-xs gap-2">
                  <span>Open Theory Catalog</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TELEMETRY STATS COUNTER */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-[#1C2438] bg-[#080B11]">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 font-mono">
            <div className="p-4 rounded-lg border border-[#1C2438] bg-[#0C1019] space-y-1">
              <span className="text-[10px] uppercase text-[#7E8B9F]">PRACTICE_PROBLEMS</span>
              <p className="text-3xl font-black text-white font-display">{stats.problemsCount}</p>
              <p className="text-[10px] text-emerald-400">All with seed data & diff</p>
            </div>
            <div className="p-4 rounded-lg border border-[#1C2438] bg-[#0C1019] space-y-1">
              <span className="text-[10px] uppercase text-[#7E8B9F]">THEORY_MASTERCLASSES</span>
              <p className="text-3xl font-black text-white font-display">{stats.lessonsCount}</p>
              <p className="text-[10px] text-cyan-400">With interactive TOC</p>
            </div>
            <div className="p-4 rounded-lg border border-[#1C2438] bg-[#0C1019] space-y-1">
              <span className="text-[10px] uppercase text-[#7E8B9F]">CURRICULUM_TRACKS</span>
              <p className="text-3xl font-black text-white font-display">{stats.tracksCount}</p>
              <p className="text-[10px] text-amber-400">28 specialized modules</p>
            </div>
            <div className="p-4 rounded-lg border border-[#1C2438] bg-[#0C1019] space-y-1">
              <span className="text-[10px] uppercase text-[#7E8B9F]">EXECUTION_COST</span>
              <p className="text-3xl font-black text-emerald-400 font-display">$0.00</p>
              <p className="text-[10px] text-[#7E8B9F]">100% Free & Open Source</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
