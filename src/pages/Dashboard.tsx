import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  BookOpen,
  Flame,
  Sparkles,
  LogIn,
  Calendar,
  Layers,
  Award
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
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProgressStore } from '@/store/useProgressStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';
import lessonsData from '@/content/lessons.json';

/**
 * Cohesive Learner Progress & Personal Telemetry Dashboard.
 * 
 * Logic & Approach:
 * - Timezone-aware daily active streak tracker (consecutive days with accepted solutions).
 * - GitHub/LeetCode-style 24-week interactive activity calendar heatmap.
 * - Dynamic topic recommendations highlighting weakest solved categories.
 * - Dual-mode: Hydrates from Supabase cloud telemetry for authenticated users,
 *   or runs 100% offline via local IndexedDB telemetry in guest mode.
 */
export const Dashboard: React.FC = () => {
  const { problems, lessons, activities } = useProgressStore();
  const { theme } = useThemeStore();
  const { user, profile } = useAuth();
  const isDark = theme === 'dark';

  const [selectedKpi, setSelectedKpi] = useState<'completion' | 'problems' | 'streak' | 'activity'>('problems');
  const [cloudSubmissionDates, setCloudSubmissionDates] = useState<string[]>([]);

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

  // 2. Fetch cloud submission timestamps if authenticated
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      supabase
        .from('submissions')
        .select('submitted_at, verdict')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(500)
        .then(({ data }) => {
          if (data) {
            setCloudSubmissionDates(data.map((d) => d.submitted_at));
          }
        });
    }
  }, [user]);

  // 3. Timezone-aware streak calculation
  const { currentStreak, maxStreak, dayCountMap } = useMemo(() => {
    // Combine cloud timestamps with local activities
    const timestamps = [
      ...cloudSubmissionDates,
      ...activities.map((a) => a.timestamp),
    ];

    const counts: Record<string, number> = {};
    const uniqueDays = new Set<string>();

    timestamps.forEach((ts) => {
      try {
        const d = new Date(ts);
        const yyyyMmDd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        counts[yyyyMmDd] = (counts[yyyyMmDd] || 0) + 1;
        uniqueDays.add(yyyyMmDd);
      } catch (e) {}
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse();

    let streak = 0;
    let longest = 0;
    let tempStreak = 0;

    // Check today and yesterday
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (uniqueDays.has(todayStr) || uniqueDays.has(yesterdayStr)) {
      let checkDate = uniqueDays.has(todayStr) ? new Date(now) : yesterday;
      while (true) {
        const checkStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (uniqueDays.has(checkStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Longest streak
    let prevDate: Date | null = null;
    for (const day of sortedDays) {
      const cur = new Date(day);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((prevDate.getTime() - cur.getTime()) / (1000 * 3600 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else {
          longest = Math.max(longest, tempStreak);
          tempStreak = 1;
        }
      }
      prevDate = cur;
    }
    longest = Math.max(longest, tempStreak, streak);

    return { currentStreak: streak, maxStreak: longest, dayCountMap: counts };
  }, [cloudSubmissionDates, activities]);

  // 4. Generate 24-week calendar cells
  const calendarWeeks = useMemo(() => {
    const weeks: { dateStr: string; count: number; date: Date }[][] = [];
    const today = new Date();
    // End on upcoming Saturday to complete column
    const end = new Date(today);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const totalDays = 24 * 7; // 24 weeks
    const start = new Date(end);
    start.setDate(start.getDate() - totalDays + 1);

    let currentWeek: { dateStr: string; count: number; date: Date }[] = [];
    const iter = new Date(start);

    while (iter <= end) {
      const yyyyMmDd = `${iter.getFullYear()}-${String(iter.getMonth() + 1).padStart(2, '0')}-${String(iter.getDate()).padStart(2, '0')}`;
      const count = dayCountMap[yyyyMmDd] || 0;
      currentWeek.push({ dateStr: yyyyMmDd, count, date: new Date(iter) });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      iter.setDate(iter.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, [dayCountMap]);

  // 5. Difficulty stats
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
    { name: 'Easy', solved: difficultyStats.easy.solved, total: difficultyStats.easy.total, tier: 'easy' },
    { name: 'Medium', solved: difficultyStats.medium.solved, total: difficultyStats.medium.total, tier: 'medium' },
    { name: 'Hard', solved: difficultyStats.hard.solved, total: difficultyStats.hard.total, tier: 'hard' },
  ];

  // 6. Topic Recommendations (Identify weakest solved topics)
  const topicRecommendations = useMemo(() => {
    const topicStats: Record<string, { total: number; solved: number; nextProblem?: any }> = {};

    allProblemsList.forEach((prob) => {
      const isSolved = problems[prob.id]?.status === 'solved';
      (prob.tags || ['General']).forEach((t: string) => {
        if (!topicStats[t]) topicStats[t] = { total: 0, solved: 0 };
        topicStats[t].total += 1;
        if (isSolved) {
          topicStats[t].solved += 1;
        } else if (!topicStats[t].nextProblem) {
          topicStats[t].nextProblem = prob;
        }
      });
    });

    return Object.entries(topicStats)
      .filter(([_, data]) => data.nextProblem && data.total >= 3)
      .map(([topic, data]) => ({
        topic,
        solved: data.solved,
        total: data.total,
        ratio: data.solved / data.total,
        problem: data.nextProblem,
      }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 3);
  }, [allProblemsList, problems]);

  // Find next unsolved problem
  const nextUnsolvedProblem = allProblemsList.find((p) => problems[p.id]?.status !== 'solved') || allProblemsList[0];

  const userDisplayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)] text-left">
      {/* Title & Fast Resume */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between pb-6 border-b border-[var(--border)] gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent)]">
              {user ? 'Cloud Telemetry' : 'Local Telemetry'}
            </span>
            <span className="text-[11px] text-[var(--faint)]">•</span>
            <span className="text-[11px] text-[var(--muted)] font-mono">
              {user ? `Account: ${user.email}` : 'IndexedDB Private Storage'}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-[var(--ink)]">
            {user ? `Welcome back, ${userDisplayName}` : 'Learning Progress'}
          </h1>
          <p className="text-xs text-[var(--muted)]">
            {user 
              ? 'Your query submissions, activity calendar, and practice drafts are synced across all your devices.'
              : 'Draft solutions and mastery stats saved directly in your browser. Create an account to sync across devices.'}
          </p>
        </div>

        {nextUnsolvedProblem && (
          <Link to={`/practice/${nextUnsolvedProblem.id}`}>
            <Button size="sm" className="gap-2 text-xs font-semibold cursor-pointer">
              <span>Resume #{nextUnsolvedProblem.number}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Guest Mode Banner */}
      {!user && (
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-xs text-[var(--ink)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-semibold">You are practicing in Guest Mode</p>
              <p className="text-[11px] text-[var(--muted)]">
                Sign in or create an account to back up your custom test cases and activity streak to Supabase.
              </p>
            </div>
          </div>
          <Link to="/practice">
            <Button size="sm" variant="outline" className="text-xs h-8 border-[var(--accent)] text-[var(--accent)]">
              <span>Practice Arena</span>
            </Button>
          </Link>
        </div>
      )}

      {/* Overview KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1: Overall Completion */}
        <button
          type="button"
          onClick={() => setSelectedKpi('completion')}
          className={`p-5 rounded-lg border text-left transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer ${
            selectedKpi === 'completion'
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--control)]'
          }`}
        >
          <span className="text-xs font-medium text-[var(--muted)] block">Overall Completion</span>
          <span className="mt-2 text-3xl font-bold text-[var(--ink)] tabular-nums block font-display">
            {overallPercentage}%
          </span>
          <span className="mt-1 text-[11px] text-[var(--muted)] block">
            {solvedProblems + readLessons} of {totalProblems + totalLessons} items
          </span>
        </button>

        {/* KPI 2: Problems Solved */}
        <button
          type="button"
          onClick={() => setSelectedKpi('problems')}
          className={`p-5 rounded-lg border text-left transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer ${
            selectedKpi === 'problems'
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--control)]'
          }`}
        >
          <span className="text-xs font-medium text-[var(--muted)] block">Problems Solved</span>
          <span className="mt-2 text-3xl font-bold text-[var(--positive)] tabular-nums block font-display">
            {solvedProblems}
          </span>
          <span className="mt-1 text-[11px] text-[var(--muted)] block">
            {attemptedProblems} in-progress attempts
          </span>
        </button>

        {/* KPI 3: Daily Active Streak */}
        <button
          type="button"
          onClick={() => setSelectedKpi('streak')}
          className={`p-5 rounded-lg border text-left transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer ${
            selectedKpi === 'streak'
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--control)]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--muted)] block">Active Streak</span>
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-amber-500 fill-amber-500' : 'text-[var(--muted)]'}`} />
          </div>
          <span className="mt-2 text-3xl font-bold text-amber-500 tabular-nums block font-display">
            {currentStreak} <span className="text-base font-normal text-[var(--muted)]">days</span>
          </span>
          <span className="mt-1 text-[11px] text-[var(--muted)] block">
            Best: {maxStreak} consecutive days
          </span>
        </button>

        {/* KPI 4: Total Submissions */}
        <button
          type="button"
          onClick={() => setSelectedKpi('activity')}
          className={`p-5 rounded-lg border text-left transition-[border-color,background-color,box-shadow] duration-150 cursor-pointer ${
            selectedKpi === 'activity'
              ? 'bg-[var(--surface)] border-[var(--accent)] shadow-xs'
              : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--control)]'
          }`}
        >
          <span className="text-xs font-medium text-[var(--muted)] block">Total Evaluations</span>
          <span className="mt-2 text-3xl font-bold text-[var(--accent)] tabular-nums block font-display">
            {activities.length + cloudSubmissionDates.length}
          </span>
          <span className="mt-1 text-[11px] text-[var(--muted)] block">
            Queries executed
          </span>
        </button>
      </div>

      {/* 24-Week Interactive Activity Heatmap Calendar */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <h3 className="text-base font-bold text-[var(--ink)]">Submission Calendar</h3>
            </div>
            <p className="text-xs text-[var(--muted)]">Activity heatmap over the past 24 weeks.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)] font-mono">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded-xs bg-[var(--raised)] border border-[var(--border)]" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2cbb5d]/30" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2cbb5d]/60" />
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2cbb5d]" />
            <span>More</span>
          </div>
        </div>

        <div className="overflow-x-auto pt-2 pb-1">
          <div className="inline-flex gap-1.5 min-w-[700px]">
            {calendarWeeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1.5">
                {week.map((day) => {
                  let bgClass = 'bg-[var(--raised)] border border-[var(--border)]';
                  if (day.count >= 4) {
                    bgClass = 'bg-[#2cbb5d] shadow-xs';
                  } else if (day.count >= 2) {
                    bgClass = 'bg-[#2cbb5d]/70';
                  } else if (day.count === 1) {
                    bgClass = 'bg-[#2cbb5d]/35';
                  }

                  return (
                    <div
                      key={day.dateStr}
                      className={`w-3.5 h-3.5 rounded-xs ${bgClass} transition-transform hover:scale-125 cursor-pointer`}
                      title={`${day.dateStr}: ${day.count} ${day.count === 1 ? 'submission' : 'submissions'}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics Chart & Track Mastery Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Recharts Difficulty Breakdown (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--ink)]">Problems Solved by Tier</h3>
            <p className="text-xs text-[var(--muted)]">Count of accepted solutions across difficulties.</p>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="var(--muted)" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis 
                  stroke="var(--muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg text-xs space-y-1 font-sans">
                          <p className="font-semibold text-[var(--ink)]">{data.name} Difficulty</p>
                          <p className="text-[var(--positive)] font-mono">
                            Solved: {data.solved} / {data.total}
                          </p>
                          <p className="text-[var(--muted)] text-[10px]">
                            {Math.round((data.solved / (data.total || 1)) * 100)}% complete
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="solved" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={
                        entry.tier === 'easy' 
                          ? '#10b981' 
                          : entry.tier === 'medium' 
                          ? '#f59e0b' 
                          : '#f43f5e'
                      } 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)] text-center text-xs">
            <div>
              <span className="text-[10px] text-[var(--positive)] block font-semibold">Easy</span>
              <span className="font-mono text-xs tabular-nums text-[var(--ink)]">
                {difficultyStats.easy.solved}/{difficultyStats.easy.total}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--warning)] block font-semibold">Medium</span>
              <span className="font-mono text-xs tabular-nums text-[var(--ink)]">
                {difficultyStats.medium.solved}/{difficultyStats.medium.total}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--negative)] block font-semibold">Hard</span>
              <span className="font-mono text-xs tabular-nums text-[var(--ink)]">
                {difficultyStats.hard.solved}/{difficultyStats.hard.total}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Tracks Breakdown & Topic Recommendations (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Personalized Topic Recommendations */}
          {topicRecommendations.length > 0 && (
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-base font-bold text-[var(--ink)]">Recommended Practice Focus</h3>
                </div>
                <p className="text-xs text-[var(--muted)]">Categories where you have unsolved challenges.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topicRecommendations.map((rec) => (
                  <Link
                    key={rec.topic}
                    to={`/practice/${rec.problem.id}`}
                    className="p-3.5 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] hover:border-[var(--accent)] transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--accent)] block">
                        {rec.topic}
                      </span>
                      <p className="mt-1 text-xs font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] line-clamp-1">
                        #{rec.problem.number} {rec.problem.title}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--muted)] pt-2 border-t border-[var(--border)]">
                      <span>{rec.solved}/{rec.total} solved</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Curriculum Tracks */}
          <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--ink)]">Curriculum Track Mastery</h3>
              <p className="text-xs text-[var(--muted)]">Status across structured learning pathways.</p>
            </div>

            <div className="space-y-4">
              {tracks.map((track) => {
                const trackProblems = allProblemsList.filter((p) => p.trackId === track.id);
                const trackSolved = trackProblems.filter((p) => problems[p.id]?.status === 'solved').length;
                const percent = trackProblems.length > 0 ? Math.round((trackSolved / trackProblems.length) * 100) : 0;

                return (
                  <div key={track.id} className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[var(--ink)]">{track.title}</h4>
                        <p className="text-xs text-[var(--muted)]">{track.description}</p>
                      </div>
                      <Link to={`/practice?track=${track.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] cursor-pointer">
                          Continue
                        </Button>
                      </Link>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-[var(--muted)] font-mono">
                        <span>{trackSolved} / {track.totalProblems} solved</span>
                        <span>{percent}%</span>
                      </div>
                      <Progress value={percent} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-[var(--ink)]">Recent Activity</h3>
            <p className="text-xs text-[var(--muted)]">Your recent query evaluations and reads.</p>
          </div>
          <span className="text-xs text-[var(--muted)] font-mono">
            {activities.length} total events
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="py-10 text-center text-xs text-[var(--muted)]">
            <p>No activity recorded yet. Start practicing in the arena to generate history!</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {activities.slice(0, 8).map((act, idx) => (
              <div key={idx} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  {act.type === 'read_lesson' ? (
                    <BookOpen className="h-4 w-4 text-[var(--accent)]" />
                  ) : act.type === 'solved_problem' ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--positive)]" />
                  ) : (
                    <Clock className="h-4 w-4 text-[var(--warning)]" />
                  )}

                  <div className="space-y-0.5">
                    <span className="font-semibold text-[var(--ink)]">
                      {act.title || act.targetId}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] block">
                      {act.type === 'read_lesson' ? 'Read theory module' : act.type === 'solved_problem' ? 'Solved challenge' : 'Attempted query'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[var(--muted)] font-mono">
                    {new Date(act.timestamp).toLocaleDateString()}
                  </span>
                  <Link to={act.type === 'read_lesson' ? `/learn` : `/practice/${act.targetId}`}>
                    <Button variant="ghost" size="sm" className="h-7 text-xs cursor-pointer">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
