import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges Tailwind CSS class names efficiently, resolving conflicts.
 * 
 * @param inputs - Array of class values, objects, or conditional arrays
 * @returns The merged class name string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
