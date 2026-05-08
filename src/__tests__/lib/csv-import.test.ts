import {
  validateFile,
  parseCSV,
  matchPlayers,
  toStoredPlayers,
  filterDuplicates,
  MAX_FILE_SIZE,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  IMPORT_OPTIONS,
} from '@/lib/csv-import';
import { createMockPlayerWithRank } from '@/__tests__/utils/test-fixtures';
import { createMockFile } from '@/__tests__/utils/test-helpers';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';

describe('csv-import', () => {
  describe('constants', () => {
    it('exports file size limit', () => {
      expect(MAX_FILE_SIZE).toBe(1024 * 1024);
    });

    it('exports allowed extensions', () => {
      expect(ALLOWED_EXTENSIONS).toContain('.csv');
      expect(ALLOWED_EXTENSIONS).toContain('.txt');
    });

    it('exports allowed mime types', () => {
      expect(ALLOWED_MIME_TYPES).toContain('text/csv');
      expect(ALLOWED_MIME_TYPES).toContain('text/plain');
    });

    it('exports import options', () => {
      expect(IMPORT_OPTIONS).toHaveLength(3);
      expect(IMPORT_OPTIONS.map(o => o.value)).toEqual(['multi-first-last', 'multi-last-first', 'single']);
    });
  });

  describe('validateFile', () => {
    it('returns valid for a proper CSV file', () => {
      const file = createMockFile('name,team\nMike Trout,LAA', 'players.csv', 'text/csv');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns error for empty file', () => {
      const file = createMockFile('', 'empty.csv', 'text/csv', 0);
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File is empty');
    });

    it('returns error for file exceeding size limit', () => {
      const file = createMockFile('x', 'large.csv', 'text/csv', MAX_FILE_SIZE + 1);
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('File too large (max 1MB)');
    });

    it('returns valid for .txt extension', () => {
      const file = createMockFile('Mike Trout, LAA', 'players.txt', 'text/plain');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('returns valid for empty mime type with valid extension', () => {
      const file = createMockFile('Mike Trout, LAA', 'players.csv', '');
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });

    it('returns error for invalid file type', () => {
      const file = createMockFile('data', 'players.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      const result = validateFile(file);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Please upload a CSV file');
    });
  });

  describe('parseCSV', () => {
    describe('single column format', () => {
      it('parses multi-column CSV in single mode using first column', () => {
        const content = '"Mike Trout, LAA",extra\n"Aaron Judge, NYY",extra';
        const result = parseCSV(content, 'single');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows).toHaveLength(2);
          expect(result.rows[0].name).toBe('Mike Trout');
          expect(result.rows[0].team).toBe('LAA');
          expect(result.rows[1].name).toBe('Aaron Judge');
          expect(result.rows[1].team).toBe('NYY');
        }
      });

      it('parses name with team in single value', () => {
        const content = 'Name,Extra\n"Mike Trout, LAA",data';
        const result = parseCSV(content, 'single');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows[0].name).toBe('Mike Trout');
          expect(result.rows[0].team).toBe('LAA');
        }
      });

      it('skips header row', () => {
        const content = 'Name,Extra\n"Mike Trout, LAA",data';
        const result = parseCSV(content, 'single');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows).toHaveLength(1);
          expect(result.rows[0].name).toBe('Mike Trout');
        }
      });
    });

    describe('multi-column format', () => {
      it('parses two columns with team', () => {
        const content = 'Mike Trout,LAA\nAaron Judge,NYY';
        const result = parseCSV(content, 'multi-first-last');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows).toHaveLength(2);
          expect(result.rows[0].name).toBe('Mike Trout');
          expect(result.rows[0].team).toBe('LAA');
        }
      });

      it('handles "Last, First" format in name column', () => {
        const content = '"Trout, Mike",LAA';
        const result = parseCSV(content, 'multi-last-first');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows[0].name).toBe('Mike Trout');
        }
      });

      it('handles "First, Last" format in name column', () => {
        const content = '"Mike, Trout",LAA';
        const result = parseCSV(content, 'multi-first-last');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows[0].name).toBe('Mike Trout');
        }
      });

      it('detects rank column and uses correct name column', () => {
        const content = '1,Mike Trout,LAA\n2,Aaron Judge,NYY';
        const result = parseCSV(content, 'multi-first-last');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows[0].name).toBe('Mike Trout');
          expect(result.rows[1].name).toBe('Aaron Judge');
        }
      });

      it('skips header row with common headers', () => {
        const content = 'Player,Team\nMike Trout,LAA';
        const result = parseCSV(content, 'multi-first-last');
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.rows).toHaveLength(1);
          expect(result.rows[0].name).toBe('Mike Trout');
        }
      });
    });

    describe('error handling', () => {
      it('returns error for empty content', () => {
        const result = parseCSV('', 'single');
        expect(result.success).toBe(false);
      });

      it('returns error when only header row exists', () => {
        const result = parseCSV('Name,Team', 'multi-first-last');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('No player data found in file');
        }
      });

      it('returns error when no valid names found', () => {
        const result = parseCSV('   \n   ', 'single');
        expect(result.success).toBe(false);
      });
    });
  });

  describe('matchPlayers', () => {
    const mockPlayers: PlayerWithRank[] = [
      createMockPlayerWithRank({
        player_key: 'mlb.p.1',
        name: { full: 'Mike Trout', first: 'Mike', last: 'Trout' },
        editorial_team_abbr: 'LAA',
      }),
      createMockPlayerWithRank({
        player_key: 'mlb.p.2',
        name: { full: 'José Ramírez', first: 'José', last: 'Ramírez' },
        editorial_team_abbr: 'CLE',
      }),
      createMockPlayerWithRank({
        player_key: 'mlb.p.3',
        name: { full: 'Aaron Judge', first: 'Aaron', last: 'Judge' },
        editorial_team_abbr: 'NYY',
      }),
    ];

    it('matches exact full name', () => {
      const parsed = [{ name: 'Mike Trout', rawRow: ['Mike Trout'] }];
      const results = matchPlayers(parsed, mockPlayers);
      expect(results).toHaveLength(1);
      expect(results[0].matched?.player_key).toBe('mlb.p.1');
      expect(results[0].confidence).toBe('exact');
    });

    it('matches with accent normalization', () => {
      const parsed = [{ name: 'Jose Ramirez', rawRow: ['Jose Ramirez'] }];
      const results = matchPlayers(parsed, mockPlayers);
      expect(results).toHaveLength(1);
      expect(results[0].matched?.player_key).toBe('mlb.p.2');
      expect(results[0].confidence).toBe('exact');
    });

    it('matches by last name and team', () => {
      const parsed = [{ name: 'Aaron Judge', team: 'NYY', rawRow: ['Aaron Judge', 'NYY'] }];
      const results = matchPlayers(parsed, mockPlayers);
      expect(results).toHaveLength(1);
      expect(results[0].matched?.player_key).toBe('mlb.p.3');
    });

    it('returns no match for unknown player', () => {
      const parsed = [{ name: 'Unknown Player', rawRow: ['Unknown Player'] }];
      const results = matchPlayers(parsed, mockPlayers);
      expect(results).toHaveLength(1);
      expect(results[0].matched).toBeNull();
      expect(results[0].confidence).toBe('none');
    });

    it('handles case insensitive matching', () => {
      const parsed = [{ name: 'MIKE TROUT', rawRow: ['MIKE TROUT'] }];
      const results = matchPlayers(parsed, mockPlayers);
      expect(results[0].matched?.player_key).toBe('mlb.p.1');
    });
  });

  describe('toStoredPlayers', () => {
    it('converts matched players to stored format', () => {
      const matches = [
        {
          parsed: { name: 'Mike Trout', rawRow: ['Mike Trout'] },
          matched: createMockPlayerWithRank({
            player_key: 'mlb.p.1',
            name: { full: 'Mike Trout', first: 'Mike', last: 'Trout' },
            editorial_team_abbr: 'LAA',
          }),
          confidence: 'exact' as const,
        },
      ];
      const result = toStoredPlayers(matches);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        player_key: 'mlb.p.1',
        name: 'Mike Trout',
        team: 'LAA',
        position: 'OF',
        originalRank: 1,
      });
    });

    it('filters out unmatched players', () => {
      const matches = [
        {
          parsed: { name: 'Mike Trout', rawRow: ['Mike Trout'] },
          matched: createMockPlayerWithRank({ player_key: 'mlb.p.1' }),
          confidence: 'exact' as const,
        },
        {
          parsed: { name: 'Unknown', rawRow: ['Unknown'] },
          matched: null,
          confidence: 'none' as const,
        },
      ];
      const result = toStoredPlayers(matches);
      expect(result).toHaveLength(1);
    });

    it('assigns sequential ranks starting from provided value', () => {
      const matches = [
        {
          parsed: { name: 'Player 1', rawRow: [] },
          matched: createMockPlayerWithRank({ player_key: 'mlb.p.1' }),
          confidence: 'exact' as const,
        },
        {
          parsed: { name: 'Player 2', rawRow: [] },
          matched: createMockPlayerWithRank({ player_key: 'mlb.p.2' }),
          confidence: 'exact' as const,
        },
      ];
      const result = toStoredPlayers(matches, 10);
      expect(result[0].originalRank).toBe(10);
      expect(result[1].originalRank).toBe(11);
    });
  });

  describe('filterDuplicates', () => {
    it('filters out players already in draft list', () => {
      const matches = [
        {
          parsed: { name: 'Mike Trout', rawRow: [] },
          matched: createMockPlayerWithRank({ player_key: 'mlb.p.1' }),
          confidence: 'exact' as const,
        },
        {
          parsed: { name: 'Aaron Judge', rawRow: [] },
          matched: createMockPlayerWithRank({ player_key: 'mlb.p.2' }),
          confidence: 'exact' as const,
        },
      ];
      const existingKeys = new Set(['mlb.p.1']);
      const result = filterDuplicates(matches, existingKeys);
      expect(result.newMatches).toHaveLength(1);
      expect(result.newMatches[0].matched?.player_key).toBe('mlb.p.2');
      expect(result.duplicateCount).toBe(1);
    });

    it('keeps unmatched players in results', () => {
      const matches = [
        {
          parsed: { name: 'Unknown', rawRow: [] },
          matched: null,
          confidence: 'none' as const,
        },
      ];
      const existingKeys = new Set<string>();
      const result = filterDuplicates(matches, existingKeys);
      expect(result.newMatches).toHaveLength(1);
      expect(result.duplicateCount).toBe(0);
    });

    it('returns zero duplicates when none exist', () => {
      const matches = [
        {
          parsed: { name: 'Mike Trout', rawRow: [] },
          matched: createMockPlayerWithRank({ player_key: 'mlb.p.1' }),
          confidence: 'exact' as const,
        },
      ];
      const existingKeys = new Set<string>();
      const result = filterDuplicates(matches, existingKeys);
      expect(result.newMatches).toHaveLength(1);
      expect(result.duplicateCount).toBe(0);
    });
  });
});
