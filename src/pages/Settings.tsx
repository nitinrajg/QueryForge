import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Check, 
  AlertTriangle, 
  Sun, 
  Moon, 
  Cpu, 
  Database, 
  Trash2,
  Shield,
  FileCode
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/useThemeStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useProgressStore } from '@/store/useProgressStore';

/**
 * Cohesive Settings & Local Storage Management.
 * 
 * Rules:
 * - Preference sections with clear descriptions and controls.
 * - Daylight vs Graphite dark palette switcher.
 * - Code editor font size configuration.
 * - Local-first data sovereignty: Export, Import, and safe Wipe with confirmation.
 */
export const Settings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { fontSize, setFontSize } = useEditorStore();
  const { exportProgress, importProgress, resetAllProgress, activities, problems } = useProgressStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportNotice, setExportNotice] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = async () => {
    const jsonStr = await exportProgress();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `queryforge-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const success = await importProgress(text);
      if (success) {
        setImportStatus('Progress imported successfully.');
      } else {
        setImportStatus('Invalid JSON format. Import aborted.');
      }
    } catch (err) {
      setImportStatus('Error reading import file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setImportStatus(null), 4000);
    }
  };

  const handleResetConfirm = async () => {
    await resetAllProgress();
    setShowResetConfirm(false);
  };

  const solvedCount = Object.values(problems).filter((p) => p.status === 'solved').length;

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)] text-left">
      {/* Title */}
      <div className="space-y-1 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--accent)]">
            Preferences & Telemetry
          </span>
          <span className="text-[11px] text-[var(--faint)]">•</span>
          <span className="text-[11px] text-[var(--muted)] font-mono">Local Storage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight text-[var(--ink)]">
          Environment Settings
        </h1>
        <p className="text-xs text-[var(--muted)]">
          Manage interface theme, editor typography, and local IndexedDB state.
        </p>
      </div>

      {/* Settings Sections */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)] overflow-hidden shadow-xs">
        {/* Section 1: Interface Palette */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Interface Palette
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Choose between Obsidian dark mode and high-contrast daylight theme.
            </p>
          </div>

          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2">
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                theme === 'dark'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs'
                  : 'bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Moon className="h-4 w-4" />
              <span>Obsidian Dark</span>
            </button>

            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors duration-150 cursor-pointer ${
                theme === 'light'
                  ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-xs'
                  : 'bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              <Sun className="h-4 w-4" />
              <span>Daylight</span>
            </button>
          </div>
        </div>

        {/* Section 2: Code Editor Font Size */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              SQL Editor Font Size
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Adjust CodeMirror editor font scale in pixels.
            </p>
          </div>

          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-1.5">
            {[12, 13, 14, 16].map((size) => (
              <button
                key={size}
                onClick={() => setFontSize(size)}
                className={`w-10 h-9 rounded-lg text-xs font-mono transition-colors duration-150 cursor-pointer ${
                  fontSize === size
                    ? 'bg-[var(--accent)] text-[var(--accent-ink)] font-bold shadow-xs'
                    : 'bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Data Export / Import */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-semibold text-[var(--ink)]">
              Data Sovereignty & Backups
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Download your solved problems, draft codes, and timestamps as a portable JSON file.
            </p>
            <div className="pt-1 flex items-center gap-3 text-[11px] text-[var(--muted)] font-mono">
              <span>{solvedCount} solved</span>
              <span>•</span>
              <span>{activities.length} activity logs</span>
            </div>
          </div>

          <div className="md:col-span-5 flex items-center justify-start md:justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="gap-1.5 text-xs"
            >
              {exportNotice ? <Check className="h-3.5 w-3.5 text-[var(--positive)]" /> : <Download className="h-3.5 w-3.5" />}
              <span>{exportNotice ? 'Exported!' : 'Export JSON'}</span>
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import JSON</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {importStatus && (
          <div className="px-6 py-3 bg-[var(--raised)] text-xs text-[var(--ink)] flex items-center gap-2">
            <Check className="h-4 w-4 text-[var(--positive)]" />
            <span>{importStatus}</span>
          </div>
        )}

        {/* Section 4: Wipe Local Data */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-semibold text-[var(--negative)]">
              Reset Learning Records
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Permanently delete all locally persisted solved problems, drafts, and attempt logs.
            </p>
          </div>

          <div className="md:col-span-5 flex items-center justify-start md:justify-end">
            {!showResetConfirm ? (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="gap-1.5 text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Wipe All Progress</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleResetConfirm}
                  className="text-xs font-semibold"
                >
                  Confirm Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* System Specifications Card */}
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-app)] space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
          <Cpu className="h-4 w-4 text-[var(--accent)]" />
          <span>Execution Engine Telemetry</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <span className="text-[11px] text-[var(--muted)] block">SQLite Engine</span>
            <span className="font-mono font-semibold text-[var(--ink)] block">v3.45.0 WASM</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <span className="text-[11px] text-[var(--muted)] block">Persistence Layer</span>
            <span className="font-mono font-semibold text-[var(--ink)] block">Dexie.js IndexedDB</span>
          </div>
          <div className="p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)] space-y-1">
            <span className="text-[11px] text-[var(--muted)] block">Network Calls</span>
            <span className="font-mono font-semibold text-[var(--positive)] block">0 requests (Client-side)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
