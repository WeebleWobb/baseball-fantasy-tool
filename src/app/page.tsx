'use client';

import React from "react";
import { useYahooFantasy } from "@/hooks/use-yahoo-fantasy";
import { usePlayersManager } from "@/hooks/use-players-manager";
import { AuthGuard } from "@/components/auth-guard";
import { AppHeader } from "@/components/app-header";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/players-table/data-table";
import { extractUserProfile } from "@/lib/user-profile";
import type { SeasonType, TimePeriodType } from "@/types/hooks";

function getSeasonTitle(season: SeasonType, timePeriod: TimePeriodType): string {
  const currentYear = new Date().getFullYear().toString();
  const lastYear = (new Date().getFullYear() - 1).toString();

  switch (season) {
    case 'last':
      return `MLB Players - ${lastYear} Season`;
    case 'current':
    default:
      if (timePeriod === 'lastmonth') return `MLB Players - ${currentYear} Season (Last 30 Days)`;
      if (timePeriod === 'lastweek') return `MLB Players - ${currentYear} Season (Last 7 Days)`;
      return `MLB Players - ${currentYear} Season`;
  }
}

export default function Home() {
  const { useUserInfo } = useYahooFantasy();
  const { data: userInfo } = useUserInfo();

  const playersData = usePlayersManager();
  const userProfile = extractUserProfile(userInfo);

  return (
    <AuthGuard>
      <AppHeader userProfile={userProfile} />
      <main className="p-8">
        <PageHeader
          title={getSeasonTitle(playersData.season, playersData.timePeriod)}
          isLoading={playersData.isLoading}
          filteredPlayersLength={playersData.filteredPlayers.length}
          totalFilteredCount={playersData.totalFilteredCount}
          activeFilter={playersData.activeFilter}
          searchTerm={playersData.searchTerm}
          season={playersData.season}
          timePeriod={playersData.timePeriod}
          onSeasonChange={playersData.onSeasonChange}
          onTimePeriodChange={playersData.onTimePeriodChange}
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
          searchTerm={playersData.searchTerm}
          onSearchChange={playersData.onSearchChange}
        />
      </main>
    </AuthGuard>
  );
}
