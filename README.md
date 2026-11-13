# ⚡ QueryForge — Free In-Browser SQL & Data Practice Platform

> A 100% free, client-side SQL and data engineering practice platform where learners read deep theory, solve 110+ interview problems, and run queries against real browser engines. Zero backends, zero paywalls, zero accounts, zero telemetry.

---

## 🌟 Key Features

- **In-Browser WebAssembly Engines:** Run real SQL with SQLite WASM and MySQL compatibility mode. Instant execution, no server latency.
- **111+ Curated Practice Problems:**
  - Full LeetCode Top SQL 50 study plan (with approach breakdowns and official test outputs)
  - Real Product Company Interview questions (food delivery, streaming, ride-hailing, fintech)
  - Consulting & Tech Giants (Accenture, TCS)
  - Advanced Analytics Patterns (Rolling sums, date spines, `ROWS` vs `RANGE`)
- **14 Masterclass Theory Guides:** Complete walkthroughs from basic `SELECT` and `WHERE` filtering to Window Functions, Recursive CTEs, Views, Stored Procedures, and Indexing.
- **Intelligent Answer Checker:** Auto-grades queries against expected datasets with numeric tolerance (0.02) and order-insensitive verification.
- **Client-Side Progress Tracker:** Stores solved status, attempt counts, hints used, and draft code in IndexedDB (Dexie).
- **Freeform SQL Playground:** Test arbitrary queries, DDL, and DML against the 9-table `employer_database` dataset.
- **Offline & PWA Ready:** Works offline after first load using Service Worker caching.

---

## 🚀 Quickstart & Local Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/queryforge.git
cd queryforge

# 2. Install dependencies
npm install

# 3. (Optional) Rebuild content from markdown source
npm run build:content

# 4. Run development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Running Tests & Production Build

```bash
# Run unit tests (Vitest)
npm run test

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## 🏗️ Architecture & Tech Stack

```
src/
├── components/
│   ├── editor/         # CodeMirror 6 SQL editor, results panel, schema viewer
│   ├── layout/         # Sticky navigation, responsive footer, theme toggle
│   └── ui/             # Radix UI + CVA + Tailwind CSS primitives
├── content/            # Generated typed JSON content (tracks, lessons, problems, datasets)
├── checker/            # Automated test result comparator with numeric tolerance
├── engines/            # SQLite WASM engine, MySQL dialect translator, engine manager
├── lib/                # IndexedDB database (Dexie), utility helpers
├── pages/              # Home, Learn, LearnLesson, Practice, PracticeWorkspace, Dashboard, Playground, Settings
└── store/              # Zustand stores (Theme, Progress, Editor state)
```

| Layer | Technology |
|---|---|
| **Framework** | React 19 + TypeScript + Vite |
| **Styling** | Tailwind CSS v4 + Radix UI primitives + Framer Motion |
| **Editor** | CodeMirror 6 with SQL dialect & schema autocompletion |
| **Engines** | SQLite via `sql.js` (WebAssembly) |
| **Local DB** | IndexedDB via `Dexie` |
| **Charts** | Recharts (Difficulty distribution & streak analytics) |
| **Testing** | Vitest |

---

## 📝 How to Add New Content

QueryForge converts markdown files at build time without requiring code changes.

1. **Adding a Theory Lesson:**
   - Create a `.md` file in `content-source/docs/` with numeric prefix (e.g. `14-partitioning.md`).
   - Run `npm run build:content`.

2. **Adding Practice Problems:**
   - Add a problem to any problem set file in `content-source/leetcode-problems/` or `content-source/interview-questions/`:
   ```markdown
   ## Q10 — Title Here
   **Question:** What to do...
   ### 🗄️ Dataset
   ```sql
   CREATE TABLE ...;
   INSERT INTO ...;
   ```
   ### ✅ Expected Output
   | col1 | col2 |
   |---|---|
   | val1 | val2 |
   ### 💡 Solution
   ```sql
   SELECT ...;
   ```
   ### 🧠 Explanation
   ...
   ```
   - Run `npm run build:content`.

---

## 🌐 Free Deployment Guide

### 1. Cloudflare Pages (Recommended - 100% Free)
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `NODE_VERSION = 20`

### 2. GitHub Pages
Add `.github/workflows/deploy.yml`:
```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 3. Netlify
- Build command: `npm run build`
- Publish directory: `dist`

---

## ⚖️ Known Limitations & Emulation Notes

- **MySQL Emulation:** MySQL is executed via client-side AST and syntax normalization on SQLite WASM. Unsupported MySQL-specific server features include:
  - Stored Procedures & Triggers (`CREATE PROCEDURE`, `CREATE TRIGGER`)
  - Server management (`SHOW PROCESSLIST`, `GRANT`, `FLUSH PRIVILEGES`)
  - Server-specific metadata queries against internal `INFORMATION_SCHEMA` tables.
- **PySpark:** PySpark requires a distributed JVM cluster and is intentionally excluded from client-side in-browser execution per PRD non-goals.
