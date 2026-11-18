import React from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Cohesive Tactile Switch Component.
 * 
 * Rules:
 * - Rounded pill track (`rounded-full`) with smooth sliding thumb.
 * - Warm Forge Flame active state with high visual contrast.
 */
export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  id,
  className,
  'aria-label': ariaLabel = 'Toggle feature',
}) => {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      data-ui="switch"
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-[var(--border)] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]',
        checked ? 'bg-[var(--accent)] border-[var(--accent)]' : 'bg-[var(--raised)]',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
};
