import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';
import lessonsData from '@/content/lessons.json';

/**
 * Learner Progress Dashboard — Data Terminal Style.
 * 
 * Logic & Approach:
 * - Overview KPI Strip: 14/500 label over 24/400 value format.
 * - Selecting a KPI activates focus for the analytics chart.
 * - Single-color bar chart answering "Problems solved by difficulty" with ONE highlighted
 *   safety-orange accent bar (#ff4a1f) and muted companions (#f2f2f3 / #4a4b50).
 * - Curriculum Track Mastery rendered as high-density table rows with flat 6px progress bars.
 * - Recent activity audit log capped strictly at 5 rows.
 * - Zero telemetry, local-first IndexedDB persistence.
 */
export const Dashboard: React.FC = () => {
  const { problems, lessons, activities } = useProgressStore();
  const [selectedKpi, setSelectedKpi] = useState<'completion' | 'problems' | 'lessons' | 'activity'>('problems');

  const allProblemsList = Object.values(problemsData) as any[];
  const allLessonsList = Object.values(lessonsData) as any[];
  const tracks = tracksData as any[];

  // 1. Completion counts
  const totalProblems = allProblemsList.length;
  const solvedProblems = Object.values(problems).filter((p) => p.status === 'solved').length;
  const attemptedProblems = Object.values(problems).filter((p) => p.status === 'attempted').length;

  const totalLessons = allLessonsList.length;
  const readLessons = Object.values(lessons).filter((l) => l.read).length;

  const overallPercentage = Math.round(((solvedProblems + readLessons) / (totalProblems + totalLessons)) * 100) || 0;

  // 2. Difficulty Distribution Calculation
  const difficultyStats = {
    easy: { total: 0, solved: 0 },
    medium: { total: 0, solved: 0 },
    hard: { total: 0, solved: 0 },
  };

  for (const prob of allProblemsList) {
    const diff = (prob.difficulty as 'easy' | 'medium' | 'hard') || 'easy';
    if (difficultyStats[diff]) {
      difficultyStats[diff].total += 1;
      if (problems[prob.id]?.status === 'solved') {
        difficultyStats[diff].solved += 1;
      }
    }
  }

  // Single-color chart with one accent bar
  // The tier with most solved or medium is highlighted with safety orange
  const chartData = [
    { name: 'Easy', solved: difficultyStats.easy.solved, total: difficultyStats.easy.total, tier: 'easy' },
    { name: 'Medium', solved: difficultyStats.medium.solved, total: difficultyStats.medium.total, tier: 'medium' },
    { name: 'Hard', solved: difficultyStats.hard.solved, total: difficultyStats.hard.total, tier: 'hard' },
  ];

  // 3. Find next unsolved problem
  const nextUnsolvedProblem = allProblemsList.find((p) => problems[p.id]?.status !== 'solved');

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)]">
      {/* Editorial Title & Resume Button */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-[var(--border)] gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)]">
              Local Telemetry
            </span>
            <span className="text-[11px] text-[var(--muted)]">•</span>
            <span className="text-[11px] text-[var(--muted)]">IndexedDB Storage</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal font-display tracking-tight text-[var(--ink)] leading-tight">
            Learning Progress
          </h1>
          <p className="text-xs text-[var(--muted)]">
            All progress, queries, and logs are persisted locally in browser memory.
          </p>
        </div>

        {nextUnsolvedProblem && (
          <Link to={`/practice/${nextUnsolvedProblem.id}`}>
            <Button size="sm" className="gap-2 text-xs rounded-none font-medium">
              <span>Resume challenge {nextUnsolvedProblem.number}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Overview KPI Strip (14/500 label over 24/400 value) */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-[var(--border)] bg-[var(--surface)] divide-y md:divide-y-0 md:divide-x divide-[var(--border)]">
        {/* KPI 1 */}
        <button
          type="button"
          onClick={() => setSelectedKpi('completion')}
          className={`p-4 text-left transition-colors cursor-pointer relative ${
            selectedKpi === 'completion'
              ? 'bg-[var(--ground)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
              : 'hover:bg-[var(--ground)]'
          }`}
        >
          <div className="text-sm font-medium text-[var(--muted)] leading-tight">Overall progress</div>
          <div className="mt-2 text-2xl font-normal text-[var(--ink)] tabular-nums">{overallPercentage}%</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{solvedProblems + readLessons} of {totalProblems + totalLessons} completed</div>
        </button>

        {/* KPI 2 */}
        <button
          type="button"
          onClick={() => setSelectedKpi('problems')}
          className={`p-4 text-left transition-colors cursor-pointer relative ${
            selectedKpi === 'problems'
              ? 'bg-[var(--ground)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
              : 'hover:bg-[var(--ground)]'
          }`}
        >
          <div className="text-sm font-medium text-[var(--muted)] leading-tight">Problems Solved</div>
          <div className="mt-2 text-2xl font-normal text-[var(--ink)] tabular-nums">{solvedProblems}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">{attemptedProblems} in-progress attempts</div>
        </button>

        {/* KPI 3 */}
        <button
          type="button"
          onClick={() => setSelectedKpi('lessons')}
          className={`p-4 text-left transition-colors cursor-pointer relative ${
            selectedKpi === 'lessons'
              ? 'bg-[var(--ground)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
              : 'hover:bg-[var(--ground)]'
          }`}
        >
          <div className="text-sm font-medium text-[var(--muted)] leading-tight">Theory read</div>
          <div className="mt-2 text-2xl font-normal text-[var(--ink)] tabular-nums">{readLessons}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">14 structured lessons</div>
        </button>

        {/* KPI 4 */}
        <button
          type="button"
          onClick={() => setSelectedKpi('activity')}
          className={`p-4 text-left transition-colors cursor-pointer relative ${
            selectedKpi === 'activity'
              ? 'bg-[var(--ground)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
              : 'hover:bg-[var(--ground)]'
          }`}
        >
          <div className="text-sm font-medium text-[var(--muted)] leading-tight">Session events</div>
          <div className="mt-2 text-2xl font-normal text-[var(--ink)] tabular-nums">{activities.length}</div>
          <div className="mt-1 text-xs text-[var(--muted)]">Total IndexedDB records</div>
        </button>
      </div>

      {/* Grid: Difficulty Chart (Left) + Recent Activity Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Difficulty Breakdown (Left 7 Cols) */}
        <div className="lg:col-span-7 border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-medium text-[var(--ink)] uppercase tracking-wider">
              Problems solved by difficulty
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Single-color distribution with safety-orange accent highlighting highest volume tier.
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#9c9ea3" fontSize={11} fontFamily="General Sans" tickLine={false} />
                <YAxis stroke="#9c9ea3" fontSize={11} fontFamily="General Sans" tickLine={false} />
                <RechartsTooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                  contentStyle={{
                    backgroundColor: '#18191b',
                    border: '1px solid #222224',
                    borderRadius: 0,
                    fontSize: '11px',
                    fontFamily: 'General Sans',
                    color: '#eff0f1',
                  }}
                />
                <Bar dataKey="solved" radius={[0, 0, 0, 0]}>
                  {chartData.map((entry, index) => {
                    // Highlight the 'easy' or active tier with #ff4a1f; others in single neutral color #9c9ea3
                    const isHighlighted = entry.tier === 'easy' || entry.solved > 0;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={isHighlighted ? '#ff4a1f' : '#4a4b50'} 
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--rule)] text-left">
            <div>
              <p className="text-xs text-[var(--muted)]">Easy</p>
              <p className="text-base font-normal text-[var(--ink)] tabular-nums mt-0.5">
                {difficultyStats.easy.solved} / {difficultyStats.easy.total}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Medium</p>
              <p className="text-base font-normal text-[var(--ink)] tabular-nums mt-0.5">
                {difficultyStats.medium.solved} / {difficultyStats.medium.total}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)]">Hard</p>
              <p className="text-base font-normal text-[var(--ink)] tabular-nums mt-0.5">
                {difficultyStats.hard.solved} / {difficultyStats.hard.total}
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity Log (Right 5 Cols - Capped at 5 rows) */}
        <div className="lg:col-span-5 border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--rule)]">
            <h2 className="text-sm font-medium text-[var(--ink)] uppercase tracking-wider">
              Recent activity
            </h2>
            <span className="text-xs text-[var(--muted)] tabular-nums">
              Latest 5 entries
            </span>
          </div>

          <div className="divide-y divide-[var(--rule)]">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--muted)]">
                No activity recorded yet.
              </div>
            ) : (
              activities.slice(0, 5).map((act, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {act.type === 'solved_problem' ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[var(--positive)] shrink-0" />
                    ) : (
                      <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-none shrink-0" />
                    )}
                    <span className="text-[var(--ink)] truncate font-medium text-xs">
                      {act.title}
                    </span>
                  </div>
                  <span className="text-[11px] text-[var(--muted)] tabular-nums shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Curriculum Track Mastery as Table Rows (Not Cards) */}
      <div className="space-y-3 pt-4">
        <h2 className="text-sm font-medium text-[var(--ink)] uppercase tracking-wider">
          Curriculum track mastery
        </h2>

        <div className="border border-[var(--border)] overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[var(--surface)] text-[var(--muted)] border-b border-[var(--border)]">
              <tr>
                <th className="py-2.5 px-4 font-normal">Track</th>
                <th className="py-2.5 px-4 font-normal text-right">Completion</th>
                <th className="py-2.5 px-4 font-normal w-1/3">Progress</th>
                <th className="py-2.5 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--rule)] bg-[var(--ground)]">
              {tracks.map((track) => {
                let trackTotal = 0;
                let trackCompleted = 0;

                if (track.totalProblems > 0) {
                  trackTotal = track.totalProblems;
                  const probIds: string[] = track.modules.flatMap((m: any) => m.problemIds);
                  trackCompleted = probIds.filter((pid) => problems[pid]?.status === 'solved').length;
                } else {
                  trackTotal = track.totalLessons;
                  const lessIds: string[] = track.modules.flatMap((m: any) => m.lessonIds);
                  trackCompleted = lessIds.filter((lid) => lessons[lid]?.read).length;
                }

                const pct = Math.round((trackCompleted / (trackTotal || 1)) * 100);

                return (
                  <tr key={track.id} className="hover:bg-[var(--surface)] transition-colors">
                    <td className="py-3 px-4 font-medium text-[var(--ink)]">
                      {track.title}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-[var(--muted)]">
                      {trackCompleted} / {trackTotal} ({pct}%)
                    </td>
                    <td className="py-3 px-4">
                      <Progress value={pct} className="h-1.5 rounded-none bg-[var(--surface)]" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={track.totalProblems > 0 ? `/practice?track=${track.id}` : `/learn`}
                        className="text-[var(--accent)] hover:underline font-medium"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
