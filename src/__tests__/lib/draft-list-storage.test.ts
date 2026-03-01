import {
  getStoredDraftList,
  saveDraftList,
  clearDraftList,
} from '@/lib/draft-list-storage';
import type { StoredDraftPlayer } from '@/types/draft-list';

const STORAGE_KEY = 'baseball-fantasy-tool:draftList';

describe('draft-list-storage', () => {
  const mockPlayer1: StoredDraftPlayer = {
    player_key: '431.p.8967',
    name: 'Mike Trout',
    team: 'LAA',
    position: 'OF',
    originalRank: 1,
  };

  const mockPlayer2: StoredDraftPlayer = {
    player_key: '431.p.9988',
    name: 'Mookie Betts',
    team: 'LAD',
    position: '2B,OF',
    originalRank: 2,
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('getStoredDraftList', () => {
    it('should return empty array when nothing is stored', () => {
      const result = getStoredDraftList();
      expect(result).toEqual([]);
    });

    it('should return stored players when valid data exists', () => {
      const storedData = {
        players: [mockPlayer1, mockPlayer2],
        version: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const result = getStoredDraftList();
      expect(result).toEqual([mockPlayer1, mockPlayer2]);
    });

    it('should return empty array for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json {');
      const result = getStoredDraftList();
      expect(result).toEqual([]);
    });

    it('should return empty array for mismatched version', () => {
      const storedData = {
        players: [mockPlayer1],
        version: 999, // Wrong version
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const result = getStoredDraftList();
      expect(result).toEqual([]);
    });

    it('should return empty array when players is not an array', () => {
      const storedData = {
        players: 'not an array',
        version: 1,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));

      const result = getStoredDraftList();
      expect(result).toEqual([]);
    });

    it('should handle localStorage errors gracefully', () => {
      const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
      getItemSpy.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = getStoredDraftList();
      expect(result).toEqual([]);

      getItemSpy.mockRestore();
    });
  });

  describe('saveDraftList', () => {
    it('should save players to localStorage', () => {
      const players = [mockPlayer1, mockPlayer2];
      saveDraftList(players);

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.players).toEqual(players);
      expect(parsed.version).toBe(1);
    });

    it('should save empty array', () => {
      saveDraftList([]);

      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = JSON.parse(stored!);
      expect(parsed.players).toEqual([]);
      expect(parsed.version).toBe(1);
    });

    it('should handle localStorage errors gracefully', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
      setItemSpy.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => saveDraftList([mockPlayer1])).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('clearDraftList', () => {
    it('should remove draft list from localStorage', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ players: [mockPlayer1], version: 1 })
      );

      clearDraftList();

      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('should handle clearing when nothing is stored', () => {
      expect(() => clearDraftList()).not.toThrow();
    });

    it('should handle localStorage errors gracefully', () => {
      const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => clearDraftList()).not.toThrow();

      removeItemSpy.mockRestore();
    });
  });

  describe('integration', () => {
    it('should round-trip data correctly', () => {
      const players = [mockPlayer1, mockPlayer2];

      saveDraftList(players);
      const retrieved = getStoredDraftList();

      expect(retrieved).toEqual(players);
    });

    it('should handle save -> clear -> get flow', () => {
      saveDraftList([mockPlayer1]);
      expect(getStoredDraftList()).toHaveLength(1);

      clearDraftList();
      expect(getStoredDraftList()).toEqual([]);
    });
  });
});
