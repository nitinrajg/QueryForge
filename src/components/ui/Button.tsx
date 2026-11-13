import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * Data Terminal Button.
 * 
 * Rules:
 * - One shape: square-cornered (rounded-none).
 * - Flat solid fills, no glows, no gradients, no borders on default.
 * - Tactile active:scale-[0.98] press feedback.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--accent)] text-[var(--accent-ink)] font-semibold hover:opacity-95',
        secondary:
          'bg-[var(--raised)] text-[var(--text)] hover:bg-[var(--control)]',
        outline:
          'border border-[var(--border)] bg-transparent text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]',
        ghost:
          'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--raised)]',
        danger:
          'text-[var(--muted)] hover:text-[var(--negative)] hover:bg-[var(--raised)]',
        link:
          'text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-9 px-4 py-2 text-xs',
        sm: 'h-7 px-2.5 text-xs',
        lg: 'h-11 px-5 text-sm',
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
