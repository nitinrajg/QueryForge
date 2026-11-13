import React, { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, highlightSpecialChars, drawSelection, dropCursor } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { sql, StandardSQL, MySQL, PostgreSQL, SQLite } from '@codemirror/lang-sql';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
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
 * Logic & Features:
 * - Dynamically configures schema autocompletion based on introspected tables/columns.
 * - Supports keyboard shortcut `Ctrl+Enter` / `Cmd+Enter` to execute queries immediately.
 * - Reactive to app theme (matches OneDark in dark mode vs clean light theme).
 * - Proper line numbers, bracket matching, history undo/redo, and tab indentation.
 */
export const SqlEditor: React.FC<SqlEditorProps> = ({
  value,
  onChange,
  onRun,
  schema = [],
  engine = 'sqlite',
  fontSize = 14,
  readOnly = false,
  minHeight = '240px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { theme } = useThemeStore();

  // Pick dialect
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

  // Convert schema into CodeMirror autocompletion schema format: { [tableName]: [col1, col2] }
  const buildSchemaCompleter = () => {
    const tableDict: Record<string, string[]> = {};
    for (const t of schema) {
      tableDict[t.name] = t.columns.map((c) => c.name);
    }
    return tableDict;
  };

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

    const sqlExtension = sql({
      dialect: getDialect(),
      schema: buildSchemaCompleter(),
      upperCaseKeywords: true,
    });

    const themeExtension = EditorView.theme({
      '&': {
        height: '100%',
        fontSize: `${fontSize}px`,
        fontFamily: "'JetBrains Mono', monospace",
        backgroundColor: theme === 'dark' ? '#0B1020' : '#FFFFFF',
      },
      '.cm-scroller': {
        overflow: 'auto',
        minHeight,
      },
      '.cm-content': {
        caretColor: '#6366F1',
      },
      '&.cm-focused .cm-cursor': {
        borderLeftColor: '#6366F1',
      },
      '&.cm-focused .cm-selectionBackground, ::selection': {
        backgroundColor: theme === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
      },
      '.cm-gutters': {
        backgroundColor: theme === 'dark' ? '#080C18' : '#F8FAFC',
        color: theme === 'dark' ? '#4A5578' : '#94A3B8',
        border: 'none',
        borderRight: theme === 'dark' ? '1px solid #172044' : '1px solid #E2E8F0',
      },
      '.cm-activeLine': {
        backgroundColor: theme === 'dark' ? 'rgba(23, 32, 68, 0.4)' : 'rgba(241, 245, 249, 0.6)',
      },
      '.cm-activeLineGutter': {
        backgroundColor: theme === 'dark' ? 'rgba(23, 32, 68, 0.7)' : 'rgba(226, 232, 240, 0.6)',
        color: '#6366F1',
      },
    });

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
        autocompletion(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        theme === 'dark' ? oneDark : [],
        themeExtension,
        sqlExtension,
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
  }, [theme, engine, fontSize, minHeight]);

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
      className="w-full h-full border border-[#222C55] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 light:border-slate-200"
    />
  );
};

