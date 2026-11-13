import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Sun, 
  Moon, 
  Menu, 
  X,
  Settings,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { Button } from '@/components/ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: 'Learn', path: '/learn' },
    { label: 'Practice', path: '/practice' },
    { label: 'Playground', path: '/playground' },
    { label: 'Dashboard', path: '/dashboard' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--bg)] transition-colors">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Wordmark & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="text-base font-normal tracking-tight text-[var(--ink)] font-display hover:text-[var(--accent)] transition-colors">
            QueryForge
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative py-4 text-xs font-normal transition-colors ${
                    active
                      ? 'text-[var(--ink)] font-medium after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-[var(--accent)]'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Static Engine Status & Controls */}
        <div className="hidden md:flex items-center gap-4">
          <span className="text-xs text-[var(--muted)] tabular-nums flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[var(--positive)] block" />
            <span>Engine ready</span>
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-8 w-8 text-[var(--muted)] hover:text-[var(--ink)]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link to="/settings" aria-label="Settings">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-[var(--muted)] hover:text-[var(--ink)]"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-8 w-8 text-[var(--muted)]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Open mobile navigation"
            className="h-8 w-8 text-[var(--muted)]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block py-2 text-xs font-normal ${
                isActive(item.path) ? 'text-[var(--accent)] font-semibold' : 'text-[var(--muted)]'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/settings"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-xs text-[var(--muted)]"
          >
            Settings
          </Link>
        </div>
      )}
    </header>
  );
};
