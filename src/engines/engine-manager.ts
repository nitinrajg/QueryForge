import { EngineInterface, SupportedEngine, QueryResult, TableSchema } from './types';
import { SqliteEngine } from './sqlite-engine';

/**
 * Global Engine Registry & Lifecycle Manager.
 * 
 * Logic & Architecture:
 * - Lazily instantiates and caches engines on first selection.
 * - Handles engine switching, dataset synchronization, and schema introspection.
 * - Provides graceful fallbacks and descriptive status notices for MySQL compatibility mode.
 */
class EngineManager {
  private engines: Map<SupportedEngine, EngineInterface> = new Map();
  private activeEngineId: SupportedEngine = 'sqlite';
  private currentDatasetSql = '';

  constructor() {
    // Register SQLite and MySQL compatibility engines initially
    this.engines.set('sqlite', new SqliteEngine('sqlite', 'SQLite (WASM)'));
    this.engines.set('mysql', new SqliteEngine('mysql', 'MySQL (compatibility mode)'));
  }

  getActiveEngineId(): SupportedEngine {
    return this.activeEngineId;
  }

  async setActiveEngine(id: SupportedEngine): Promise<EngineInterface> {
    this.activeEngineId = id;
    let engine = this.engines.get(id);

    if (!engine) {
      if (id === 'pglite') {
        // Fallback: PGlite compatibility layer
        engine = new SqliteEngine('pglite', 'PostgreSQL (compatibility mode)');
        this.engines.set(id, engine);
      } else if (id === 'pandas') {
        engine = new SqliteEngine('pandas', 'pandas (SQL bridge mode)');
        this.engines.set(id, engine);
      } else {
        engine = this.engines.get('sqlite')!;
      }
    }

    if (!engine.isReady) {
      await engine.init();
    }

    if (this.currentDatasetSql) {
      await engine.loadDataset(this.currentDatasetSql);
    }

    return engine;
  }

  async getEngine(id?: SupportedEngine): Promise<EngineInterface> {
    const targetId = id || this.activeEngineId;
    let engine = this.engines.get(targetId);
    if (!engine) {
      return this.setActiveEngine(targetId);
    }
    if (!engine.isReady) {
      await engine.init();
    }
    return engine;
  }

  async loadDataset(sql: string): Promise<void> {
    this.currentDatasetSql = sql;
    const engine = await this.getEngine();
    await engine.loadDataset(sql);
  }

  async run(code: string): Promise<QueryResult> {
    const engine = await this.getEngine();
    return engine.run(code);
  }

  async reset(): Promise<void> {
    const engine = await this.getEngine();
    await engine.reset();
  }

  async getSchema(): Promise<TableSchema[]> {
    const engine = await this.getEngine();
    return engine.getSchema();
  }
}

export const engineManager = new EngineManager();

