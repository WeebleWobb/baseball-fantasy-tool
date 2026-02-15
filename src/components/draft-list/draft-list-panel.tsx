'use client';

import React from 'react';
import { ArrowUp, ArrowDown, UserMinus, GripVertical } from 'lucide-react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { PanelCard } from './panel-card';
import { ExportDropdown } from './export-dropdown';
import { RankMovePopover } from './rank-move-popover';
import { FILTER_LABELS } from '@/lib/constants';
import { playerMatchesFilter } from '@/lib/utils';
import type { StoredDraftPlayer } from '@/types/draft-list';
import type { PlayerFilterType } from '@/types/hooks';

interface DraftListPanelProps {
  draftList: StoredDraftPlayer[];
  onRemovePlayer: (playerKey: string) => void;
  onMovePlayer: (playerKey: string, direction: 'up' | 'down') => void;
  onReorderPlayer: (playerKey: string, newIndex: number) => void;
}

interface SortableRowProps {
  row: import('@tanstack/react-table').Row<StoredDraftPlayer>;
  children: React.ReactNode;
}

function SortableRow({ row, children }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.original.player_key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'bg-gray-200 hover:bg-gray-200' : undefined}
      {...attributes}
    >
      <TableCell className="w-fit px-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
      </TableCell>
      {children}
    </TableRow>
  );
}

export function DraftListPanel({
  draftList,
  onRemovePlayer,
  onMovePlayer,
  onReorderPlayer,
}: DraftListPanelProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState<PlayerFilterType>('ALL_PLAYERS');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = draftList.findIndex((p) => p.player_key === active.id);
      const newIndex = draftList.findIndex((p) => p.player_key === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderPlayer(active.id as string, newIndex);
      }
    },
    [draftList, onReorderPlayer]
  );

  // Filter draft list by search term and position filter
  const filteredDraftList = React.useMemo(() => {
    return draftList.filter((player) => {
      // Search filter
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        if (!player.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      // Position filter
      if (activeFilter !== 'ALL_PLAYERS') {
        if (!playerMatchesFilter(player.position, activeFilter)) {
          return false;
        }
      }
      return true;
    });
  }, [draftList, searchTerm, activeFilter]);

  const columns = React.useMemo<ColumnDef<StoredDraftPlayer>[]>(
    () => [
      {
        id: 'rank',
        header: 'Rank',
        cell: ({ row }) => {
          // Find original index in full draft list for proper rank
          const originalIndex = draftList.findIndex(
            (p) => p.player_key === row.original.player_key
          );
          const rank = originalIndex + 1;
          const allPlayers = draftList.map((p, idx) => ({
            name: p.name,
            rank: idx + 1,
          }));
          return (
            <RankMovePopover
              playerName={row.original.name}
              currentRank={rank}
              allPlayers={allPlayers}
              onMoveToRank={(newRank) => {
                onReorderPlayer(row.original.player_key, newRank - 1);
              }}
            >
              <Button
                variant="ghost"
                className="h-6 w-6 font-medium text-sm text-foreground"
              >
                {rank}
              </Button>
            </RankMovePopover>
          );
        },
      },
      {
        id: 'name',
        header: 'Name',
        accessorKey: 'name',
      },
      {
        id: 'team',
        header: 'Team',
        accessorKey: 'team',
      },
      {
        id: 'position',
        header: 'Pos',
        accessorKey: 'position',
        cell: ({ row }) => (
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
            {row.original.position.replaceAll(',', '/')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const originalIndex = draftList.findIndex(
            (p) => p.player_key === row.original.player_key
          );
          const isFirst = originalIndex === 0;
          const isLast = originalIndex === draftList.length - 1;

          return (
            <div className="flex items-center gap-1 justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMovePlayer(row.original.player_key, 'up')}
                    disabled={isFirst}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move Up</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMovePlayer(row.original.player_key, 'down')}
                    disabled={isLast}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Move Down</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRemovePlayer(row.original.player_key)}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove from Draft</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [draftList, onMovePlayer, onRemovePlayer, onReorderPlayer]
  );

  const table = useReactTable({
    data: filteredDraftList,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const filterLabel = FILTER_LABELS[activeFilter] || activeFilter;
  const description = `${draftList.length} player${draftList.length !== 1 ? 's' : ''} in your draft list`;

  const emptyMessage = draftList.length === 0
    ? 'No players in your draft list yet. Add players from the available pool.'
    : 'No players match your search.';

  return (
    <PanelCard
      title={`Draft List: ${filterLabel}`}
      description={description}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      headerActions={<ExportDropdown draftList={draftList} />}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <Table className='border-0 rounded-t-none'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-4" />
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + 1} className="h-24 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              <SortableContext
                items={filteredDraftList.map((p) => p.player_key)}
                strategy={verticalListSortingStrategy}
              >
                {table.getRowModel().rows.map((row) => (
                  <SortableRow key={row.id} row={row}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </SortableRow>
                ))}
              </SortableContext>
            )}
          </TableBody>
        </Table>
      </DndContext>
    </PanelCard>
  );
}
