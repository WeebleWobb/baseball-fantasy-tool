import React from "react";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { getColumns } from "@/components/players-table/columns";
import { getStoredFilter, saveFilter } from "@/lib/filter-state";
import type { PlayerFilterType } from "@/types/hooks";
import { playerMatchesFilter } from "@/lib/utils";
import type { ProcessedPlayersData } from "@/types/player-data";

function processPlayersData(
  fullDataset: unknown[] | null | undefined,
  activeFilter: PlayerFilterType,
  searchTerm: string,
  renderedCount: number,
  isLoadingFullDataset: boolean
): ProcessedPlayersData {
  if (!fullDataset || fullDataset.length === 0) {
    return {
      filteredPlayers: [],
      totalFilteredCount: 0,
      totalMatchingPlayers: 0,
      isLoading: isLoadingFullDataset
    };
  }

  // Apply position-based filtering to the entire dataset
  const positionFiltered = fullDataset.filter((player) => {
    const playerRecord = player as Record<string, unknown>;
    return playerMatchesFilter(playerRecord.display_position as string, activeFilter);
  });

  // Apply search filtering across the entire dataset
  const searchFiltered = positionFiltered.filter((player) => {
    if (!searchTerm.trim()) return true; // No search term, show all
    
    const searchLower = searchTerm.toLowerCase();
    const playerRecord = player as Record<string, unknown>;
    const name = playerRecord.name as { full?: string; first?: string; last?: string };
    return (
      name?.full?.toLowerCase().includes(searchLower) ||
      name?.first?.toLowerCase().includes(searchLower) ||
      name?.last?.toLowerCase().includes(searchLower)
    );
  });

  // Get progressive data for infinite scroll (slice from 0 to renderedCount)
  const displayedData = searchFiltered.slice(0, renderedCount);

  // Add global rank based on search-filtered dataset position
  const playersWithRank = displayedData.map((player, index) => ({
    ...(player as Record<string, unknown>),
    globalRank: index + 1 // True global rank in search-filtered dataset
  }));

  return {
    filteredPlayers: playersWithRank,
    totalFilteredCount: searchFiltered.length,
    totalMatchingPlayers: searchFiltered.length,
    isLoading: isLoadingFullDataset
  };
}

export function usePlayersManager() {
  const { usePlayersComprehensive } = useYahooFantasy();
  
  const [renderedCount, setRenderedCount] = React.useState(25);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeFilter, setActiveFilter] = React.useState<PlayerFilterType>(() => {
    return getStoredFilter();
  });
  
  const isPitcherFilter = ["ALL_PITCHERS", "SP", "RP"].includes(activeFilter);
  const playerTypeForApi: PlayerFilterType = isPitcherFilter ? "ALL_PITCHERS" : "ALL_BATTERS";

  const { data: fullDataset, isLoading: isLoadingFullDataset } = usePlayersComprehensive({
    playerType: playerTypeForApi,
    fetchAll: true
  });

  const { filteredPlayers, totalFilteredCount, totalMatchingPlayers, isLoading } = React.useMemo(() => 
    processPlayersData(fullDataset, activeFilter, searchTerm, renderedCount, isLoadingFullDataset),
    [fullDataset, activeFilter, searchTerm, renderedCount, isLoadingFullDataset]
  );

  const columns = React.useMemo(() => {
    return getColumns(activeFilter);
  }, [activeFilter]);

  const loadMorePlayers = React.useCallback(() => {
    setRenderedCount(prevCount => 
      Math.min(prevCount + 25, totalMatchingPlayers)
    );
  }, [totalMatchingPlayers]);

  const hasMore = renderedCount < totalMatchingPlayers;

  // Reset renderedCount when filter or search changes
  React.useEffect(() => {
    setRenderedCount(25);
  }, [activeFilter, searchTerm]);

  const handleFilterChange = React.useCallback((newFilter: PlayerFilterType) => {
    setActiveFilter(newFilter);
    // Reset search when filter changes to avoid empty pages
    setSearchTerm("");
    // Persist filter change to localStorage
    saveFilter(newFilter);
  }, []);

  const handleSearchChange = React.useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  }, []);

  return {
    filteredPlayers,
    columns,
    isLoading,
    totalFilteredCount,
    totalMatchingPlayers,
    hasMore,
    activeFilter,
    searchTerm,
    loadMorePlayers,
    onFilterChange: handleFilterChange,
    onSearchChange: handleSearchChange,
  };
} 