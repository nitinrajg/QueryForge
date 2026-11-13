import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Data Terminal Indicator & Badge.
 * 
 * Rules:
 * - Difficulty is plain sentence-case text (Easy / Medium / Hard) without tinted chip borders.
 * - Status pills (Solved, Attempted) use flat pill tokens exclusively in list rows.
 * - No icon-in-tinted-square.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 text-xs font-normal select-none',
  {
    variants: {
      variant: {
        default:
          'text-[var(--muted)]',
        easy:
          'text-[var(--positive)]',
        medium:
          'text-[var(--warning)]',
        hard:
          'text-[var(--negative)]',
        solved:
          'bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)] px-2 py-0.5 rounded-none font-medium text-[12px]',
        attempted:
          'bg-[var(--pill-warning-bg)] text-[var(--pill-warning-ink)] px-2 py-0.5 rounded-none font-medium text-[12px]',
        neutral:
          'bg-[var(--pill-neutral-bg)] text-[var(--pill-neutral-ink)] px-2 py-0.5 rounded-none font-medium text-[12px]',
        accent:
          'text-[var(--accent)] font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
