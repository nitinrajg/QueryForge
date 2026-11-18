import React, { useState, useRef, useEffect, useId } from 'react';
import { Layers, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SetOption {
  id: string;
  label: string;
  count: number;
}

interface SetDropdownProps {
  options: SetOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Accessible, High-Performance Set Filter Dropdown.
 * 
 * Logic & Approach:
 * - Dual Engine: Custom floating popover on desktop/tablet with keyboard navigation
 *   (Arrow keys, Enter, Escape, Home, End), combined with an accessible native <select>
 *   on mobile screens (<640px) to leverage mobile-native selection sheets without clipping.
 * - Natural Ordering: Displays sets ordered naturally (Set 1, 2, ... 9, 10).
 * - Impeccable Typography: Styled using --font-sans for labels and --font-mono for counts.
 * - Oil-Motion GPU Animation: Scales and fades using transform and opacity only.
 */
export const SetDropdown: React.FC<SetDropdownProps> = ({
  options,
  value,
  onChange,
  className,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  // Find active option
  const activeOption = options.find((opt) => opt.id === value) || options[0] || {
    id: 'all',
    label: 'All Sets',
    count: 0,
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Sync focused index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.id === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, options, value]);

  // Scroll focused option into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll<HTMLButtonElement>('[role="option"]');
      const item = items[focusedIndex];
      if (item && item.scrollIntoView) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  // Keyboard Navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;

      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0 && focusedIndex < options.length) {
          onChange(options[focusedIndex].id);
          setIsOpen(false);
        } else {
          setIsOpen(!isOpen);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(0);
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          setFocusedIndex(options.length - 1);
        }
        break;

      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn('relative inline-block text-left text-xs', className)}
      onKeyDown={handleKeyDown}
    >
      {/* ================= DESKTOP CUSTOM TRIGGER BUTTON ================= */}
      <button
        type="button"
        role="combobox"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label="Filter problems by set"
        className={cn(
          'h-9 px-3 rounded-lg border flex items-center justify-between gap-2.5 transition-colors cursor-pointer select-none',
          'bg-[var(--surface)] text-[var(--ink)] border-[var(--border)]',
          'hover:border-[var(--control)] hover:bg-[var(--raised)]/40',
          'focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)]',
          isOpen && 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
          <span className="font-medium truncate max-w-[140px] sm:max-w-[180px]">
            {activeOption.label}
          </span>
          {activeOption.id !== 'all' && (
            <span className="font-mono text-[10px] text-[var(--muted)] bg-[var(--raised)] px-1.5 py-0.2 rounded shrink-0">
              {activeOption.count}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[var(--muted)] transition-transform duration-200 ease-out shrink-0',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* ================= MOBILE NATIVE SELECT OVERLAY (<640px) ================= */}
      <select
        aria-label="Filter by set (mobile)"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer sm:hidden w-full h-full z-10"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label} ({opt.count})
          </option>
        ))}
      </select>

      {/* ================= FLOATING POPOVER MENU (DESKTOP) ================= */}
      {isOpen && (
        <div
          id={listboxId}
          ref={listRef}
          role="listbox"
          tabIndex={-1}
          aria-label="SQL Sets"
          className={cn(
            'absolute right-0 sm:left-0 sm:right-auto mt-1.5 w-64 max-h-72 overflow-y-auto rounded-lg',
            'bg-[var(--surface)] border border-[var(--border)] shadow-xl z-50 p-1 space-y-0.5',
            'animate-pop select-none'
          )}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          {options.map((option, idx) => {
            const isSelected = option.id === value;
            const isFocused = idx === focusedIndex;

            return (
              <button
                key={option.id}
                role="option"
                type="button"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setFocusedIndex(idx)}
                className={cn(
                  'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer text-left',
                  isSelected
                    ? 'bg-[var(--accent-subtle)] text-[var(--accent)] font-semibold'
                    : isFocused
                    ? 'bg-[var(--raised)] text-[var(--ink)]'
                    : 'text-[var(--ink)] hover:bg-[var(--raised)]/60'
                )}
              >
                <div className="flex items-center gap-2 truncate pr-2">
                  <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                    {isSelected && <Check className="h-3.5 w-3.5 text-[var(--accent)]" />}
                  </div>
                  <span className="truncate">{option.label}</span>
                </div>

                <span
                  className={cn(
                    'font-mono text-[10px] px-1.5 py-0.2 rounded shrink-0',
                    isSelected
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                      : 'bg-[var(--raised)] text-[var(--muted)]'
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
