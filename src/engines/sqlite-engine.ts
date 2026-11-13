import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { EngineInterface, QueryResult, TableSchema, SupportedEngine } from './types';
import { translateMysqlToSqlite } from './mysql-translator';

/**
 * In-Browser SQLite Engine powered by sql.js WebAssembly.
 * 
 * Detailed explanation of approach and logic:
 * 1. WebAssembly Initialization:
 *    Loads `/sql-wasm.wasm` from the public directory. Keeps a singleton SQL instance.
 * 2. Database Session Management:
 *    Creates an in-memory SQLite database (`new SQL.Database()`).
 *    When `loadDataset(sql)` is called, the dataset SQL is first run through the dialect translator
 *    to strip MySQL-only directives (like `USE database;` and `AUTO_INCREMENT`) and executed.
 * 3. Query Execution & Benchmarking:
 *    Measures exact wall-clock execution time (`performance.now()`) to return real latency metrics (`timeMs`).
 * 4. Schema Introspection:
 *    Queries `sqlite_master` and `PRAGMA table_info()` so the CodeMirror editor can provide
 *    intelligent, schema-aware autocomplete for table and column names.
 */
export class SqliteEngine implements EngineInterface {
  public id: SupportedEngine = 'sqlite';
  public name = 'SQLite (WASM)';
  public isReady = false;

  private sqlModule: SqlJsStatic | null = null;
  private db: Database | null = null;
  private currentDatasetSql = '';

  constructor(id: SupportedEngine = 'sqlite', name = 'SQLite (WASM)') {
    this.id = id;
    this.name = name;
  }

  async init(): Promise<void> {
    if (this.isReady && this.db) return;

    try {
      if (!this.sqlModule) {
        this.sqlModule = await initSqlJs({
          locateFile: () => sqlWasmUrl,
        });
      }
      this.db = new this.sqlModule.Database();
      this.isReady = true;
    } catch (err: any) {
      console.error('Failed to initialize SQLite WASM engine:', err);
      throw new Error(`SQLite initialization failed: ${err.message || err}`);
    }
  }

  async loadDataset(sql: string): Promise<void> {
    await this.init();
    if (!this.db || !this.sqlModule) throw new Error('Engine not initialized');

    this.currentDatasetSql = sql;
    // Reset database to a clean slate before loading
    this.db.close();
    this.db = new this.sqlModule.Database();

    if (!sql || sql.trim().length === 0) return;

    const translatedSql = translateMysqlToSqlite(sql);
    try {
      this.db.run(translatedSql);
    } catch (err: any) {
      console.error('Error loading dataset into SQLite:', err);
      // Still attempt executing statement by statement if bulk execution threw on comments or delimiters
      const statements = translatedSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        try {
          this.db.run(stmt);
        } catch (innerErr) {
          // Log non-fatal error on harmless comments or empty statements
          console.warn('Ignored statement error in dataset seed:', stmt, innerErr);
        }
      }
    }
  }

  async run(code: string): Promise<QueryResult> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    const trimmed = code.trim();
    if (!trimmed) {
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        timeMs: 0,
      };
    }

    const translated = this.id === 'mysql' ? translateMysqlToSqlite(trimmed) : trimmed;
    const start = performance.now();

    try {
      const results = this.db.exec(translated);
      const timeMs = Math.round((performance.now() - start) * 100) / 100;

      if (!results || results.length === 0) {
        // e.g. DDL / DML commands (CREATE, INSERT, UPDATE, DELETE)
        return {
          columns: [],
          rows: [],
          rowCount: 0,
          timeMs,
        };
      }

      // Return the output of the last statement in the execution
      const lastResult = results[results.length - 1];
      return {
        columns: lastResult.columns || [],
        rows: (lastResult.values || []) as any[][],
        rowCount: lastResult.values ? lastResult.values.length : 0,
        timeMs,
      };
    } catch (err: any) {
      const timeMs = Math.round((performance.now() - start) * 100) / 100;
      return {
        columns: [],
        rows: [],
        rowCount: 0,
        timeMs,
        error: err.message || String(err),
      };
    }
  }

  async reset(): Promise<void> {
    if (this.currentDatasetSql) {
      await this.loadDataset(this.currentDatasetSql);
    } else if (this.db && this.sqlModule) {
      this.db.close();
      this.db = new this.sqlModule.Database();
    }
  }

  cancel(): void {
    // For synchronous single-threaded sql.js execution, reset reinitializes cleanly
  }

  async getSchema(): Promise<TableSchema[]> {
    if (!this.db) return [];

    try {
      const tablesRes = this.db.exec(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';"
      );
      if (!tablesRes.length || !tablesRes[0].values) return [];

      const tables: TableSchema[] = [];
      for (const row of tablesRes[0].values) {
        const tableName = String(row[0]);
        const colRes = this.db.exec(`PRAGMA table_info("${tableName}");`);
        const columns = colRes.length && colRes[0].values
          ? colRes[0].values.map((c) => ({
              name: String(c[1]),
              type: String(c[2]),
              primaryKey: Boolean(c[5]),
            }))
          : [];

        // Count rows
        let rowCount = 0;
        try {
          const countRes = this.db.exec(`SELECT COUNT(*) FROM "${tableName}";`);
          if (countRes.length && countRes[0].values?.[0]?.[0] !== undefined) {
            rowCount = Number(countRes[0].values[0][0]);
          }
        } catch (e) {}

        tables.push({
          name: tableName,
          columns,
          rowCount,
        });
      }

      return tables;
    } catch (err) {
      console.warn('Error inspecting SQLite schema:', err);
      return [];
    }
  }
}
