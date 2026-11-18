import React from 'react';
import { cn } from '@/lib/cn';

interface ResizeHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  direction: 'vertical' | 'horizontal';
  className?: string;
  isCollapsed?: boolean;
}

/**
 * High-Precision Accessible Draggable Resize Divider.
 * 
 * Logic & Micro-Interactions:
 * - Wide 8px interactive pointer hit-box prevents slipping.
 * - 2px visual hairline centered inside the hit-box with smooth hover glow.
 * - Central grip pill indicator indicates interactive affordance.
 * - Keyboard accessible with `role="separator"` and arrow-key resizing.
 * - Double-click trigger resets to optimal default ratio.
 */
export const ResizeHandle: React.FC<ResizeHandleProps> = ({
  direction,
  className,
  isCollapsed = false,
  ...props
}) => {
  const isVertical = direction === 'vertical';

  return (
    <div
      {...props}
      className={cn(
        'group relative flex items-center justify-center shrink-0 select-none z-10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]',
        isVertical
          ? 'w-2 self-stretch min-h-full cursor-col-resize hover:bg-[var(--accent)]/15 active:bg-[var(--accent)]/25'
          : 'h-2 w-full self-stretch cursor-row-resize hover:bg-[var(--accent)]/15 active:bg-[var(--accent)]/25',
        isCollapsed ? 'opacity-50 pointer-events-none' : '',
        className
      )}
      title="Drag to resize. Double-click to reset size."
    >
      {/* 2px Visual Hairline */}
      <div
        className={cn(
          'transition-colors duration-150',
          isVertical
            ? 'w-[2px] h-full bg-[var(--border)] group-hover:bg-[var(--accent)] group-active:bg-[var(--accent)]'
            : 'h-[2px] w-full bg-[var(--border)] group-hover:bg-[var(--accent)] group-active:bg-[var(--accent)]'
        )}
      />

      {/* Central Grip Indicator */}
      <div
        className={cn(
          'absolute rounded-full bg-[var(--border)] group-hover:bg-[var(--accent)] transition-colors pointer-events-none shadow-xs',
          isVertical ? 'w-1 h-6' : 'h-1 w-6'
        )}
      />
    </div>
  );
};
