import { 
  parsePlayerPositions, 
  playerMatchesFilter, 
  isPitcher, 
  isBatter, 
  getPrimaryPosition,
  cn 
} from '@/lib/utils'
import type { PlayerFilterType } from '@/types/hooks'

describe('utils.ts - Position and Filter Utilities', () => {
  
  describe('parsePlayerPositions', () => {
    it('should parse position strings correctly', () => {
      expect(parsePlayerPositions('C')).toEqual(['C'])
      expect(parsePlayerPositions('1B,OF')).toEqual(['1B', 'OF'])
      expect(parsePlayerPositions('1B, OF')).toEqual(['1B', 'OF']) // With spaces
      expect(parsePlayerPositions('C,,1B')).toEqual(['C', '1B']) // Malformed
      expect(parsePlayerPositions('')).toEqual([])
    })
  })

  describe('playerMatchesFilter', () => {
    describe('ALL_BATTERS filter', () => {
      it('should match non-pitcher positions', () => {
        expect(playerMatchesFilter('C', 'ALL_BATTERS')).toBe(true)
        expect(playerMatchesFilter('1B', 'ALL_BATTERS')).toBe(true)
        expect(playerMatchesFilter('2B,SS', 'ALL_BATTERS')).toBe(true)
        expect(playerMatchesFilter('OF', 'ALL_BATTERS')).toBe(true)
        expect(playerMatchesFilter('LF,CF,RF', 'ALL_BATTERS')).toBe(true)
      })

      it('should not match pitcher positions', () => {
        expect(playerMatchesFilter('P', 'ALL_BATTERS')).toBe(false)
        expect(playerMatchesFilter('SP', 'ALL_BATTERS')).toBe(false)
        expect(playerMatchesFilter('RP', 'ALL_BATTERS')).toBe(false)
        expect(playerMatchesFilter('1B,P', 'ALL_BATTERS')).toBe(false)
        expect(playerMatchesFilter('OF,SP', 'ALL_BATTERS')).toBe(false)
      })
    })

    describe('ALL_PITCHERS filter', () => {
      it('should match pitcher positions', () => {
        expect(playerMatchesFilter('P', 'ALL_PITCHERS')).toBe(true)
        expect(playerMatchesFilter('SP', 'ALL_PITCHERS')).toBe(true)
        expect(playerMatchesFilter('RP', 'ALL_PITCHERS')).toBe(true)
        expect(playerMatchesFilter('1B,P', 'ALL_PITCHERS')).toBe(true)
        expect(playerMatchesFilter('OF,SP', 'ALL_PITCHERS')).toBe(true)
      })

      it('should not match non-pitcher positions', () => {
        expect(playerMatchesFilter('C', 'ALL_PITCHERS')).toBe(false)
        expect(playerMatchesFilter('1B', 'ALL_PITCHERS')).toBe(false)
        expect(playerMatchesFilter('2B,SS', 'ALL_PITCHERS')).toBe(false)
        expect(playerMatchesFilter('OF', 'ALL_PITCHERS')).toBe(false)
      })
    })

    describe('specific position filters', () => {
      it('should match exact positions correctly', () => {
        // Catcher
        expect(playerMatchesFilter('C', 'C')).toBe(true)
        expect(playerMatchesFilter('C,1B', 'C')).toBe(true)
        expect(playerMatchesFilter('1B', 'C')).toBe(false)
        
        // Infield positions
        expect(playerMatchesFilter('1B', '1B')).toBe(true)
        expect(playerMatchesFilter('2B', '2B')).toBe(true)
        expect(playerMatchesFilter('SS', 'SS')).toBe(true)
        expect(playerMatchesFilter('3B', '3B')).toBe(true)
        expect(playerMatchesFilter('2B,SS', '2B')).toBe(true)
      })
    })

    describe('OF (Outfield) filter', () => {
      it('should match generic OF position', () => {
        expect(playerMatchesFilter('OF', 'OF')).toBe(true)
        expect(playerMatchesFilter('OF,1B', 'OF')).toBe(true)
      })

      it('should match specific outfield positions', () => {
        expect(playerMatchesFilter('LF', 'OF')).toBe(true)
        expect(playerMatchesFilter('CF', 'OF')).toBe(true)
        expect(playerMatchesFilter('RF', 'OF')).toBe(true)
        expect(playerMatchesFilter('LF,CF', 'OF')).toBe(true)
        expect(playerMatchesFilter('RF,1B', 'OF')).toBe(true)
      })

      it('should not match non-outfield positions', () => {
        expect(playerMatchesFilter('C', 'OF')).toBe(false)
        expect(playerMatchesFilter('1B', 'OF')).toBe(false)
        expect(playerMatchesFilter('2B,SS', 'OF')).toBe(false)
        expect(playerMatchesFilter('P', 'OF')).toBe(false)
      })
    })

    describe('Util filter', () => {
      it('should match all non-pitcher positions (same as ALL_BATTERS)', () => {
        expect(playerMatchesFilter('C', 'Util')).toBe(true)
        expect(playerMatchesFilter('1B', 'Util')).toBe(true)
        expect(playerMatchesFilter('OF', 'Util')).toBe(true)
        expect(playerMatchesFilter('2B,SS', 'Util')).toBe(true)
      })

      it('should not match pitcher positions', () => {
        expect(playerMatchesFilter('P', 'Util')).toBe(false)
        expect(playerMatchesFilter('SP', 'Util')).toBe(false)
        expect(playerMatchesFilter('RP', 'Util')).toBe(false)
        expect(playerMatchesFilter('1B,P', 'Util')).toBe(false)
      })
    })

    describe('pitcher-specific filters', () => {
      it('should match SP filter correctly', () => {
        expect(playerMatchesFilter('SP', 'SP')).toBe(true)
        expect(playerMatchesFilter('P', 'SP')).toBe(true) // Generic P matches SP
        expect(playerMatchesFilter('SP,RP', 'SP')).toBe(true)
        
        expect(playerMatchesFilter('RP', 'SP')).toBe(false)
        expect(playerMatchesFilter('C', 'SP')).toBe(false)
        expect(playerMatchesFilter('1B', 'SP')).toBe(false)
      })

      it('should match RP filter correctly', () => {
        expect(playerMatchesFilter('RP', 'RP')).toBe(true)
        expect(playerMatchesFilter('P', 'RP')).toBe(true) // Generic P matches RP
        expect(playerMatchesFilter('SP,RP', 'RP')).toBe(true)
        
        expect(playerMatchesFilter('SP', 'RP')).toBe(false)
        expect(playerMatchesFilter('C', 'RP')).toBe(false)
        expect(playerMatchesFilter('OF', 'RP')).toBe(false)
      })
    })

    describe('edge cases and invalid inputs', () => {
      it('should handle empty position strings', () => {
        expect(playerMatchesFilter('', 'ALL_BATTERS')).toBe(true) // No positions = no pitchers = batter
        expect(playerMatchesFilter('', 'ALL_PITCHERS')).toBe(false)
        expect(playerMatchesFilter('', 'C')).toBe(false)
      })

      it('should handle malformed position strings', () => {
        expect(playerMatchesFilter(',,,', 'ALL_BATTERS')).toBe(true)
        expect(playerMatchesFilter('C,,1B', 'C')).toBe(true)
        expect(playerMatchesFilter('P, ,', 'ALL_PITCHERS')).toBe(true)
      })

      it('should return false for invalid filter types', () => {
        expect(playerMatchesFilter('C', 'INVALID' as PlayerFilterType)).toBe(false)
        expect(playerMatchesFilter('1B', 'RANDOM' as PlayerFilterType)).toBe(false)
      })
    })
  })

  describe('isPitcher and isBatter', () => {
    it('should correctly categorize players as pitchers or batters', () => {
      // Pitchers
      expect(isPitcher('P')).toBe(true)
      expect(isPitcher('SP')).toBe(true) 
      expect(isPitcher('RP')).toBe(true)
      expect(isPitcher('1B,P')).toBe(true) // Two-way player
      
      // Batters (non-pitchers)
      expect(isPitcher('C')).toBe(false)
      expect(isPitcher('1B')).toBe(false)
      expect(isPitcher('OF')).toBe(false)
      
      // isBatter should be opposite of isPitcher
      expect(isBatter('P')).toBe(false)
      expect(isBatter('C')).toBe(true)
      expect(isBatter('')).toBe(true) // No positions = not a pitcher = batter
    })
  })

  describe('getPrimaryPosition', () => {
    it('should return first position from position string', () => {
      expect(getPrimaryPosition('C')).toBe('C')
      expect(getPrimaryPosition('1B,OF')).toBe('1B')
      expect(getPrimaryPosition('OF,1B,3B')).toBe('OF')
      expect(getPrimaryPosition('1B, OF')).toBe('1B') // With spaces
      expect(getPrimaryPosition('')).toBe('')
      expect(getPrimaryPosition(', OF')).toBe('OF') // Leading comma
    })
  })

  describe('cn (className utility)', () => {
    it('should merge and override Tailwind classes correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
      const showConditional = true
      const hideConditional = false
      expect(cn('base', showConditional && 'conditional')).toBe('base conditional')
      expect(cn('base', hideConditional && 'conditional')).toBe('base')
      expect(cn('p-4', 'p-2')).toBe('p-2') // Later Tailwind class wins
      expect(cn()).toBe('')
    })
  })

  describe('integration scenarios', () => {
    it('should work through complete player filtering workflow', () => {
      // Test data representing different player types
      const testPlayers = [
        { name: 'Mike Trout', position: 'OF' },
        { name: 'Joey Votto', position: '1B' },
        { name: 'Jacob deGrom', position: 'SP' },
        { name: 'Craig Kimbrel', position: 'RP' },
        { name: 'Francisco Lindor', position: 'SS,2B' },
        { name: 'Willson Contreras', position: 'C,1B' },
        { name: 'Shohei Ohtani', position: 'OF,P' }, // Two-way player
      ]

      // Test ALL_BATTERS filter
      const batters = testPlayers.filter(p => playerMatchesFilter(p.position, 'ALL_BATTERS'))
      expect(batters.map(p => p.name)).toEqual([
        'Mike Trout', 'Joey Votto', 'Francisco Lindor', 'Willson Contreras'
      ])

      // Test ALL_PITCHERS filter
      const pitchers = testPlayers.filter(p => playerMatchesFilter(p.position, 'ALL_PITCHERS'))
      expect(pitchers.map(p => p.name)).toEqual([
        'Jacob deGrom', 'Craig Kimbrel', 'Shohei Ohtani'
      ])

      // Test specific position filters
      const catchers = testPlayers.filter(p => playerMatchesFilter(p.position, 'C'))
      expect(catchers.map(p => p.name)).toEqual(['Willson Contreras'])

      const outfielders = testPlayers.filter(p => playerMatchesFilter(p.position, 'OF'))
      expect(outfielders.map(p => p.name)).toEqual(['Mike Trout', 'Shohei Ohtani'])
    })

    it('should handle real-world position combinations', () => {
      // Common position combinations from actual Yahoo Fantasy data
      const realWorldPositions = [
        'C,1B',     // Catcher who can play first base
        '2B,SS',    // Middle infielder
        'LF,RF',    // Corner outfielder
        'OF',       // Generic outfielder
        'SP',       // Starting pitcher
        'RP',       // Relief pitcher
        '1B,OF',    // First baseman who can play outfield
        '3B,SS',    // Corner/middle infielder
        'C',        // Pure catcher
        'P',        // Generic pitcher
      ]

      realWorldPositions.forEach(position => {
        // Should be able to parse all positions
        const parsed = parsePlayerPositions(position)
        expect(parsed.length).toBeGreaterThan(0)

        // Should be able to determine if pitcher or batter
        const isP = isPitcher(position)
        const isB = isBatter(position)
        expect(isP).toBe(!isB) // Should be one or the other, not both

        // Should have a primary position
        const primary = getPrimaryPosition(position)
        expect(primary).toBeTruthy()
      })
    })
  })
}) 