import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { RangeStages } from '@/components/ui/RangeStages';
import { QueryInput } from '@/components/ui/QueryInput';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';
import lessonsData from '@/content/lessons.json';

/**
 * Rebuilt QueryForge Home Page.
 * 
 * Design Direction:
 * - Direction: "The sentence is the layout", hero "Photograph for a letter", motion "Shutter image".
 * - Palette: Graphite dark (#18191b), tone-step surfaces (#222427), Safety Orange accent (#ff4a1f).
 * - Typography: Gambarino for display headers, General Sans for all UI and body text.
 * - Hero: "QueryForge" on one line at vertical centre, the 'o' replaced by real result of Problem #1.
 * - Features: "Sentences with switches" across 4 full-bleed bands.
 * - How it works: "Drag through the stages" 50/50 split at 88svh.
 * - Showcase: "Headline you can type" with live WebAssembly query execution.
 * - Stats: Ledger aligned on the decimal with real content counts.
 * - CTA: "A sentence with a blank" (inline select).
 */
export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { problems, activities } = useProgressStore();

  const allProblems = Object.values(problemsData) as any[];
  const allLessons = Object.values(lessonsData) as any[];
  const tracks = tracksData as any[];

  // Find last attempted or first unsolved problem for resume line
  const lastActivity = activities[0];
  const nextUnsolved = allProblems.find((p) => problems[p.id]?.status !== 'solved') || allProblems[0];

  // Features switch states (two on at load)
  const [switch1, setSwitch1] = useState(true);
  const [switch2, setSwitch2] = useState(true);
  const [switch3, setSwitch3] = useState(false);
  const [switch4, setSwitch4] = useState(false);

  // How it works stage slider (0 to 3)
  const [stage, setStage] = useState(0);

  // CTA Inline select state
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.id || 'leetcode-sql-50');

  const handleStartTrack = () => {
    const selectedTrack = tracks.find((t) => t.id === selectedTrackId);
    if (selectedTrack && selectedTrack.totalProblems > 0) {
      navigate(`/practice?track=${selectedTrackId}`);
    } else {
      navigate('/learn');
    }
  };

  return (
    <div className="w-full bg-[var(--bg)] text-[var(--ink)]">
      {/* Optional Top Resume Line */}
      {activities.length > 0 && (
        <div className="w-full bg-[var(--surface)] border-b border-[var(--border)] px-4 sm:px-6 lg:px-8 py-2 text-xs text-[var(--muted)] flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <span>Resume where you left off:</span>
            <Link
              to={`/practice/${nextUnsolved.id}`}
              className="text-[var(--ink)] font-medium hover:text-[var(--accent)] underline-offset-4 hover:underline"
            >
              {nextUnsolved.title} →
            </Link>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="relative min-h-[92svh] flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto w-full">
        <div className="h-4" />

        {/* Center Display: QueryForge with the 'o' replaced by real Problem #1 result fragment */}
        <div className="my-auto py-8 text-center sm:text-left">
          {/* Desktop Single-Line Name spanning 82% of width */}
          <div className="hidden sm:flex items-center justify-center font-display text-[9vw] lg:text-[7.5vw] font-bold leading-none tracking-[-0.04em] text-[var(--ink)] select-none">
            <span>QueryF</span>
            {/* The 'o' replaced by a live square fragment one cap-height tall */}
            <div className="relative inline-flex items-center justify-center mx-[0.04em] w-[0.72em] h-[0.72em] border border-[var(--border)] bg-[var(--surface-app)] overflow-hidden align-middle animate-shutter">
              <div className="p-1 w-full h-full flex flex-col justify-center text-left text-[10px] leading-tight font-sans bg-[var(--ground)]">
                <span className="text-[var(--muted)] text-[8px] font-mono border-b border-[var(--rule)] pb-0.5">
                  Q1 Result
                </span>
                <span className="text-[var(--positive)] font-mono text-[9px] pt-0.5">
                  id: 1, 3
                </span>
                <span className="text-[var(--muted)] text-[7px]">
                  low_fat & rec
                </span>
              </div>
            </div>
            <span>rge</span>
          </div>

          {/* Mobile Phone Fallback: Two Centered Lines with Frame */}
          <div className="sm:hidden flex flex-col items-center justify-center font-display text-[19vw] font-bold leading-[0.88] tracking-[-0.04em] text-[var(--ink)]">
            <span>Query</span>
            <div className="my-2 w-28 h-16 border border-[var(--border)] bg-[var(--surface-app)] p-2 text-left text-[11px] animate-shutter flex flex-col justify-center">
              <span className="text-[var(--muted)] text-[9px] font-mono">Q1: Recyclable</span>
              <span className="text-[var(--positive)] font-mono text-[11px]">product_id: 1, 3</span>
            </div>
            <span>Forge</span>
          </div>
        </div>

        {/* Hero Bottom Row: Column 6 Sentence + Primary Action */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-baseline pt-8 border-t border-[var(--rule)]">
          <div className="md:col-span-5 text-xs text-[var(--muted)]">
            <span className="tabular-nums">111</span> interview challenges · <span className="tabular-nums">14</span> theory lessons · In-browser WebAssembly
          </div>

          <div className="md:col-span-5 text-sm sm:text-base text-[var(--ink)] leading-relaxed font-sans">
            A free, client-side SQL laboratory with real engines running directly in your browser. Nothing to install, zero telemetry, and zero cost.
          </div>

          <div className="md:col-span-2 flex justify-start md:justify-end">
            <Link to="/practice">
              <Button size="lg" className="w-full sm:w-auto h-11 px-6 text-sm">
                Start practicing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FEATURES = SENTENCES WITH SWITCHES (4 Full-bleed Bands) */}
      <section className="w-full border-t border-[var(--border)]">
        {/* Band 1 */}
        <div
          className={`w-full py-12 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] transition-colors duration-150 ${
            switch1 ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-[var(--bg)] text-[var(--muted)]'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">
                Engine runs SQLite, MySQL, and PostgreSQL locally.
              </h3>
              {switch1 && (
                <p className="text-sm text-[var(--muted)] max-w-2xl">
                  Client-side WebAssembly execution eliminates remote server latency and executes test queries in under 10 milliseconds.
                </p>
              )}
            </div>
            <Switch checked={switch1} onCheckedChange={setSwitch1} aria-label="Toggle engine feature" />
          </div>
        </div>

        {/* Band 2 */}
        <div
          className={`w-full py-12 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] transition-colors duration-150 ${
            switch2 ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-[var(--bg)] text-[var(--muted)]'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">
                Submissions are verified against authentic test sets.
              </h3>
              {switch2 && (
                <p className="text-sm text-[var(--muted)] max-w-2xl">
                  Automated checker parses column cardinality, row ordering, and numeric tolerance (0.02) to grade answers objectively.
                </p>
              )}
            </div>
            <Switch checked={switch2} onCheckedChange={setSwitch2} aria-label="Toggle test set verification" />
          </div>
        </div>

        {/* Band 3 */}
        <div
          className={`w-full py-12 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] transition-colors duration-150 ${
            switch3 ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-[var(--bg)] text-[var(--muted)]'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">
                Progress is stored exclusively on your device.
              </h3>
              {switch3 && (
                <p className="text-sm text-[var(--muted)] max-w-2xl">
                  IndexedDB encrypts and persists draft solutions, solve history, and timestamps locally. You can export or wipe your data anytime.
                </p>
              )}
            </div>
            <Switch checked={switch3} onCheckedChange={setSwitch3} aria-label="Toggle local storage" />
          </div>
        </div>

        {/* Band 4 */}
        <div
          className={`w-full py-12 px-4 sm:px-6 lg:px-8 border-b border-[var(--border)] transition-colors duration-150 ${
            switch4 ? 'bg-[var(--surface)] text-[var(--ink)]' : 'bg-[var(--bg)] text-[var(--muted)]'
          }`}
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">
                Platform works completely offline without a network.
              </h3>
              {switch4 && (
                <p className="text-sm text-[var(--muted)] max-w-2xl">
                  Service workers cache all 111 questions, 14 masterclass lessons, and relational datasets for offline practice.
                </p>
              )}
            </div>
            <Switch checked={switch4} onCheckedChange={setSwitch4} aria-label="Toggle offline capability" />
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS = DRAG THROUGH THE STAGES (50/50 Split at 88svh) */}
      <section className="w-full border-b border-[var(--border)] min-h-[88svh] flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs text-[var(--muted)]">Workflow</p>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)] mt-1">
            How a problem is studied, executed, and validated.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column (5 Cols): Stage Explanation & Slider */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <span className="text-xs text-[var(--accent)] font-medium">Stage {stage + 1} of 4</span>
              
              {stage === 0 && (
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-[var(--ink)]">Read the theory clause.</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Understand core relational operators (filtering, joins, window frames, CTEs) with clear syntax explanations and real table schemas before touching code.
                  </p>
                </div>
              )}

              {stage === 1 && (
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-[var(--ink)]">Run in the browser engine.</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Write queries in a CodeMirror editor with schema-aware autocomplete. Execute statements locally against SQLite or MySQL compatibility mode via WebAssembly.
                  </p>
                </div>
              )}

              {stage === 2 && (
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-[var(--ink)]">Check against the test output.</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Automated verification compares row counts, types, and values with floating-point tolerance. Discrepancies are highlighted in aligned diff tables.
                  </p>
                </div>
              )}

              {stage === 3 && (
                <div className="space-y-3">
                  <h3 className="font-display text-2xl text-[var(--ink)]">Track mastery across tracks.</h3>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    Attempts, execution latency, and solved states are stored in your device's IndexedDB. Review difficulty distributions and activity logs without external accounts.
                  </p>
                </div>
              )}
            </div>

            {/* Range Controller */}
            <RangeStages stage={stage} onStageChange={setStage} />
          </div>

          {/* Right Column (7 Cols): Real fragment of the app at true size */}
          <div className="lg:col-span-7 border border-[var(--border)] bg-[var(--surface-app)] p-6 min-h-[380px] flex flex-col justify-center">
            {stage === 0 && (
              <div className="space-y-3 font-sans text-xs">
                <div className="border-b border-[var(--rule)] pb-2 text-[var(--muted)] flex justify-between">
                  <span>Lesson excerpt: Joins & Anti-Joins</span>
                  <span>docs/03-joins.md</span>
                </div>
                <blockquote className="border-l-2 border-[var(--accent)] pl-3 text-[var(--ink)] bg-[var(--surface)] p-2">
                  <strong>Tip:</strong> An anti-join filters for missing relationships by joining on a foreign key and filtering for <code>WHERE right_table.id IS NULL</code>.
                </blockquote>
                <pre className="font-mono text-xs bg-[var(--ground)] p-3 border border-[var(--rule)] text-[var(--ink)] overflow-x-auto">
{`SELECT c.id, c.name
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.order_id IS NULL;`}
                </pre>
              </div>
            )}

            {stage === 1 && (
              <div className="space-y-3 font-mono text-xs">
                <div className="border-b border-[var(--rule)] pb-2 text-[var(--muted)] flex justify-between">
                  <span>Editor Console</span>
                  <span>SQLite WASM</span>
                </div>
                <div className="bg-[var(--ground)] p-4 border border-[var(--border)] space-y-1 text-[var(--ink)]">
                  <div className="text-[var(--muted)]">-- Problem #1 Solution draft</div>
                  <div><span className="text-[var(--accent)]">SELECT</span> product_id</div>
                  <div><span className="text-[var(--accent)]">FROM</span> Products</div>
                  <div><span className="text-[var(--accent)]">WHERE</span> low_fats = 'Y' <span className="text-[var(--accent)]">AND</span> recyclable = 'Y';</div>
                </div>
                <div className="flex justify-between items-center text-[var(--muted)] pt-1">
                  <span>Press Ctrl+Enter</span>
                  <span className="text-[var(--positive)]">Ready</span>
                </div>
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[var(--pill-positive-bg)] border border-[var(--positive)] text-[var(--pill-positive-ink)] flex justify-between">
                  <span className="font-medium">Accepted</span>
                  <span className="tabular-nums font-mono">4.1ms</span>
                </div>
                <div className="border border-[var(--rule)] bg-[var(--ground)] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse font-sans">
                    <thead className="border-b border-[var(--border)] text-[var(--muted)]">
                      <tr>
                        <th className="p-2 font-normal">#</th>
                        <th className="p-2 font-normal">product_id</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--rule)]">
                      <tr>
                        <td className="p-2 text-[var(--muted)] font-mono">1</td>
                        <td className="p-2 font-mono">1</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-[var(--muted)] font-mono">2</td>
                        <td className="p-2 font-mono">3</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {stage === 3 && (
              <div className="space-y-4 text-xs font-sans">
                <div className="border-b border-[var(--rule)] pb-2 text-[var(--muted)] flex justify-between">
                  <span>Progress Ledger</span>
                  <span>IndexedDB persistent</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[var(--ground)] border border-[var(--rule)]">
                    <p className="text-[var(--muted)] text-[11px]">Solved</p>
                    <p className="text-xl font-normal text-[var(--ink)] tabular-nums mt-1">48 / 111</p>
                  </div>
                  <div className="p-3 bg-[var(--ground)] border border-[var(--rule)]">
                    <p className="text-[var(--muted)] text-[11px]">Accuracy</p>
                    <p className="text-xl font-normal text-[var(--positive)] tabular-nums mt-1">94.2%</p>
                  </div>
                  <div className="p-3 bg-[var(--ground)] border border-[var(--rule)]">
                    <p className="text-[var(--muted)] text-[11px]">Guides Read</p>
                    <p className="text-xl font-normal text-[var(--ink)] tabular-nums mt-1">14 / 14</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. SHOWCASE = HEADLINE YOU CAN TYPE */}
      <section className="w-full border-b border-[var(--border)] py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-6 space-y-1">
          <p className="text-xs text-[var(--muted)]">Live Sandbox</p>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)]">
            A query typed into the headline returns real rows.
          </h2>
        </div>

        <QueryInput />
      </section>

      {/* 5. STATS = LEDGER ALIGNED ON THE DECIMAL */}
      <section className="w-full border-b border-[var(--border)] py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-xs text-[var(--muted)]">Inventory</p>
          <h2 className="font-display text-3xl sm:text-4xl text-[var(--ink)]">
            Content generated from the repository.
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
          <div className="border-t border-[var(--border)] pt-4 space-y-1">
            <span className="font-display text-4xl sm:text-5xl text-[var(--ink)] tabular-nums block">
              {allProblems.length}
            </span>
            <span className="text-xs text-[var(--muted)] block">Practice problems</span>
            <p className="text-[11px] text-[var(--muted)]">LeetCode Top SQL 50, Accenture, TCS</p>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-1">
            <span className="font-display text-4xl sm:text-5xl text-[var(--ink)] tabular-nums block">
              {allLessons.length}
            </span>
            <span className="text-xs text-[var(--muted)] block">Theory masterclasses</span>
            <p className="text-[11px] text-[var(--muted)]">SELECT to Recursive CTEs and Indexes</p>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-1">
            <span className="font-display text-4xl sm:text-5xl text-[var(--ink)] tabular-nums block">
              9
            </span>
            <span className="text-xs text-[var(--muted)] block">Relational tables</span>
            <p className="text-[11px] text-[var(--muted)]">Employees, payroll, attendance, projects</p>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-1">
            <span className="font-display text-4xl sm:text-5xl text-[var(--positive)] tabular-nums block">
              0
            </span>
            <span className="text-xs text-[var(--muted)] block">Backend calls</span>
            <p className="text-[11px] text-[var(--muted)]">100% Client-side privacy</p>
          </div>
        </div>
      </section>

      {/* 6. CTA = A SENTENCE WITH A BLANK */}
      <section className="w-full py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-left">
        <div className="max-w-4xl space-y-6">
          <p className="text-xs text-[var(--muted)]">Begin study</p>
          
          <div className="font-display text-2xl sm:text-4xl text-[var(--ink)] leading-snug">
            <span>I want to study </span>
            <select
              value={selectedTrackId}
              onChange={(e) => setSelectedTrackId(e.target.value)}
              aria-label="Select study track"
              className="inline-block bg-[var(--surface)] text-[var(--accent)] font-display text-2xl sm:text-4xl px-2 py-0 border-b border-[var(--accent)] rounded-none focus:outline-none cursor-pointer"
            >
              {tracks.map((t) => (
                <option key={t.id} value={t.id} className="bg-[var(--surface)] text-[var(--ink)] font-sans text-sm">
                  {t.title}
                </option>
              ))}
            </select>
            <span> right now in the browser.</span>
          </div>

          <div>
            <Button size="lg" onClick={handleStartTrack} className="h-11 px-8 text-sm">
              Open track
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
