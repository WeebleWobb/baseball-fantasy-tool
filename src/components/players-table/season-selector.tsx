"use client"

import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SeasonType, TimePeriodType } from "@/types/hooks"
import { cn } from "@/lib/utils"

const SEASON_OPTIONS = [
  { value: 'current', label: 'Current Season' },
  { value: 'last', label: 'Last Season' },
] as const

const TIME_PERIOD_OPTIONS = [
  { value: 'full', label: 'Full' },
  { value: 'lastmonth', label: 'Last Month' },
  { value: 'lastweek', label: 'Last Week' },
] as const

interface SeasonSelectorProps {
  season: SeasonType
  timePeriod: TimePeriodType
  onSeasonChange: (season: SeasonType) => void
  onTimePeriodChange: (period: TimePeriodType) => void
  disabled?: boolean
}

export const SeasonSelector = React.memo<SeasonSelectorProps>(function SeasonSelector({
  season,
  timePeriod,
  onSeasonChange,
  onTimePeriodChange,
  disabled = false
}: SeasonSelectorProps) {
  const showTimePeriodButtons = season === 'current'

  return (
    <div className="flex items-center gap-3">
      {/* Time Period Buttons - only shown for Current Season */}
      {showTimePeriodButtons && (
        <>
          <div className="flex gap-2" role="radiogroup" aria-label="Time period filter">
            {TIME_PERIOD_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={timePeriod === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => onTimePeriodChange(option.value)}
                disabled={disabled}
                className={cn(
                  "transition-colors",
                  timePeriod === option.value
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
                role="radio"
                aria-checked={timePeriod === option.value}
              >
                {option.label}
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-7 mx-0" />
        </>
      )}
      {/* Season Dropdown */}
      <Select
        value={season}
        onValueChange={(value) => onSeasonChange(value as SeasonType)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select season" />
        </SelectTrigger>
        <SelectContent>
          {SEASON_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
})
