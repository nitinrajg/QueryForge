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
  Clock 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
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
 * Editorial Theory Masterclass Reader — Data Terminal Style.
 * 
 * Logic & Approach:
 * - 2px flat safety-orange reading progress indicator at viewport top.
 * - Left or sticky Table of Contents with active 1px accent line indicator.
 * - High-contrast typography: Gambarino display titles, General Sans prose.
 * - Callouts strictly starting with bold labels ("Tip", "Warning", "Note") without emojis.
 * - Runnable SQL snippets with instant Playground transfer and clipboard copy.
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
        <h2 className="text-2xl font-normal font-display mb-2">Lesson Not Located</h2>
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
      {/* Top Reading Progress Bar (2px flat accent fill, zero gradient) */}
      <div className="fixed top-14 left-0 right-0 h-[2px] bg-[var(--border)] z-30 pointer-events-none">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-8 border-b border-[var(--border)] gap-4">
          <div className="flex items-center gap-2 text-xs">
            <Link to="/learn" className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Theory Index</span>
            </Link>
            <span className="text-[var(--muted)]">/</span>
            <span className="text-[var(--ink)] font-medium">{currentLesson.slug}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant={isRead ? 'secondary' : 'default'}
              size="sm"
              onClick={handleMarkComplete}
              className="gap-1.5 text-xs rounded-none"
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${isRead ? 'text-[var(--positive)]' : ''}`} />
              <span>{isRead ? 'Completed' : 'Mark as read'}</span>
            </Button>

            <Link to="/practice">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs rounded-none">
                <span>Practice problems</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 2-Column Editorial Grid: Main Prose (Left) + Reading TOC Compass (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Article Content */}
          <main className="lg:col-span-8 space-y-6">
            {/* Guide Meta Header */}
            <div className="space-y-3 pb-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3 text-xs text-[var(--muted)]">
                <span className="text-[var(--ink)] font-medium">Lesson {currentLesson.order}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{readTimeMin} min read</span>
                </span>
                <span>•</span>
                <span>MySQL 8.0 Reference</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-normal font-display text-[var(--ink)] tracking-tight leading-tight">
                {sanitizeHeading(currentLesson.title)}
              </h1>
            </div>

            {/* Markdown Body */}
            <div className="editorial-prose text-sm text-[var(--ink)] leading-relaxed space-y-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-normal font-display text-[var(--ink)] mt-8 mb-4 border-b border-[var(--border)] pb-2">
                      {sanitizeHeading(String(children))}
                    </h1>
                  ),
                  h2: ({ children }) => {
                    const text = sanitizeHeading(String(children));
                    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    return (
                      <h2 id={id} className="text-xl font-normal font-display text-[var(--ink)] mt-10 mb-3 pt-2">
                        {text}
                      </h2>
                    );
                  },
                  h3: ({ children }) => (
                    <h3 className="text-base font-medium text-[var(--ink)] mt-6 mb-2">
                      {sanitizeHeading(String(children))}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="my-3 text-sm leading-relaxed text-[var(--ink)] opacity-90">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-5 my-3 space-y-1.5 text-sm text-[var(--ink)]">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-5 my-3 space-y-1.5 text-sm text-[var(--ink)]">
                      {children}
                    </ol>
                  ),
                  // Code Block Renderer
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    const codeId = String(Math.random());

                    if (match) {
                      const lang = match[1].toLowerCase();
                      const isSql = lang === 'sql';

                      return (
                        <div className="my-6 border border-[var(--border)] bg-[var(--surface-app)] not-prose">
                          {/* Code Frame Header */}
                          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--border)] bg-[var(--ground)] text-xs text-[var(--muted)]">
                            <span className="text-[11px] font-mono uppercase tracking-wider">
                              {lang} snippet
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(codeText, codeId)}
                                className="flex items-center gap-1 px-2 py-0.5 border border-[var(--border)] bg-[var(--surface-app)] hover:bg-[var(--raised)] text-[var(--ink)] transition-colors cursor-pointer text-[10px]"
                                title="Copy code"
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
                              </button>

                              {isSql && (
                                <button
                                  type="button"
                                  onClick={() => handlePlayground(codeText)}
                                  className="flex items-center gap-1 px-2 py-0.5 bg-[var(--accent)] text-[var(--accent-ink)] font-semibold transition-transform active:scale-[0.98] cursor-pointer text-[10px]"
                                  title="Run in free playground"
                                >
                                  <Play className="h-2.5 w-2.5 fill-current" />
                                  <span>Run in playground</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Code Presentation */}
                          <pre className="p-4 overflow-x-auto text-xs font-mono text-[var(--ink)] leading-relaxed bg-[var(--surface-app)]">
                            <code>{codeText}</code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code className="font-mono text-xs text-[var(--ink)] bg-[var(--surface)] px-1.5 py-0.5 border border-[var(--border)]" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Tone-stepped blockquote with bold label
                  blockquote({ children }) {
                    return (
                      <blockquote className="my-5 p-4 border-l-2 border-[var(--accent)] bg-[var(--surface)] text-xs text-[var(--ink)] space-y-1.5 not-prose">
                        <div className="text-[11px] font-semibold text-[var(--ink)] uppercase tracking-wider">
                          Technical note
                        </div>
                        <div className="leading-relaxed opacity-90">
                          {children}
                        </div>
                      </blockquote>
                    );
                  },
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-6 border border-[var(--border)]">
                      <table className="w-full text-xs text-left border-collapse">
                        {children}
                      </table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)]">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-[var(--rule)] px-3 py-2 text-xs text-[var(--ink)] font-mono">
                      {children}
                    </td>
                  ),
                }}
              >
                {currentLesson.content}
              </ReactMarkdown>
            </div>

            {/* Bottom Next / Prev Navigation */}
            <div className="pt-8 mt-12 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevLesson ? (
                <Link to={`/learn/sql-fundamentals/${prevLesson.slug}`} className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full justify-start gap-2 text-xs rounded-none h-10">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[220px]">Prev: {sanitizeHeading(prevLesson.title)}</span>
                  </Button>
                </Link>
              ) : <div />}

              {nextLesson && (
                <Link to={`/learn/sql-fundamentals/${nextLesson.slug}`} className="w-full sm:w-auto">
                  <Button className="w-full justify-end gap-2 text-xs rounded-none h-10">
                    <span className="truncate max-w-[220px]">Next: {sanitizeHeading(nextLesson.title)}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </main>

          {/* Right Sticky Column: Table of Contents Compass with 1px accent indicator */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
            <div className="p-4 border border-[var(--border)] bg-[var(--surface)] space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--muted)] pb-2 border-b border-[var(--border)]">
                <span className="font-semibold text-[var(--ink)] uppercase tracking-wider text-[11px]">
                  On this page
                </span>
                <span className="tabular-nums">{currentLesson.toc?.length || 0} sections</span>
              </div>

              <nav className="space-y-1 text-xs max-h-[60vh] overflow-y-auto pr-1">
                {currentLesson.toc?.map((heading: any, idx: number) => {
                  const cleanText = sanitizeHeading(heading.text);
                  const isActive = activeHeadingId === heading.id;

                  return (
                    <a
                      key={idx}
                      href={`#${heading.id}`}
                      style={{ paddingLeft: `${Math.max(8, (heading.level - 2) * 12 + 8)}px` }}
                      className={`block py-1.5 transition-colors truncate text-[11px] relative cursor-pointer ${
                        isActive
                          ? 'text-[var(--ink)] font-semibold after:absolute after:left-0 after:top-1.5 after:bottom-1.5 after:w-[2px] after:bg-[var(--accent)]'
                          : 'text-[var(--muted)] hover:text-[var(--ink)]'
                      }`}
                    >
                      {cleanText}
                    </a>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[var(--border)]">
                <Link to="/practice">
                  <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 justify-center rounded-none">
                    <span>Practice Problems</span>
                  </Button>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
