import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Search, ChevronRight, Terminal, Clock, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useProgressStore } from '@/store/useProgressStore';
import tracksData from '@/content/tracks.json';
import lessonsData from '@/content/lessons.json';

// Helper to strip decorative emojis from headings for clean typography
function sanitizeHeading(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Theory Curriculum Index.
 * 
 * Logic & Approach:
 * - High-craft curriculum directory organizing 14 complete masterclass guides.
 * - Interactive topic search and quick-filter pills.
 * - Clear reading progress indicators and estimated read times.
 */
export const Learn: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { lessons: progressLessons } = useProgressStore();

  const fundamentalsTrack = (tracksData as any[]).find((t) => t.id === 'sql-fundamentals');
  const allLessonsList = Object.values(lessonsData) as any[];

  // Filter lessons based on search query
  const filteredLessons = allLessonsList.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent">THEORY MASTERCLASSES</Badge>
          <span className="text-xs text-[#7E8B9F] font-mono">14 COMPREHENSIVE GUIDES</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight light:text-slate-900">
              SQL Engineering & Query Mastery
            </h1>
            <p className="text-sm text-[#94A3B8] leading-relaxed">
              Exhaustive conceptual references paired with copy-paste runnable SQL.
              From fundamental row filtering to recursive CTE calendar generation and B-Tree indexing plans.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-[#7E8B9F]" />
            <Input
              type="text"
              placeholder="Search theory guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-xs font-mono"
            />
          </div>
        </div>
      </div>

      {/* Grid of Theory Guides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(searchQuery ? filteredLessons : allLessonsList).map((lesson: any, index: number) => {
          const isRead = progressLessons[lesson.id]?.read;
          const wordCount = lesson.content ? lesson.content.split(/\s+/).length : 500;
          const readTime = Math.max(3, Math.ceil(wordCount / 180));
          const cleanTitle = sanitizeHeading(lesson.title);

          return (
            <Link
              key={lesson.id}
              to={`/learn/sql-fundamentals/${lesson.slug}`}
              className="block group"
            >
              <div className="h-full rounded-xl border border-[#1C2438] bg-[#0C1019] p-5 flex flex-col justify-between hover:border-cyan-500/50 hover:bg-[#101622] transition-all surface-cockpit">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold">
                      PART {String(lesson.order).padStart(2, '0')}
                    </span>
                    {isRead ? (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        COMPLETED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-[#7E8B9F]">
                        <Clock className="h-3 w-3" />
                        {readTime} MIN
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold font-display text-white group-hover:text-cyan-300 transition-colors light:text-slate-900 leading-snug">
                    {cleanTitle}
                  </h3>

                  <p className="text-xs text-[#7E8B9F] font-mono leading-relaxed truncate">
                    Topic: {lesson.slug}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#161D2E] flex items-center justify-between text-xs font-mono text-[#7E8B9F]">
                  <span className="group-hover:text-[#F1F5F9] transition-colors">READ GUIDE</span>
                  <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 group-hover:text-cyan-400 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
