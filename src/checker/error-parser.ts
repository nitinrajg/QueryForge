import { ParsedSqlError, SqlErrorCategory } from '@/types/testcase';
import { TableSchema } from '@/engines/types';

/**
 * Calculates Levenshtein string distance for fuzzy schema suggestions.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Finds the closest matching candidate from a list of identifiers.
 */
function findClosestMatch(target: string, candidates: string[], maxDist = 3): string | null {
  if (!target || candidates.length === 0) return null;
  const targetLower = target.toLowerCase();
  let bestMatch: string | null = null;
  let minDistance = maxDist + 1;

  for (const candidate of candidates) {
    const dist = levenshtein(targetLower, candidate.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}

/**
 * Parses raw SQL engine error messages into structured diagnostic categories
 * with line/column coordinates, token extracts, and schema-aware recommendations.
 */
export function parseSqlError(rawMessage: string, schema: TableSchema[] = []): ParsedSqlError {
  const msg = rawMessage || 'Unknown execution error occurred';

  // Extract optional line & column coordinates
  const lineMatch = msg.match(/line\s*(\d+)/i);
  const colMatch = msg.match(/col(?:umn)?\s*(\d+)/i);
  const line = lineMatch ? parseInt(lineMatch[1], 10) : undefined;
  const column = colMatch ? parseInt(colMatch[1], 10) : undefined;

  // 1. Unknown Column (e.g., "no such column: produc_id")
  const noSuchColMatch = msg.match(/no such column:\s*([a-zA-Z0-9_.$#]+)/i);
  if (noSuchColMatch) {
    const colName = noSuchColMatch[1];
    const allColumns = Array.from(new Set(schema.flatMap((t) => t.columns.map((c) => c.name))));
    const suggestion = findClosestMatch(colName, allColumns);

    return {
      category: 'unknown_column',
      badgeLabel: 'Unknown Column',
      title: `Column '${colName}' not found`,
      plainEnglishFix: suggestion
        ? `The query refers to '${colName}', but no such column exists. Did you mean '${suggestion}'? Check for typos or verify the schema definition.`
        : `The column '${colName}' does not exist in any referenced table. Check your SELECT or WHERE clause for typos.`,
      rawMessage: msg,
      token: colName,
      line,
      column,
      suggestion: suggestion || undefined,
    };
  }

  // 2. Unknown Table (e.g., "no such table: Prducts")
  const noSuchTableMatch = msg.match(/no such table:\s*([a-zA-Z0-9_.$#]+)/i);
  if (noSuchTableMatch) {
    const tblName = noSuchTableMatch[1];
    const allTables = schema.map((t) => t.name);
    const suggestion = findClosestMatch(tblName, allTables);

    return {
      category: 'unknown_table',
      badgeLabel: 'Table Not Found',
      title: `Table '${tblName}' does not exist`,
      plainEnglishFix: suggestion
        ? `The database could not find table '${tblName}'. Did you mean '${suggestion}'?`
        : `The table '${tblName}' does not exist in this database dataset. Inspect the schema list for available tables.`,
      rawMessage: msg,
      token: tblName,
      line,
      column,
      suggestion: suggestion || undefined,
    };
  }

  // 3. Ambiguous Column (e.g., "ambiguous column name: id")
  const ambiguousMatch = msg.match(/ambiguous column name:\s*([a-zA-Z0-9_.$#]+)/i);
  if (ambiguousMatch) {
    const colName = ambiguousMatch[1];
    return {
      category: 'ambiguous_column',
      badgeLabel: 'Ambiguous Column',
      title: `Column '${colName}' is ambiguous`,
      plainEnglishFix: `Multiple tables in your JOIN contain '${colName}'. Prefix the column with its table name (e.g., TableName.${colName}) to resolve ambiguity.`,
      rawMessage: msg,
      token: colName,
      line,
      column,
    };
  }

  // 4. Syntax Error (e.g., "near \"WHERE\": syntax error" or "incomplete input")
  const syntaxMatch = msg.match(/near\s+["']([^"']+)["']:\s*syntax error/i);
  if (syntaxMatch) {
    const offendingToken = syntaxMatch[1];
    return {
      category: 'syntax_error',
      badgeLabel: 'Syntax Error',
      title: `SQL Syntax Error near '${offendingToken}'`,
      plainEnglishFix: `There is a syntax error right near '${offendingToken}'. Check for missing commas, unmatched parentheses, or incorrect keyword order.`,
      rawMessage: msg,
      token: offendingToken,
      line,
      column,
    };
  }

  if (/syntax error|incomplete input|unrecognized token/i.test(msg)) {
    return {
      category: 'syntax_error',
      badgeLabel: 'Syntax Error',
      title: 'SQL Syntax Error',
      plainEnglishFix: 'The SQL statement is incomplete or invalid. Check that all clauses (SELECT, FROM, WHERE, GROUP BY) are properly formatted and closed.',
      rawMessage: msg,
    };
  }

  // 5. Division by Zero / Arithmetic
  if (/division by zero|divide by zero/i.test(msg)) {
    return {
      category: 'division_by_zero',
      badgeLabel: 'Division by Zero',
      title: 'Math Evaluation Error: Division by Zero',
      plainEnglishFix: 'A calculation tried to divide by zero. Wrap denominators with NULLIF(denominator, 0) to avoid runtime division errors.',
      rawMessage: msg,
    };
  }

  // 6. Type Mismatch / Invalid Cast
  if (/datatype mismatch|type mismatch|cannot cast/i.test(msg)) {
    return {
      category: 'type_mismatch',
      badgeLabel: 'Type Mismatch',
      title: 'Data Type Incompatibility',
      plainEnglishFix: 'An operator or function was applied to an incompatible data type (e.g., arithmetic on string data). Check explicit conversions.',
      rawMessage: msg,
    };
  }

  // 7. Time Limit Exceeded / Interrupted
  if (/timed? ?out|interrupted|exceeded time/i.test(msg)) {
    return {
      category: 'timeout',
      badgeLabel: 'Time Limit Exceeded',
      title: 'Query Execution Timed Out',
      plainEnglishFix: 'Your query ran longer than the allowed engine timeout. Check for infinite recursive CTEs or unconstrained cross joins generating millions of rows.',
      rawMessage: msg,
    };
  }

  // 8. Unsupported / Permission
  if (/not authorized|read-only|unsupported/i.test(msg)) {
    return {
      category: 'unsupported_statement',
      badgeLabel: 'Statement Restricted',
      title: 'Restricted Statement',
      plainEnglishFix: 'Only query statements (SELECT, WITH) are evaluated during practice testing. Modifying schema or database internals is restricted.',
      rawMessage: msg,
    };
  }

  // Default Runtime Error
  return {
    category: 'runtime_error',
    badgeLabel: 'Runtime Error',
    title: 'SQL Execution Error',
    plainEnglishFix: 'An unexpected database error halted execution. Inspect the raw engine message below.',
    rawMessage: msg,
  };
}
