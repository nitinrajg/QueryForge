import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SessionTimerProps {
  className?: string;
}

/**
 * LeetCode-Style Interview Session Stopwatch.
 * 
 * Logic & Features:
 * - Accurately tracks elapsed practice time in `MM:SS` format.
 * - Start / Pause / Reset controls for mock interview benchmarking.
 * - Minimalist pill design with subtle hover states.
 */
export const SessionTimer: React.FC<SessionTimerProps> = ({ className }) => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setSeconds(0);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--raised)] border border-[var(--border)] text-xs font-mono text-[var(--muted)] select-none transition-colors',
        isActive ? 'text-[var(--accent)] border-[var(--accent)]/30' : '',
        className
      )}
      title="Practice Session Stopwatch"
    >
      <Clock className="h-3 w-3 shrink-0" />
      <span className="tabular-nums font-semibold tracking-tight">
        {formatTime(seconds)}
      </span>

      <div className="flex items-center gap-0.5 ml-0.5 border-l border-[var(--border)] pl-1">
        <button
          type="button"
          onClick={toggleTimer}
          className="p-0.5 rounded hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
          title={isActive ? 'Pause Timer' : 'Start Timer'}
          aria-label={isActive ? 'Pause Timer' : 'Start Timer'}
        >
          {isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </button>

        {seconds > 0 && (
          <button
            type="button"
            onClick={resetTimer}
            className="p-0.5 rounded hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            title="Reset Timer"
            aria-label="Reset Timer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
};
