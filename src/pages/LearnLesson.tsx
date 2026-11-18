import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  ArrowLeft, 
  ArrowRight, 
  Copy, 
  Check, 
  Play, 
  CheckCircle2, 
  Clock,
  BookOpen,
  ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useProgressStore } from '@/store/useProgressStore';
import { useEditorStore } from '@/store/useEditorStore';
import lessonsData from '@/content/lessons.json';

// Helper to strip decorative emojis from headings for clean typography
function sanitizeHeading(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();
}

/**
 * Editorial Theory Masterclass Reader Component.
 * 
 * Rules:
 * - Fluid reading progress bar at top of viewport.
 * - Sticky Table of Contents with active heading spy.
 * - Clean prose typography with syntax-highlighted code blocks.
 * - Runnable SQL snippets with one-click Playground transfer.
 */
export const LearnLesson: React.FC = () => {
  const { slug } = useParams<{ track?: string; slug?: string }>();
  const navigate = useNavigate();
  const { lessons: progressLessons, markLessonRead } = useProgressStore();
  const { setSql } = useEditorStore();
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');

  const allLessons = Object.values(lessonsData) as any[];
  const currentIndex = allLessons.findIndex((l) => l.slug === slug);
  const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : null;

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Track reading scroll progress & active heading for scroll-spy
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
      }

      if (!currentLesson?.toc) return;
      const headingElements = currentLesson.toc
        .map((h: any) => document.getElementById(h.id))
        .filter(Boolean) as HTMLElement[];

      const scrollPos = window.scrollY + 120;
      for (let i = headingElements.length - 1; i >= 0; i--) {
        if (headingElements[i].offsetTop <= scrollPos) {
          setActiveHeadingId(headingElements[i].id);
          return;
        }
      }
      if (headingElements.length > 0 && activeHeadingId === '') {
        setActiveHeadingId(headingElements[0].id);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentLesson, activeHeadingId]);

  if (!currentLesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] bg-[var(--bg)] text-[var(--ink)]">
        <h2 className="text-2xl font-bold font-display mb-2">Lesson Not Found</h2>
        <p className="text-xs text-[var(--muted)] mb-6">The requested theory guide does not exist in the catalog.</p>
        <Link to="/learn">
          <Button size="sm">Back to Theory Catalog</Button>
        </Link>
      </div>
    );
  }

  const isRead = !!progressLessons[currentLesson.id]?.read;

  const handleCopy = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handlePlayground = (codeText: string) => {
    setSql(codeText);
    navigate('/playground');
  };

  const handleMarkComplete = () => {
    markLessonRead(currentLesson.id, currentLesson.title);
  };

  // Estimate read time
  const wordCount = currentLesson.content.split(/\s+/).length;
  const readTimeMin = Math.max(3, Math.ceil(wordCount / 180));

  return (
    <div className="flex-1 w-full bg-[var(--bg)] text-[var(--ink)]">
      {/* Top Reading Progress Bar (Hardware-Accelerated ScaleX) */}
      <div className="fixed top-14 left-0 right-0 h-[2px] bg-[var(--border)] z-30 pointer-events-none">
        <div
          className="h-full w-full bg-[var(--accent)] origin-left transition-transform duration-75 ease-out will-change-transform"
          style={{ transform: `scaleX(${scrollProgress / 100})` }}
        />
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-8 border-b border-[var(--border)] gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/learn" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Theory Catalog</span>
            </Link>
            <span className="text-[var(--border)]">/</span>
            <span className="text-[var(--ink)] font-semibold">{currentLesson.slug}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] font-mono">
              <Clock className="h-3.5 w-3.5" />
              <span>{readTimeMin} min read</span>
            </div>

            <Button
              variant={isRead ? 'secondary' : 'default'}
              size="sm"
              onClick={handleMarkComplete}
              className="gap-1.5 text-xs font-semibold"
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${isRead ? 'text-[var(--positive)]' : ''}`} />
              <span>{isRead ? 'Completed' : 'Mark Complete'}</span>
            </Button>
          </div>
        </div>

        {/* Article Grid: Left Sidebar TOC + Right Prose */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Article Content (8 cols) */}
          <article className="lg:col-span-8 text-left space-y-6">
            <div className="space-y-3 pb-6 border-b border-[var(--border)]">
              <span className="text-xs font-mono font-semibold text-[var(--accent)] uppercase tracking-wider">
                Module {currentIndex + 1} of {allLessons.length}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-[var(--ink)]">
                {sanitizeHeading(currentLesson.title)}
              </h1>
            </div>

            {/* Markdown Body */}
            <div className="editorial-prose text-left">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Code block with Run in Playground & Copy
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    const codeId = `code-${Math.random().toString(36).substring(2, 9)}`;

                    if (!inline && match) {
                      return (
                        <div className="my-6 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] overflow-hidden shadow-xs">
                          {/* Code Block Header */}
                          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border)] bg-[var(--raised)] text-xs text-[var(--muted)]">
                            <span className="font-mono text-[11px] font-semibold uppercase text-[var(--ink)]">
                              {match[1]}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(codeText, codeId)}
                                className="h-7 px-2 text-xs gap-1"
                              >
                                {copiedCodeId === codeId ? (
                                  <>
                                    <Check className="h-3 w-3 text-[var(--positive)]" />
                                    <span className="text-[var(--positive)]">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>

                              {match[1].toLowerCase() === 'sql' && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handlePlayground(codeText)}
                                  className="h-7 px-2 text-xs gap-1"
                                >
                                  <Play className="h-3 w-3 fill-current text-[var(--accent)]" />
                                  <span>Playground</span>
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Code Content */}
                          <div className="p-4 overflow-x-auto font-mono text-xs text-[var(--ink)] leading-relaxed">
                            <pre>
                              <code>{codeText}</code>
                            </pre>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <code className="px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] font-mono text-xs text-[var(--accent)]" {...props}>
                        {children}
                      </code>
                    );
                  },

                  // Headings with auto ID for TOC scroll-spy
                  h2({ children }: any) {
                    const headingText = String(children);
                    const id = headingText
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    return (
                      <h2 id={id} className="scroll-mt-24">
                        {children}
                      </h2>
                    );
                  },
                  h3({ children }: any) {
                    const headingText = String(children);
                    const id = headingText
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    return (
                      <h3 id={id} className="scroll-mt-24">
                        {children}
                      </h3>
                    );
                  },
                }}
              >
                {currentLesson.content}
              </ReactMarkdown>
            </div>

            {/* Pagination Controls */}
            <div className="pt-10 mt-10 border-t border-[var(--border)] grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevLesson ? (
                <Link
                  to={`/learn/sql-fundamentals/${prevLesson.slug}`}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--control)] transition-colors duration-150 flex flex-col space-y-1 group"
                >
                  <span className="text-[11px] text-[var(--muted)] flex items-center gap-1">
                    <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform duration-150 ease-out" />
                    <span>Previous Lesson</span>
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {sanitizeHeading(prevLesson.title)}
                  </span>
                </Link>
              ) : <div />}

              {nextLesson && (
                <Link
                  to={`/learn/sql-fundamentals/${nextLesson.slug}`}
                  className="p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--control)] transition-colors duration-150 flex flex-col space-y-1 text-right sm:text-right group ml-auto w-full"
                >
                  <span className="text-[11px] text-[var(--muted)] flex items-center justify-end gap-1">
                    <span>Next Lesson</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform duration-150 ease-out" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors">
                    {sanitizeHeading(nextLesson.title)}
                  </span>
                </Link>
              )}
            </div>
          </article>

          {/* Sticky Table of Contents Sidebar (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-6 text-left">
            <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <ListOrdered className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
                  On this page
                </h3>
              </div>

              {currentLesson.toc && currentLesson.toc.length > 0 ? (
                <nav className="space-y-1 text-xs">
                  {currentLesson.toc.map((item: any) => {
                    const isActive = activeHeadingId === item.id;
                    const label = item.text || item.title;
                    return (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block py-1.5 transition-colors border-l-2 pl-3 text-xs leading-relaxed ${
                          isActive
                            ? 'border-[var(--accent)] text-[var(--accent)] font-semibold'
                            : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                        style={{ paddingLeft: item.level === 3 ? '1.5rem' : '0.75rem' }}
                      >
                        {label}
                      </a>
                    );
                  })}
                </nav>
              ) : (
                <p className="text-xs text-[var(--muted)]">Scroll to navigate this module.</p>
              )}
            </div>

            {/* Quick Practice Suggestion */}
            <div className="p-5 rounded-lg border border-[var(--border)] bg-[var(--surface-app)] space-y-3">
              <h4 className="text-xs font-semibold text-[var(--ink)]">Apply in the Arena</h4>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Test the concepts learned in this lesson against authentic LeetCode problems in the practice catalog.
              </p>
              <Link to="/practice">
                <Button size="sm" variant="secondary" className="w-full text-xs">
                  Open Problem Arena
                </Button>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
