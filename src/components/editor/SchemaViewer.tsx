import React, { useState } from 'react';
import { TableSchema } from '@/engines/types';
import { ChevronDown, ChevronRight, Search, Key, Database, Hash, X } from 'lucide-react';

interface SchemaViewerProps {
  schema: TableSchema[];
}

/**
 * Cohesive Database Schema Inspector.
 * 
 * Rules:
 * - Clear table cards with row counts and column type tags.
 * - Key icon for Primary Keys with subtle accent highlight.
 * - Interactive filter with instant clear.
 */
export const SchemaViewer: React.FC<SchemaViewerProps> = ({ schema }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({
    [schema[0]?.name || '']: true,
  });

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const filteredSchema = schema.filter((table) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const tableMatch = table.name.toLowerCase().includes(query);
    const columnMatch = table.columns.some((c) => c.name.toLowerCase().includes(query));
    return tableMatch || columnMatch;
  });

  if (!schema || schema.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-[var(--muted)] border border-dashed border-[var(--border)] rounded-lg">
        <Database className="h-6 w-6 text-[var(--faint)] mx-auto mb-2" strokeWidth={1.5} />
        <p className="font-medium text-[var(--ink)]">No Active Schema</p>
        <p className="text-[11px] text-[var(--muted)] mt-1">Load a dataset or execute DDL to inspect tables.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Title & counter */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-[var(--muted)]">
        <div className="flex items-center gap-1.5 font-medium text-[var(--ink)]">
          <Database className="h-4 w-4 text-[var(--accent)]" strokeWidth={2} />
          <span>Introspected Schema</span>
        </div>
        <span className="tabular-nums font-mono text-[11px] px-2 py-0.5 bg-[var(--raised)] border border-[var(--border)] rounded">
          {schema.length} {schema.length === 1 ? 'table' : 'tables'}
        </span>
      </div>

      {/* Filter */}
      {schema.length > 1 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search tables or columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-md bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)]"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* Table list */}
      <div className="space-y-2">
        {filteredSchema.map((table) => {
          const isExpanded = !!expandedTables[table.name] || Boolean(searchQuery);
          return (
            <div
              key={table.name}
              className="border border-[var(--border)] rounded-lg bg-[var(--surface)] overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => toggleTable(table.name)}
                className="w-full flex items-center justify-between p-2.5 text-left text-xs font-medium text-[var(--ink)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                  )}
                  <span className="font-mono text-xs font-semibold text-[var(--ink)] truncate">{table.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[var(--muted)] tabular-nums font-mono">
                    {table.columns.length} cols
                  </span>
                  {table.rowCount !== undefined && (
                    <span className="text-[10px] text-[var(--muted)] tabular-nums font-mono px-1.5 py-0.5 bg-[var(--raised)] rounded">
                      {table.rowCount} rows
                    </span>
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-2.5 pt-1 border-t border-[var(--border)] bg-[var(--surface-app)]">
                  <div className="space-y-1 divide-y divide-[var(--rule)]">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between py-1.5 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {col.primaryKey ? (
                            <span title="Primary Key" className="flex items-center text-[var(--accent)]">
                              <Key className="h-3 w-3" />
                            </span>
                          ) : (
                            <Hash className="h-3 w-3 text-[var(--faint)]" />
                          )}
                          <span className="font-mono text-[11px] text-[var(--ink)] truncate font-medium">
                            {col.name}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[var(--muted)] bg-[var(--raised)] px-1.5 py-0.5 rounded border border-[var(--border)] uppercase">
                          {col.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
