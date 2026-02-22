import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a magic code for a soap batch in the format MMDD-xxxxxx,
 * where MMDD is the current month/day and the suffix is a 6-character
 * alphanumeric identifier.
 */
export function generateMagicCode(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const suffix = Array.from(randomBytes(6))
    .map(b => chars[b % chars.length])
    .join('')
  return `${month}${day}-${suffix}`
}

/**
 * Formats a Date (or ISO date string) as YYYY-MM-DD.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toISOString().split('T')[0]
}
