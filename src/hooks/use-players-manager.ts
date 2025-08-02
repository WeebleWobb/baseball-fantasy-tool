import React from "react";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { getColumns } from "@/components/players-table/columns";
import { getStoredFilter, saveFilter } from "@/lib/filter-state";
import type { PlayerFilterType } from "@/types/hooks";
import { playerMatchesFilter } from "@/lib/utils";
import type { ProcessedPlayersData } from "@/types/player-data";

import type { PlayerWithRank, YahooPlayerStats } from "@/types/yahoo-fantasy";

function processPlayersData(
  fullDataset: YahooPlayerStats[] | null | undefined,
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

  // First, preserve original Yahoo ranking (sort=AR order) before any filtering
  const dataWithOriginalRank: PlayerWithRank[] = fullDataset.map((player, index) => ({
    ...player,
    originalRank: index + 1, // Yahoo's sort=AR performance ranking order
    globalRank: index + 1 // Initialize globalRank, will be updated after filtering
  }));

  // Apply position-based filtering to the entire dataset
  const positionFiltered = dataWithOriginalRank.filter((player) => {
    return playerMatchesFilter(player.display_position, activeFilter);
  });

  // Apply search filtering across the entire dataset
  const searchFiltered = positionFiltered.filter((player) => {
    if (!searchTerm.trim()) return true; // No search term, show all
    
    const searchLower = searchTerm.toLowerCase();
    return (
      player.name.full?.toLowerCase().includes(searchLower) ||
      player.name.first?.toLowerCase().includes(searchLower) ||
      player.name.last?.toLowerCase().includes(searchLower)
    );
  });

  // Get progressive data for infinite scroll (slice from 0 to renderedCount)
  const displayedData = searchFiltered.slice(0, renderedCount);

  // Add current global rank based on search-filtered dataset position while preserving originalRank
  const playersWithRank = displayedData.map((player, index) => ({
    ...player,
    globalRank: index + 1 // Current position in filtered/searched results
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