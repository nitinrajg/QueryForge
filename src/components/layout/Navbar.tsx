import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Database, 
  BookOpen, 
  Terminal, 
  LayoutDashboard, 
  Play, 
  Sun, 
  Moon, 
  Menu, 
  X,
  Settings,
  Cpu
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Practice', path: '/practice', icon: Terminal },
    { label: 'Playground', path: '/playground', icon: Play },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1C2438] bg-[#07090E]/90 backdrop-blur-md transition-colors light:bg-white/95 light:border-slate-200">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity with Technical Stance */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0C1019] border border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)] group-hover:border-cyan-400 group-hover:scale-105 transition-all">
              <Database className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white font-display light:text-slate-900">
                  Query<span className="text-cyan-400">Forge</span>
                </span>
                <span className="hidden sm:inline-block text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border border-[#1C2438] bg-[#0C1019] text-[#7E8B9F]">
                  v1.0
                </span>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Pills */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-[#1C2438]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-[#121826] text-cyan-300 border border-[#1C2438] shadow-sm light:bg-slate-100 light:text-cyan-700 light:border-slate-300'
                      : 'text-[#7E8B9F] hover:text-[#F1F5F9] hover:bg-[#0C1019] light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-cyan-400' : 'text-[#7E8B9F]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Engine Status Pill & Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Real-time WASM status ticker */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#1C2438] bg-[#0C1019] text-[11px] font-mono text-[#7E8B9F]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[#94A3B8]">WASM: ACTIVE</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-8 w-8 text-[#7E8B9F] hover:text-white"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </Button>

          <Link to="/settings">
            <Button variant="ghost" size="icon" aria-label="Settings" className="h-8 w-8 text-[#7E8B9F] hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <a
            href="https://github.com/vivekpandey76/Mysql-course"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-mono">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </Button>
          </a>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1.5">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-8 w-8">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1C2438] bg-[#07090E] px-4 py-3 space-y-1.5 light:bg-white light:border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold ${
                  active ? 'bg-[#121826] text-cyan-300' : 'text-[#7E8B9F]'
                }`}
              >
                <Icon className="h-4 w-4 text-cyan-400" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-[#1C2438] mt-2 flex items-center justify-between text-xs text-[#7E8B9F]">
            <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-1.5 p-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>
            <div className="flex items-center gap-1.5 font-mono text-emerald-400 text-[11px] p-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>WASM Active</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
