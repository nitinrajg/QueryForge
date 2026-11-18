import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        accent: {
          DEFAULT: 'var(--accent)',
          ink: 'var(--accent-ink)',
        },
        field1: {
          DEFAULT: 'var(--field-1)',
          ink: 'var(--field-1-ink)',
        },
        // App Terminal Tokens
        ground: 'var(--ground)',
        raised: 'var(--raised)',
        border: 'var(--border)',
        rule: 'var(--rule)',
        control: 'var(--control)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
        warning: 'var(--warning)',
        pill: {
          positive: {
            bg: 'var(--pill-positive-bg)',
            ink: 'var(--pill-positive-ink)',
          },
          negative: {
            bg: 'var(--pill-negative-bg)',
            ink: 'var(--pill-negative-ink)',
          },
          warning: {
            bg: 'var(--pill-warning-bg)',
            ink: 'var(--pill-warning-ink)',
          },
          neutral: {
            bg: 'var(--pill-neutral-bg)',
            ink: 'var(--pill-neutral-ink)',
          },
        },
      },
      fontFamily: {
        display: ['Gambarino', 'serif'],
        sans: ['General Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'step-small': 'clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)',
        'step-body': 'clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)',
        'step-lead': 'clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)',
        'step-head': 'clamp(2rem, 1.3rem + 3.2vw, 4rem)',
        'hero-display': 'clamp(96px, 10.5vw, 168px)',
        'fs-title': '26px',
        'fs-section': '20px',
        'fs-kpi': '20px',
        'fs-body': '13px',
        'fs-small': '12px',
      },
      borderRadius: {
        none: '0px',
        card: '6px',
      },
    },
  },
  plugins: [],
} satisfies Config;

