import { renderHook, act } from '@testing-library/react';
import { useDraftList } from '@/hooks/use-draft-list';
import * as storage from '@/lib/draft-list-storage';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';

jest.mock('@/lib/draft-list-storage');

const mockStorage = storage as jest.Mocked<typeof storage>;

describe('useDraftList', () => {
  const mockPlayer1: PlayerWithRank = {
    player_key: '431.p.8967',
    name: { full: 'Mike Trout', first: 'Mike', last: 'Trout' },
    editorial_team_abbr: 'LAA',
    display_position: 'OF',
    originalRank: 1,
    globalRank: 1,
  };

  const mockPlayer2: PlayerWithRank = {
    player_key: '431.p.9988',
    name: { full: 'Mookie Betts', first: 'Mookie', last: 'Betts' },
    editorial_team_abbr: 'LAD',
    display_position: '2B,OF',
    originalRank: 2,
    globalRank: 2,
  };

  const mockPlayer3: PlayerWithRank = {
    player_key: '431.p.1234',
    name: { full: 'Aaron Judge', first: 'Aaron', last: 'Judge' },
    editorial_team_abbr: 'NYY',
    display_position: 'OF',
    originalRank: 3,
    globalRank: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.getStoredDraftList.mockReturnValue([]);
    mockStorage.saveDraftList.mockImplementation(() => {});
  });

  describe('initialization', () => {
    it('should initialize with empty draft list', () => {
      const { result } = renderHook(() => useDraftList());

      expect(result.current.draftList).toEqual([]);
      expect(result.current.draftListCount).toBe(0);
      expect(result.current.isInitialized).toBe(true);
    });

    it('should load existing players from storage on mount', () => {
      const storedPlayers = [
        {
          player_key: '431.p.8967',
          name: 'Mike Trout',
          team: 'LAA',
          position: 'OF',
          originalRank: 1,
        },
      ];
      mockStorage.getStoredDraftList.mockReturnValue(storedPlayers);

      const { result } = renderHook(() => useDraftList());

      expect(result.current.draftList).toEqual(storedPlayers);
      expect(result.current.draftListCount).toBe(1);
    });
  });

  describe('addPlayer', () => {
    it('should add a player to the draft list', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      expect(result.current.draftList).toHaveLength(1);
      expect(result.current.draftList[0].player_key).toBe('431.p.8967');
      expect(result.current.draftList[0].name).toBe('Mike Trout');
      expect(mockStorage.saveDraftList).toHaveBeenCalled();
    });

    it('should not add duplicate players', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      expect(result.current.draftList).toHaveLength(1);
    });

    it('should add multiple different players', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      expect(result.current.draftList).toHaveLength(2);
    });
  });

  describe('removePlayer', () => {
    it('should remove a player from the draft list', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      act(() => {
        result.current.removePlayer('431.p.8967');
      });

      expect(result.current.draftList).toHaveLength(1);
      expect(result.current.draftList[0].player_key).toBe('431.p.9988');
    });

    it('should handle removing non-existent player', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      act(() => {
        result.current.removePlayer('non-existent-key');
      });

      expect(result.current.draftList).toHaveLength(1);
    });
  });

  describe('movePlayer', () => {
    it('should move player up in the list', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
        result.current.addPlayer(mockPlayer3);
      });

      act(() => {
        result.current.movePlayer('431.p.1234', 'up');
      });

      expect(result.current.draftList[1].player_key).toBe('431.p.1234');
      expect(result.current.draftList[2].player_key).toBe('431.p.9988');
    });

    it('should move player down in the list', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
        result.current.addPlayer(mockPlayer3);
      });

      act(() => {
        result.current.movePlayer('431.p.8967', 'down');
      });

      expect(result.current.draftList[0].player_key).toBe('431.p.9988');
      expect(result.current.draftList[1].player_key).toBe('431.p.8967');
    });

    it('should not move first player up', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      act(() => {
        result.current.movePlayer('431.p.8967', 'up');
      });

      expect(result.current.draftList[0].player_key).toBe('431.p.8967');
    });

    it('should not move last player down', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      act(() => {
        result.current.movePlayer('431.p.9988', 'down');
      });

      expect(result.current.draftList[1].player_key).toBe('431.p.9988');
    });

    it('should handle moving non-existent player', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      act(() => {
        result.current.movePlayer('non-existent', 'up');
      });

      expect(result.current.draftList).toHaveLength(1);
    });
  });

  describe('reorderPlayer', () => {
    it('should reorder player to new position', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
        result.current.addPlayer(mockPlayer3);
      });

      // Move player 3 (index 2) to position 0
      act(() => {
        result.current.reorderPlayer('431.p.1234', 0);
      });

      expect(result.current.draftList[0].player_key).toBe('431.p.1234');
      expect(result.current.draftList[1].player_key).toBe('431.p.8967');
      expect(result.current.draftList[2].player_key).toBe('431.p.9988');
    });

    it('should not reorder to same position', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      const saveCallsBefore = mockStorage.saveDraftList.mock.calls.length;

      act(() => {
        result.current.reorderPlayer('431.p.8967', 0);
      });

      // Should not trigger another save
      expect(mockStorage.saveDraftList.mock.calls.length).toBe(saveCallsBefore);
    });

    it('should handle invalid new index (negative)', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      act(() => {
        result.current.reorderPlayer('431.p.9988', -1);
      });

      // Should remain unchanged
      expect(result.current.draftList[0].player_key).toBe('431.p.8967');
      expect(result.current.draftList[1].player_key).toBe('431.p.9988');
    });

    it('should handle invalid new index (out of bounds)', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      act(() => {
        result.current.reorderPlayer('431.p.8967', 10);
      });

      // Should remain unchanged
      expect(result.current.draftList[0].player_key).toBe('431.p.8967');
    });

    it('should handle reordering non-existent player', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      act(() => {
        result.current.reorderPlayer('non-existent', 0);
      });

      expect(result.current.draftList).toHaveLength(1);
    });
  });

  describe('isPlayerDrafted', () => {
    it('should return true for drafted player', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      expect(result.current.isPlayerDrafted('431.p.8967')).toBe(true);
    });

    it('should return false for non-drafted player', () => {
      const { result } = renderHook(() => useDraftList());

      expect(result.current.isPlayerDrafted('431.p.8967')).toBe(false);
    });

    it('should update after player is removed', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
      });

      expect(result.current.isPlayerDrafted('431.p.8967')).toBe(true);

      act(() => {
        result.current.removePlayer('431.p.8967');
      });

      expect(result.current.isPlayerDrafted('431.p.8967')).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all players from draft list', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.draftList).toEqual([]);
      expect(result.current.draftListCount).toBe(0);
    });
  });

  describe('draftedKeys', () => {
    it('should return Set of drafted player keys', () => {
      const { result } = renderHook(() => useDraftList());

      act(() => {
        result.current.addPlayer(mockPlayer1);
        result.current.addPlayer(mockPlayer2);
      });

      expect(result.current.draftedKeys.has('431.p.8967')).toBe(true);
      expect(result.current.draftedKeys.has('431.p.9988')).toBe(true);
      expect(result.current.draftedKeys.has('431.p.1234')).toBe(false);
    });
  });
});
