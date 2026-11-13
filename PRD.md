# PRD: SQL & Data Practice Platform ("QueryForge")

Working name: QueryForge (change freely). Source content: https://github.com/vivekpandey76/Mysql-course

## 1. Summary
A free, fully client-side web app where learners read theory, solve practice problems against sample datasets, and run code in an in-browser editor that supports MySQL, SQLite, PostgreSQL and pandas. A tracker shows exactly where the learner is and how much is done. No backend, no accounts, no paid services. Deployable as a static site.

## 2. Goals / Non-goals
Goals
- Professional, polished home page and UI (dark-first, light mode available).
- Theory (Learn) and problems (Practice) as separate sections, with a clear hierarchy.
- One dedicated editor with an engine switcher.
- Auto-checking of answers, hints, solutions, progress tracking.
- Content comes from the repo's markdown files, converted at build time. Adding a new `.md` adds new content with no code changes.
- 100% free to build and host.

Non-goals (v1)
- User accounts, cloud sync, leaderboards, payments.
- A real MySQL server in the browser (see section 6 for how MySQL is handled).
- PySpark (explicitly out of scope).

## 3. Users
- Beginner to intermediate learners of SQL and data processing.
- Self-learners preparing for interviews who want topic-wise practice.

## 4. Information architecture
```
/                      Home (landing)
/learn                 Theory index (tracks > modules > lessons)
/learn/:track/:slug    Lesson page (markdown, TOC, prev/next, "Practice this topic" CTA)
/practice              Problem index (filters + tree)
/practice/:id          Problem workspace (description | editor | results)
/dashboard             Progress tracker
/playground            Free editor, no problem attached, any dataset
/settings              Theme, editor prefs, export/import/reset progress
```
Hierarchy: Track (e.g. SQL Fundamentals) > Module (e.g. Joins) > Lesson (theory) and Problem (practice), ordered. Difficulty: Easy / Medium / Hard. Tags: topic, concept.

## 5. Features

### 5.1 Home page
- Sticky navbar: logo, Learn, Practice, Playground, Dashboard, theme toggle, GitHub link.
- Hero: strong headline, sub-copy, primary CTA "Start practicing", secondary "Read theory", and a live mini editor preview/animated query demo.
- Sections: supported engines strip (MySQL, SQLite, PostgreSQL, pandas logos), how it works (3 steps), learning path overview cards, feature grid (editor, auto-check, tracker, datasets), stats (problems, lessons, topics counted from content), "Continue where you left off" card when progress exists, footer.
- Subtle motion (Framer Motion), responsive, accessible (WCAG AA contrast, keyboard nav).

### 5.2 Learn (theory)
- Rendered markdown with GFM tables, syntax-highlighted code blocks, callouts.
- Every SQL code block has "Run in playground" and "Copy" buttons.
- Right-side table of contents, reading progress, "Mark as read", prev/next.
- Search across lessons.

### 5.3 Practice
- Problem list as an organized tree (Track > Module) plus a table view with filters: difficulty, topic, status (todo / attempted / solved), search.
- Each row: number, title, difficulty chip, status icon.
- Problem workspace, 3 resizable panes:
  - Left tabs: Description, Schema/Dataset (tables, columns, types, 5-row preview, ER hints), Hints (reveal one at a time), Solution (locked until solved or until "Give up").
  - Middle: editor with engine switcher, Run (Ctrl/Cmd+Enter), Submit, Reset, Format.
  - Bottom/right: Results table, errors, execution time, row count, expected-vs-actual diff on failure.
- Next/previous problem, "Next unsolved".

### 5.4 Editor
- CodeMirror 6: syntax highlighting per language, autocomplete using the loaded schema (tables/columns), multi-tab scripts in playground, themes matching the app, font size, vim mode optional.
- Engine switcher: MySQL, SQLite, PostgreSQL, pandas (Python).
- Each run happens in a Web Worker so the UI never freezes. Timeout and cancel button.
- Dataset is loaded fresh per problem and run; "Reset database" button.
- Run history per problem (last 20 runs, local).

### 5.5 Answer checking
- Problem JSON defines an expected result set (or a reference solution executed at build time to generate it).
- Compare: column names (optionally case-insensitive), row count, values with numeric tolerance; row order ignored unless the problem sets `ordered: true`.
- Feedback: pass, or fail with what differed (missing columns, row count mismatch, first differing rows).
- Problems may restrict engines (e.g. pandas-only problems) or allow all; for non-SQL answers, the checker compares the DataFrame result.
- For DDL/DML problems (CREATE/INSERT/UPDATE/DELETE), check by running a verification query after the user's script.

### 5.6 Progress tracker
- Per problem: not started, attempted, solved; attempts count, time spent, hints used, last code saved (auto-save drafts).
- Per lesson: read / unread.
- Dashboard: overall % complete, per-track and per-module progress bars, solved by difficulty (chart), current streak and activity heatmap, recent activity, "Continue" button.
- Sidebar/lists show checkmarks and module progress everywhere.
- Storage: IndexedDB (Dexie) with localStorage fallback. Export/import progress as JSON. Reset with confirmation.

### 5.7 Content pipeline
- `/content` folder copied or synced from the repo. A build-time script (`scripts/build-content.ts`) parses markdown into typed JSON.
- Problem markdown format (the script must support this and be adapted to whatever the repo actually uses):
```
---
id: joins-001
title: Employees with their departments
track: sql-fundamentals
module: joins
difficulty: easy
tags: [inner-join]
engines: [mysql, sqlite, postgres]
dataset: company
ordered: false
---
# Problem statement
...
## Hints
1. ...
## Solution
```sql
...
```
## Explanation
...
```
- Datasets: `.sql` seed files (and optional CSV for pandas). One dataset can be shared across many problems. The script generates per-engine seeds where syntax differs, and the expected output by running the reference solution at build time (and fails the build if the solution errors).
- If the repo's markdown does not have front-matter, the script infers track/module from folder names and order from filename prefixes, and a one-time migration step adds front-matter.
- Build validation report: counts, missing datasets, duplicate IDs, problems without solutions.

## 6. Technical approach (free, static)

Stack: Vite + React + TypeScript, Tailwind CSS, shadcn/ui (Radix), React Router, Zustand, Dexie, CodeMirror 6, react-markdown + remark-gfm + rehype-highlight, Recharts, Framer Motion, Vitest + Playwright. Hosting: GitHub Pages, Cloudflare Pages, Netlify or Vercel free tier.

Engines (all in-browser, loaded lazily on first use, cached by service worker):
| Engine | Implementation | Notes |
|---|---|---|
| SQLite | sqlite-wasm (official) or sql.js | Real SQLite. |
| PostgreSQL | PGlite (`@electric-sql/pglite`) | Real Postgres compiled to WASM. |
| MySQL | sqlglot (MySQL to DuckDB/SQLite dialect translation, runs in Pyodide) on DuckDB-WASM or SQLite | Labelled "MySQL (compatibility mode)". Expected outputs are generated by running reference solutions on real MySQL (Docker) at build time; problems whose browser result differs are flagged "MySQL-compat limited". Unsupported features (stored procedures, triggers, SHOW, INFORMATION_SCHEMA details) are listed in the UI. Optional later: free-tier backend with real MySQL. |
| pandas | Pyodide (Python + pandas in WASM) | Datasets loaded as DataFrames. Heavy download, so lazy load with a progress bar. |

Architecture
- `engines/` with a common interface: `init()`, `loadDataset(dataset)`, `run(code) -> {columns, rows, error, timeMs}`, `reset()`, `cancel()`. Each engine in its own Web Worker.
- `checker/` for result comparison, independent of engine.
- `content/` generated JSON, imported lazily per lesson/problem for fast loads.
- Fully static, no server, no API keys, no telemetry.

## 7. Design system
- Style: modern developer-education product (clean, spacious, rounded 12-16px, soft shadows, glass panels on hero).
- Palette (dark default): background `#0B1020`, surface `#111936`, border `#222C55`, text `#E6E9F5`, muted `#8B93B7`, primary indigo `#6366F1`, accent cyan `#22D3EE`, success `#34D399`, warning `#FBBF24`, danger `#F87171`. Light theme: background `#F8FAFF`, surface `#FFFFFF`, same accents.
- Difficulty colors: Easy green, Medium amber, Hard rose.
- Type: Inter (UI), JetBrains Mono (code), generous line height for theory.
- Consistent components: cards, chips, progress bars/rings, tabs, resizable panels, toasts, skeleton loaders, empty states.
- Responsive: desktop-first workspace; on mobile, panes become tabs.

## 8. Non-functional
- Lighthouse: Performance 90+, Accessibility 95+. Initial JS under ~250 KB gz; engines and Pyodide lazy loaded.
- Works offline after first load (PWA) for already-cached engines and content.
- Runs on latest Chrome, Edge, Firefox, Safari.
- Safe execution: code only runs in the user's browser sandbox (workers).
- Zero cost: no paid APIs or hosting.

## 9. Milestones
1. Scaffold, design system, home page, routing, theme.
2. Content pipeline + Learn section.
3. SQLite + PostgreSQL engines, editor, Practice workspace, checker.
4. Progress tracker + dashboard.
5. MySQL compatibility layer.
6. pandas via Pyodide.
7. Playground, search, PWA, polish, tests, deploy.

## 10. Acceptance criteria
- A learner can open the app, read a lesson, open a problem, run SQL on any supported SQL engine, submit, get pass/fail feedback, and see progress update on the dashboard after refresh.
- Dropping a new markdown problem/lesson into `/content` and rebuilding shows it in the app with no code changes.
- Build fails with a clear message when a problem's reference solution errors.
- pandas problems run and are checkable.
- App deploys as a static site on a free host.

## 11. Risks
- MySQL is emulated in the browser, not native. Mitigation: clear labels, build-time verification against real MySQL, compatibility list, problems tagged with supported engines.
- Pyodide download size (~10 MB+). Mitigation: lazy load, cache, progress indicator.
- Repo markdown may be inconsistent. Mitigation: tolerant parser and validation report.
