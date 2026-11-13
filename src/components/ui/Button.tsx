import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * High-Craft Button Primitive.
 * 
 * Philosophy:
 * - Tactile physical response on active (`active:scale-[0.98]`).
 * - Hairline 1px border with inner edge highlight.
 * - Monospace micro-details for engineering posture.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-cyan-500 text-[#07090E] font-bold shadow-[0_1px_12px_rgba(6,182,212,0.25)] hover:bg-cyan-400 hover:shadow-[0_1px_16px_rgba(6,182,212,0.4)] border border-cyan-300/40',
        secondary:
          'bg-[#121826] text-[#F1F5F9] border border-[#1C2438] hover:bg-[#182033] hover:border-[#2A3654] shadow-sm light:bg-slate-100 light:text-slate-900 light:border-slate-300 light:hover:bg-slate-200',
        outline:
          'border border-[#1C2438] bg-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#0C1019] hover:border-[#2A3654] light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100',
        ghost:
          'text-[#7E8B9F] hover:text-[#F1F5F9] hover:bg-[#121826]/70 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100',
        success:
          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 shadow-sm',
        danger:
          'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 shadow-sm',
        link: 'text-cyan-400 underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 rounded-md px-2.5 text-[11px]',
        lg: 'h-11 rounded-xl px-5 text-sm',
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
