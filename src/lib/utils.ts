/**
 * Formats a number with commas for display (e.g. 1000 → "1,000").
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Generates a slug from a string (lowercase, hyphenated).
 */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Truncates a string to a max length, appending "…" if needed.
 */
export function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…';
}

/**
 * Simple debounce utility.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
