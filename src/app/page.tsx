'use client';

import React from "react";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { usePlayersManager } from "@/hooks/use-players-manager";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/players-table/data-table";
import { extractUserProfile } from "@/lib/user-profile";

export default function Home() {
  const { useUserInfo } = useYahooFantasy();
  const { data: userInfo } = useUserInfo();

  const playersData = usePlayersManager();
  const currentSeason = new Date().getFullYear().toString();
  const userProfile = extractUserProfile(userInfo);

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
          data={playersData.filteredPlayers} 
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
