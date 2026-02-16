'use client';

import type { ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FilterDropdown } from './filter-dropdown';
import type { PlayerFilterType } from '@/types/hooks';

interface PanelCardProps {
  title: string;
  description: string;
  activeFilter: PlayerFilterType;
  onFilterChange: (filter: PlayerFilterType) => void;
  filterDisabled?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchDisabled?: boolean;
  headerActions?: ReactNode;
  children: ReactNode;
}

export function PanelCard({
  title,
  description,
  activeFilter,
  onFilterChange,
  filterDisabled,
  searchTerm,
  onSearchChange,
  searchDisabled,
  headerActions,
  children,
}: PanelCardProps) {
  return (
    <Card className="py-0 shadow-none h-[calc(100vh-221px)]">
      <CardHeader className="bg-muted border-0 border-b border-solid py-5 rounded-t-xl sticky">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className='flex gap-2'>
          {headerActions}
          <FilterDropdown
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            disabled={filterDisabled}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col space-y-4 p-0 overflow-hidden flex-1 min-h-0">
        <div className='px-6'>
          <Input
            placeholder="Search Player"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            disabled={searchDisabled}
          />
        </div>
        <div
          className="border-t border-solid overscroll-none overflow-auto flex-1 min-h-0"
          data-slot="table-container"
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
