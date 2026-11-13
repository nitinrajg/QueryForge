import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Micro-Badge for technical metadata, difficulty ratings, and execution stats.
 */
export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono font-medium tracking-wide border select-none transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[#1C2438] bg-[#0C1019] text-[#94A3B8]',
        outline:
          'border-[#1C2438] text-[#7E8B9F] bg-transparent',
        easy:
          'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold',
        medium:
          'border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold',
        hard:
          'border-rose-500/30 bg-rose-500/10 text-rose-400 font-semibold',
        accent:
          'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-semibold',
        primary:
          'border-cyan-500/40 bg-cyan-950/30 text-cyan-300 font-semibold',
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
