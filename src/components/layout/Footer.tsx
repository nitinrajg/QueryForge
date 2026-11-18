import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Shield, Cpu, ArrowUpRight } from 'lucide-react';

/**
 * Cohesive Architectural Footer Component.
 * 
 * Rules:
 * - Proper product information hierarchy with structured navigation columns.
 * - Legible typography, eliminating disproportionate giant URL banners.
 * - Transparent privacy & open source attributions.
 */
export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] pt-14 pb-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 text-left">
          {/* Brand & Mission Statement (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 text-[var(--ink)]">
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white shadow-xs">
                <Database className="w-4 h-4" />
              </div>
              <span className="text-base font-bold tracking-tight text-[var(--ink)]">
                QueryForge
              </span>
            </Link>

            <p className="text-xs text-[var(--muted)] leading-relaxed max-w-sm">
              The high-performance client-side SQL laboratory. Real SQLite, MySQL, and PostgreSQL compatibility engines running entirely inside WebAssembly in your browser.
            </p>

            <div className="flex items-center gap-3 pt-1 text-xs text-[var(--muted)]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--raised)] border border-[var(--border)] font-mono text-[11px]">
                <Cpu className="h-3 w-3 text-[var(--accent)]" />
                Zero Backend Latency
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--raised)] border border-[var(--border)] font-mono text-[11px]">
                <Shield className="h-3 w-3 text-[var(--positive)]" />
                100% Client-Side Privacy
              </span>
            </div>
          </div>

          {/* Navigation Links (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[var(--ink)]">Platform</h4>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>
                <Link to="/learn" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                  <span>Theory Guides</span>
                </Link>
              </li>
              <li>
                <Link to="/practice" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                  <span>111 Challenges</span>
                </Link>
              </li>
              <li>
                <Link to="/playground" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                  <span>SQL Playground</span>
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                  <span>Progress Ledger</span>
                </Link>
              </li>
              <li>
                <Link to="/settings" className="hover:text-[var(--accent)] transition-colors flex items-center gap-1">
                  <span>Settings & Export</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Tracks & Content (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[var(--ink)]">Curriculum</h4>
            <ul className="space-y-2 text-xs text-[var(--muted)]">
              <li>
                <Link to="/practice?track=leetcode-sql-50" className="hover:text-[var(--accent)] transition-colors">
                  LeetCode Top 50
                </Link>
              </li>
              <li>
                <Link to="/practice?track=advanced-sql" className="hover:text-[var(--accent)] transition-colors">
                  Window Functions
                </Link>
              </li>
              <li>
                <Link to="/practice?track=interview-prep" className="hover:text-[var(--accent)] transition-colors">
                  Accenture & TCS
                </Link>
              </li>
              <li>
                <Link to="/learn" className="hover:text-[var(--accent)] transition-colors">
                  Recursive CTEs
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source & Attribution (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-semibold tracking-wider uppercase text-[var(--ink)]">Open Source</h4>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Curriculum notes and dataset seeds adapted from open MySQL references and community benchmarks.
            </p>
            <a
              href="https://github.com/vivekpandey76/Mysql-course"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-medium text-[var(--ink)] hover:text-[var(--accent)] transition-colors pt-1"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>vivekpandey76/Mysql-course</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--muted)]">
          <p>© {new Date().getFullYear()} QueryForge. Built with WebAssembly, CodeMirror 6, and SQLite.</p>
          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono text-[11px] text-[var(--faint)]">MIT Licensed</span>
            <span>•</span>
            <span className="font-mono text-[11px] text-[var(--positive)]">IndexedDB Local Persistence</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
