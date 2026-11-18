import React, { useEffect, useRef } from 'react';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import { 
  EditorView, 
  keymap, 
  lineNumbers, 
  highlightActiveLineGutter, 
  highlightSpecialChars, 
  drawSelection, 
  dropCursor 
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { sql, MySQL, PostgreSQL, SQLite } from '@codemirror/lang-sql';
import { 
  autocompletion, 
  completionKeymap, 
  closeBrackets, 
  closeBracketsKeymap,
  CompletionContext,
  CompletionResult
} from '@codemirror/autocomplete';
import { bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { oneDark } from '@codemirror/theme-one-dark';
import { useThemeStore } from '@/store/useThemeStore';
import { TableSchema, SupportedEngine } from '@/engines/types';

interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun?: () => void;
  schema?: TableSchema[];
  engine?: SupportedEngine;
  fontSize?: number;
  readOnly?: boolean;
  minHeight?: string;
}

/**
 * Professional in-browser CodeMirror 6 SQL Editor.
 * 
 * Logic & Approach:
 * - Dynamic Schema Autocompletion:
 *   In SQL, columns are frequently typed in `SELECT <col>` before the `FROM <table>` clause exists.
 *   Standard context-sensitive completers cannot resolve the active table at that stage.
 *   We inject both CodeMirror's table-scoped schema and a global schema completer facet
 *   so columns and tables autocompletes seamlessly as you type.
 * - Reactive Compartments:
 *   Uses CodeMirror Compartments for dynamic dialect, schema, and theme reconfigurations
 *   without tearing down the EditorView or losing cursor / undo history.
 * - Fast Execution Shortcut:
 *   Supports `Ctrl+Enter` / `Cmd+Enter` to run the query immediately.
 */
export const SqlEditor: React.FC<SqlEditorProps> = ({
  value,
  onChange,
  onRun,
  schema = [],
  engine = 'sqlite',
  fontSize = 13,
  readOnly = false,
  minHeight = '100%',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { theme } = useThemeStore();

  // Compartments for dynamic reconfiguration
  const sqlCompartment = useRef(new Compartment()).current;
  const themeCompartment = useRef(new Compartment()).current;

  // Pick SQL dialect based on active engine
  const getDialect = () => {
    switch (engine) {
      case 'mysql':
        return MySQL;
      case 'pglite':
        return PostgreSQL;
      case 'sqlite':
      default:
        return SQLite;
    }
  };

  // Build SQL extension with both table-scoped schema and global column completer
  const buildSqlExtension = (activeEngine: SupportedEngine, currentSchema: TableSchema[]): Extension => {
    let dialect = SQLite;
    if (activeEngine === 'mysql') dialect = MySQL;
    if (activeEngine === 'pglite') dialect = PostgreSQL;

    // 1. Table-scoped dictionary: { [tableName]: [col1, col2] }
    const tableDict: Record<string, string[]> = {};
    for (const t of currentSchema) {
      tableDict[t.name] = t.columns.map((c) => c.name);
    }

    const baseSql = sql({
      dialect,
      schema: tableDict,
      upperCaseKeywords: true,
    });

    // 2. Global column and table autocompleter
    const globalCompleter = (context: CompletionContext): CompletionResult | null => {
      const word = context.matchBefore(/[\w.]*/);
      if (!word || (word.from === word.to && !context.explicit)) return null;

      const options: any[] = [];
      const seen = new Set<string>();

      for (const table of currentSchema) {
        // Table name completion
        const tableKey = `tbl:${table.name.toLowerCase()}`;
        if (!seen.has(tableKey)) {
          seen.add(tableKey);
          options.push({
            label: table.name,
            type: 'class',
            detail: 'table',
            boost: 1.5,
          });
        }

        // Column name completions
        for (const col of table.columns) {
          const colKey = `col:${col.name.toLowerCase()}:${table.name.toLowerCase()}`;
          if (!seen.has(colKey)) {
            seen.add(colKey);
            options.push({
              label: col.name,
              type: 'property',
              detail: `${col.type ? col.type.toLowerCase() : 'column'} (${table.name})`,
              boost: 1.2,
            });
          }
        }
      }

      if (options.length === 0) return null;

      return {
        from: word.from,
        options,
        validFor: /^[\w.]*$/,
      };
    };

    return [
      baseSql,
      dialect.language.data.of({ autocomplete: globalCompleter }),
    ];
  };

  // Build theme styling extension
  const buildThemeExtension = (currentTheme: string, size: number, height: string): Extension => {
    const isDark = currentTheme === 'dark';

    const customTheme = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${size}px`,
        fontFamily: "'JetBrains Mono', monospace",
        backgroundColor: isDark ? '#0f1013' : '#ffffff',
        color: isDark ? '#f1f5f9' : '#0f172a',
      },
      '.cm-scroller': {
        overflow: 'auto',
        minHeight: height,
        fontFamily: "'JetBrains Mono', monospace",
      },
      '.cm-content': {
        padding: '12px 0',
        caretColor: '#f97316',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: '#f97316',
        borderLeftWidth: '2px',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: isDark ? 'rgba(249, 115, 22, 0.25)' : 'rgba(249, 115, 22, 0.18)',
      },
      '.cm-gutters': {
        backgroundColor: isDark ? '#141518' : '#f8fafc',
        color: isDark ? '#525866' : '#94a3b8',
        border: 'none',
        borderRight: isDark ? '1px solid #242830' : '1px solid #e2e8f0',
        paddingRight: '6px',
      },
      '.cm-lineNumbers .cm-gutterElement': {
        minWidth: '32px',
        textAlign: 'right',
        fontSize: '11px',
      },
      '.cm-activeLine': {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: isDark ? '#1a1c22' : '#f1f5f9',
        color: '#f97316',
        fontWeight: '600',
      },
    });

    return [isDark ? oneDark : [], customTheme];
  };

  // Mount editor once on container attachment
  useEffect(() => {
    if (!editorRef.current) return;

    // Keyboard shortcut for query execution: Ctrl/Cmd + Enter
    const runKeymap = keymap.of([
      {
        key: 'Mod-Enter',
        run: () => {
          if (onRun) {
            onRun();
            return true;
          }
          return false;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        dropCursor(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          defaultKeymap: true,
          icons: true,
        }),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        themeCompartment.of(buildThemeExtension(theme, fontSize, minHeight)),
        sqlCompartment.of(buildSqlExtension(engine, schema)),
        runKeymap,
        keymap.of([...defaultKeymap, ...historyKeymap, ...completionKeymap, ...closeBracketsKeymap, indentWithTab]),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  // Dynamically reconfigure SQL engine and schema when they change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: sqlCompartment.reconfigure(buildSqlExtension(engine, schema)),
    });
  }, [engine, JSON.stringify(schema)]);

  // Dynamically reconfigure theme when theme, fontSize, or minHeight change
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: themeCompartment.reconfigure(buildThemeExtension(theme, fontSize, minHeight)),
    });
  }, [theme, fontSize, minHeight]);

  // Sync external value changes without losing cursor
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      className="w-full h-full rounded-lg border border-[var(--border)] overflow-hidden focus-within:border-[var(--accent)] focus-within:ring-1 focus-within:ring-[var(--accent)] transition-colors bg-[var(--surface-app)]"
    />
  );
};
