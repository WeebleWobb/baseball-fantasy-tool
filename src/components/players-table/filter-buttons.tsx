"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { FILTER_BUTTONS } from "@/lib/constants"
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
  return (
    <div 
      className="flex flex-wrap gap-2 mb-4"
      role="radiogroup"
      aria-label="Player position filter"
    >
      {FILTER_BUTTONS.map((filter) => (
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
      ))}
    </div>
  )
}) 