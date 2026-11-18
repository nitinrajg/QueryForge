import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Cohesive Badge & Status Indicator Component.
 * 
 * Rules:
 * - Clear contrast for difficulty indicators and solve progress.
 * - Subtle background tints with matched borders to eliminate garish blocks.
 * - Perfectly aligned typography and dot indicators.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors select-none tabular-nums',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--raised)] border border-[var(--border)] text-[var(--muted)]',
        easy:
          'bg-[var(--pill-positive-bg)] border border-[var(--positive)]/30 text-[var(--positive)]',
        medium:
          'bg-[var(--pill-warning-bg)] border border-[var(--warning)]/30 text-[var(--warning)]',
        hard:
          'bg-[var(--pill-negative-bg)] border border-[var(--negative)]/30 text-[var(--negative)]',
        solved:
          'bg-[var(--pill-positive-bg)] border border-[var(--positive)]/30 text-[var(--positive)]',
        attempted:
          'bg-[var(--pill-warning-bg)] border border-[var(--warning)]/30 text-[var(--warning)]',
        neutral:
          'bg-[var(--pill-neutral-bg)] border border-[var(--border)] text-[var(--muted)]',
        accent:
          'bg-[var(--accent-subtle)] border border-[var(--accent)]/30 text-[var(--accent)]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'easy' || variant === 'solved'
              ? 'bg-[var(--positive)]'
              : variant === 'medium' || variant === 'attempted'
              ? 'bg-[var(--warning)]'
              : variant === 'hard'
              ? 'bg-[var(--negative)]'
              : variant === 'accent'
              ? 'bg-[var(--accent)]'
              : 'bg-[var(--muted)]'
          )}
        />
      )}
      {children}
    </div>
  );
}
