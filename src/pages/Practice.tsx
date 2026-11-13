import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/Input';
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
 * High-Density SQL Problem Arena Catalog — Data Terminal List.
 * 
 * Logic & Approach:
 * - Clean Data Terminal list without bulky card frames.
 * - Underline status tabs: All, Unsolved, Attempted, Solved with 1px accent indicator.
 * - Flat search input and discrete track/difficulty selectors.
 * - Row pitch 48-52px with title dominance, plain sentence-case difficulty (Easy/Medium/Hard),
 *   and status pills using the design system's --pill-* tokens.
 * - Natural unpadded challenge numbers.
 */
export const Practice: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTrackFilter = searchParams.get('track') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'attempted' | 'solved'>('all');

  const { problems: progressProblems } = useProgressStore();
  const tracks = tracksData as any[];
  const allProblems = useMemo(() => Object.values(problemsData) as any[], []);

  // Filter problems based on active parameters
  const filteredProblems = useMemo(() => {
    return allProblems.filter((p) => {
      // 1. Track filter
      if (activeTrackFilter !== 'all' && p.trackId !== activeTrackFilter) return false;

      // 2. Difficulty filter
      if (difficultyFilter !== 'all' && p.difficulty !== difficultyFilter) return false;

      // 3. Status filter
      const pStatus = progressProblems[p.id]?.status || 'unsolved';
      if (statusFilter === 'solved' && pStatus !== 'solved') return false;
      if (statusFilter === 'attempted' && pStatus !== 'attempted') return false;
      if (statusFilter === 'unsolved' && pStatus === 'solved') return false;

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

  // Counts for tabs
  const solvedCount = useMemo(() => {
    return allProblems.filter((p) => progressProblems[p.id]?.status === 'solved').length;
  }, [allProblems, progressProblems]);

  const attemptedCount = useMemo(() => {
    return allProblems.filter((p) => progressProblems[p.id]?.status === 'attempted').length;
  }, [allProblems, progressProblems]);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)]">
      {/* Editorial Title Row */}
      <div className="space-y-2 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)]">
            Execution Sandbox
          </span>
          <span className="text-[11px] text-[var(--muted)]">•</span>
          <span className="text-[11px] text-[var(--muted)] tabular-nums">
            {allProblems.length} Problems Total
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-3xl sm:text-4xl font-normal font-display tracking-tight text-[var(--ink)] leading-tight">
            SQL Problem Catalog
          </h1>
          <span className="text-xs text-[var(--muted)]">
            Verified client-side via SQLite WASM
          </span>
        </div>
      </div>

      {/* Underline Tabs & Controls */}
      <div className="space-y-4">
        {/* Underline Tabs */}
        <div className="flex items-center gap-6 border-b border-[var(--border)] overflow-x-auto -mb-px">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            All problems ({allProblems.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unsolved')}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'unsolved'
                ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Unsolved ({allProblems.length - solvedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('attempted')}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'attempted'
                ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Attempted ({attemptedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('solved')}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'solved'
                ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Solved ({solvedCount})
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* Search (280px wide) */}
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted)]" />
            <Input
              type="text"
              placeholder="Search title, join, window..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-[var(--surface)] border-[var(--border)] focus:border-[var(--accent)] rounded-none"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Track Selector */}
            <select
              value={activeTrackFilter}
              onChange={(e) => setSearchParams({ track: e.target.value })}
              className="h-8 rounded-none border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Tracks</option>
              {tracks.filter((t) => t.totalProblems > 0).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.totalProblems})
                </option>
              ))}
            </select>

            {/* Difficulty Selector */}
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="h-8 rounded-none border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Problem List (No outer card container) */}
      <div className="border-t border-[var(--border)]">
        {filteredProblems.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted)]">
            <p className="text-sm">No matching SQL problems found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--rule)]">
            {filteredProblems.map((prob) => {
              const pStatus = progressProblems[prob.id]?.status || 'unsolved';
              const cleanTitle = sanitizeTitle(prob.title);

              return (
                <Link
                  key={prob.id}
                  to={`/practice/${prob.id}`}
                  className="flex items-center justify-between min-h-[50px] py-3 px-3 hover:bg-[var(--surface)] transition-colors group"
                >
                  {/* Left: Number and Title (Dominant Width) */}
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <span className="w-8 text-right text-xs tabular-nums text-[var(--muted)] shrink-0">
                      {prob.number}.
                    </span>

                    <span className="text-sm font-medium text-[var(--ink)] group-hover:text-white transition-colors truncate">
                      {cleanTitle}
                    </span>
                  </div>

                  {/* Right: Difficulty Word and Status Pill */}
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    {/* Plain Difficulty Word */}
                    <span className={`capitalize text-xs ${
                      prob.difficulty === 'easy'
                        ? 'text-[var(--positive)]'
                        : prob.difficulty === 'medium'
                        ? 'text-[var(--warning)]'
                        : 'text-[var(--negative)]'
                    }`}>
                      {prob.difficulty}
                    </span>

                    {/* Status Pill */}
                    {pStatus === 'solved' ? (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-[var(--pill-positive-bg)] text-[var(--positive)] rounded-none">
                        Solved
                      </span>
                    ) : pStatus === 'attempted' ? (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-[var(--pill-warning-bg)] text-[var(--warning)] rounded-none">
                        Attempted
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[11px] font-medium bg-[var(--pill-neutral-bg)] text-[var(--muted)] rounded-none">
                        Unsolved
                      </span>
                    )}

                    <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-transform" />
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
