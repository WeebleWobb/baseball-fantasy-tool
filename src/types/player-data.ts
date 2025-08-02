import type { PlayerWithRank } from "./yahoo-fantasy";

export interface ProcessedPlayersData {
  filteredPlayers: PlayerWithRank[];
  totalFilteredCount: number;
  totalMatchingPlayers: number;
  isLoading: boolean;
}

export interface InfiniteScrollState {
  renderedCount: number;
  hasMore: boolean;
  loadingMore: boolean;
}

export interface InfiniteScrollHookReturn {
  isNearBottom: boolean;
  loadingMore: boolean;
} 