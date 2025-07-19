'use client';

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getColumns } from "@/components/players-table/columns";
import { DataTable } from "@/components/players-table/data-table";
import { getStoredFilter, saveFilter } from "@/lib/filter-state";
import type { PlayerFilterType } from "@/types/hooks";
import { playerMatchesFilter } from "@/lib/utils";
import { FILTER_LABELS } from "@/lib/constants";
import React from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const { useUserInfo, usePlayersComprehensive } = useYahooFantasy();
  const { data: userInfo, isLoading: isLoadingUserInfo } = useUserInfo();
  
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

  // Memoized loading state message for better UX
  const loadingMessage = React.useMemo(() => {
    if (isLoadingFullDataset) {
      return "Loading player dataset...";
    }
    return null;
  }, [isLoadingFullDataset]);

  // Memoized filter result message
  const filterResultMessage = React.useMemo(() => {
    // Always show filter result message if we have data
    if (filteredPlayers.length > 0 || totalFilteredCount > 0) {
      const displayName = FILTER_LABELS[activeFilter] || activeFilter;
      const count = totalFilteredCount > 0 ? totalFilteredCount : filteredPlayers.length;
      
      if (searchTerm.trim()) {
        return `Showing ${count} players matching "${searchTerm}" in ${displayName} filter`;
      } else {
        return `Showing ${count} players matching ${displayName} filter`;
      }
    }
    return null;
  }, [filteredPlayers.length, totalFilteredCount, activeFilter, searchTerm]);

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

  const handleSignIn = () => {
    signIn('yahoo', { callbackUrl: '/' })
  }

  const handleSignOut = () => {
    signOut({ redirect: true, callbackUrl: "/" })
  }

  if (status === "loading" || isLoadingUserInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Yahoo Fantasy Baseball Tool</h1>
          <p className="mb-4">Please sign in with your Yahoo account to get started.</p>
          <Button 
              className="cursor-pointer w-full bg-[#7d2eff] py-3"
              onClick={handleSignIn}
            >
              Sign in with Yahoo
            </Button>
        </div>
      </div>
    );
  }

  const userName = userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.display_name;
  const userProfileUrl = userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.fantasy_profile_url;
  const userImageUrl = userInfo?.fantasy_content?.users?.[0]?.user?.[1]?.profile?.image_url;

  return (
    <>
      <header className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarImage src={userImageUrl || ''} alt="User Profile" />
            <AvatarFallback>{userName?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <h1 className="text-2xl font-bold">Welcome, {userName || 'User'}</h1>
        </div>
        <div className="flex items-center space-x-3">
            <a
              href={`${userProfileUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#7d2eff] hover:underline"
            >
              View Profile
            </a>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>
      <main className="p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">MLB Players - {currentSeason} Season</h2>
          {loadingMessage && (
            <p className="text-sm text-gray-600 mt-1">{loadingMessage}</p>
          )}
          {filterResultMessage && (
            <p className="text-sm text-gray-600 mt-1">{filterResultMessage}</p>
          )}
        </div>
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
    </>
  );
}
