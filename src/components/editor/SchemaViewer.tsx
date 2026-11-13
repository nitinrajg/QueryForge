import React, { useState } from 'react';
import { TableSchema } from '@/engines/types';
import { Database, Table, ChevronDown, ChevronRight, Hash, Type, Calendar, Search } from 'lucide-react';

interface SchemaViewerProps {
  schema: TableSchema[];
}

/**
 * Interactive Database Schema Inspector.
 * 
 * Logic & Approach:
 * - Introspects relational database tables loaded into the WebAssembly engine.
 * - Displays active tables, columns, primary keys, and data types with visual iconography.
 * - Supports search filtering across table names and column names for large schemas.
 * - Collapsible table tree with smooth transitions and persistent state.
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

  const getColIcon = (type: string) => {
    const lower = type.toLowerCase();
    if (lower.includes('int') || lower.includes('numeric') || lower.includes('dec') || lower.includes('float')) {
      return <Hash className="h-3 w-3 text-[#22D3EE]" />;
    }
    if (lower.includes('date') || lower.includes('time')) {
      return <Calendar className="h-3 w-3 text-[#F59E0B]" />;
    }
    return <Type className="h-3 w-3 text-[#10B981]" />;
  };

  if (!schema || schema.length === 0) {
    return (
      <div className="p-6 text-center text-[#94A3B8] text-xs">
        <Database className="h-6 w-6 mx-auto mb-2 opacity-30 text-[#06B6D4]" />
        <p className="font-mono">No active tables found in current session.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      {/* Header bar with counter */}
      <div className="flex items-center justify-between text-[#94A3B8] px-1 pb-1 border-b border-[#1C2438]">
        <div className="flex items-center gap-1.5">
          <Database className="h-3.5 w-3.5 text-[#06B6D4]" />
          <span className="font-mono uppercase tracking-wider text-[10px] text-[#F1F5F9] font-bold">
            Schema Explorer
          </span>
        </div>
        <span className="font-mono text-[10px] bg-[#161F30] px-2 py-0.5 rounded text-[#22D3EE] border border-[#26354D]">
          {schema.length} table{schema.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Search Input for columns & tables */}
      {schema.length > 3 && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#64748B]" />
          <input
            type="text"
            placeholder="Filter tables or columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1.5 rounded-lg bg-[#07090E] border border-[#1C2438] text-[11px] font-mono text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#06B6D4]"
          />
        </div>
      )}

      {/* Tables list */}
      <div className="space-y-2">
        {filteredSchema.map((table) => {
          const isExpanded = !!expandedTables[table.name] || Boolean(searchQuery);
          return (
            <div
              key={table.name}
              className="border border-[#1C2438] rounded-xl overflow-hidden bg-[#0C1019] transition-colors light:border-slate-200 light:bg-slate-50"
            >
              <button
                type="button"
                onClick={() => toggleTable(table.name)}
                className="w-full flex items-center justify-between p-2.5 text-left font-medium text-[#F1F5F9] hover:bg-[#121826] transition-colors light:text-slate-900 light:hover:bg-slate-100 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
                  )}
                  <Table className="h-3.5 w-3.5 text-[#06B6D4] shrink-0" />
                  <span className="font-mono font-semibold text-xs truncate">{table.name}</span>
                </div>
                {table.rowCount !== undefined && (
                  <span className="text-[10px] text-[#64748B] font-mono shrink-0 ml-2">
                    {table.rowCount} rows
                  </span>
                )}
              </button>

              {isExpanded && (
                <div className="px-3 pb-2.5 pt-1 border-t border-[#1C2438]/80 bg-[#07090E]/60 light:bg-white light:border-slate-200">
                  <div className="space-y-1 divide-y divide-[#1C2438]/40">
                    {table.columns.map((col) => (
                      <div
                        key={col.name}
                        className="flex items-center justify-between py-1 text-[11px]"
                      >
                        <div className="flex items-center gap-1.5 font-mono text-[#CBD5E1] light:text-slate-800 min-w-0">
                          {getColIcon(col.type)}
                          <span className="truncate">{col.name}</span>
                          {col.primaryKey && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono">
                              PK
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-[#64748B] shrink-0 ml-2">
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
