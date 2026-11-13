import React, { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useThemeStore } from '@/store/useThemeStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useProgressStore } from '@/store/useProgressStore';

/**
 * Settings & Local Storage Management — Data Terminal.
 * 
 * Logic & Approach:
 * - Two-column row layout: left column contains setting name and description, right contains controls.
 * - Daylight and dark palette selector.
 * - CodeMirror editor font size selector with 1px accent indicator.
 * - Local-first data sovereignty: Progress JSON export/import and explicit two-step wipe confirmation.
 * - Pure client-side zero-telemetry guarantee.
 */
export const Settings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { fontSize, setFontSize } = useEditorStore();
  const { exportProgress, importProgress, resetAllProgress } = useProgressStore();

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
    a.download = `queryforge-progress-backup-${new Date().toISOString().split('T')[0]}.json`;
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

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 bg-[var(--bg)] text-[var(--ink)]">
      {/* Editorial Title */}
      <div className="space-y-2 pb-6 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)]">
            Preferences & Storage
          </span>
          <span className="text-[11px] text-[var(--muted)]">•</span>
          <span className="text-[11px] text-[var(--muted)]">Local Configuration</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal font-display tracking-tight text-[var(--ink)] leading-tight">
          Environment Settings
        </h1>
        <p className="text-xs text-[var(--muted)]">
          Configure interface presentation, editor sizing, and manage local IndexedDB records.
        </p>
      </div>

      {/* Two-Column Rows */}
      <div className="border border-[var(--border)] bg-[var(--surface)] divide-y divide-[var(--border)]">
        {/* Row 1: Interface Palette */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-medium text-[var(--ink)]">
              Interface Palette
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Switch between graphite dark terminal and high-contrast daylight mode.
            </p>
          </div>
          <div className="md:col-span-5 flex items-center md:justify-end gap-2">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 text-xs transition-colors cursor-pointer border rounded-none ${
                theme === 'dark'
                  ? 'bg-[var(--ground)] text-[var(--ink)] border-[var(--accent)] font-medium'
                  : 'bg-[var(--surface-app)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--ink)]'
              }`}
            >
              Graphite Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`px-3 py-1.5 text-xs transition-colors cursor-pointer border rounded-none ${
                theme === 'light'
                  ? 'bg-[var(--ground)] text-[var(--ink)] border-[var(--accent)] font-medium'
                  : 'bg-[var(--surface-app)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--ink)]'
              }`}
            >
              Daylight
            </button>
          </div>
        </div>

        {/* Row 2: Editor Typography Size */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-medium text-[var(--ink)]">
              CodeMirror Font Size
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Monospace text size for the code editor buffer.
            </p>
          </div>
          <div className="md:col-span-5 flex items-center md:justify-end gap-1.5">
            {[12, 13, 14, 16, 18].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => setFontSize(size)}
                className={`text-xs px-2.5 py-1 border rounded-none transition-colors cursor-pointer ${
                  fontSize === size
                    ? 'border-[var(--accent)] text-[var(--ink)] font-medium bg-[var(--ground)]'
                    : 'border-[var(--border)] text-[var(--muted)] hover:text-[var(--ink)] bg-[var(--surface-app)]'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Progress Backup & Data Sovereignty */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
          <div className="md:col-span-7 space-y-1">
            <h2 className="text-sm font-medium text-[var(--ink)]">
              Data Sovereignty
            </h2>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              All attempts, code drafts, solutions, and read states reside solely in your browser's IndexedDB. Export an offline snapshot or restore a backup.
            </p>
            {importStatus && (
              <p className="text-xs text-[var(--positive)] pt-1">
                {importStatus}
              </p>
            )}
          </div>
          <div className="md:col-span-5 flex flex-col sm:flex-row items-stretch md:justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              className="gap-2 text-xs rounded-none"
            >
              {exportNotice ? <Check className="h-3.5 w-3.5 text-[var(--positive)]" /> : <Download className="h-3.5 w-3.5" />}
              <span>{exportNotice ? 'Exported' : 'Export JSON'}</span>
            </Button>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2 text-xs rounded-none border-[var(--border)]"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Import JSON</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Row 4: Danger Zone */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-7 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--negative)] uppercase tracking-wider">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Danger Zone</span>
            </div>
            <p className="text-xs text-[var(--muted)]">
              Permanently wipe all saved solutions, progress timestamps, and query history from local memory.
            </p>
          </div>
          <div className="md:col-span-5 flex items-center md:justify-end">
            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleResetConfirm}
                  className="text-xs rounded-none"
                >
                  Confirm wipe
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                  className="text-xs text-[var(--muted)] rounded-none"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs rounded-none border-[var(--negative)] text-[var(--negative)] hover:bg-[var(--pill-negative-bg)]"
              >
                Reset All Progress
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
