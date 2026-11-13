import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Trophy, 
  Flame, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Terminal, 
  BarChart2, 
  Sparkles,
  Layers,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';
import lessonsData from '@/content/lessons.json';

/**
 * Learner Progress Dashboard.
 * 
 * Logic & Approach:
 * - Aggregates client-side progress across all tracks, modules, lessons, and problems.
 * - Renders overall completion metrics, streak data, and difficulty breakdown chart (Recharts).
 * - Displays an activity timeline generated from IndexedDB logs.
 * - Provides immediate "Continue Practice" navigation to next unsolved question.
 */
export const Dashboard: React.FC = () => {
  const { problems, lessons, activities } = useProgressStore();

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

  const chartData = [
    { name: 'Easy', solved: difficultyStats.easy.solved, total: difficultyStats.easy.total, color: '#10B981' },
    { name: 'Medium', solved: difficultyStats.medium.solved, total: difficultyStats.medium.total, color: '#F59E0B' },
    { name: 'Hard', solved: difficultyStats.hard.solved, total: difficultyStats.hard.total, color: '#EF4444' },
  ];

  // 3. Find next unsolved problem
  const nextUnsolvedProblem = allProblemsList.find((p) => problems[p.id]?.status !== 'solved');

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-[#07090E]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1C2438] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-xs text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30 font-semibold uppercase">
              Telemetry & Analytics
            </span>
          </div>
          <h1 className="text-3xl font-extrabold font-heading tracking-tight text-[#F1F5F9] light:text-slate-900">
            Learning Progress
          </h1>
          <p className="text-xs text-[#94A3B8] font-mono mt-1">
            Zero telemetry sent to servers. All progress, queries, and logs are encrypted in local IndexedDB.
          </p>
        </div>

        {nextUnsolvedProblem && (
          <Link to={`/practice/${nextUnsolvedProblem.id}`}>
            <Button size="lg" className="gap-2 font-mono text-xs bg-[#06B6D4] hover:bg-[#0891B2] text-[#07090E] font-semibold">
              <span>Resume Challenge #{String(nextUnsolvedProblem.number).padStart(3, '0')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      {/* 4 Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 space-y-2 bg-[#0C1019] border-[#1C2438]">
          <span className="text-[10px] text-[#94A3B8] font-mono font-semibold uppercase tracking-wider">
            Overall Completion
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#F1F5F9] light:text-slate-900">{overallPercentage}%</span>
            <Trophy className="h-5 w-5 text-[#06B6D4]" />
          </div>
          <Progress value={overallPercentage} className="h-1.5 mt-2 bg-[#161F30]" />
        </Card>

        <Card className="p-5 space-y-2 bg-[#0C1019] border-[#1C2438]">
          <span className="text-[10px] text-[#94A3B8] font-mono font-semibold uppercase tracking-wider">
            Problems Solved
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-emerald-400">
              {solvedProblems} <span className="text-xs text-[#64748B] font-mono">/ {totalProblems}</span>
            </span>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-[10px] text-[#64748B] font-mono">{attemptedProblems} in-progress attempts</p>
        </Card>

        <Card className="p-5 space-y-2 bg-[#0C1019] border-[#1C2438]">
          <span className="text-[10px] text-[#94A3B8] font-mono font-semibold uppercase tracking-wider">
            Theory Guides Read
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-[#22D3EE]">
              {readLessons} <span className="text-xs text-[#64748B] font-mono">/ {totalLessons}</span>
            </span>
            <BookOpen className="h-5 w-5 text-[#22D3EE]" />
          </div>
          <p className="text-[10px] text-[#64748B] font-mono">14 structured lessons</p>
        </Card>

        <Card className="p-5 space-y-2 bg-[#0C1019] border-[#1C2438]">
          <span className="text-[10px] text-[#94A3B8] font-mono font-semibold uppercase tracking-wider">
            Session Activity
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold font-mono text-amber-400">
              {activities.length} <span className="text-xs text-[#64748B] font-mono">Events</span>
            </span>
            <Flame className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-[10px] text-[#64748B] font-mono">Active local workspace</p>
        </Card>
      </div>

      {/* Grid: Difficulty Chart (Left) + Activity Log (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Difficulty Breakdown (Left 7 Cols) */}
        <Card className="lg:col-span-7 p-6 space-y-6 bg-[#0C1019] border-[#1C2438]">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold font-heading text-[#F1F5F9] light:text-slate-900 uppercase tracking-wide">
                Problems Solved by Difficulty
              </h3>
              <p className="text-xs text-[#94A3B8]">
                Distribution of solved challenges across Easy, Medium, and Hard tiers.
              </p>
            </div>
            <BarChart2 className="h-4 w-4 text-[#06B6D4]" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} fontFamily="JetBrains Mono" tickLine={false} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#07090E',
                    border: '1px solid #1C2438',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono',
                    color: '#F1F5F9',
                  }}
                />
                <Bar dataKey="solved" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[#1C2438] text-center">
            <div>
              <p className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Easy</p>
              <p className="font-mono text-base font-bold text-[#F1F5F9] light:text-slate-900 mt-0.5">
                {difficultyStats.easy.solved} <span className="text-xs text-[#64748B]">/ {difficultyStats.easy.total}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-amber-400 font-semibold uppercase">Medium</p>
              <p className="font-mono text-base font-bold text-[#F1F5F9] light:text-slate-900 mt-0.5">
                {difficultyStats.medium.solved} <span className="text-xs text-[#64748B]">/ {difficultyStats.medium.total}</span>
              </p>
            </div>
            <div>
              <p className="text-[10px] font-mono text-rose-400 font-semibold uppercase">Hard</p>
              <p className="font-mono text-base font-bold text-[#F1F5F9] light:text-slate-900 mt-0.5">
                {difficultyStats.hard.solved} <span className="text-xs text-[#64748B]">/ {difficultyStats.hard.total}</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Recent Activity Feed (Right 5 Cols) */}
        <Card className="lg:col-span-5 p-6 space-y-4 flex flex-col bg-[#0C1019] border-[#1C2438]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading text-[#F1F5F9] light:text-slate-900 uppercase tracking-wide">
              IndexedDB Audit Log
            </h3>
            <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
              {activities.length} entries
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[290px] space-y-2 pr-1">
            {activities.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#94A3B8]">
                <Clock className="h-6 w-6 mb-2 opacity-30 text-[#06B6D4]" />
                <p className="text-xs font-mono">No activity recorded yet.</p>
                <p className="text-[10px] font-mono text-[#64748B] mt-1">Read a lesson or solve a problem to start logging.</p>
              </div>
            ) : (
              activities.map((act, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-[#1C2438] bg-[#07090E] flex items-center justify-between text-xs light:bg-slate-50 light:border-slate-200"
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    {act.type === 'solved_problem' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : act.type === 'read_lesson' ? (
                      <BookOpen className="h-4 w-4 text-[#22D3EE] shrink-0" />
                    ) : (
                      <Terminal className="h-4 w-4 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[#E2E8F0] truncate font-medium light:text-slate-800 text-[11px]">
                      {act.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748B] font-mono shrink-0">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Per-Track Progress Bars */}
      <div className="space-y-4">
        <h3 className="text-base font-bold font-heading text-[#F1F5F9] light:text-slate-900 uppercase tracking-wide">
          Curriculum Track Mastery
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Card key={track.id} className="p-5 space-y-3 bg-[#0C1019] border-[#1C2438]">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-semibold text-[#F1F5F9] light:text-slate-800">{track.title}</span>
                  <span className="font-mono text-[#06B6D4] text-[11px]">{trackCompleted} / {trackTotal}</span>
                </div>
                <Progress value={pct} className="h-1.5 bg-[#161F30]" />
                <div className="flex items-center justify-between text-[11px] text-[#94A3B8] font-mono">
                  <span>{pct}% complete</span>
                  <Link
                    to={track.totalProblems > 0 ? `/practice?track=${track.id}` : `/learn`}
                    className="text-[#06B6D4] hover:underline"
                  >
                    Open Track →
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
