import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Avatar initials. Words are considered before any are taken, so
 * "Hall & Sons" is HS rather than H&: a token that does not start with a
 * letter or digit never spends one of the slots. Unicode-aware, so Núñez
 * keeps its Ñ. Falls back to the first character at all when nothing
 * qualifies, rather than an empty bubble.
 */
export function initials(name: string, max = 2): string {
  const words = name
    .split(/\s+/)
    .filter((w) => /^[\p{L}\p{N}]/u.test(w))
  if (words.length === 0) return name.trim().slice(0, 1).toUpperCase()
  return words
    .slice(0, max)
    .map((w) => w[0].toUpperCase())
    .join("")
}
