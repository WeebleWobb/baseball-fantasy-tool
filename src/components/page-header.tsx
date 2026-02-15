'use client';

import React from "react";
import { FILTER_LABELS } from "@/lib/constants";
import { SeasonSelector } from "@/components/players-table/season-selector";
import type { PlayerFilterType, SeasonType, TimePeriodType } from "@/types/hooks";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode;
  // Legacy props for Players page backward compatibility
  isLoading?: boolean;
  filteredPlayersLength?: number;
  totalFilteredCount?: number;
  activeFilter?: PlayerFilterType;
  searchTerm?: string;
  season?: SeasonType;
  timePeriod?: TimePeriodType;
  onSeasonChange?: (season: SeasonType) => void;
  onTimePeriodChange?: (period: TimePeriodType) => void;
}

export function PageHeader({
  title,
  subtitle,
  rightContent,
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
  // Use direct subtitle if provided, otherwise compute from legacy props
  const message = React.useMemo(() => {
    if (subtitle !== undefined) {
      return subtitle;
    }

    if (isLoading) {
      return "Loading player dataset...";
    }

    // Legacy computed message for Players page
    if (activeFilter !== undefined && filteredPlayersLength !== undefined) {
      const displayName = FILTER_LABELS[activeFilter] || activeFilter;
      const count = (totalFilteredCount ?? 0) > 0 ? totalFilteredCount : filteredPlayersLength;

      if (searchTerm?.trim()) {
        return `Showing ${count} players matching "${searchTerm}" in ${displayName} filter`;
      } else {
        return `Showing ${count} players matching ${displayName} filter`;
      }
    }

    return null;
  }, [subtitle, isLoading, filteredPlayersLength, totalFilteredCount, activeFilter, searchTerm]);

  const showSeasonSelector = !rightContent && onSeasonChange && onTimePeriodChange;

  return (
    <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        {message && (
          <p className="text-sm text-gray-600 mt-1">
            {message}
          </p>
        )}
      </div>
      {rightContent}
      {showSeasonSelector && (
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
