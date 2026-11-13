import fs from 'fs';
import path from 'path';

interface ExpectedOutput {
  columns: string[];
  rows: (string | number | null)[][];
}

interface ProblemItem {
  id: string;
  number: number;
  title: string;
  trackId: string;
  moduleId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  description: string;
  datasetSql: string;
  expectedOutput: ExpectedOutput;
  solutionSql: string;
  hints: string[];
  explanation: string;
  engines: string[];
  sourceUrl?: string;
}

interface LessonItem {
  id: string;
  slug: string;
  title: string;
  trackId: string;
  moduleId: string;
  order: number;
  content: string;
  toc: { level: number; text: string; id: string }[];
}

interface ModuleItem {
  id: string;
  title: string;
  trackId: string;
  order: number;
  description: string;
  lessonIds: string[];
  problemIds: string[];
}

interface TrackItem {
  id: string;
  title: string;
  order: number;
  description: string;
  modules: ModuleItem[];
  totalLessons: number;
  totalProblems: number;
}

const ROOT_DIR = process.cwd();
const CONTENT_SOURCE = path.join(ROOT_DIR, 'content-source');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src', 'content');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function normalizeNewlines(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

// Helper to parse markdown table into { columns, rows }
function parseMarkdownTable(tableText: string): ExpectedOutput {
  const lines = tableText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (lines.length < 2) {
    return { columns: [], rows: [] };
  }

  const parseRow = (line: string) =>
    line
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

  const rawHeaders = parseRow(lines[0]);
  const columns = rawHeaders.map((h) => h.replace(/`/g, '').trim());

  // line 1 is separator |---|---|
  const rows: (string | number | null)[][] = [];
  for (let i = 2; i < lines.length; i++) {
    const rawCells = parseRow(lines[i]);
    const cells = rawCells.map((val) => {
      if (val === 'NULL' || val === 'null' || val === '—' || val === '-') return null;
      // Try parsing numeric
      const cleanVal = val.replace(/,/g, '');
      const num = Number(cleanVal);
      if (!isNaN(num) && cleanVal !== '' && !cleanVal.includes('-') && !cleanVal.includes(':')) {
        return num;
      }
      return val;
    });
    // Pad or trim if length differs slightly
    while (cells.length < columns.length) cells.push(null);
    rows.push(cells.slice(0, columns.length));
  }

  return { columns, rows };
}

// Parse TOC from markdown
function extractToc(markdown: string) {
  const headings: { level: number; text: string; id: string }[] = [];
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(#{2,3})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[#*_`]/g, '').trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
      headings.push({ level, text, id });
    }
  }
  return headings;
}

// Clean emoji and decorative prefixes
function cleanTitle(title: string): string {
  return title
    .replace(/^[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\s]+/u, '')
    .replace(/^Part\s+\d+:\s*/i, '')
    .replace(/^Q\d+\s*[—–-]\s*/i, '')
    .trim();
}

console.log('🚀 QueryForge Content Pipeline: Building typed content from content-source...');

const tracks: TrackItem[] = [];
const allLessons: Record<string, LessonItem> = {};
const allProblems: Record<string, ProblemItem> = {};
let sharedEmployerDataset = '';

// ==========================================
// 1. Parse Shared Dataset from docs/00-sample-database.md
// ==========================================
const sampleDbPath = path.join(CONTENT_SOURCE, 'docs', '00-sample-database.md');
if (fs.existsSync(sampleDbPath)) {
  const sampleDbContent = normalizeNewlines(fs.readFileSync(sampleDbPath, 'utf-8'));
  const sqlBlocks: string[] = [];
  const regex = /```sql([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(sampleDbContent)) !== null) {
    sqlBlocks.push(match[1].trim());
  }
  sharedEmployerDataset = sqlBlocks.join('\n\n');
}

// ==========================================
// 2. Track 1: SQL Fundamentals (Theory Lessons)
// ==========================================
const docsDir = path.join(CONTENT_SOURCE, 'docs');
const docFiles = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md')).sort();

const fundamentalsModules: ModuleItem[] = [];
let lessonOrder = 0;

for (const file of docFiles) {
  const filePath = path.join(docsDir, file);
  const raw = normalizeNewlines(fs.readFileSync(filePath, 'utf-8'));
  const lines = raw.split('\n');
  const firstH1 = lines.find((l) => l.trim().startsWith('# '));
  const title = firstH1 ? cleanTitle(firstH1.replace(/^#\s*/, '')) : file.replace('.md', '');
  const slug = file.replace(/\.md$/, '');
  const id = `lesson-${slug}`;
  const moduleId = `mod-${slug}`;

  const lessonItem: LessonItem = {
    id,
    slug,
    title,
    trackId: 'sql-fundamentals',
    moduleId,
    order: lessonOrder++,
    content: raw,
    toc: extractToc(raw),
  };

  allLessons[id] = lessonItem;

  fundamentalsModules.push({
    id: moduleId,
    title,
    trackId: 'sql-fundamentals',
    order: fundamentalsModules.length,
    description: `Complete guide and reference for ${title.toLowerCase()}`,
    lessonIds: [id],
    problemIds: [],
  });
}

tracks.push({
  id: 'sql-fundamentals',
  title: 'SQL Fundamentals & Deep Dives',
  order: 1,
  description:
    'Complete masterclass from basic SELECT queries to advanced Window Functions, CTEs, Views, and Indexing.',
  modules: fundamentalsModules,
  totalLessons: fundamentalsModules.length,
  totalProblems: 0,
});

// Helper to parse problem markdown files
function parseProblemFile(
  filePath: string,
  trackId: string,
  moduleId: string,
  defaultDifficulty: 'easy' | 'medium' | 'hard'
): ProblemItem[] {
  if (!fs.existsSync(filePath)) return [];
  const content = normalizeNewlines(fs.readFileSync(filePath, 'utf-8'));
  const sections = content.split(/\n(?=##\s+Q\d+)/g);
  const problems: ProblemItem[] = [];

  for (let i = 1; i < sections.length; i++) {
    const sec = sections[i];
    const headerLine = sec.split('\n')[0];
    const titleMatch = headerLine.match(/##\s+Q(\d+)\s*[—–-]\s*(.*)/);
    const qNum = titleMatch ? parseInt(titleMatch[1], 10) : i;
    const rawTitle = titleMatch ? titleMatch[2].trim() : `Problem ${qNum}`;
    const cleanProblemTitle = cleanTitle(rawTitle);

    // Difficulty inference
    let difficulty: 'easy' | 'medium' | 'hard' = defaultDifficulty;
    if (sec.includes('🟩 Easy') || sec.includes('Easy')) difficulty = 'easy';
    else if (sec.includes('🟨 Medium') || sec.includes('Medium')) difficulty = 'medium';
    else if (sec.includes('🟥 Hard') || sec.includes('Hard')) difficulty = 'hard';

    // Source link
    const urlMatch = sec.match(/🔗\s*\[.*?\]\((https?:\/\/[^\s)]+)\)/);
    const sourceUrl = urlMatch ? urlMatch[1] : undefined;

    // Problem description
    let description = '';
    const descMatch = sec.match(/\*\*Problem:\*\*\s*([\s\S]*?)(?=###|$)/i) ||
                      sec.match(/\*\*Question:\*\*\s*([\s\S]*?)(?=###|$)/i);
    if (descMatch) {
      description = descMatch[1].trim();
    } else {
      const lines = sec.split('\n').slice(1);
      const firstPara = lines.find((l) => l.trim().length > 0 && !l.trim().startsWith('#') && !l.trim().startsWith('🔗'));
      description = firstPara ? firstPara.trim() : cleanProblemTitle;
    }

    // Dataset SQL
    let datasetSql = '';
    const datasetSection = sec.match(/###\s*[^#\n]*(?:Schema|Dataset)[^#\n]*\n+```sql([\s\S]*?)```/i);
    if (datasetSection) {
      datasetSql = datasetSection[1].trim();
    } else {
      datasetSql = sharedEmployerDataset;
    }

    // Expected Output Table
    let expectedOutput: ExpectedOutput = { columns: [], rows: [] };
    const expectedSection = sec.match(/###\s*.*Expected Output[\s\S]*?(\|[^\n]+\|[\s\S]*?)(?=\n###|\n---|$)/i);
    if (expectedSection) {
      expectedOutput = parseMarkdownTable(expectedSection[1]);
    }

    // Solution SQL
    let solutionSql = '';
    const solutionSection = sec.match(/###\s*[^#\n]*(?:Solution|Example)[^#\n]*\n+```sql([\s\S]*?)```/i);
    if (solutionSection) {
      solutionSql = solutionSection[1].trim();
    } else {
      // Fallback: extract the last SQL block in the section if any
      const allSqlBlocks: string[] = [];
      const sqlRegex = /```sql([\s\S]*?)```/g;
      let m;
      while ((m = sqlRegex.exec(sec)) !== null) {
        allSqlBlocks.push(m[1].trim());
      }
      if (allSqlBlocks.length > 1) {
        // Last block is usually the solution, first is dataset
        solutionSql = allSqlBlocks[allSqlBlocks.length - 1];
      } else if (allSqlBlocks.length === 1 && !datasetSection) {
        solutionSql = allSqlBlocks[0];
      } else {
        solutionSql = `-- Theory Question: Review the notes in description\nSELECT 'Theory question' AS note;`;
      }
    }

    // Hints from Approach section
    const hints: string[] = [];
    const approachSection = sec.match(/###\s*.*approach it[\s\S]*?([\s\S]*?)(?=###\s*.*Solution|$)/i);
    if (approachSection) {
      hints.push(approachSection[1].trim());
    }

    // Explanation
    let explanation = '';
    const explanationSection = sec.match(/###\s*.*Explanation[\s\S]*?([\s\S]*?)(?=\n##\s+Q|\n---|$)/i);
    if (explanationSection) {
      explanation = explanationSection[1].trim();
    }

    const probId = `${trackId}-${moduleId}-q${qNum}`;

    const prob: ProblemItem = {
      id: probId,
      number: qNum,
      title: cleanProblemTitle,
      trackId,
      moduleId,
      difficulty,
      tags: [moduleId.replace(/^(mod-|set-)/, '')],
      description,
      datasetSql,
      expectedOutput,
      solutionSql,
      hints,
      explanation,
      engines: ['sqlite', 'mysql', 'pglite', 'pandas'],
      sourceUrl,
    };

    problems.push(prob);
    allProblems[probId] = prob;
  }

  return problems;
}

// ==========================================
// 3. Track 2: LeetCode SQL 50
// ==========================================
const leetcodeDir = path.join(CONTENT_SOURCE, 'leetcode-problems');
const leetcodeFiles = [
  { file: 'set-01-easy-basics.md', title: 'Select & Basic Joins', diff: 'easy' as const },
  { file: 'set-02-joins-and-aggregation.md', title: 'Basic Aggregate Functions', diff: 'easy' as const },
  { file: 'set-03-window-functions-and-first-rows.md', title: 'Sorting and Grouping', diff: 'medium' as const },
  { file: 'set-04-advanced-windows-and-conditional-logic.md', title: 'Advanced Select & Joins', diff: 'medium' as const },
  { file: 'set-05-strings-regex-and-set-operations.md', title: 'Subqueries & Advanced Strings', diff: 'hard' as const },
];

const leetcodeModules: ModuleItem[] = [];
let totalLeetcodeProblems = 0;

for (let i = 0; i < leetcodeFiles.length; i++) {
  const item = leetcodeFiles[i];
  const modId = `leetcode-set-${i + 1}`;
  const filePath = path.join(leetcodeDir, item.file);
  const problems = parseProblemFile(filePath, 'leetcode-sql-50', modId, item.diff);
  totalLeetcodeProblems += problems.length;

  leetcodeModules.push({
    id: modId,
    title: item.title,
    trackId: 'leetcode-sql-50',
    order: i,
    description: `LeetCode SQL 50 study plan problems (${item.title})`,
    lessonIds: [],
    problemIds: problems.map((p) => p.id),
  });
}

tracks.push({
  id: 'leetcode-sql-50',
  title: 'LeetCode Top SQL 50',
  order: 2,
  description:
    'Full walkthroughs of the official LeetCode SQL 50 study plan with verified datasets, approaches, and test cases.',
  modules: leetcodeModules,
  totalLessons: 0,
  totalProblems: totalLeetcodeProblems,
});

// ==========================================
// 4. Track 3: Interview Question Sets
// ==========================================
const interviewDir = path.join(CONTENT_SOURCE, 'interview-questions');
const interviewModules: ModuleItem[] = [];
let totalInterviewProblems = 0;

if (fs.existsSync(interviewDir)) {
  const files = fs.readdirSync(interviewDir).filter((f) => f.endsWith('.md')).sort();
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const modId = `interview-set-${i + 1}`;
    const filePath = path.join(interviewDir, file);
    const problems = parseProblemFile(filePath, 'interview-questions', modId, 'medium');
    totalInterviewProblems += problems.length;

    interviewModules.push({
      id: modId,
      title: `Interview Set ${i + 1}`,
      trackId: 'interview-questions',
      order: i,
      description: `Curated interview questions covering anti-joins, running balances, and multi-table operations.`,
      lessonIds: [],
      problemIds: problems.map((p) => p.id),
    });
  }
}

tracks.push({
  id: 'interview-questions',
  title: 'Product Company SQL Interviews',
  order: 3,
  description:
    'Real-world queries inspired by product tech companies (food delivery, streaming, ride-hailing, fintech).',
  modules: interviewModules,
  totalLessons: 0,
  totalProblems: totalInterviewProblems,
});

// ==========================================
// 5. Track 4: Company-Based Question Bank
// ==========================================
const companyDir = path.join(CONTENT_SOURCE, 'company-based-questions');
const companyModules: ModuleItem[] = [];
let totalCompanyProblems = 0;

if (fs.existsSync(companyDir)) {
  const companyFiles = [
    { file: 'accenture_sql_questions.md', title: 'Accenture Tech Interviews' },
    { file: 'tcs_sql_questions.md', title: 'TCS Tech Interviews' },
  ];

  for (let i = 0; i < companyFiles.length; i++) {
    const cItem = companyFiles[i];
    const modId = `company-${i + 1}`;
    const filePath = path.join(companyDir, cItem.file);
    const problems = parseProblemFile(filePath, 'company-questions', modId, 'medium');
    totalCompanyProblems += problems.length;

    companyModules.push({
      id: modId,
      title: cItem.title,
      trackId: 'company-questions',
      order: i,
      description: `Questions reported by candidates on AmbitionBox for Data Engineer & SQL roles at ${cItem.title}.`,
      lessonIds: [],
      problemIds: problems.map((p) => p.id),
    });
  }
}

tracks.push({
  id: 'company-questions',
  title: 'Company-Specific Interview Questions',
  order: 4,
  description: 'Real interview rounds from IT and consulting giants (Accenture, TCS, etc.).',
  modules: companyModules,
  totalLessons: 0,
  totalProblems: totalCompanyProblems,
});

// ==========================================
// 6. Track 5: Bonus Problems
// ==========================================
const bonusDir = path.join(CONTENT_SOURCE, 'bonus-problems');
const bonusModules: ModuleItem[] = [];
let totalBonusProblems = 0;

if (fs.existsSync(bonusDir)) {
  const bonusFiles = fs.readdirSync(bonusDir).filter((f) => f.endsWith('.md')).sort();
  for (let i = 0; i < bonusFiles.length; i++) {
    const file = bonusFiles[i];
    const modId = `bonus-set-${i + 1}`;
    const filePath = path.join(bonusDir, file);
    const problems = parseProblemFile(filePath, 'bonus-problems', modId, 'hard');
    totalBonusProblems += problems.length;

    bonusModules.push({
      id: modId,
      title: 'The Rolling Sum Pattern',
      trackId: 'bonus-problems',
      order: i,
      description: 'Advanced analytics patterns: rolling sums, calendar date spines, ROWS vs RANGE.',
      lessonIds: [],
      problemIds: problems.map((p) => p.id),
    });
  }
}

tracks.push({
  id: 'bonus-problems',
  title: 'Advanced Analytics Patterns',
  order: 5,
  description: 'Deep patterns skipped by standard platforms: date spines, rolling time windows, and gaps.',
  modules: bonusModules,
  totalLessons: 0,
  totalProblems: totalBonusProblems,
});

// ==========================================
// 7. Write Output Files
// ==========================================
const totalProblems = Object.keys(allProblems).length;
const totalLessons = Object.keys(allLessons).length;

const datasets = {
  employer_database: {
    name: 'employer_database',
    description: 'Corporate dataset with 9 relational tables: employees, bonuses, attendance, projects, etc.',
    sql: sharedEmployerDataset,
  },
};

const manifest = {
  appName: 'QueryForge',
  version: '1.0.0',
  buildDate: new Date().toISOString(),
  stats: {
    tracksCount: tracks.length,
    modulesCount: tracks.reduce((acc, t) => acc + t.modules.length, 0),
    lessonsCount: totalLessons,
    problemsCount: totalProblems,
    datasetsCount: Object.keys(datasets).length,
  },
};

fs.writeFileSync(path.join(OUTPUT_DIR, 'tracks.json'), JSON.stringify(tracks, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'lessons.json'), JSON.stringify(allLessons, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'problems.json'), JSON.stringify(allProblems, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'datasets.json'), JSON.stringify(datasets, null, 2));
fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

console.log('✅ Content pipeline generated successfully:');
console.log(`   - Tracks:   ${tracks.length}`);
console.log(`   - Lessons:  ${totalLessons}`);
console.log(`   - Problems: ${totalProblems}`);
console.log(`   - Datasets: ${Object.keys(datasets).length}`);
