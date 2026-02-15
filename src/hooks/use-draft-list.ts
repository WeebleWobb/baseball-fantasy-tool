'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';
import type { StoredDraftPlayer } from '@/types/draft-list';
import { toStoredPlayer } from '@/types/draft-list';
import { getStoredDraftList, saveDraftList } from '@/lib/draft-list-storage';

export function useDraftList() {
  const [draftList, setDraftList] = useState<StoredDraftPlayer[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    setDraftList(getStoredDraftList());
    setIsInitialized(true);
  }, []);

  // Set of drafted player keys for O(1) lookup
  const draftedKeys = useMemo(
    () => new Set(draftList.map((p) => p.player_key)),
    [draftList]
  );

  // Add a player to the draft list
  const addPlayer = useCallback((player: PlayerWithRank) => {
    setDraftList((prev) => {
      if (prev.some((p) => p.player_key === player.player_key)) {
        return prev; // Already in list
      }
      const updated = [...prev, toStoredPlayer(player)];
      saveDraftList(updated);
      return updated;
    });
  }, []);

  // Remove a player from the draft list
  const removePlayer = useCallback((playerKey: string) => {
    setDraftList((prev) => {
      const updated = prev.filter((p) => p.player_key !== playerKey);
      saveDraftList(updated);
      return updated;
    });
  }, []);

  // Move a player up or down in the draft list
  const movePlayer = useCallback(
    (playerKey: string, direction: 'up' | 'down') => {
      setDraftList((prev) => {
        const index = prev.findIndex((p) => p.player_key === playerKey);
        if (index === -1) return prev;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= prev.length) return prev;

        const updated = [...prev];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        saveDraftList(updated);
        return updated;
      });
    },
    []
  );

  // Reorder a player to a new position (for drag-and-drop)
  const reorderPlayer = useCallback(
    (playerKey: string, newIndex: number) => {
      setDraftList((prev) => {
        const oldIndex = prev.findIndex((p) => p.player_key === playerKey);
        if (oldIndex === -1) return prev;
        if (newIndex < 0 || newIndex >= prev.length) return prev;
        if (oldIndex === newIndex) return prev;

        const updated = [...prev];
        const [removed] = updated.splice(oldIndex, 1);
        updated.splice(newIndex, 0, removed);
        saveDraftList(updated);
        return updated;
      });
    },
    []
  );

  // Check if a player is in the draft list
  const isPlayerDrafted = useCallback(
    (playerKey: string) => draftedKeys.has(playerKey),
    [draftedKeys]
  );

  // Clear the entire draft list
  const clearAll = useCallback(() => {
    setDraftList([]);
    saveDraftList([]);
  }, []);

  return {
    draftList,
    draftedKeys,
    draftListCount: draftList.length,
    isInitialized,
    addPlayer,
    removePlayer,
    movePlayer,
    reorderPlayer,
    isPlayerDrafted,
    clearAll,
  };
}
