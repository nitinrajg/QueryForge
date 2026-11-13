import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'light';

interface ThemeState {
  /** Current theme: 'dark' or 'light' */
  theme: Theme;
  /** Toggle between dark and light */
  toggleTheme: () => void;
  /** Set a specific theme */
  setTheme: (theme: Theme) => void;
}

/**
 * Zustand store for theme management.
 * Persisted to localStorage under key 'queryforge-theme'.
 * Also applies/removes the 'dark' class on <html> for Tailwind dark mode.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'dark',

      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'dark' ? 'light' : 'dark';
          applyThemeToDOM(next);
          return { theme: next };
        }),

      setTheme: (theme: Theme) =>
        set(() => {
          applyThemeToDOM(theme);
          return { theme };
        }),
    }),
    {
      name: 'queryforge-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDOM(state.theme);
        }
      },
    },
  ),
);

function applyThemeToDOM(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}
