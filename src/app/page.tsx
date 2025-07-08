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
  const { useUserInfo, usePlayers } = useYahooFantasy();
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

  // Update usePlayers with pagination and filter - always uses current season
  const { data: playersData, isLoading: isLoadingPlayers } = usePlayers({
    start: pageIndex * 25, // 25 players per page
    count: 25,
    playerType: playerTypeForApi
  });

  // Apply client-side position filtering
  const filteredPlayers = React.useMemo(() => {
    if (!playersData) return [];
    return playersData
      .filter((player) => playerMatchesFilter(player.display_position, activeFilter))
      .map((player, index) => ({
        ...player,
        globalRank: pageIndex * 25 + index + 1
      }));
  }, [playersData, activeFilter, pageIndex]);

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
        </div>
        <DataTable 
          columns={getColumns(activeFilter)} 
          data={filteredPlayers} 
          isLoading={isLoadingPlayers}
          pageIndex={pageIndex}
          onPageChange={setPageIndex}
          totalPages={4} // This is hardcoded for now, ideally should come from API
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          disabled={isLoadingPlayers}
        />
      </main>
    </>
  );
}
