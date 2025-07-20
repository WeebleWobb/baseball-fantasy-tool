'use client';

import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { getColumns } from "@/components/players-table/columns";
import { DataTable } from "@/components/players-table/data-table";
import { getStoredFilter, saveFilter } from "@/lib/filter-state";
import type { PlayerFilterType } from "@/types/hooks";
import { playerMatchesFilter } from "@/lib/utils";
import React from "react";

export default function Home() {
  const { useUserInfo, usePlayersComprehensive } = useYahooFantasy();
  const { data: userInfo } = useUserInfo();
  
  // Add state for pagination
  const [pageIndex, setPageIndex] = React.useState(0);
  
  // Add search state management
  const [searchTerm, setSearchTerm] = React.useState("");
  
  // Add filter state management with localStorage initialization
  const [activeFilter, setActiveFilter] = React.useState<PlayerFilterType>(() => {
    // Initialize from localStorage on component mount
    return getStoredFilter();
  });
  
  // Get current season dynamically
  const currentSeason = new Date().getFullYear().toString();
  
  // Determine playerType for API (ALL_BATTERS or ALL_PITCHERS)
  const isPitcherFilter = ["ALL_PITCHERS", "SP", "RP"].includes(activeFilter);
  const playerTypeForApi: PlayerFilterType = isPitcherFilter ? "ALL_PITCHERS" : "ALL_BATTERS";

  // Load comprehensive dataset for all filters - simplified approach
  const { data: fullDataset, isLoading: isLoadingFullDataset } = usePlayersComprehensive({
    playerType: playerTypeForApi,
    fetchAll: true
  });

  // Apply filtering and pagination to comprehensive dataset
  const { filteredPlayers, totalFilteredCount, totalPages, isLoading } = React.useMemo(() => {
    if (!fullDataset || fullDataset.length === 0) {
      return {
        filteredPlayers: [],
        totalFilteredCount: 0,
        totalPages: 1,
        isLoading: isLoadingFullDataset
      };
    }

    // Apply position-based filtering to the entire dataset
    const positionFiltered = fullDataset.filter((player) => 
      playerMatchesFilter(player.display_position, activeFilter)
    );

    // Apply search filtering across the entire dataset
    const searchFiltered = positionFiltered.filter((player) => {
      if (!searchTerm.trim()) return true; // No search term, show all
      
      const searchLower = searchTerm.toLowerCase();
      return (
        player.name?.full?.toLowerCase().includes(searchLower) ||
        player.name?.first?.toLowerCase().includes(searchLower) ||
        player.name?.last?.toLowerCase().includes(searchLower)
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
      ...player,
      globalRank: startIndex + index + 1 // True global rank in search-filtered dataset
    }));

    return {
      filteredPlayers: playersWithRank,
      totalFilteredCount: searchFiltered.length,
      totalPages: totalPagesCount,
      isLoading: isLoadingFullDataset
    };
  }, [
    fullDataset, 
    activeFilter, 
    searchTerm, // Add searchTerm to dependencies
    pageIndex, 
    isLoadingFullDataset
  ]);



  // Memoized columns to prevent recreation on each render
  const columns = React.useMemo(() => {
    return getColumns(activeFilter);
  }, [activeFilter]);

  // Handle filter changes
  const handleFilterChange = React.useCallback((newFilter: PlayerFilterType) => {
    setActiveFilter(newFilter);
    // Reset pagination and search when filter changes to avoid empty pages
    setPageIndex(0);
    setSearchTerm("");
    // Persist filter change to localStorage
    saveFilter(newFilter);
  }, []);

  // Handle search changes
  const handleSearchChange = React.useCallback((newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // Reset pagination when search changes
    setPageIndex(0);
  }, []);

  // Extract user profile data for AppHeader
  const userProfile = {
    displayName: userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.display_name,
    profileUrl: userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.fantasy_profile_url,
    imageUrl: userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.image_url,
  };

  return (
    <AuthGuard>
      <AppHeader userProfile={userProfile} />
      <main className="p-8">
        <PageHeader 
          title={`MLB Players - ${currentSeason} Season`}
          isLoading={isLoadingFullDataset}
          filteredPlayersLength={filteredPlayers.length}
          totalFilteredCount={totalFilteredCount}
          activeFilter={activeFilter}
          searchTerm={searchTerm}
        />
        <DataTable 
          columns={columns} 
          data={filteredPlayers} 
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          totalPages={totalPages}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          disabled={isLoading}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />
      </main>
    </AuthGuard>
  );
}
