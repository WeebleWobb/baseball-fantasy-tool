/**
 * Utilities for parsing and normalizing player names.
 * Used by both CSV import and export functionality.
 */

/**
 * Remove parenthetical suffixes like "(Batter)" or "(Pitcher)"
 */
export function cleanName(name: string): string {
  return name.replace(/\s*\([^)]*\)\s*$/, '').trim();
}

/**
 * Split a full name into first and last name parts.
 * Handles multi-word first names (e.g., "Juan Carlos" -> firstName: "Juan Carlos")
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const cleaned = cleanName(fullName);
  const parts = cleaned.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  const lastName = parts.pop() || '';
  const firstName = parts.join(' ');
  return { firstName, lastName };
}

/**
 * Strip diacritical marks (accents) from a string.
 * "José Ramírez" → "Jose Ramirez"
 */
export function stripDiacritics(str: string): string {
  return str.normalize('NFD').replaceAll(/[̀-ͯ]/g, '');
}

/**
 * Normalize a name for comparison (lowercase, strip accents, remove suffixes like Jr., III, etc.)
 */
export function normalizeName(name: string): string {
  return stripDiacritics(cleanName(name))
    .toLowerCase()
    .replace(/\s+(jr\.?|sr\.?|i{1,3}|iv|v)$/i, '')
    .trim();
}
