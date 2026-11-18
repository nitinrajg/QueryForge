import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  ChevronRight, 
  Clock, 
  X, 
  Code2, 
  Check,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SetDropdown, SetOption } from '@/components/ui/SetDropdown';
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
 * Derives a human-friendly label from a raw module ID.
 * Examples:
 * - 'leetcode-set-1' -> 'LeetCode Set 1'
 * - 'interview-set-2' -> 'Interview Set 2'
 * - 'company-1' -> 'Company Set 1'
 * - 'bonus-set-1' -> 'Bonus Set 1'
 */
export function formatSetLabel(moduleId: string): string {
  if (!moduleId) return 'Unknown Set';

  if (moduleId.startsWith('leetcode-set-')) {
    const num = moduleId.replace('leetcode-set-', '');
    return `LeetCode Set ${num}`;
  }
  if (moduleId.startsWith('interview-set-')) {
    const num = moduleId.replace('interview-set-', '');
    return `Interview Set ${num}`;
  }
  if (moduleId.startsWith('company-')) {
    const num = moduleId.replace('company-', '');
    return `Company Set ${num}`;
  }
  if (moduleId.startsWith('bonus-set-')) {
    const num = moduleId.replace('bonus-set-', '');
    return `Bonus Set ${num}`;
  }

  return moduleId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Derives available set options from problem data, sorted naturally (Set 1, 2, ... 9, 10).
 */
export function deriveSetOptions(problems: any[], activeTrack: string): SetOption[] {
  // If a track filter is active, scope to that track; otherwise use all problems
  const scopedProblems = activeTrack !== 'all'
    ? problems.filter((p) => p.trackId === activeTrack)
    : problems;

  const countsByModule = new Map<string, number>();
  scopedProblems.forEach((p) => {
    if (p.moduleId) {
      countsByModule.set(p.moduleId, (countsByModule.get(p.moduleId) || 0) + 1);
    }
  });

  // Natural alphabetical + numeric sorting (1, 2, ... 9, 10, not 1, 10, 2)
  const setKeys = Array.from(countsByModule.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  return [
    {
      id: 'all',
      label: 'All Sets',
      count: scopedProblems.length,
    },
    ...setKeys.map((id) => ({
      id,
      label: formatSetLabel(id),
      count: countsByModule.get(id) || 0,
    })),
  ];
}

/**
 * Pure filter function for problem catalog testing & execution.
 */
export function filterProblems(
  problems: any[],
  filters: {
    track: string;
    set: string;
    difficulty: string;
    status: string;
    searchQuery: string;
  },
  progressProblems: Record<string, { status: string }>
): any[] {
  return problems.filter((p) => {
    // 1. Track filter
    if (filters.track !== 'all' && p.trackId !== filters.track) return false;

    // 2. Set filter
    if (filters.set !== 'all' && p.moduleId !== filters.set) return false;

    // 3. Difficulty filter
    if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false;

    // 4. Status filter
    const pStatus = progressProblems[p.id]?.status || 'unsolved';
    if (filters.status === 'solved' && pStatus !== 'solved') return false;
    if (filters.status === 'attempted' && pStatus !== 'attempted') return false;
    if (filters.status === 'unsolved' && pStatus === 'solved') return false;

    // 5. Search query
    if (filters.searchQuery.trim().length > 0) {
      const query = filters.searchQuery.toLowerCase();
      const matchesTitle = p.title.toLowerCase().includes(query);
      const matchesNumber = String(p.number) === query;
      // Filter out internal set tags from search matching
      const matchesTags = p.tags?.some(
        (t: string) =>
          !/(?:leetcode-set|interview-set|company-\d+|bonus-set|^set-\d+)/i.test(t) &&
          t.toLowerCase().includes(query)
      );
      if (!matchesTitle && !matchesTags && !matchesNumber) return false;
    }

    return true;
  });
}

/**
 * Cohesive SQL Problem Catalog Arena.
 * 
 * Rules:
 * - Clear track selection pills with real-time solve counts.
 * - Underline status tabs: All, Unsolved, Attempted, Solved.
 * - Dynamic Set Dropdown with natural ordering (Set 1..10) and problem counts.
 * - Clean problem rows: Raw "leetcode-set-N" strings stripped; only essential badges remain.
 * - Active filter chip allowing 1-click clearing of set filter.
 * - Responsive design: graceful collapse on mobile (native select fallback on <640px).
 */
export const Practice: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTrackFilter = searchParams.get('track') || 'all';
  const rawSetParam = searchParams.get('set') || 'all';

  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unsolved' | 'attempted' | 'solved'>('all');

  const { problems: progressProblems } = useProgressStore();
  const tracks = tracksData as any[];
  const allProblems = useMemo(() => Object.values(problemsData) as any[], []);

  // Derive dynamic set options based on track
  const setOptions = useMemo(() => {
    return deriveSetOptions(allProblems, activeTrackFilter);
  }, [allProblems, activeTrackFilter]);

  // Validate URL set param against available options; fallback gracefully to 'all'
  const effectiveSetFilter = useMemo(() => {
    if (rawSetParam === 'all') return 'all';
    const exists = setOptions.some((opt) => opt.id === rawSetParam);
    return exists ? rawSetParam : 'all';
  }, [rawSetParam, setOptions]);

  // Keep search params in sync if set param is invalid
  useEffect(() => {
    if (rawSetParam !== 'all' && effectiveSetFilter === 'all') {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('set');
        return next;
      });
    }
  }, [rawSetParam, effectiveSetFilter, setSearchParams]);

  // Set filter change handler
  const handleSetChange = (newSet: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSet === 'all') {
        next.delete('set');
      } else {
        next.set('set', newSet);
      }
      return next;
    });

    try {
      localStorage.setItem('queryforge-practice-set', newSet);
    } catch {
      // Ignore localStorage errors
    }
  };

  // Track filter change handler
  const handleTrackChange = (newTrack: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newTrack === 'all') {
        next.set('track', 'all');
      } else {
        next.set('track', newTrack);
      }
      // If switching tracks, check if active set is present in the new track
      if (effectiveSetFilter !== 'all') {
        const newTrackSets = deriveSetOptions(allProblems, newTrack);
        if (!newTrackSets.some((s) => s.id === effectiveSetFilter)) {
          next.delete('set');
        }
      }
      return next;
    });
  };

  // Reset all filters
  const handleResetAllFilters = () => {
    setSearchQuery('');
    setDifficultyFilter('all');
    setStatusFilter('all');
    setSearchParams({ track: 'all' });
  };

  // Filter problems based on active parameters
  const filteredProblems = useMemo(() => {
    return filterProblems(
      allProblems,
      {
        track: activeTrackFilter,
        set: effectiveSetFilter,
        difficulty: difficultyFilter,
        status: statusFilter,
        searchQuery,
      },
      progressProblems
    );
  }, [allProblems, activeTrackFilter, effectiveSetFilter, difficultyFilter, statusFilter, searchQuery, progressProblems]);

  // Counts for tabs
  const solvedCount = useMemo(() => {
    return allProblems.filter((p) => progressProblems[p.id]?.status === 'solved').length;
  }, [allProblems, progressProblems]);

  const attemptedCount = useMemo(() => {
    return allProblems.filter((p) => progressProblems[p.id]?.status === 'attempted').length;
  }, [allProblems, progressProblems]);

  const activeSetOption = useMemo(() => {
    return setOptions.find((opt) => opt.id === effectiveSetFilter);
  }, [setOptions, effectiveSetFilter]);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)]">
      {/* Title & Track Progress Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border)]">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent)]">
                Problem Arena
              </span>
              <span className="text-[11px] text-[var(--faint)]">•</span>
              <span className="text-[11px] text-[var(--muted)] tabular-nums font-mono">
                {allProblems.length} Graded Challenges
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-[var(--ink)]">
              SQL Practice Catalog
            </h1>
            <p className="text-xs text-[var(--muted)]">
              Verified client-side via SQLite WebAssembly with automated test sets.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-left">
              <span className="text-[11px] text-[var(--muted)] block">Mastery Progress</span>
              <span className="font-mono text-sm font-semibold text-[var(--positive)]">
                {solvedCount} / {allProblems.length} ({Math.round((solvedCount / allProblems.length) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Track Pills Carousel / Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => handleTrackChange('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTrackFilter === 'all'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs font-semibold'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--control)]'
            }`}
          >
            All Tracks ({allProblems.length})
          </button>
          {tracks.filter((t) => t.totalProblems > 0).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleTrackChange(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                activeTrackFilter === t.id
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--control)]'
              }`}
            >
              {t.title} ({t.totalProblems})
            </button>
          ))}
        </div>
      </div>

      {/* Underline Tabs & Toolbar */}
      <div className="space-y-4">
        {/* Status Filter Underline Tabs */}
        <div className="flex items-center gap-6 border-b border-[var(--border)] overflow-x-auto -mb-px">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`pb-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'text-[var(--ink)] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            All Problems ({allProblems.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('unsolved')}
            className={`pb-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'unsolved'
                ? 'text-[var(--ink)] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Unsolved ({allProblems.length - solvedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('attempted')}
            className={`pb-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'attempted'
                ? 'text-[var(--ink)] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Attempted ({attemptedCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('solved')}
            className={`pb-3 text-xs font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              statusFilter === 'solved'
                ? 'text-[var(--ink)] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Solved ({solvedCount})
          </button>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
          {/* Left: Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
            <Input
              type="text"
              placeholder="Search problem title, tag, or #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Right: Set Dropdown & Difficulty Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Set Dropdown Filter */}
            <div className="w-full sm:w-auto">
              <SetDropdown
                options={setOptions}
                value={effectiveSetFilter}
                onChange={handleSetChange}
              />
            </div>

            {/* Difficulty Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-xs text-[var(--muted)] mr-1 hidden sm:inline">Difficulty:</span>
              {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficultyFilter(diff)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize cursor-pointer ${
                    difficultyFilter === diff
                      ? 'bg-[var(--raised)] border border-[var(--control)] text-[var(--ink)] font-semibold'
                      : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Summary & Active Set Badge */}
        <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1 select-none">
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              Showing <strong className="text-[var(--ink)] font-mono">{filteredProblems.length}</strong> of{' '}
              <span className="font-mono">{allProblems.length}</span> challenges
            </span>

            {/* Dismissible Active Set Filter Chip */}
            {effectiveSetFilter !== 'all' && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[11px] text-[var(--accent)] font-medium animate-enter">
                <span>Showing: {activeSetOption?.label || effectiveSetFilter}</span>
                <button
                  type="button"
                  onClick={() => handleSetChange('all')}
                  className="p-0.5 hover:bg-[var(--accent)]/15 rounded-full cursor-pointer transition-colors"
                  title="Clear set filter"
                  aria-label="Clear set filter"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Problem List */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs transition-opacity duration-150">
        {filteredProblems.length === 0 ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-2">
            <Code2 className="h-8 w-8 text-[var(--faint)] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[var(--ink)]">No Problems Match Your Filter</p>
            <p className="text-xs text-[var(--muted)]">Try adjusting your search query, difficulty, set, or track.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAllFilters}
              className="mt-3 text-xs"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {filteredProblems.map((prob) => {
              const pStatus = progressProblems[prob.id]?.status || 'unsolved';
              const cleanTitle = sanitizeTitle(prob.title);

              // Filter out raw set labels ('leetcode-set-1', etc.) from tags
              const cleanTags = (prob.tags || []).filter(
                (tag: string) =>
                  !/(?:leetcode-set|interview-set|company-\d+|bonus-set|^set-\d+)/i.test(tag) &&
                  tag !== prob.moduleId
              );

              return (
                <Link
                  key={prob.id}
                  to={`/practice/${prob.id}`}
                  className="flex items-center justify-between p-4 hover:bg-[var(--raised)]/60 transition-colors group select-none"
                >
                  {/* Left: Number, Title, and Clean Domain Topic Tags */}
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <span className="w-9 h-7 rounded-md bg-[var(--raised)] border border-[var(--border)] text-center text-xs tabular-nums font-mono text-[var(--muted)] shrink-0 flex items-center justify-center font-semibold">
                      {prob.number}
                    </span>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                          {cleanTitle}
                        </span>
                      </div>

                      {/* Clean Domain Topic Tags (No Raw Set Labels) */}
                      {cleanTags.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {cleanTags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--muted)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Difficulty & Status */}
                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    {/* Difficulty Badge */}
                    <Badge variant={prob.difficulty as any} dot>
                      <span className="capitalize">{prob.difficulty}</span>
                    </Badge>

                    {/* Status Pill */}
                    {pStatus === 'solved' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[var(--pill-positive-bg)] border border-[var(--positive)]/30 text-[var(--positive)] rounded-md">
                        <Check className="h-3 w-3" strokeWidth={2.5} />
                        <span>Solved</span>
                      </span>
                    ) : pStatus === 'attempted' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[var(--pill-warning-bg)] border border-[var(--warning)]/30 text-[var(--warning)] rounded-md">
                        <Clock className="h-3 w-3" />
                        <span>Attempted</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-[11px] font-medium bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] rounded-md">
                        Unsolved
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-transform duration-150 ease-out" />
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