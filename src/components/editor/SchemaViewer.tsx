import React, { useState } from 'react';
import { TableSchema } from '@/engines/types';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SchemaViewerProps {
  schema: TableSchema[];
}

/**
 * Data Terminal Schema Viewer.
 * Simple, legible table inspector with search filtering and column types in plain text.
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
      <div className="p-4 text-center text-xs text-[var(--muted)]">
        No active tables in current database session.
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Title & counter */}
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] text-[var(--muted)]">
        <span className="font-normal text-[var(--text)]">Database schema</span>
        <span className="tabular-nums">{schema.length} tables</span>
      </div>

      {/* Search */}
      {schema.length > 2 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Filter tables or columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-none bg-[var(--surface-app)] border border-[var(--border)] text-xs text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      )}

      {/* Table list */}
      <div className="space-y-1">
        {filteredSchema.map((table) => {
          const isExpanded = !!expandedTables[table.name] || Boolean(searchQuery);
          return (
            <div
              key={table.name}
              className="border border-[var(--border)] bg-[var(--surface-app)]"
            >
              <button
                type="button"
                onClick={() => toggleTable(table.name)}
                className="w-full flex items-center justify-between p-2.5 text-left text-xs font-normal text-[var(--text)] hover:bg-[var(--raised)] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                  )}
                  <span className="font-mono text-xs truncate">{table.name}</span>
                </div>
                {table.rowCount !== undefined && (
                  <span className="text-[11px] text-[var(--muted)] tabular-nums shrink-0 ml-2">
                    {table.rowCount} rows
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-2.5 pt-1 border-t border-[var(--rule)] bg-[var(--ground)]">
                  <div className="space-y-1 divide-y divide-[var(--rule)]">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between py-1 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs text-[var(--text)] truncate">{col.name}</span>
                          {col.primaryKey && (
                            <span className="text-[10px] text-[var(--accent)] font-mono">
                              PK
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--muted)] shrink-0 ml-2">
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
