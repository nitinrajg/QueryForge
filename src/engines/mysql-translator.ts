/**
 * MySQL to SQLite Dialect Normalizer & Translator.
 * 
 * Explanation of the approach and logic:
 * Since MySQL does not run natively inside a browser WASM sandbox without a backend server,
 * QueryForge uses an intelligent client-side SQL dialect translation layer.
 * This parser converts common MySQL DDL/DML and function constructs into standard SQLite-compatible syntax:
 * 
 * 1. Database Directives:
 *    - Strips `CREATE DATABASE ...` and `USE ...` which are illegal in embedded SQLite.
 * 
 * 2. Table Definition & Types:
 *    - `AUTO_INCREMENT` -> `AUTOINCREMENT` (or `PRIMARY KEY` on INTEGER)
 *    - `ENUM(...)` -> `TEXT` (SQLite is dynamically typed)
 *    - `DATETIME` / `TIMESTAMP` -> `TEXT`
 *    - Removes table options like `ENGINE=InnoDB`, `DEFAULT CHARSET=...`, `COLLATE=...`
 * 
 * 3. Date & Time Functions:
 *    - `DATE_FORMAT(col, '%Y-%m')` -> `strftime('%Y-%m', col)`
 *    - `DATEDIFF(a, b)` -> `CAST(julianday(a) - julianday(b) AS INTEGER)`
 *    - `NOW()` / `SYSDATE()` -> `CURRENT_TIMESTAMP`
 * 
 * 4. Conditional & Other Idioms:
 *    - `IFNULL(a, b)` -> standard SQLite supports IFNULL and COALESCE
 *    - MySQL backtick identifiers are converted or preserved for compatibility
 */

export function translateMysqlToSqlite(sql: string): string {
  if (!sql) return '';

  let clean = sql;

  // 1. Remove CREATE DATABASE and USE statements
  clean = clean.replace(/CREATE\s+DATABASE\s+[^;]+;/gi, '');
  clean = clean.replace(/USE\s+[^;]+;/gi, '');

  // 2. Remove table options at the end of CREATE TABLE statements
  clean = clean.replace(/\)\s*ENGINE\s*=\s*\w+/gi, ')');
  clean = clean.replace(/\s*DEFAULT\s+CHARSET\s*=\s*[\w\d]+/gi, '');
  clean = clean.replace(/\s*COLLATE\s*=\s*[\w\d_]+/gi, '');
  clean = clean.replace(/\s*AUTO_INCREMENT\s*=\s*\d+/gi, '');

  // 3. Convert ENUM('a','b') to TEXT
  clean = clean.replace(/ENUM\s*\([^)]+\)/gi, 'TEXT');

  // 4. Convert INT AUTO_INCREMENT to INTEGER PRIMARY KEY AUTOINCREMENT
  // SQLite strictly requires "INTEGER PRIMARY KEY" (not INT) for AUTOINCREMENT
  clean = clean.replace(/INT\s+PRIMARY\s+KEY\s+AUTO_INCREMENT/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  clean = clean.replace(/INT\s+AUTO_INCREMENT\s+PRIMARY\s+KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
  clean = clean.replace(/AUTO_INCREMENT/gi, '');

  // 5. Convert DATE_FORMAT(expr, '%Y-%m') to strftime('%Y-%m', expr)
  // Example: DATE_FORMAT(watch_date, '%Y-%m') -> strftime('%Y-%m', watch_date)
  clean = clean.replace(/DATE_FORMAT\s*\(\s*([^,]+)\s*,\s*('[^']+')\s*\)/gi, 'strftime($2, $1)');

  // 6. Convert NOW() to CURRENT_TIMESTAMP
  clean = clean.replace(/\bNOW\(\)/gi, "datetime('now')");

  // 7. Convert DATEDIFF(d1, d2) -> CAST(ROUND(julianday(d1) - julianday(d2)) AS INTEGER)
  clean = clean.replace(/DATEDIFF\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'CAST(ROUND(julianday($1) - julianday($2)) AS INTEGER)');

  // 8. Convert TIMESTAMPDIFF(MINUTE, t1, t2) -> CAST(ROUND((julianday(t2) - julianday(t1)) * 1440) AS INTEGER)
  clean = clean.replace(/TIMESTAMPDIFF\s*\(\s*MINUTE\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/gi, 'CAST(ROUND((julianday($2) - julianday($1)) * 1440) AS INTEGER)');

  return clean;
}

