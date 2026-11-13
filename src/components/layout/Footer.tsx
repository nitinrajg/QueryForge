import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Data Terminal Page Footer.
 * 
 * Rules:
 * - Contact as headline: GitHub repo address at 8-9vw as the display line.
 * - Small meta row with credits, year, and archival image attribution.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg)] text-[var(--ink)] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Contact as Headline (Display line 8-9vw) */}
        <div className="space-y-4">
          <p className="text-xs text-[var(--muted)]">Source repository and course notes:</p>
          <a
            href="https://github.com/vivekpandey76/Mysql-course"
            target="_blank"
            rel="noopener noreferrer"
            className="block font-display text-[8vw] sm:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-[-0.04em] text-[var(--ink)] hover:text-[var(--accent)] transition-colors break-all"
          >
            github.com/vivekpandey76/Mysql-course
          </a>
        </div>

        {/* Small Meta Row */}
        <div className="pt-8 border-t border-[var(--rule)] flex flex-col md:flex-row md:items-center justify-between gap-6 text-xs text-[var(--muted)]">
          <div className="space-y-1">
            <p>QueryForge — In-browser SQL practice studio. Client-side WebAssembly, zero servers.</p>
            <p className="text-[11px]">
              Archival photographic references: IBM 80-column punched card, public library card index catalog, and 1777 double-entry bookkeeping ledger (Wikimedia Public Domain).
            </p>
          </div>

          <div className="flex items-center gap-6 text-xs shrink-0">
            <Link to="/learn" className="hover:text-[var(--ink)] transition-colors">
              Theory
            </Link>
            <Link to="/practice" className="hover:text-[var(--ink)] transition-colors">
              Problems
            </Link>
            <Link to="/playground" className="hover:text-[var(--ink)] transition-colors">
              Playground
            </Link>
            <Link to="/dashboard" className="hover:text-[var(--ink)] transition-colors">
              Dashboard
            </Link>
            <span className="tabular-nums">2026</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
