# Content Report: Mysql-course Repository

## Repository Structure

```
content-source/
├── docs/                          # 14 theory lessons (00–13)
│   ├── 00-sample-database.md      # Dataset: employer_database (9 tables, seed SQL)
│   ├── 01-filtering-data.md       # WHERE, LIKE, IN, BETWEEN, ORDER BY, LIMIT
│   ├── 02-aggregate-functions-and-group-by.md
│   ├── 03-joins.md                # INNER, LEFT, RIGHT, SELF, CROSS
│   ├── 04-subqueries.md
│   ├── 05-window-functions.md     # ROW_NUMBER, RANK, LAG/LEAD
│   ├── 06-common-table-expressions.md
│   ├── 07-string-date-and-case-functions.md
│   ├── 08-views.md
│   ├── 09-stored-procedures.md
│   ├── 10-triggers.md
│   ├── 11-union-and-union-all.md
│   ├── 12-recursive-cte.md
│   └── 13-indexes.md
├── interview-questions/           # 6 problem sets (30+ problems)
│   ├── problem-set-01.md          # 5 problems (anti-joins, running balances, etc.)
│   ├── problem-set-02.md          # 5 problems
│   ├── problem-set-03.md          # 5 problems
│   ├── problem-set-04.md          # 5 problems
│   ├── problem-set-05.md          # 5 problems
│   └── problem-set-06.md          # 7+ problems
├── leetcode-problems/             # 5 sets = 50 LeetCode SQL problems
│   ├── set-01-easy-basics.md      # Problems 1–10
│   ├── set-02-joins-and-aggregation.md    # Problems 11–20
│   ├── set-03-window-functions-and-first-rows.md  # Problems 21–30
│   ├── set-04-advanced-windows-and-conditional-logic.md  # Problems 31–40
│   └── set-05-strings-regex-and-set-operations.md  # Problems 41–50
├── bonus-problems/                # 1 set so far
│   └── set-01-rolling-sum-pattern.md  # 3 problems on rolling sums
├── company-based-questions/       # 2 company sets
│   ├── accenture_sql_questions.md # 15 questions
│   └── tcs_sql_questions.md       # ~15 questions
└── assets/
    ├── joins.png
    └── Indexing.png
```

## Content Format Analysis

### Theory Files (`docs/`)
- **No YAML front-matter** — must be inferred from folder and filenames
- Format: `##-topic-name.md` with numeric prefix for ordering
- Content: explanation + SQL code blocks + GFM tables + callouts (blockquotes)
- SQL blocks are inline examples against the `employer_database`
- `00-sample-database.md` contains all CREATE TABLE + INSERT statements for the shared dataset

### Problem Files (`interview-questions/`, `leetcode-problems/`, `bonus-problems/`, `company-based-questions/`)
- **No YAML front-matter** — must be inferred
- Consistent structure per problem:
  - `## Q{N} — {Title}`
  - `### 🗄️ Dataset` or `### 🗄️ Schema` — inline CREATE TABLE + INSERT SQL
  - `### ✅ Expected Output` — markdown table
  - `### 🎯 How to approach it` (LeetCode sets)
  - `### 💡 Solution` — one or more SQL code blocks
  - `### 🧠 Explanation` — prose
- Each problem is **self-contained** with its own inline dataset
- Difficulty is often indicated by emoji: 🟩 Easy, 🟨 Medium, 🟥 Hard, or by problem titles
- Some problems have multiple solution approaches (Method 1, Method 2)
- Some "problems" are actually theory Q&A (e.g., "WHERE vs HAVING" — no dataset/solution SQL)

### Datasets
- **No separate .sql or .csv files** — all SQL is inline in markdown code blocks
- The main shared dataset is in `docs/00-sample-database.md` (`employer_database`, 9 tables)
- Each problem in interview/leetcode/bonus/company sets has its own inline dataset
- Datasets use MySQL syntax (AUTO_INCREMENT, ENUM, backtick quoting, etc.)

## Mapping to PRD Schema: Track > Module > Lesson/Problem

### Track 1: `sql-fundamentals` — SQL Fundamentals
Theory lessons from `docs/`:

| Module | Lesson File | Order |
|--------|------------|-------|
| `getting-started` | `00-sample-database.md` | 0 |
| `filtering` | `01-filtering-data.md` | 1 |
| `aggregation` | `02-aggregate-functions-and-group-by.md` | 2 |
| `joins` | `03-joins.md` | 3 |
| `subqueries` | `04-subqueries.md` | 4 |
| `window-functions` | `05-window-functions.md` | 5 |
| `ctes` | `06-common-table-expressions.md` | 6 |
| `functions` | `07-string-date-and-case-functions.md` | 7 |
| `views` | `08-views.md` | 8 |
| `stored-procedures` | `09-stored-procedures.md` | 9 |
| `triggers` | `10-triggers.md` | 10 |
| `set-operations` | `11-union-and-union-all.md` | 11 |
| `recursive-cte` | `12-recursive-cte.md` | 12 |
| `indexes` | `13-indexes.md` | 13 |

### Track 2: `leetcode-sql-50` — LeetCode SQL 50
Problems from `leetcode-problems/`:

| Module | Source File | Problems | Difficulty |
|--------|-----------|----------|------------|
| `select-and-basic-joins` | `set-01-easy-basics.md` | 10 | Easy |
| `joins-and-aggregation` | `set-02-joins-and-aggregation.md` | 10 | Easy–Medium |
| `window-functions` | `set-03-window-functions-and-first-rows.md` | 10 | Medium |
| `advanced-windows` | `set-04-advanced-windows-and-conditional-logic.md` | 10 | Medium–Hard |
| `strings-regex-sets` | `set-05-strings-regex-and-set-operations.md` | 10 | Medium–Hard |

### Track 3: `interview-prep` — Interview Preparation
Problems from `interview-questions/`:

| Module | Source File | Problems |
|--------|-----------|----------|
| `set-01` | `problem-set-01.md` | 5 |
| `set-02` | `problem-set-02.md` | 5 |
| `set-03` | `problem-set-03.md` | 5 |
| `set-04` | `problem-set-04.md` | 5 |
| `set-05` | `problem-set-05.md` | 5 |
| `set-06` | `problem-set-06.md` | 7+ |

### Track 4: `company-questions` — Company-Based Questions
Problems from `company-based-questions/`:

| Module | Source File | Problems |
|--------|-----------|----------|
| `accenture` | `accenture_sql_questions.md` | 15 |
| `tcs` | `tcs_sql_questions.md` | ~15 |

### Track 5: `bonus-patterns` — Bonus Problem Patterns
Problems from `bonus-problems/`:

| Module | Source File | Problems |
|--------|-----------|----------|
| `rolling-sums` | `set-01-rolling-sum-pattern.md` | 3 |

## ID Generation Strategy
Since no front-matter exists, IDs will be generated as:
- Lessons: `{track}-{module}-{order}` e.g. `sql-fundamentals-joins-3`
- Problems: `{track}-{module}-q{number}` e.g. `leetcode-sql-50-select-and-basic-joins-q1`

## Content Stats (Estimated)
- **Theory Lessons:** 14
- **Practice Problems:** ~100+ (50 LeetCode + 32 interview + 3 bonus + 30 company)
- **Datasets:** ~80+ unique inline datasets + 1 shared employer_database
- **Topics:** filtering, aggregation, joins, subqueries, window functions, CTEs, string/date functions, views, stored procedures, triggers, UNION, recursive CTE, indexes

## Key Decisions
1. Theory-only questions (e.g., "WHERE vs HAVING" from company sets) will be treated as **lessons** (read-only), not problems
2. The shared `employer_database` dataset will be the default playground dataset
3. Problems with multiple solution approaches: first solution is the "reference solution" for expected output generation
4. MySQL-specific syntax (AUTO_INCREMENT, ENUM, TIMESTAMPDIFF, DATE_FORMAT) will need SQLite/PostgreSQL translation in the build pipeline
5. Stored procedures and triggers lessons will be marked as "MySQL-only" content

