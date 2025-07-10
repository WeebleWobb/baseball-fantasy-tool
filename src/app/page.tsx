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
import React from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const { useUserInfo, usePlayers, usePlayersComprehensive } = useYahooFantasy();
  const { data: userInfo, isLoading: isLoadingUserInfo } = useUserInfo();
  
  // Add state for pagination
  const [pageIndex, setPageIndex] = React.useState(0);
  
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

  // Determine if we need comprehensive dataset for position-based filtering
  const needsComprehensiveData = !["ALL_BATTERS", "ALL_PITCHERS"].includes(activeFilter);

  // Progressive loading: Current page (immediate) + Full dataset (background when needed)
  const { data: currentPageData, isLoading: isLoadingCurrentPage } = usePlayers({
    start: pageIndex * 25,
    count: 25,
    playerType: playerTypeForApi
  });

  // Comprehensive dataset loading (background, only when needed for position filtering)
  const { data: fullDataset, isLoading: isLoadingFullDataset } = usePlayersComprehensive({
    playerType: playerTypeForApi,
    fetchAll: needsComprehensiveData
  });

  // Smart data selection and filtering
  const { filteredPlayers, totalFilteredCount, isLoading } = React.useMemo(() => {
    // Determine which dataset to use
    const useComprehensiveData = needsComprehensiveData && fullDataset && fullDataset.length > 0;
    const sourceData = useComprehensiveData ? fullDataset : currentPageData;
    
    if (!sourceData) {
      return {
        filteredPlayers: [],
        totalFilteredCount: 0,
        isLoading: isLoadingCurrentPage || (needsComprehensiveData && isLoadingFullDataset)
      };
    }

    // Apply position-based filtering
    const filtered = sourceData.filter((player) => 
      playerMatchesFilter(player.display_position, activeFilter)
    );

    // For comprehensive data, implement client-side pagination
    let paginatedData = filtered;
    if (useComprehensiveData) {
      const startIndex = pageIndex * 25;
      paginatedData = filtered.slice(startIndex, startIndex + 25);
    }

    // Add global rank based on filtered dataset
    const playersWithRank = paginatedData.map((player, index) => ({
      ...player,
      globalRank: useComprehensiveData 
        ? (pageIndex * 25) + index + 1 // True pagination rank
        : (pageIndex * 25) + index + 1  // Current page rank
    }));

    return {
      filteredPlayers: playersWithRank,
      totalFilteredCount: filtered.length,
      isLoading: isLoadingCurrentPage || (needsComprehensiveData && isLoadingFullDataset)
    };
  }, [
    currentPageData, 
    fullDataset, 
    activeFilter, 
    pageIndex, 
    needsComprehensiveData, 
    isLoadingCurrentPage, 
    isLoadingFullDataset
  ]);

  // Calculate total pages based on filtered data
  const totalPages = React.useMemo(() => {
    if (needsComprehensiveData && totalFilteredCount > 0) {
      return Math.ceil(totalFilteredCount / 25);
    }
    return 4; // Default fallback for non-comprehensive data
  }, [needsComprehensiveData, totalFilteredCount]);

  // Memoized loading state message for better UX
  const loadingMessage = React.useMemo(() => {
    if (needsComprehensiveData && isLoadingFullDataset) {
      return "Loading comprehensive dataset for position filtering...";
    }
    if (isLoadingCurrentPage) {
      return "Loading players...";
    }
    return null;
  }, [needsComprehensiveData, isLoadingFullDataset, isLoadingCurrentPage]);

  // Memoized filter result message
  const filterResultMessage = React.useMemo(() => {
    if (needsComprehensiveData && totalFilteredCount > 0) {
      return `Showing ${totalFilteredCount} players matching ${activeFilter} filter`;
    }
    return null;
  }, [needsComprehensiveData, totalFilteredCount, activeFilter]);

  // Handle filter changes
  const handleFilterChange = React.useCallback((newFilter: PlayerFilterType) => {
    setActiveFilter(newFilter);
    // Reset pagination when filter changes to avoid empty pages
    setPageIndex(0);
    // Persist filter change to localStorage
    saveFilter(newFilter);
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
          columns={getColumns(activeFilter)} 
          data={filteredPlayers} 
          isLoading={isLoading}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          totalPages={totalPages}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          disabled={isLoading}
        />
      </main>
    </>
  );
}
