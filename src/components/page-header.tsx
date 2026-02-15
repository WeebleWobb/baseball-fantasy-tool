'use client';

import React from "react";
import { FILTER_LABELS } from "@/lib/constants";
import { SeasonSelector } from "@/components/players-table/season-selector";
import type { PlayerFilterType, SeasonType, TimePeriodType } from "@/types/hooks";

interface PageHeaderProps {
  title: string;
  isLoading?: boolean;
  filteredPlayersLength: number;
  totalFilteredCount: number;
  activeFilter: PlayerFilterType;
  searchTerm: string;
  season?: SeasonType;
  timePeriod?: TimePeriodType;
  onSeasonChange?: (season: SeasonType) => void;
  onTimePeriodChange?: (period: TimePeriodType) => void;
}

export function PageHeader({
  title,
  isLoading = false,
  filteredPlayersLength,
  totalFilteredCount,
  activeFilter,
  searchTerm,
  season = 'current',
  timePeriod = 'full',
  onSeasonChange,
  onTimePeriodChange,
}: PageHeaderProps) {
  const message = React.useMemo(() => {
    if (isLoading) {
      return "Loading player dataset...";
    }

    const displayName = FILTER_LABELS[activeFilter] || activeFilter;
    const count = totalFilteredCount > 0 ? totalFilteredCount : filteredPlayersLength;

    if (searchTerm.trim()) {
      return `Showing ${count} players matching "${searchTerm}" in ${displayName} filter`;
    } else {
      return `Showing ${count} players matching ${displayName} filter`;
    }
  }, [isLoading, filteredPlayersLength, totalFilteredCount, activeFilter, searchTerm]);

  return (
    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {message}
        </p>
      </div>
      {onSeasonChange && onTimePeriodChange && (
        <SeasonSelector
          season={season}
          timePeriod={timePeriod}
          onSeasonChange={onSeasonChange}
          onTimePeriodChange={onTimePeriodChange}
          disabled={isLoading}
        />
      )}
    </div>
  );
}
