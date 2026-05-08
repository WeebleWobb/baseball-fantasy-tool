'use client';

import React from 'react';
import { AvailablePlayersPanel } from './available-players-panel';
import { DraftListPanel } from './draft-list-panel';
import { ImportSheet } from './import-sheet';
import { useDraftList } from '@/hooks/use-draft-list';
import { useYahooFantasy } from '@/hooks/use-yahoo-fantasy';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';

interface DraftListBuilderProps {
  importSheetOpen: boolean;
  onImportSheetOpenChange: (open: boolean) => void;
}

export function DraftListBuilder({
  importSheetOpen,
  onImportSheetOpenChange,
}: DraftListBuilderProps) {
  const {
    draftList,
    draftedKeys,
    addPlayer,
    removePlayer,
    movePlayer,
    reorderPlayer,
    isPlayerDrafted,
    importPlayers,
  } = useDraftList();

  const { usePlayersComprehensive } = useYahooFantasy();

  // Fetch batters for import matching
  const { data: batters } = usePlayersComprehensive({
    playerType: 'ALL_BATTERS',
    fetchAll: true,
    statType: 'season',
    seasonYear: 'last',
  });

  // Fetch pitchers for import matching
  const { data: pitchers } = usePlayersComprehensive({
    playerType: 'ALL_PITCHERS',
    fetchAll: true,
    statType: 'season',
    seasonYear: 'last',
  });

  // Combine batters and pitchers with rank info for import matching
  const availablePlayers = React.useMemo<PlayerWithRank[]>(() => {
    const allPlayers: PlayerWithRank[] = [];

    if (batters) {
      batters.forEach((player, index) => {
        allPlayers.push({
          ...player,
          originalRank: index + 1,
          globalRank: index + 1,
        });
      });
    }

    if (pitchers) {
      const offset = batters?.length ?? 0;
      pitchers.forEach((player, index) => {
        allPlayers.push({
          ...player,
          originalRank: offset + index + 1,
          globalRank: offset + index + 1,
        });
      });
    }

    return allPlayers;
  }, [batters, pitchers]);

  return (
    <>
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column - Available Players */}
        <div className="flex-1 min-w-0">
          <AvailablePlayersPanel
            isPlayerDrafted={isPlayerDrafted}
            draftedCount={draftList.length}
            onAddPlayer={addPlayer}
          />
        </div>

        {/* Right Column - Draft List */}
        <div className="flex-1 min-w-0">
          <DraftListPanel
            draftList={draftList}
            onRemovePlayer={removePlayer}
            onMovePlayer={movePlayer}
            onReorderPlayer={reorderPlayer}
          />
        </div>
      </div>

      <ImportSheet
        open={importSheetOpen}
        onOpenChange={onImportSheetOpenChange}
        availablePlayers={availablePlayers}
        existingPlayerKeys={draftedKeys}
        onImport={importPlayers}
      />
    </>
  );
}
