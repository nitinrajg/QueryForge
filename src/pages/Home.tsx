import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Play, 
  ArrowRight, 
  Terminal, 
  Cpu, 
  Shield, 
  CheckCircle2, 
  BookOpen, 
  Code2, 
  Layers, 
  Zap,
  Sparkles,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QueryInput } from '@/components/ui/QueryInput';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';
import lessonsData from '@/content/lessons.json';

/**
 * Rebuilt QueryForge Home Page.
 * 
 * Design Architecture:
 * - Authoritative Developer-Workbench Hero with live interactive query preview.
 * - Purposeful value pillars replacing artificial switch gimmicks.
 * - Interactive SQL Sandbox showcase executing locally in WebAssembly.
 * - Structured curriculum tracks overview with real metrics.
 * - Focused call-to-action to begin practice immediately with zero sign-up friction.
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { problems, activities } = useProgressStore();

  const allProblems = Object.values(problemsData) as any[];
  const allLessons = Object.values(lessonsData) as any[];
  const tracks = tracksData as any[];

  // Find last attempted or first unsolved problem for quick resume
  const nextUnsolved = allProblems.find((p) => problems[p.id]?.status !== 'solved') || allProblems[0];
  const solvedCount = Object.values(problems).filter((p) => p.status === 'solved').length;

  // Selected track for quick-start CTA
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.id || 'leetcode-sql-50');

  // Hero interactive preview active tab
  const [activeHeroTab, setActiveHeroTab] = useState<'filter' | 'join' | 'window'>('filter');

  const heroQueries = {
    filter: {
      title: 'Problem #1: Recyclable & Low Fat Products',
      sql: `SELECT product_id\nFROM Products\nWHERE low_fats = 'Y' AND recyclable = 'Y';`,
      output: [
        { product_id: 1, name: 'Eco Bottle', status: 'In Stock' },
        { product_id: 3, name: 'Glass Tumbler', status: 'In Stock' },
      ],
      time: '1.2ms',
    },
    join: {
      title: 'Problem #17: Customer Order Anti-Join',
      sql: `SELECT c.customer_name, c.email\nFROM Customers c\nLEFT JOIN Orders o ON c.id = o.customer_id\nWHERE o.order_id IS NULL;`,
      output: [
        { customer_name: 'Sarah Connor', email: 'sarah@resistance.org' },
        { customer_name: 'Arthur Dent', email: 'dent@galaxy.net' },
      ],
      time: '2.4ms',
    },
    window: {
      title: 'Problem #34: Department Salary Ranking',
      sql: `SELECT employee_name, department, salary,\n  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rk\nFROM Employees;`,
      output: [
        { employee_name: 'Elena Rostova', department: 'Engineering', salary: 145000, rk: 1 },
        { employee_name: 'David Kim', department: 'Engineering', salary: 132000, rk: 2 },
      ],
      time: '3.1ms',
    },
  };

  const currentHeroQuery = heroQueries[activeHeroTab];

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Resume Banner for Returning Learners */}
      {activities.length > 0 && (
        <aside aria-label="Resume learning" className="w-full bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 lg:px-8 py-2.5 text-xs text-[var(--muted)]">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--positive)] inline-block" />
              <span>Resume session:</span>
              <Link
                to={`/practice/${nextUnsolved.id}`}
                className="text-[var(--ink)] font-medium hover:text-[var(--accent)] underline-offset-4 hover:underline transition-colors"
              >
                #{nextUnsolved.number} {nextUnsolved.title}
              </Link>
            </div>
            <span className="hidden sm:inline font-mono text-[11px] text-[var(--muted)]">
              {solvedCount} of {allProblems.length} solved
            </span>
          </div>
        </aside>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Value Proposition & CTAs */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--muted)]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
              </span>
              <span className="font-medium text-[var(--ink)]">In-Browser SQL Studio</span>
              <span className="text-[var(--faint)]">•</span>
              <span>100% Client-Side WASM</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display tracking-tight text-[var(--ink)] leading-[1.08]">
                Master SQL with <span className="text-[var(--accent)]">Real Engines</span> in Your Browser.
              </h1>
              <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-xl">
                Solve 111 curated LeetCode and interview challenges, master database theory through 14 comprehensive guides, and grade queries against test datasets with sub-10ms WebAssembly execution.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link to="/practice">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  <Play className="h-4 w-4 fill-current" />
                  <span>Start Practicing (111 Problems)</span>
                </Button>
              </Link>
              <Link to="/learn">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Theory Guides (14 Modules)</span>
                </Button>
              </Link>
            </div>

            {/* Micro guarantees */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
              <div>
                <span className="font-semibold text-[var(--ink)] block">0 ms</span>
                <span className="text-[11px]">Network latency</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--ink)] block">100% Private</span>
                <span className="text-[11px]">Local IndexedDB</span>
              </div>
              <div>
                <span className="font-semibold text-[var(--ink)] block">Zero Cost</span>
                <span className="text-[11px]">Open source & free</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live SQL IDE Stage */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
              {/* Window Chrome Header */}
              <div className="h-11 px-4 bg-[var(--surface-app)] border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-[#f43f5e]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#f59e0b]/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-[#10b981]/80 inline-block" />
                  </div>
                  <span className="text-[11px] font-mono text-[var(--muted)] ml-2">sqlite3_worker.wasm</span>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveHeroTab('filter')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeHeroTab === 'filter'
                        ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Filter
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('join')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeHeroTab === 'join'
                        ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Anti-Join
                  </button>
                  <button
                    onClick={() => setActiveHeroTab('window')}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      activeHeroTab === 'window'
                        ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold'
                        : 'text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Window Func
                  </button>
                </div>
              </div>

              {/* Code Editor Region */}
              <div className="p-4 bg-[var(--surface-app)] border-b border-[var(--border)] text-left font-mono text-xs">
                <div className="flex items-center justify-between pb-2 text-[var(--muted)] text-[11px]">
                  <span>{currentHeroQuery.title}</span>
                  <span className="text-[var(--positive)] font-medium">Test Set Passed</span>
                </div>
                <pre className="text-[var(--ink)] whitespace-pre-wrap leading-relaxed py-2">
                  <code>{currentHeroQuery.sql}</code>
                </pre>
              </div>

              {/* Live Output Region */}
              <div className="p-4 bg-[var(--surface)] text-left text-xs">
                <div className="flex items-center justify-between pb-2 text-[var(--muted)]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[var(--positive)] inline-block" />
                    <span className="font-semibold text-[var(--ink)]">Query Results</span>
                  </div>
                  <span className="tabular-nums font-mono text-[11px] px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)]">
                    {currentHeroQuery.time}
                  </span>
                </div>

                <div className="overflow-x-auto border border-[var(--border)] rounded-md">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead className="bg-[var(--raised)] text-[var(--muted)] border-b border-[var(--border)]">
                      <tr>
                        {Object.keys(currentHeroQuery.output[0]).map((key) => (
                          <th key={key} className="py-2 px-3 font-semibold text-[11px] text-[var(--ink)]">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {currentHeroQuery.output.map((row, idx) => (
                        <tr key={idx} className="hover:bg-[var(--raised)]/50 transition-colors">
                          {Object.values(row).map((val, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 text-[var(--ink)] text-[11px]">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-between pt-1">
                  <span className="text-[11px] text-[var(--muted)]">Evaluated against in-memory SQLite table</span>
                  <Link
                    to="/practice"
                    className="text-xs font-medium text-[var(--accent)] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Try all 111 questions</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE ENGINEERING PILLARS */}
      <section className="w-full border-y border-[var(--border)] bg-[var(--surface)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-[var(--accent)]">
              Architecture & Features
            </h2>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">
              Engineered for Serious Database Mastery
            </h3>
            <p className="text-sm text-[var(--muted)]">
              Everything runs client-side inside your browser with enterprise-grade developer tooling.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-3 text-left hover:border-[var(--control)] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent)]/20 flex items-center justify-center text-[var(--accent)]">
                <Cpu className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-[var(--ink)]">In-Browser WASM Kernel</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Full relational SQLite engine compiled to WebAssembly. Zero round-trip server latency, instant query feedback, and offline execution.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-3 text-left hover:border-[var(--control)] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--pill-positive-bg)] border border-[var(--positive)]/20 flex items-center justify-center text-[var(--positive)]">
                <Code2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-[var(--ink)]">111 Graded Problems</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Covers LeetCode Top SQL 50, window ranking, anti-joins, aggregation, and company assessment sets with automatic output verification.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-3 text-left hover:border-[var(--control)] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--pill-warning-bg)] border border-[var(--warning)]/20 flex items-center justify-center text-[var(--warning)]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-[var(--ink)]">14 Theory Masterclasses</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Exhaustive architectural deep dives from relational filtering and subqueries to recursive CTEs, indexing internals, and transaction isolation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-lg border border-[var(--border)] bg-[var(--bg)] space-y-3 text-left hover:border-[var(--control)] transition-colors">
              <div className="w-10 h-10 rounded-lg bg-[var(--raised)] border border-[var(--border)] flex items-center justify-center text-[var(--ink)]">
                <Shield className="h-5 w-5" />
              </div>
              <h4 className="text-base font-semibold text-[var(--ink)]">Local-First Privacy</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Your code drafts, solve history, and analytics reside strictly in your browser's IndexedDB. Export or wipe your data anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SQL SHOWCASE (Live Sandbox in View) */}
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <div className="space-y-2 mb-6">
          <Badge variant="accent" dot>
            Live WASM Terminal
          </Badge>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">
            Execute Live Statements in Real-Time
          </h2>
          <p className="text-sm text-[var(--muted)] max-w-2xl">
            Type any valid SQL statement against our 9-table seeded sample schema. Notice the instant sub-millisecond execution powered by WebAssembly.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
          <QueryInput />
        </div>
      </section>

      {/* 4. CURRICULUM TRACKS SHOWCASE */}
      <section className="w-full border-t border-[var(--border)] bg-[var(--surface)] py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8 text-left">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xs font-semibold tracking-wider uppercase text-[var(--accent)]">
                Structured Tracks
              </h2>
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-[var(--ink)]">
                Guided Paths from Basics to Staff Engineer
              </h3>
            </div>
            <Link to="/practice" className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1">
              <span>View all tracks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tracks.map((track) => {
              const trackProblems = allProblems.filter((p) => p.trackId === track.id);
              const trackSolved = trackProblems.filter((p) => problems[p.id]?.status === 'solved').length;
              const percent = trackProblems.length > 0 ? Math.round((trackSolved / trackProblems.length) * 100) : 0;

              return (
                <div
                  key={track.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6 flex flex-col justify-between hover:border-[var(--control)] transition-colors space-y-6"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-[var(--muted)]">Track 0{track.order || 1}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)]">
                        {track.totalProblems} challenges
                      </span>
                    </div>

                    <h4 className="text-lg font-bold text-[var(--ink)]">{track.title}</h4>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      {track.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                    <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                      <span>Progress</span>
                      <span className="tabular-nums font-mono">{trackSolved} / {track.totalProblems} ({percent}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--raised)] rounded-full overflow-hidden">
                      <div 
                        className="h-full w-full bg-[var(--accent)] rounded-full origin-left transition-transform duration-300 ease-out will-change-transform"
                        style={{ transform: `scaleX(${percent / 100})` }}
                      />
                    </div>

                    <Link to={`/practice?track=${track.id}`} className="block w-full pt-1">
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        Open Track
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-6 shadow-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20 mx-auto">
            <Database className="w-6 h-6" />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-[var(--ink)]">
              Ready to Upgrade Your SQL Skills?
            </h2>
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              No account creation, no cloud infrastructure costs, and zero latency. Start your first challenge immediately.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link to="/practice">
              <Button size="lg" className="w-full sm:w-auto px-8 gap-2">
                <span>Start Practice Problem #1</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/learn">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-6">
                Read Theory Lessons
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
