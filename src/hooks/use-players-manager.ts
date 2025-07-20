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
  pageIndex: number,
  isLoadingFullDataset: boolean
): ProcessedPlayersData {
  if (!fullDataset || fullDataset.length === 0) {
    return {
      filteredPlayers: [],
      totalFilteredCount: 0,
      totalPages: 1,
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

  // Calculate pagination based on search-filtered results
  const itemsPerPage = 25;
  const totalPagesCount = Math.ceil(searchFiltered.length / itemsPerPage);
  
  // Get current page data
  const startIndex = pageIndex * itemsPerPage;
  const paginatedData = searchFiltered.slice(startIndex, startIndex + itemsPerPage);

  // Add global rank based on search-filtered dataset position
  const playersWithRank = paginatedData.map((player, index) => ({
    ...(player as Record<string, unknown>),
    globalRank: startIndex + index + 1 // True global rank in search-filtered dataset
  }));

  return {
    filteredPlayers: playersWithRank,
    totalFilteredCount: searchFiltered.length,
    totalPages: totalPagesCount,
    isLoading: isLoadingFullDataset
  };
}

export function usePlayersManager() {
  const { usePlayersComprehensive } = useYahooFantasy();
  
  const [pageIndex, setPageIndex] = React.useState(0);
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

  const { filteredPlayers, totalFilteredCount, totalPages, isLoading } = React.useMemo(() => 
    processPlayersData(fullDataset, activeFilter, searchTerm, pageIndex, isLoadingFullDataset),
    [fullDataset, activeFilter, searchTerm, pageIndex, isLoadingFullDataset]
  );

  const columns = React.useMemo(() => {
    return getColumns(activeFilter);
  }, [activeFilter]);

  const handleFilterChange = React.useCallback((newFilter: PlayerFilterType) => {
    setActiveFilter(newFilter);
    // Reset pagination and search when filter changes to avoid empty pages
    setPageIndex(0);
    setSearchTerm("");
    // Persist filter change to localStorage
    saveFilter(newFilter);
  }, []);

  const handleSearchChange = React.useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Reset pagination when search changes
    setPageIndex(0);
  }, []);

  return {
    filteredPlayers,
    columns,
    isLoading,
    pageIndex,
    totalPages,
    totalFilteredCount,
    activeFilter,
    searchTerm,
    onPageChange: setPageIndex,
    onFilterChange: handleFilterChange,
    onSearchChange: handleSearchChange,
  };
} 