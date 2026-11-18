import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Learn } from '@/pages/Learn';
import { LearnLesson } from '@/pages/LearnLesson';
import { Practice } from '@/pages/Practice';
import { PracticeWorkspace } from '@/pages/PracticeWorkspace';
import { Dashboard } from '@/pages/Dashboard';
import { Playground } from '@/pages/Playground';
import { Settings } from '@/pages/Settings';
import { ResetPassword } from '@/pages/ResetPassword';
import { AuthProvider } from '@/context/AuthContext';
import { GuestMigrationModal } from '@/components/auth/GuestMigrationModal';
import { useProgressStore } from '@/store/useProgressStore';
import { useThemeStore } from '@/store/useThemeStore';

/**
 * Root Application Component.
 * 
 * Logic & Architecture:
 * - Wraps the component tree with AuthProvider for Supabase session & user lifecycle.
 * - Bootstraps React Router with nested layout architecture.
 * - Initializes IndexedDB progress persistence store on mount.
 * - Renders GuestMigrationModal for seamless local-to-cloud transition.
 * - Applies active theme class (dark/light) to the HTML document.
 */
export function App() {
  const initProgress = useProgressStore((state) => state.init);
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    // 1. Initialize IndexedDB Progress storage
    initProgress();

    // 2. Synchronize theme class on root DOM
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme, initProgress]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <GuestMigrationModal />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="learn" element={<Learn />} />
            <Route path="learn/:track/:slug" element={<LearnLesson />} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:id" element={<PracticeWorkspace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="playground" element={<Playground />} />
            <Route path="settings" element={<Settings />} />
            <Route path="reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
