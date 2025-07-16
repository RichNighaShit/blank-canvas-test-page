import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for conditionally joining classNames together and merging Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for proper Tailwind class merging
 *
 * @param inputs - Array of class values (strings, objects, arrays, etc.)
 * @returns Merged and deduplicated class string
 *
 * @example
 * ```tsx
 * cn("text-red-500", "text-blue-500") // Returns: "text-blue-500" (last one wins)
 * cn("px-4", { "py-2": true, "m-2": false }) // Returns: "px-4 py-2"
 * cn(["text-sm", "font-bold"], undefined, null) // Returns: "text-sm font-bold"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
