'use client';

import React from "react";
import { FILTER_LABELS } from "@/lib/constants";
import type { PlayerFilterType } from "@/types/hooks";

interface PageHeaderProps {
  title: string;
  isLoading?: boolean;
  filteredPlayersLength: number;
  totalFilteredCount: number;
  activeFilter: PlayerFilterType;
  searchTerm: string;
}

export function PageHeader({ 
  title, 
  isLoading = false,
  filteredPlayersLength,
  totalFilteredCount,
  activeFilter,
  searchTerm
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
    <div className="mb-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="text-sm text-gray-600 mt-1">
        {message}
      </p>
    </div>
  );
} 