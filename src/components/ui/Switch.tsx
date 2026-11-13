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
 * Data-Terminal Switch Component.
 * Minimal tactile toggle with flat square indicator and 1px accent feedback.
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
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-none border border-[var(--control)] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
        checked ? 'bg-[var(--accent)]' : 'bg-[var(--raised)]',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-none transition-transform duration-150',
          checked
            ? 'translate-x-5 bg-[var(--accent-ink)]'
            : 'translate-x-0 bg-[var(--muted)]'
        )}
      />
    </button>
  );
};
