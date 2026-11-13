import React, { useState, useRef } from 'react';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Download, 
  Upload, 
  RotateCcw, 
  ShieldCheck, 
  Check, 
  AlertTriangle,
  Type
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useThemeStore } from '@/store/useThemeStore';
import { useEditorStore } from '@/store/useEditorStore';
import { useProgressStore } from '@/store/useProgressStore';

/**
 * Settings & Data Management Page.
 * 
 * Logic & Approach:
 * - Theme configuration (light/dark mode toggle).
 * - CodeMirror editor preferences (font size adjustments).
 * - Local data management: exports progress as valid JSON file, imports backup JSON,
 *   or wipes all local IndexedDB records with explicit user confirmation.
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
        setImportStatus('Progress imported successfully!');
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
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-8 bg-[#07090E]">
      {/* Header */}
      <div className="space-y-2 pb-6 border-b border-[#1C2438]">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/30 font-semibold uppercase">
            Preferences
          </span>
        </div>
        <h1 className="text-3xl font-extrabold font-heading tracking-tight text-[#F1F5F9] light:text-slate-900">
          Environment Settings
        </h1>
        <p className="text-xs text-[#94A3B8] font-mono">
          Manage interface aesthetics, CodeMirror editor parameters, and IndexedDB state.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Theme Configuration */}
        <Card className="p-6 space-y-4 bg-[#0C1019] border-[#1C2438]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-[#F1F5F9] light:text-slate-900 uppercase tracking-wide">
                Interface Palette
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Switch between high-contrast obsidian dark cockpit and clean daylight mode.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-lg border border-[#1C2438]">
              <Button
                variant={theme === 'dark' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('dark')}
                className={`gap-2 text-xs font-mono ${theme === 'dark' ? 'bg-[#06B6D4] text-[#07090E]' : 'text-[#94A3B8]'}`}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </Button>
              <Button
                variant={theme === 'light' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTheme('light')}
                className={`gap-2 text-xs font-mono ${theme === 'light' ? 'bg-[#06B6D4] text-[#07090E]' : 'text-[#94A3B8]'}`}
              >
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Light</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* 2. Editor Configuration */}
        <Card className="p-6 space-y-4 bg-[#0C1019] border-[#1C2438]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-[#F1F5F9] light:text-slate-900 uppercase tracking-wide">
                Editor Typography Size
              </h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Set CodeMirror code editor font size in pixels.
              </p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#07090E] p-1 rounded-lg border border-[#1C2438]">
              {[12, 13, 14, 16, 18].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFontSize(size)}
                  className={`font-mono text-xs px-3 py-1.5 rounded transition-colors cursor-pointer ${
                    fontSize === size
                      ? 'bg-[#161F30] text-[#22D3EE] border border-[#26354D]'
                      : 'text-[#94A3B8] hover:text-[#F1F5F9]'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* 3. Progress Backup & Data Sovereignty */}
        <Card className="p-6 space-y-6 bg-[#0C1019] border-[#1C2438]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold font-heading text-[#F1F5F9] light:text-slate-900 uppercase tracking-wide">
                100% Client-Side Data Sovereignty
              </h3>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Your attempts, drafts, solutions, and completion times are stored exclusively in your browser's IndexedDB.
              We collect 0 telemetry. You can export or restore your data at any time.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="secondary"
              onClick={handleExport}
              className="gap-2 text-xs font-mono h-11 justify-center border-[#1C2438] bg-[#07090E] hover:bg-[#121826]"
            >
              {exportNotice ? <Check className="h-4 w-4 text-emerald-400" /> : <Download className="h-4 w-4 text-[#06B6D4]" />}
              <span>{exportNotice ? 'Export Downloaded!' : 'Export Progress JSON'}</span>
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
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2 text-xs font-mono h-11 justify-center border-[#1C2438] bg-[#07090E] hover:bg-[#121826]"
              >
                <Upload className="h-4 w-4 text-[#06B6D4]" />
                <span>Import Progress JSON</span>
              </Button>
            </div>
          </div>

          {importStatus && (
            <p className="text-xs text-center font-mono text-[#06B6D4] bg-[#06B6D4]/10 py-1.5 rounded border border-[#06B6D4]/20">
              {importStatus}
            </p>
          )}

          {/* Dangerous Action: Reset Database */}
          <div className="pt-6 border-t border-[#1C2438] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
                Danger Zone
              </h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Wipe all saved solutions, history, and streaks from IndexedDB.
              </p>
            </div>

            {showResetConfirm ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleResetConfirm}
                  className="text-xs font-mono bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Reset
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResetConfirm(false)}
                  className="text-xs font-mono text-[#94A3B8]"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="text-xs font-mono border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
              >
                Reset All Progress
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
