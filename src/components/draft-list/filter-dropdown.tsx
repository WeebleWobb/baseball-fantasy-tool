'use client';

import { Check, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FILTER_LABELS, FILTER_TYPES } from '@/lib/constants';
import type { PlayerFilterType } from '@/types/hooks';

interface FilterDropdownProps {
  activeFilter: PlayerFilterType;
  onFilterChange: (filter: PlayerFilterType) => void;
  disabled?: boolean;
}

const BATTER_POSITIONS = [
  FILTER_TYPES.C,
  FILTER_TYPES.FIRST_BASE,
  FILTER_TYPES.SECOND_BASE,
  FILTER_TYPES.SHORTSTOP,
  FILTER_TYPES.THIRD_BASE,
  FILTER_TYPES.OUTFIELD,
  FILTER_TYPES.UTIL,
] as const;

const PITCHER_POSITIONS = [
  FILTER_TYPES.STARTING_PITCHER,
  FILTER_TYPES.RELIEF_PITCHER,
] as const;

export function FilterDropdown({
  activeFilter,
  onFilterChange,
  disabled = false,
}: FilterDropdownProps) {
  const renderMenuItem = (value: string, label: string) => (
    <DropdownMenuItem
      key={value}
      onClick={() => onFilterChange(value as PlayerFilterType)}
      className="flex items-center justify-between"
    >
      <span>{label}</span>
      {activeFilter === value && <Check className="h-4 w-4" />}
    </DropdownMenuItem>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {renderMenuItem(FILTER_TYPES.ALL_PLAYERS, FILTER_LABELS[FILTER_TYPES.ALL_PLAYERS])}
        <DropdownMenuSeparator />
        {renderMenuItem(FILTER_TYPES.ALL_BATTERS, FILTER_LABELS[FILTER_TYPES.ALL_BATTERS])}
        {BATTER_POSITIONS.map((pos) =>
          renderMenuItem(pos, FILTER_LABELS[pos])
        )}
        <DropdownMenuSeparator />
        {renderMenuItem(FILTER_TYPES.ALL_PITCHERS, FILTER_LABELS[FILTER_TYPES.ALL_PITCHERS])}
        {PITCHER_POSITIONS.map((pos) =>
          renderMenuItem(pos, FILTER_LABELS[pos])
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
