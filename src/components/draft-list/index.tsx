'use client';

import { AvailablePlayersPanel } from './available-players-panel';
import { DraftListPanel } from './draft-list-panel';
import { useDraftList } from '@/hooks/use-draft-list';

export function DraftListBuilder() {
  const {
    draftList,
    addPlayer,
    removePlayer,
    movePlayer,
    reorderPlayer,
    isPlayerDrafted,
  } = useDraftList();

  return (
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
  );
}
