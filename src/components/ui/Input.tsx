import React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-[#222C55] bg-[#0B1020]/80 px-3.5 py-2 text-sm text-[#E6E9F5] placeholder:text-[#8B93B7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#0B1020]/80 dark:border-[#222C55] light:bg-white light:border-slate-300 light:text-slate-900 light:placeholder:text-slate-400 transition-colors',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

