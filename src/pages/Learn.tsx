import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, CheckCircle2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
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
 * Theory Curriculum Index — Data Terminal List.
 * 
 * Logic & Approach:
 * - List pattern: editorial title, underline track tabs with 1px accent indicator.
 * - Search bar 280px wide with real-time substring filtering on lesson titles and slugs.
 * - Rows structured at 52px pitch with natural ordered list numbering (<ol>).
 * - Exact reading time in words ("12 min read") and discrete completion mark.
 * - Strictly adhering to Data Terminal tokens: --bg, --surface, --ink, --muted, --accent (#ff4a1f).
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

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)]">
      {/* Editorial Title Row */}
      <div className="space-y-2 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)]">
            Reference Curriculum
          </span>
          <span className="text-[11px] text-[var(--muted)]">•</span>
          <span className="text-[11px] text-[var(--muted)] tabular-nums">
            {allLessonsList.length} Lessons Total
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal font-display tracking-tight text-[var(--ink)] leading-tight">
          SQL Engineering and Query Mastery
        </h1>
        <p className="text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
          Exhaustive conceptual references paired with copy-paste runnable SQL.
          From fundamental row filtering to recursive CTE calendar generation and B-Tree indexing plans.
        </p>
      </div>

      {/* Underline Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)]">
        {/* Underline Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto -mb-px">
          <button
            type="button"
            onClick={() => setActiveTrack('all')}
            className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
              activeTrack === 'all'
                ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            All guides ({allLessonsList.length})
          </button>
          {tracks
            .filter((t) => t.id === 'sql-fundamentals' || t.modules.some((m: any) => m.lessonIds.length > 0))
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTrack(t.id)}
                className={`pb-3 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                  activeTrack === t.id
                    ? 'text-[var(--ink)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {t.title}
              </button>
            ))}
        </div>

        {/* Search input (280px wide) */}
        <div className="relative w-full sm:w-[280px] pb-3 sm:pb-2">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--muted)]" />
          <Input
            type="text"
            placeholder="Search guides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs bg-[var(--surface)] border-[var(--border)] focus:border-[var(--accent)] rounded-none"
          />
        </div>
      </div>

      {/* List Pattern with Natural Ordered List */}
      {filteredLessons.length === 0 ? (
        <div className="py-16 text-center text-[var(--muted)]">
          <p className="text-sm">No theory guides matched your query.</p>
        </div>
      ) : (
        <ol className="divide-y divide-[var(--rule)] list-none p-0 m-0">
          {filteredLessons.map((lesson: any, index: number) => {
            const isRead = progressLessons[lesson.id]?.read;
            const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 500;
            const readTime = Math.max(3, Math.ceil(wordCount / 180));
            const cleanTitle = sanitizeHeading(lesson.title);

            return (
              <li key={lesson.id} className="relative group">
                <Link
                  to={`/learn/sql-fundamentals/${lesson.slug}`}
                  className="flex items-center justify-between min-h-[52px] py-3.5 px-3 hover:bg-[var(--surface)] transition-colors"
                >
                  {/* Left: Natural Position Number & Title */}
                  <div className="flex items-center gap-4 min-w-0 pr-4">
                    <span className="w-6 text-right text-xs font-normal tabular-nums text-[var(--muted)] shrink-0">
                      {index + 1}.
                    </span>

                    <span className="text-sm font-medium text-[var(--ink)] group-hover:text-white transition-colors truncate">
                      {cleanTitle}
                    </span>
                  </div>

                  {/* Right: Reading Time in Words & Read Mark */}
                  <div className="flex items-center gap-4 shrink-0 text-xs text-[var(--muted)]">
                    <span className="hidden sm:inline-flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{readTime} min read</span>
                    </span>

                    {isRead ? (
                      <span className="inline-flex items-center gap-1.5 text-[var(--positive)] font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Read</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--muted)] opacity-60">
                        Unread
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
