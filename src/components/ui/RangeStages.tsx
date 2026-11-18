import React from 'react';
import { cn } from '@/lib/cn';

interface RangeStagesProps {
  stage: number; // 0, 1, 2, 3
  onStageChange: (stage: number) => void;
  className?: string;
}

/**
 * 4-Stage Range Controller for the 'How it works' interactive presentation.
 * Uses an 8px track, 32px square accent thumb, and 4 stop positions.
 */
export const RangeStages: React.FC<RangeStagesProps> = ({
  stage,
  onStageChange,
  className,
}) => {
  const stageLabels = ['Read theory', 'Run query', 'Check output', 'Track mastery'];

  return (
    <div data-ui="range-stages" className={cn('w-full space-y-3', className)}>
      <div className="relative flex items-center h-10 w-full">
        {/* 8px Track */}
        <div className="relative w-full h-2 bg-[var(--rule)] rounded-none">
          {/* Active fill (Hardware-Accelerated ScaleX) */}
          <div
            className="h-full w-full bg-[var(--accent)] origin-left transition-transform duration-150 ease-out will-change-transform"
            style={{ transform: `scaleX(${stage / 3})` }}
          />

          {/* 4 Discrete Stop Marks */}
          {[0, 1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStageChange(s)}
              className={cn(
                'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-none transition-colors duration-150 cursor-pointer',
                s <= stage ? 'bg-[var(--accent)]' : 'bg-[var(--control)]'
              )}
              style={{ left: `calc(${((s / 3) * 100)}% - 6px)` }}
              aria-label={`Jump to stage ${s + 1}: ${stageLabels[s]}`}
            />
          ))}
        </div>

        {/* 32px Square Accent Thumb */}
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={stage}
          onChange={(e) => onStageChange(parseInt(e.target.value, 10))}
          className="absolute inset-0 w-full h-8 opacity-0 cursor-pointer z-10"
          aria-label="Progress stage slider"
        />

        <div
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-none bg-[var(--accent)] text-[var(--accent-ink)] flex items-center justify-center font-bold text-xs select-none shadow-sm transition-[left] duration-150 ease-out"
          style={{ left: `calc(${((stage / 3) * 100)}% - 16px)` }}
        >
          {stage + 1}
        </div>
      </div>

      {/* Stage Labels Row */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-xs">
        {stageLabels.map((lbl, idx) => (
          <button
            key={lbl}
            type="button"
            onClick={() => onStageChange(idx)}
            className={cn(
              'text-left transition-colors cursor-pointer py-1',
              idx === stage
                ? 'text-[var(--ink)] font-semibold border-b border-[var(--accent)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            <span>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

