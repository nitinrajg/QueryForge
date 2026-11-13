import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Heart, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-[#222C55] bg-[#0B1020] text-[#8B93B7] py-12 transition-colors light:bg-slate-50 light:border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Database className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-white light:text-slate-900">
                Query<span className="text-indigo-400">Forge</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#8B93B7]">
              Free, 100% client-side SQL & data practice platform. No accounts, no paywalls, zero telemetry.
            </p>
          </div>

          {/* Learn & Practice */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white light:text-slate-800">
              Platform
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <Link to="/learn" className="hover:text-white transition-colors">
                  Theory (Learn)
                </Link>
              </li>
              <li>
                <Link to="/practice" className="hover:text-white transition-colors">
                  Problems (Practice)
                </Link>
              </li>
              <li>
                <Link to="/playground" className="hover:text-white transition-colors">
                  SQL Playground
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Progress Tracker
                </Link>
              </li>
            </ul>
          </div>

          {/* Engines */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white light:text-slate-800">
              Engines
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                <span>SQLite (WASM in-browser)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                <span>MySQL (Compatibility mode)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
                <span>PostgreSQL (PGlite)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                <span>Python & pandas (Pyodide)</span>
              </li>
            </ul>
          </div>

          {/* Source & Credits */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white light:text-slate-800">
              Open Source
            </h4>
            <p className="text-xs leading-relaxed">
              Curated from Vivek Pandey's MySQL course and LeetCode Top SQL 50 study plans.
            </p>
            <div className="pt-1">
              <a
                href="https://github.com/vivekpandey76/Mysql-course"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#222C55]/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} QueryForge. MIT Licensed.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" /> for SQL learners worldwide.
          </p>
        </div>
      </div>
    </footer>
  );
};

