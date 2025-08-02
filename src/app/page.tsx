'use client';

import React from "react";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { usePlayersManager } from "@/hooks/use-players-manager";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/players-table/data-table";
import type { PlayerWithRank } from "@/types/yahoo-fantasy";
import type { UserProfile } from "@/types/user-profile";

export default function Home() {
  const { useUserInfo } = useYahooFantasy();
  const { data: userInfo } = useUserInfo();

  const playersData = usePlayersManager();
  const currentSeason = new Date().getFullYear().toString();
  const userProfile: UserProfile = {
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
          isLoading={playersData.isLoading}
          filteredPlayersLength={playersData.filteredPlayers.length}
          totalFilteredCount={playersData.totalFilteredCount}
          activeFilter={playersData.activeFilter}
          searchTerm={playersData.searchTerm}
        />
        <DataTable 
          columns={playersData.columns} 
          data={playersData.filteredPlayers as PlayerWithRank[]} 
          isLoading={playersData.isLoading}
          totalMatchingPlayers={playersData.totalMatchingPlayers}
          hasMore={playersData.hasMore}
          onLoadMore={playersData.loadMorePlayers}
          activeFilter={playersData.activeFilter}
          onFilterChange={playersData.onFilterChange}
          disabled={playersData.isLoading}
          searchTerm={playersData.searchTerm}
          onSearchChange={playersData.onSearchChange}
        />
      </main>
    </AuthGuard>
  );
}
