export interface ProcessedPlayersData {
  filteredPlayers: unknown[];
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