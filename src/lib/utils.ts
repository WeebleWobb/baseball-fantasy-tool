import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { PlayerFilterType } from "@/types/hooks"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a player's display_position field into individual positions
 * @param displayPosition - The position string from Yahoo (e.g., "1B,OF", "2B,SS")
 * @returns Array of individual positions
 */
export function parsePlayerPositions(displayPosition: string): string[] {
  if (!displayPosition) return []
  
  return displayPosition
    .split(',')
    .map(pos => pos.trim())
    .filter(pos => pos.length > 0)
}

/**
 * Check if a player's positions match a specific filter
 * @param displayPosition - The position string from Yahoo
 * @param filterType - The filter to check against
 * @returns Whether the player matches the filter
 */
export function playerMatchesFilter(displayPosition: string, filterType: PlayerFilterType): boolean {
  const positions = parsePlayerPositions(displayPosition)
  
  switch (filterType) {
    case 'ALL_BATTERS':
      // All non-pitchers
      return !positions.some(pos => ['P', 'SP', 'RP'].includes(pos))
    
    case 'ALL_PITCHERS':
      // All pitchers
      return positions.some(pos => ['P', 'SP', 'RP'].includes(pos))
    
    case 'C':
      return positions.includes('C')
    
    case '1B':
      return positions.includes('1B')
    
    case '2B':
      return positions.includes('2B')
    
    case 'SS':
      return positions.includes('SS')
    
    case '3B':
      return positions.includes('3B')
    
    case 'OF':
      // Outfield grouping - includes LF, CF, RF, and generic OF
      return positions.some(pos => ['OF', 'LF', 'CF', 'RF'].includes(pos))
    
    case 'Util':
      // All non-pitchers that meet positional conditions (essentially same as ALL_BATTERS)
      return !positions.some(pos => ['P', 'SP', 'RP'].includes(pos))
    
    case 'SP':
      return positions.includes('SP') || positions.includes('P')
    
    case 'RP':
      return positions.includes('RP') || positions.includes('P')
    
    default:
      return false
  }
}

/**
 * Check if a player is a pitcher based on their positions
 * @param displayPosition - The position string from Yahoo
 * @returns Whether the player is a pitcher
 */
export function isPitcher(displayPosition: string): boolean {
  const positions = parsePlayerPositions(displayPosition)
  return positions.some(pos => ['P', 'SP', 'RP'].includes(pos))
}

/**
 * Check if a player is a batter (non-pitcher) based on their positions
 * @param displayPosition - The position string from Yahoo
 * @returns Whether the player is a batter
 */
export function isBatter(displayPosition: string): boolean {
  return !isPitcher(displayPosition)
}

/**
 * Get the primary position for a player (first position listed)
 * @param displayPosition - The position string from Yahoo
 * @returns The primary position or empty string
 */
export function getPrimaryPosition(displayPosition: string): string {
  const positions = parsePlayerPositions(displayPosition)
  return positions[0] || ''
}
