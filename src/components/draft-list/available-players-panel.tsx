'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { PanelCard } from './panel-card';
import { PlayerStatsPopover } from './player-stats-popover';
import { usePlayersManager } from '@/hooks/use-players-manager';
import { useInfiniteScroll } from '@/hooks/use-infinite-scroll';
import { FILTER_LABELS } from '@/lib/constants';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';

interface AvailablePlayersPanelProps {
  isPlayerDrafted: (playerKey: string) => boolean;
  draftedCount: number;
  onAddPlayer: (player: PlayerWithRank) => void;
}

export function AvailablePlayersPanel({
  isPlayerDrafted,
  draftedCount,
  onAddPlayer,
}: AvailablePlayersPanelProps) {
  const [showDrafted, setShowDrafted] = React.useState(false);

  const {
    filteredPlayers,
    isLoading,
    totalMatchingPlayers,
    hasMore,
    loadMorePlayers,
    activeFilter,
    searchTerm,
    onFilterChange,
    onSearchChange,
  } = usePlayersManager({ forceSeason: 'last' });

  useInfiniteScroll({
    hasMore,
    onLoadMore: loadMorePlayers,
    dataLength: filteredPlayers.length,
  });

  const displayedPlayers = React.useMemo(() => {
    if (showDrafted) return filteredPlayers;
    return filteredPlayers.filter((player) => !isPlayerDrafted(player.player_key));
  }, [filteredPlayers, showDrafted, isPlayerDrafted]);

  const getDescription = () => {
    if (isLoading && filteredPlayers.length === 0) {
      return 'Loading players...';
    }
    const base = `Showing ${displayedPlayers.length} of ${totalMatchingPlayers}`;
    return hasMore ? `${base}. Scroll to load more.` : base;
  };

  const showDraftedToggle = (
    <div className="flex items-center gap-2 mr-1">
      <Switch
        id="show-drafted"
        checked={showDrafted}
        onCheckedChange={setShowDrafted}
        disabled={draftedCount === 0}
      />
      <Label
        htmlFor="show-drafted"
        className={draftedCount === 0 ? 'text-muted-foreground' : ''}
      >
        Show Drafted
      </Label>
    </div>
  );

  const columns = React.useMemo<ColumnDef<PlayerWithRank>[]>(
    () => [
      {
        id: 'rank',
        header: 'Rank',
        accessorKey: 'originalRank',
        cell: ({ row }) => (
          <span className="font-medium text-sm">{row.original.originalRank}</span>
        ),
      },
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name.full',
      },
      {
        id: 'team',
        header: 'Team',
        accessorKey: 'editorial_team_abbr',
      },
      {
        id: 'position',
        header: 'Pos',
        accessorKey: 'display_position',
        cell: ({ row }) => (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {row.original.display_position.replaceAll(',', '/')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const isDrafted = isPlayerDrafted(row.original.player_key);
          return (
            <div className="flex items-center gap-1 justify-end">
              {isDrafted && <Badge className="bg-green-100 text-green-800">Drafted</Badge>}
              <PlayerStatsPopover player={row.original} />
              {!isDrafted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onAddPlayer(row.original)}
                    >
                      <UserPlus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add to Draft</TooltipContent>
                </Tooltip>
              )}
            </div>
          );
        },
      },
    ],
    [isPlayerDrafted, onAddPlayer]
  );

  const table = useReactTable({
    data: displayedPlayers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const filterLabel = FILTER_LABELS[activeFilter] || activeFilter;
  const description = getDescription();

  return (
    <PanelCard
      title={`Viewing: ${filterLabel}`}
      description={description}
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      filterDisabled={isLoading}
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      searchDisabled={isLoading}
      headerActions={showDraftedToggle}
    >
      <Table className='border-0 rounded-t-none'>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {columns.map((_, colIndex) => (
                  <TableCell key={`skeleton-${i}-${colIndex}`}>
                    <div className="h-4 bg-muted rounded animate-pulse" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No players found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </PanelCard>
  );
}
