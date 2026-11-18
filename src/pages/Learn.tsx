import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, BookOpen, ArrowRight, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import lessonsData from '@/content/lessons.json';

// Strip decorative emojis from headings for clean typography
function sanitizeHeading(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Cohesive Theory Curriculum Index.
 * 
 * Rules:
 * - Clear editorial hierarchy with reading progress meter.
 * - Underline track tabs with matched filters.
 * - Structured lesson rows with estimated read time and completion indicators.
 */
export const Learn: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrack, setActiveTrack] = useState<string>('all');
  const { lessons: progressLessons } = useProgressStore();

  const tracks = tracksData as any[];
  const allLessonsList = useMemo(() => Object.values(lessonsData) as any[], []);

  // Filter lessons based on active tab and search query
  const filteredLessons = useMemo(() => {
    return allLessonsList.filter((lesson) => {
      if (activeTrack !== 'all' && lesson.trackId !== activeTrack) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = lesson.title.toLowerCase().includes(query);
        const matchesSlug = lesson.slug.toLowerCase().includes(query);
        return matchesTitle || matchesSlug;
      }
      return true;
    });
  }, [allLessonsList, activeTrack, searchQuery]);

  // Read count
  const completedLessonsCount = useMemo(() => {
    return allLessonsList.filter((l) => progressLessons[l.id]?.read).length;
  }, [allLessonsList, progressLessons]);

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)]">
      {/* Editorial Title & Reading Progress Header */}
      <div className="space-y-4 pb-6 border-b border-[var(--border)] text-left">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent)]">
                Theory Curriculum
              </span>
              <span className="text-[11px] text-[var(--faint)]">•</span>
              <span className="text-[11px] text-[var(--muted)] font-mono">
                {allLessonsList.length} Comprehensive Modules
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-[var(--ink)]">
              SQL Engineering & Query Mastery
            </h1>
            <p className="text-xs text-[var(--muted)] max-w-2xl leading-relaxed">
              Exhaustive conceptual references paired with copy-paste runnable SQL.
              From fundamental row filtering to recursive CTE calendar generation and B-Tree indexing plans.
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs text-left shrink-0">
            <span className="text-[11px] text-[var(--muted)] block">Curriculum Read</span>
            <span className="font-mono text-sm font-semibold text-[var(--positive)]">
              {completedLessonsCount} / {allLessonsList.length} ({Math.round((completedLessonsCount / allLessonsList.length) * 100)}%)
            </span>
          </div>
        </div>

        {/* Track Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTrack('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeTrack === 'all'
                ? 'bg-[var(--ink)] text-[var(--bg)] shadow-xs'
                : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--control)]'
            }`}
          >
            All Guides ({allLessonsList.length})
          </button>
          {tracks
            .filter((t) => t.id === 'sql-fundamentals' || t.modules?.some((m: any) => m.lessonIds?.length > 0))
            .map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTrack(t.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeTrack === t.id
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] hover:border-[var(--control)]'
                }`}
              >
                {t.title}
              </button>
            ))}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
          <Input
            type="text"
            placeholder="Search guides by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-9 text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <span className="text-xs text-[var(--muted)]">
          Showing {filteredLessons.length} {filteredLessons.length === 1 ? 'guide' : 'guides'}
        </span>
      </div>

      {/* Lesson List Container */}
      <div className="border border-[var(--border)] rounded-xl bg-[var(--surface)] overflow-hidden shadow-xs">
        {filteredLessons.length === 0 ? (
          <div className="py-20 text-center text-[var(--muted)] space-y-2">
            <BookOpen className="h-8 w-8 text-[var(--faint)] mx-auto mb-2" strokeWidth={1.5} />
            <p className="text-sm font-semibold text-[var(--ink)]">No Theory Guides Found</p>
            <p className="text-xs text-[var(--muted)]">Try clearing your search query or choosing another track.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveTrack('all');
              }}
              className="mt-3 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <ol className="divide-y divide-[var(--border)] list-none p-0 m-0">
            {filteredLessons.map((lesson: any, index: number) => {
              const isRead = progressLessons[lesson.id]?.read;
              const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 500;
              const readTime = Math.max(3, Math.ceil(wordCount / 180));
              const cleanTitle = sanitizeHeading(lesson.title);

              return (
                <li key={lesson.id} className="relative group">
                  <Link
                    to={`/learn/sql-fundamentals/${lesson.slug}`}
                    className="flex items-center justify-between p-4 hover:bg-[var(--raised)]/60 transition-colors"
                  >
                    {/* Left: Position Number & Title */}
                    <div className="flex items-center gap-4 min-w-0 pr-4">
                      <span className="w-8 h-8 rounded-md bg-[var(--raised)] border border-[var(--border)] text-center text-xs tabular-nums font-mono text-[var(--muted)] shrink-0 flex items-center justify-center font-semibold">
                        {index + 1}
                      </span>

                      <div className="min-w-0 space-y-1">
                        <span className="text-sm font-medium text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate block">
                          {cleanTitle}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--muted)]">
                          {lesson.slug}
                        </span>
                      </div>
                    </div>

                    {/* Right: Reading Time & Read Mark */}
                    <div className="flex items-center gap-4 shrink-0 text-xs text-[var(--muted)]">
                      <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <Clock className="h-3.5 w-3.5 text-[var(--faint)]" />
                        <span>{readTime} min read</span>
                      </span>

                      {isRead ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-[var(--pill-positive-bg)] border border-[var(--positive)]/30 text-[var(--positive)] rounded-md">
                          <Check className="h-3 w-3" strokeWidth={2.5} />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[11px] font-medium bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] rounded-md">
                          Unread
                        </span>
                      )}

                      <ArrowRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--ink)] group-hover:translate-x-0.5 transition-transform duration-150 ease-out" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
};
