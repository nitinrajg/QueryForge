import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { 
  Sun, 
  Moon, 
  Menu, 
  X,
  Settings,
  BookOpen,
  Code2,
  Terminal,
  LayoutDashboard,
  Cpu,
  LogIn,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { AuthModal } from '@/components/auth/AuthModal';
import { SyncStatusIndicator } from '@/components/auth/SyncStatusIndicator';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signin' | 'signup'>('signin');

  const navItems = [
    { label: 'Learn', path: '/learn', icon: BookOpen },
    { label: 'Practice', path: '/practice', icon: Code2, badge: '111' },
    { label: 'Playground', path: '/playground', icon: Terminal },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const openAuth = (tab: 'signin' | 'signup') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  const userDisplayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitials = userDisplayName.slice(0, 2).toUpperCase();

  return (
    <>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Branded Wordmark & Nav Links */}
          <div className="flex items-center gap-8">
            <Link 
              to="/" 
              className="flex items-center gap-2.5 text-[var(--ink)] hover:text-[var(--accent)] transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-[var(--accent-ink)] shadow-sm shadow-[var(--accent)]/20 group-hover:scale-105 transition-transform">
                <svg 
                  className="w-4 h-4 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                  <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                </svg>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-[var(--ink)]">
                  QueryForge
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)]">
                  v1.0
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[var(--raised)] text-[var(--ink)] font-semibold shadow-xs'
                        : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]/60'
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${active ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Engine Telemetry & Controls & Auth */}
          <div className="hidden md:flex items-center gap-3">
            {/* Sync Status Badge */}
            <SyncStatusIndicator />

            {/* Engine Status Pill */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-[var(--raised)] border border-[var(--border)] text-[11px] text-[var(--muted)] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--positive)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--positive)]"></span>
              </span>
              <span className="flex items-center gap-1 font-sans">
                <Cpu className="h-3 w-3 text-[var(--muted)]" />
                <span>SQLite WASM</span>
              </span>
            </div>

            <div className="h-4 w-px bg-[var(--border)]" />

            {/* Theme Switcher */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-8 w-8 text-[var(--muted)] hover:text-[var(--ink)] rounded-md cursor-pointer"
              title={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to graphite dark theme'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--warning)]" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Settings */}
            <Link to="/settings" aria-label="Settings">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[var(--muted)] hover:text-[var(--ink)] rounded-md cursor-pointer"
                title="Preferences & Storage"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            {/* User Profile or Sign In / Sign Up */}
            {user ? (
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-[var(--border)] hover:border-[var(--muted)] bg-[var(--raised)] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    aria-label="User menu"
                  >
                    {profile?.avatar_url || user.user_metadata?.avatar_url ? (
                      <img
                        src={profile?.avatar_url || user.user_metadata?.avatar_url}
                        alt={userDisplayName}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-bold text-[10px] flex items-center justify-center">
                        {userInitials}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[var(--ink)] max-w-[100px] truncate">
                      {userDisplayName}
                    </span>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 min-w-[200px] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 shadow-xl animate-in fade-in-80 zoom-in-95 text-xs text-[var(--ink)]"
                  >
                    <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                      <p className="font-semibold truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-[var(--muted)] truncate">{user.email}</p>
                    </div>

                    <DropdownMenu.Item asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--raised)] cursor-pointer text-[var(--ink)]"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span>Personal Dashboard</span>
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Item asChild>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--raised)] cursor-pointer text-[var(--ink)]"
                      >
                        <Settings className="w-3.5 h-3.5 text-[var(--muted)]" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="h-px bg-[var(--border)] my-1" />

                    <DropdownMenu.Item
                      onSelect={() => signOut()}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 text-red-400 cursor-pointer focus:bg-red-500/10 focus:outline-none"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openAuth('signin')}
                  className="text-xs h-8 px-3 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1 text-[var(--muted)]" />
                  <span>Sign In</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => openAuth('signup')}
                  className="text-xs h-8 px-3.5 font-semibold cursor-pointer"
                >
                  <span>Sign Up</span>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger & Controls */}
          <div className="flex md:hidden items-center gap-2">
            <SyncStatusIndicator />

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-8 w-8 text-[var(--muted)]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-[var(--warning)]" /> : <Moon className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
              className="h-8 w-8 text-[var(--muted)] hover:text-[var(--ink)]"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-4 py-4 space-y-2 shadow-lg">
            {user ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--raised)] border border-[var(--border)] mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-[var(--accent-ink)] font-bold text-xs flex items-center justify-center">
                    {userInitials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--ink)]">{userDisplayName}</p>
                    <p className="text-[10px] text-[var(--muted)]">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="h-7 px-2 text-xs text-red-400 border-red-500/30"
                >
                  <LogOut className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAuth('signin')}
                  className="text-xs justify-center"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  <span>Sign In</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => openAuth('signup')}
                  className="text-xs justify-center font-semibold"
                >
                  <span>Sign Up</span>
                </Button>
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium ${
                    active
                      ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                      : 'text-[var(--ink)] hover:bg-[var(--raised)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <Link
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-md text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]"
            >
              <Settings className="h-4 w-4" />
              <span>Settings & Storage</span>
            </Link>

            <div className="pt-2 mt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--muted)] px-3">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="h-2 w-2 rounded-full bg-[var(--positive)] inline-block" />
                SQLite WASM Engine
              </span>
              <span className="text-[10px] font-mono">100% Client-Side</span>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
