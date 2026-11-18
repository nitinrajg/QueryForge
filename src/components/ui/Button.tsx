import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Cohesive Product Button Component.
 * 
 * Rules:
 * - Subtle 6px corner radius (`rounded-md`) for tactile modern craftsmanship.
 * - Clear visual hierarchy across primary, secondary, outline, ghost, and danger variants.
 * - Active micro-press feedback (`active:scale-[0.98]`).
 * - Accessible keyboard focus ring utilizing `--accent`.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium transition-[color,background-color,border-color,opacity,box-shadow,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold shadow-sm hover:bg-[var(--accent-hover)]',
        secondary:
          'bg-[var(--raised)] border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--surface)] hover:border-[var(--control)]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)] hover:border-[var(--control)]',
        ghost:
          'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]',
        danger:
          'bg-[var(--pill-negative-bg)] text-[var(--negative)] border border-[var(--negative)]/20 hover:bg-[var(--negative)] hover:text-white',
        success:
          'bg-[var(--pill-positive-bg)] text-[var(--positive)] border border-[var(--positive)]/20 hover:bg-[var(--positive)] hover:text-white',
        link:
          'text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs',
        sm: 'h-7 px-2.5 text-xs',
        lg: 'h-10 px-5 text-sm font-medium',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
