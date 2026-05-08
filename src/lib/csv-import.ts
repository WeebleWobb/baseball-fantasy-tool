/**
 * CSV import utilities for draft list.
 * Handles parsing CSV files and matching player names against available players.
 */

import Papa from 'papaparse';
import { normalizeName } from './name-utils';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';
import type { StoredDraftPlayer } from '@/types/draft-list';

// File validation constants
export const MAX_FILE_SIZE = 1024 * 1024; // 1MB
export const ALLOWED_EXTENSIONS = ['.csv', '.txt'];
export const ALLOWED_MIME_TYPES = ['text/csv', 'text/plain', 'application/vnd.ms-excel'];

// Import format types - matches export formats
export type ImportLayout = 'multi-first-last' | 'multi-last-first' | 'single';

export const IMPORT_OPTIONS: { value: ImportLayout; label: string; description: string }[] = [
  {
    value: 'multi-first-last',
    label: '2 Columns',
    description: 'First name, Last name | Team',
  },
  {
    value: 'multi-last-first',
    label: '2 Columns',
    description: 'Last name, First name | Team',
  },
  {
    value: 'single',
    label: 'Single Column',
    description: 'First name Last name, Team',
  },
];

export interface ParsedCSVRow {
  name: string;
  team?: string;
  rawRow: string[];
}

export interface MatchResult {
  parsed: ParsedCSVRow;
  matched: PlayerWithRank | null;
  confidence: 'exact' | 'fuzzy' | 'none';
}

export interface CSVParseResult {
  success: true;
  rows: ParsedCSVRow[];
}

export interface CSVParseError {
  success: false;
  error: string;
}

export type ParseResult = CSVParseResult | CSVParseError;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file before parsing
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large (max 1MB)' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));

  // Check MIME type
  const hasValidMimeType = ALLOWED_MIME_TYPES.includes(file.type) || file.type === '';

  if (!hasValidExtension && !hasValidMimeType) {
    return { valid: false, error: 'Please upload a CSV file' };
  }

  return { valid: true };
}

/**
 * Detect which column contains player names based on content analysis
 */
function detectNameColumn(rows: string[][]): number {
  if (rows.length === 0 || rows[0].length === 0) return 0;

  // If single column, it's the name column
  if (rows[0].length === 1) return 0;

  // For multi-column, assume first column is name unless it looks like a rank
  const firstColValues = rows.slice(0, Math.min(5, rows.length)).map((r) => r[0]);
  const allNumeric = firstColValues.every((v) => /^\d+$/.test(v.trim()));

  // If first column is all numbers, it's probably a rank column, so name is column 1
  return allNumeric ? 1 : 0;
}

/**
 * Detect which column contains team abbreviations
 */
function detectTeamColumn(rows: string[][], nameCol: number): number | null {
  if (rows.length === 0 || rows[0].length <= 1) return null;

  // Common team column positions relative to name
  const possibleTeamCols = [nameCol + 1, rows[0].length - 1].filter(
    (col) => col !== nameCol && col < rows[0].length && col >= 0
  );

  for (const col of possibleTeamCols) {
    const values = rows.slice(0, Math.min(5, rows.length)).map((r) => r[col]?.trim() || '');
    // Team abbrs are typically 2-3 characters
    const looksLikeTeam = values.every((v) => v.length >= 2 && v.length <= 4);
    if (looksLikeTeam) return col;
  }

  return null;
}

/**
 * Check if a row looks like a header row
 */
function isHeaderRow(row: string[]): boolean {
  const headerPatterns = /^(name|player|first|last|team|pos|position|rank|#)$/i;
  return row.some((cell) => headerPatterns.test(cell.trim()));
}

/**
 * Parse a single-column format like "First Last, Team"
 */
function parseSingleColumnFormat(value: string): { name: string; team?: string } {
  const trimmed = value.trim();

  // Check for "Name, Team" format (split on last comma)
  const lastCommaIndex = trimmed.lastIndexOf(',');
  if (lastCommaIndex > 0) {
    const namePart = trimmed.substring(0, lastCommaIndex).trim();
    const teamPart = trimmed.substring(lastCommaIndex + 1).trim();

    // Team abbreviations are typically 2-4 chars
    if (teamPart.length >= 2 && teamPart.length <= 4) {
      return { name: namePart, team: teamPart };
    }
  }

  return { name: trimmed };
}

/**
 * Parse a multi-column row based on the selected layout format
 */
function parseMultiColumnRow(
  row: string[],
  nameCol: number,
  teamCol: number | null,
  layout: 'multi-first-last' | 'multi-last-first'
): { name: string; team?: string } {
  let name = row[nameCol]?.trim() || '';
  const team = teamCol !== null ? row[teamCol]?.trim() : undefined;

  // Handle comma in name column based on selected format
  if (name.includes(',')) {
    const [part1, part2] = name.split(',').map((s) => s.trim());
    // multi-first-last: "First, Last" -> "First Last"
    // multi-last-first: "Last, First" -> "First Last"
    name = layout === 'multi-first-last' ? `${part1} ${part2}` : `${part2} ${part1}`;
  }

  return { name, team };
}

/**
 * Parse a single row based on the selected layout format
 */
function parseRow(
  row: string[],
  layout: ImportLayout,
  nameCol: number,
  teamCol: number | null
): { name: string; team?: string } | null {
  // Skip empty rows
  const hasContent = row.some((cell) => cell.trim());
  if (!hasContent) return null;

  if (layout === 'single') {
    return parseSingleColumnFormat(row[0]);
  }

  return parseMultiColumnRow(row, nameCol, teamCol, layout);
}

/**
 * Parse CSV content and extract player rows based on selected format
 */
export function parseCSV(content: string, layout: ImportLayout): ParseResult {
  const result = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0) {
    const errorMsg = result.errors[0].message || 'Unable to parse file';
    return { success: false, error: errorMsg };
  }

  const rows = result.data;
  if (rows.length === 0) {
    return { success: false, error: 'No player data found in file' };
  }

  // Skip header row if detected
  const startIndex = isHeaderRow(rows[0]) ? 1 : 0;
  const dataRows = rows.slice(startIndex);
  if (dataRows.length === 0) {
    return { success: false, error: 'No player data found in file' };
  }

  // Detect column structure for multi-column formats
  const nameCol = detectNameColumn(dataRows);
  const teamCol = detectTeamColumn(dataRows, nameCol);

  const parsedRows: ParsedCSVRow[] = [];

  for (const row of dataRows) {
    const parsed = parseRow(row, layout, nameCol, teamCol);
    if (parsed?.name) {
      parsedRows.push({ ...parsed, rawRow: row });
    }
  }

  if (parsedRows.length === 0) {
    return { success: false, error: 'Could not identify player names in file' };
  }

  return { success: true, rows: parsedRows };
}

/**
 * Match parsed CSV rows against available players
 */
export function matchPlayers(
  parsedRows: ParsedCSVRow[],
  availablePlayers: PlayerWithRank[]
): MatchResult[] {
  // Build lookup maps for efficient matching
  const byNormalizedFullName = new Map<string, PlayerWithRank>();
  const byLastNameAndTeam = new Map<string, PlayerWithRank>();

  for (const player of availablePlayers) {
    const normalizedFull = normalizeName(player.name.full);
    byNormalizedFullName.set(normalizedFull, player);

    const normalizedLast = normalizeName(player.name.last);
    const teamKey = `${normalizedLast}|${player.editorial_team_abbr.toLowerCase()}`;
    byLastNameAndTeam.set(teamKey, player);
  }

  return parsedRows.map((parsed) => {
    const normalizedName = normalizeName(parsed.name);

    // Try exact match on full name
    const exactMatch = byNormalizedFullName.get(normalizedName);
    if (exactMatch) {
      return { parsed, matched: exactMatch, confidence: 'exact' as const };
    }

    // Try last name + team match if team provided
    if (parsed.team) {
      // Extract last name from parsed name
      const nameParts = parsed.name.trim().split(/\s+/);
      const lastName = nameParts[nameParts.length - 1];
      const normalizedLast = normalizeName(lastName);
      const teamKey = `${normalizedLast}|${parsed.team.toLowerCase()}`;

      const teamMatch = byLastNameAndTeam.get(teamKey);
      if (teamMatch) {
        return { parsed, matched: teamMatch, confidence: 'exact' as const };
      }
    }

    return { parsed, matched: null, confidence: 'none' as const };
  });
}

/**
 * Convert matched players to StoredDraftPlayer format
 */
export function toStoredPlayers(
  matches: MatchResult[],
  startingRank: number = 1
): StoredDraftPlayer[] {
  return matches
    .filter((m): m is MatchResult & { matched: PlayerWithRank } => m.matched !== null)
    .map((m, index) => ({
      player_key: m.matched.player_key,
      name: m.matched.name.full,
      team: m.matched.editorial_team_abbr,
      position: m.matched.display_position,
      originalRank: startingRank + index,
    }));
}

/**
 * Filter out players that already exist in the draft list
 */
export function filterDuplicates(
  matches: MatchResult[],
  existingPlayerKeys: Set<string>
): {
  newMatches: MatchResult[];
  duplicateCount: number;
} {
  const newMatches: MatchResult[] = [];
  let duplicateCount = 0;

  for (const match of matches) {
    if (match.matched && existingPlayerKeys.has(match.matched.player_key)) {
      duplicateCount++;
    } else {
      newMatches.push(match);
    }
  }

  return { newMatches, duplicateCount };
}
