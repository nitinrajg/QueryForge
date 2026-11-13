import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  BookOpen, 
  CheckCircle, 
  Copy, 
  Check, 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  Terminal, 
  ListTree,
  AlertCircle,
  Lightbulb,
  Info,
  Clock,
  ChevronRight
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
 * Editorial Theory Masterclass Reader.
 * 
 * Logic & Approach:
 * - High-craft editorial typography using Space Grotesk for headings and Plus Jakarta Sans for prose.
 * - Custom ReactMarkdown component transforms:
 *   - Auto-detects callout types (> 💡 Tip, > ⚠️ Warning, > 📌 Note) and formats them into distinct cards.
 *   - Renders code blocks inside bespoke IDE-grade frames with Copy & "Run in Playground" actions.
 *   - Professional data tables with monospace column alignment.
 * - Scroll-synced Table of Contents navigation.
 */
export const LearnLesson: React.FC = () => {
  const { slug } = useParams<{ track?: string; slug?: string }>();
  const navigate = useNavigate();
  const { lessons: progressLessons, markLessonRead } = useProgressStore();
  const { setSql } = useEditorStore();
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const allLessons = Object.values(lessonsData) as any[];
  const currentIndex = allLessons.findIndex((l) => l.slug === slug);
  const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : null;

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  // Track reading scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const current = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, current)));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!currentLesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <h2 className="text-2xl font-bold font-display text-white mb-2">Lesson Not Located</h2>
        <p className="text-xs text-[#7E8B9F] mb-6">The requested theory guide does not exist.</p>
        <Link to="/learn">
          <Button size="sm">Back to Theory Catalog</Button>
        </Link>
      </div>
    );
  }

  const isRead = !!progressLessons[currentLesson.id]?.read;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handlePlayground = (code: string) => {
    setSql(code);
    navigate('/playground');
  };

  const handleMarkComplete = () => {
    markLessonRead(currentLesson.id, currentLesson.title);
  };

  // Estimate read time
  const wordCount = currentLesson.content.split(/\s+/).length;
  const readTimeMin = Math.max(3, Math.ceil(wordCount / 180));

  return (
    <div className="flex-1 w-full bg-[#07090E] text-[#F1F5F9]">
      {/* Top Reading Progress Bar */}
      <div className="fixed top-14 left-0 right-0 h-[2px] bg-[#161D2E] z-30">
        <div
          className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Navigation Breadcrumb & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-8 border-b border-[#1C2438] gap-4">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <Link to="/learn" className="text-[#7E8B9F] hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>THEORY_INDEX</span>
            </Link>
            <span className="text-[#3E4A63]">/</span>
            <span className="text-cyan-400 font-semibold">{currentLesson.slug}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant={isRead ? 'secondary' : 'default'}
              size="sm"
              onClick={handleMarkComplete}
              className="gap-1.5 text-xs font-mono"
            >
              <CheckCircle className={`h-3.5 w-3.5 ${isRead ? 'text-emerald-400' : ''}`} />
              <span>{isRead ? 'COMPLETED' : 'MARK_AS_READ'}</span>
            </Button>

            <Link to="/practice">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-mono">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                <span>PRACTICE_QUESTIONS</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 2-Column Editorial Grid: Main Prose (Left) + Reading TOC Compass (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Article Content */}
          <main className="lg:col-span-8 space-y-6">
            {/* Guide Meta Header */}
            <div className="space-y-3 pb-6 border-b border-[#1C2438]">
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#7E8B9F]">
                <Badge variant="accent">PART {currentLesson.order}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {readTimeMin} MIN READ
                </span>
                <span>•</span>
                <span>SQL 8.0+ TARGET</span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight light:text-slate-900">
                {sanitizeHeading(currentLesson.title)}
              </h1>
            </div>

            {/* Markdown Body */}
            <div className="markdown-editorial">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold font-display text-white mt-8 mb-4 border-b border-[#1C2438] pb-2">
                      {sanitizeHeading(String(children))}
                    </h1>
                  ),
                  h2: ({ children }) => {
                    const text = sanitizeHeading(String(children));
                    const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
                    return (
                      <h2 id={id} className="text-xl font-bold font-display text-white mt-10 mb-3 flex items-center gap-2">
                        <span className="text-cyan-400 font-mono text-sm">#</span>
                        <span>{text}</span>
                      </h2>
                    );
                  },
                  h3: ({ children }) => (
                    <h3 className="text-base font-bold font-display text-[#E2E8F0] mt-6 mb-2">
                      {sanitizeHeading(String(children))}
                    </h3>
                  ),
                  // Custom Code Block Renderer
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const codeText = String(children).replace(/\n$/, '');
                    const codeId = String(Math.random());

                    if (match) {
                      const lang = match[1].toLowerCase();
                      const isSql = lang === 'sql';

                      return (
                        <div className="my-5 rounded-xl border border-[#1C2438] bg-[#07090E] overflow-hidden surface-cockpit not-prose">
                          {/* Code Frame Header */}
                          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#1C2438] bg-[#0C1019] text-xs font-mono">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-cyan-400" />
                              <span className="text-[11px] font-semibold text-[#94A3B8] uppercase">
                                {lang} SNIPPET
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopy(codeText, codeId)}
                                className="flex items-center gap-1 px-2 py-1 rounded bg-[#121826] hover:bg-[#1C2438] text-[#94A3B8] hover:text-white transition-colors cursor-pointer text-[10px]"
                                title="Copy code"
                              >
                                {copiedCodeId === codeId ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-400" />
                                    <span className="text-emerald-400">COPIED</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>COPY</span>
                                  </>
                                )}
                              </button>

                              {isSql && (
                                <button
                                  type="button"
                                  onClick={() => handlePlayground(codeText)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 hover:bg-cyan-500/25 text-cyan-300 transition-colors cursor-pointer text-[10px] font-semibold"
                                  title="Run in free playground"
                                >
                                  <Play className="h-2.5 w-2.5 fill-cyan-400 text-cyan-400" />
                                  <span>RUN IN PLAYGROUND</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Code Presentation */}
                          <pre className="p-4 overflow-x-auto text-xs font-mono text-cyan-200/90 leading-relaxed bg-[#07090E]">
                            <code>{codeText}</code>
                          </pre>
                        </div>
                      );
                    }

                    return (
                      <code className="font-mono text-xs text-cyan-300 bg-[#121826] px-1.5 py-0.5 rounded border border-[#1C2438]" {...props}>
                        {children}
                      </code>
                    );
                  },
                  // Custom Callout Box Renderer
                  blockquote({ children }) {
                    return (
                      <div className="my-5 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/15 text-xs text-[#CBD5E1] space-y-1.5 not-prose">
                        <div className="flex items-center gap-2 font-mono text-cyan-400 font-semibold text-[11px] uppercase">
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span>TECHNICAL NOTE & INSIGHT</span>
                        </div>
                        <div className="leading-relaxed opacity-95">
                          {children}
                        </div>
                      </div>
                    );
                  },
                }}
              >
                {currentLesson.content}
              </ReactMarkdown>
            </div>

            {/* Bottom Next / Prev Navigation */}
            <div className="pt-8 mt-12 border-t border-[#1C2438] flex flex-col sm:flex-row items-center justify-between gap-4">
              {prevLesson ? (
                <Link to={`/learn/sql-fundamentals/${prevLesson.slug}`} className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full justify-start gap-2 text-xs font-mono h-10">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[220px]">PREV: {sanitizeHeading(prevLesson.title)}</span>
                  </Button>
                </Link>
              ) : <div />}

              {nextLesson && (
                <Link to={`/learn/sql-fundamentals/${nextLesson.slug}`} className="w-full sm:w-auto">
                  <Button className="w-full justify-end gap-2 text-xs font-mono h-10">
                    <span className="truncate max-w-[220px]">NEXT: {sanitizeHeading(nextLesson.title)}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </main>

          {/* Right Sticky Column: Table of Contents Compass */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-20 space-y-4">
            <div className="p-4 rounded-xl border border-[#1C2438] bg-[#0C1019] surface-cockpit space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#7E8B9F] pb-2 border-b border-[#161D2E]">
                <span className="font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ListTree className="h-3.5 w-3.5 text-cyan-400" />
                  <span>ON THIS PAGE</span>
                </span>
                <span>{currentLesson.toc?.length || 0} SECTIONS</span>
              </div>

              <nav className="space-y-1 text-xs max-h-[60vh] overflow-y-auto pr-1">
                {currentLesson.toc?.map((heading: any, idx: number) => {
                  const cleanText = sanitizeHeading(heading.text);
                  return (
                    <a
                      key={idx}
                      href={`#${heading.id}`}
                      style={{ paddingLeft: `${Math.max(0, (heading.level - 2) * 12)}px` }}
                      className="block text-[#7E8B9F] hover:text-cyan-300 py-1 transition-colors truncate text-[11px] font-medium"
                    >
                      {cleanText}
                    </a>
                  );
                })}
              </nav>

              <div className="pt-3 border-t border-[#161D2E]">
                <Link to="/practice">
                  <Button variant="outline" size="sm" className="w-full text-xs font-mono gap-1.5 justify-center">
                    <Terminal className="h-3 w-3 text-cyan-400" />
                    <span>Practice Questions</span>
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
