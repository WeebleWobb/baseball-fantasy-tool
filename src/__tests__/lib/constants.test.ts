import { BATTING_STAT_IDS, BATTING_STAT_LABELS } from '@/lib/constants'

describe('Constants', () => {
  describe('BATTING_STAT_IDS', () => {
    it('should have correct stat IDs for batting statistics', () => {
      expect(BATTING_STAT_IDS.HITS).toBe(8)
      expect(BATTING_STAT_IDS.AT_BATS).toBe(6)
      expect(BATTING_STAT_IDS.RUNS).toBe(7)
      expect(BATTING_STAT_IDS.HOME_RUNS).toBe(13)
      expect(BATTING_STAT_IDS.RBI).toBe(9)
    })

    it('should have all required batting stats', () => {
      const requiredStats = [
        'HITS', 'AT_BATS', 'RUNS', 'SINGLES', 'DOUBLES', 
        'TRIPLES', 'HOME_RUNS', 'RBI', 'STOLEN_BASES', 
        'WALKS', 'HIT_BY_PITCH'
      ]
      
      requiredStats.forEach(stat => {
        expect(BATTING_STAT_IDS).toHaveProperty(stat)
        expect(typeof BATTING_STAT_IDS[stat as keyof typeof BATTING_STAT_IDS]).toBe('number')
      })
    })
  })

  describe('BATTING_STAT_LABELS', () => {
    it('should have correct labels for batting statistics', () => {
      expect(BATTING_STAT_LABELS[BATTING_STAT_IDS.HITS]).toBe('H')
      expect(BATTING_STAT_LABELS[BATTING_STAT_IDS.AT_BATS]).toBe('AB')
      expect(BATTING_STAT_LABELS[BATTING_STAT_IDS.RUNS]).toBe('R')
      expect(BATTING_STAT_LABELS[BATTING_STAT_IDS.HOME_RUNS]).toBe('HR')
      expect(BATTING_STAT_LABELS[BATTING_STAT_IDS.RBI]).toBe('RBI')
    })

    it('should have labels for all batting stat IDs', () => {
      Object.values(BATTING_STAT_IDS).forEach(statId => {
        expect(BATTING_STAT_LABELS).toHaveProperty(statId.toString())
        expect(typeof BATTING_STAT_LABELS[statId]).toBe('string')
      })
    })
  })
}) 