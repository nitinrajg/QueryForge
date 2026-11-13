import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Terminal, 
  Search, 
  CheckCircle2, 
  CircleDot, 
  Circle, 
  ChevronRight, 
  Filter,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import problemsData from '@/content/problems.json';

// Helper to sanitize emojis from titles
function sanitizeTitle(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * High-Density SQL Problem Arena Catalog.
 * 
 * Logic & Approach:
 * - High-speed search and multi-dimensional filter bar.
 * - Interactive list with status indicators, difficulty badges, and quick launch triggers.
 * - Zero emoji clutter for clean engineering posture.
 */
export const Practice: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTrackFilter = searchParams.get('track') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'solved' | 'attempted' | 'todo'>('all');

  const { problems: progressProblems } = useProgressStore();
  const tracks = tracksData as any[];
  const allProblems = Object.values(problemsData) as any[];

  // Filter problems based on active parameters
  const filteredProblems = useMemo(() => {
    return allProblems.filter((p) => {
      // 1. Track filter
      if (activeTrackFilter !== 'all' && p.trackId !== activeTrackFilter) return false;

      // 2. Difficulty filter
      if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return false;

      // 3. Status filter
      const pStatus = progressProblems[p.id]?.status;
      if (statusFilter === 'solved' && pStatus !== 'solved') return false;
      if (statusFilter === 'attempted' && pStatus !== 'attempted') return false;
      if (statusFilter === 'todo' && pStatus === 'solved') return false;

      // 4. Search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesTags = p.tags?.some((t: string) => t.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTags) return false;
      }

      return true;
    });
  }, [allProblems, activeTrackFilter, difficultyFilter, statusFilter, searchQuery, progressProblems]);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="space-y-2 pb-4 border-b border-[#1C2438]">
        <div className="flex items-center gap-2">
          <Badge variant="accent">PRACTICE ARENA</Badge>
          <span className="text-xs text-[#7E8B9F] font-mono">111 VERIFIED PROBLEMS</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-3xl font-extrabold font-display text-white tracking-tight light:text-slate-900">
            SQL Problem Catalog
          </h1>
          <span className="text-xs font-mono text-[#7E8B9F]">
            AUTO-CHECKED IN CLIENT WASM
          </span>
        </div>
      </div>

      {/* Filter Matrix Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 rounded-xl border border-[#1C2438] bg-[#0C1019] surface-cockpit">
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#7E8B9F]" />
          <Input
            type="text"
            placeholder="Filter by title, join, window, cte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs font-mono"
          />
        </div>

        {/* Track Selector */}
        <div className="sm:col-span-3">
          <select
            value={activeTrackFilter}
            onChange={(e) => setSearchParams({ track: e.target.value })}
            className="h-8 w-full rounded-lg border border-[#1C2438] bg-[#07090E] px-2.5 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <option value="all">ALL TRACKS ({allProblems.length})</option>
            {tracks.filter((t) => t.totalProblems > 0).map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.totalProblems})
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty */}
        <div className="sm:col-span-2">
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value as any)}
            className="h-8 w-full rounded-lg border border-[#1C2438] bg-[#07090E] px-2.5 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <option value="all">ANY DIFFICULTY</option>
            <option value="easy">EASY</option>
            <option value="medium">MEDIUM</option>
            <option value="hard">HARD</option>
          </select>
        </div>

        {/* Status */}
        <div className="sm:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-8 w-full rounded-lg border border-[#1C2438] bg-[#07090E] px-2.5 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:ring-1 focus:ring-cyan-400"
          >
            <option value="all">ANY STATUS</option>
            <option value="solved">SOLVED</option>
            <option value="attempted">ATTEMPTED</option>
            <option value="todo">TO DO</option>
          </select>
        </div>
      </div>

      {/* High-Density Problem Rows */}
      <div className="border border-[#1C2438] rounded-xl overflow-hidden bg-[#0C1019] surface-cockpit">
        {filteredProblems.length === 0 ? (
          <div className="p-12 text-center text-[#7E8B9F] space-y-2">
            <Terminal className="h-6 w-6 mx-auto opacity-40 text-cyan-400" />
            <p className="text-xs font-mono">NO MATCHING CHALLENGES FOUND</p>
          </div>
        ) : (
          <div className="divide-y divide-[#161D2E]">
            {filteredProblems.map((prob) => {
              const status = progressProblems[prob.id]?.status || 'todo';
              const cleanTitle = sanitizeTitle(prob.title);

              return (
                <Link
                  key={prob.id}
                  to={`/practice/${prob.id}`}
                  className="flex items-center justify-between p-3 sm:px-4 sm:py-3 hover:bg-[#121826] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-4">
                    {/* Status Dot */}
                    <div>
                      {status === 'solved' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : status === 'attempted' ? (
                        <CircleDot className="h-4 w-4 text-amber-400 shrink-0" />
                      ) : (
                        <Circle className="h-4 w-4 text-[#3E4A63] shrink-0" />
                      )}
                    </div>

                    {/* Problem Number & Title */}
                    <div className="flex items-center gap-2.5 min-w-0 font-mono text-xs">
                      <span className="text-[#7E8B9F] shrink-0 font-bold">
                        #{String(prob.number).padStart(2, '0')}
                      </span>
                      <span className="font-semibold text-[#F1F5F9] group-hover:text-cyan-300 transition-colors truncate">
                        {cleanTitle}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={prob.difficulty as any} className="uppercase text-[9px] font-mono">
                      {prob.difficulty}
                    </Badge>

                    <ChevronRight className="h-3.5 w-3.5 text-[#7E8B9F] group-hover:translate-x-1 group-hover:text-white transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
