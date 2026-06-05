import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names, resolving conflicts intelligently.
 * `cn('px-2', condition && 'px-4')` → `'px-4'` when condition is truthy.
 *
 * @param inputs - class values (strings, arrays, conditional objects)
 * @returns a single, de-duplicated class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
