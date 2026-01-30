import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility to merge Tailwind classes consistently across the app.
// This function ensures proper class merging and conflict resolution.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

