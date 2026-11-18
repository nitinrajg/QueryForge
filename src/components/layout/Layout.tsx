import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

/**
 * Root Application Layout.
 * 
 * Rules:
 * - On the Practice Workspace (`/practice/:id`), provides a locked 100dvh full-viewport
 *   application shell with zero page scroll, dedicated IDE panels, and no footer.
 * - On all other pages (Home, Learn, Practice Catalog, Dashboard, Playground),
 *   renders the full standard editorial page layout with footer.
 */
export const Layout: React.FC = () => {
  const location = useLocation();
  const isPracticeWorkspace = location.pathname.startsWith('/practice/') && location.pathname !== '/practice';

  if (isPracticeWorkspace) {
    return (
      <div className="h-screen max-h-[100dvh] flex flex-col bg-[var(--bg)] text-[var(--ink)] overflow-hidden select-none">
        <Navbar />
        <main className="flex-1 flex flex-col w-full min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--ink)] transition-colors duration-150">
      <Navbar />
      <main className="flex-1 flex flex-col w-full">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
