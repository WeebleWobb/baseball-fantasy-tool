"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { BATTER_FILTER_BUTTONS, PITCHER_FILTER_BUTTONS } from "@/lib/constants"
import type { PlayerFilterType } from "@/types/hooks"
import { cn } from "@/lib/utils"

interface FilterButtonsProps {
  activeFilter: PlayerFilterType
  onFilterChange: (filter: PlayerFilterType) => void
  disabled?: boolean
}

export const FilterButtons = React.memo<FilterButtonsProps>(function FilterButtons({ 
  activeFilter, 
  onFilterChange, 
  disabled = false 
}: FilterButtonsProps) {
  const renderFilterGroup = (filters: typeof BATTER_FILTER_BUTTONS | typeof PITCHER_FILTER_BUTTONS) => (
    filters.map((filter) => (
      <Button
        key={filter.value}
        variant={activeFilter === filter.value ? "default" : "outline"}
        size="sm"
        onClick={() => onFilterChange(filter.value)}
        disabled={disabled}
        className={cn(
          "transition-colors",
          activeFilter === filter.value 
            ? "bg-primary text-primary-foreground" 
            : "hover:bg-muted"
        )}
        role="radio"
        aria-checked={activeFilter === filter.value}
        aria-label={`Filter by ${filter.label}`}
      >
        {filter.label}
      </Button>
    ))
  );

  return (
    <div 
      className="flex flex-wrap items-center gap-2"
      role="radiogroup"
      aria-label="Player position filter"
    >
      {/* Batter Filters */}
      <div className="flex flex-wrap gap-2">
        {renderFilterGroup(BATTER_FILTER_BUTTONS)}
      </div>
      
      {/* Vertical Separator */}
      <div className="h-8 w-px bg-border mx-2" aria-hidden="true" />
      
      {/* Pitcher Filters */}
      <div className="flex flex-wrap gap-2">
        {renderFilterGroup(PITCHER_FILTER_BUTTONS)}
      </div>
    </div>
  )
}) 