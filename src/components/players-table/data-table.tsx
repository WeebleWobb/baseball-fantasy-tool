"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  Cell,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { FilterButtons } from "@/components/players-table/filter-buttons"
import LoadingIndicator from "@/components/players-table/loading-indicator"
import type { PlayerFilterType } from "@/types/hooks"
import { cn } from "@/lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  initialLoadCount?: number
  totalMatchingPlayers?: number
  hasMore?: boolean
  onLoadMore?: () => void
  activeFilter?: PlayerFilterType
  onFilterChange?: (filter: PlayerFilterType) => void
  searchTerm?: string
  onSearchChange?: (searchTerm: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  initialLoadCount = 25,
  totalMatchingPlayers = 0,
  hasMore = false,
  onLoadMore,
  activeFilter = 'ALL_BATTERS',
  onFilterChange,
  searchTerm = "",
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const { isNearBottom } = useInfiniteScroll({
    hasMore,
    onLoadMore: onLoadMore || (() => {}),
    dataLength: data.length,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  const renderTableRows = () => {
    if (isLoading) {
      return Array.from({ length: initialLoadCount }).map((_, i) => (
        <TableRow key={`skeleton-${i}`}>
          {columns.map((_, colIndex) => (
            <TableCell className="p-2" key={`skeleton-${i}-${colIndex}`}>
              <div className="h-2 bg-gray-200 rounded animate-pulse my-1.5" />
            </TableCell>
          ))}
        </TableRow>
      ))
    }

    const rows = table.getRowModel().rows
    if (!rows?.length) {
      return (
        <TableRow>
          <TableCell colSpan={columns.length} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      )
    }

    return rows.map((row) => (
      <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
        {row.getVisibleCells().map((cell: Cell<TData, TValue>) => {
          const isRankColumn = cell.column.id === 'rank'
          const isNameColumn = cell.column.id === 'name_full'

          return (
            <TableCell
              key={cell.id}
              className={cn(
                isRankColumn && 'bg-red w-24 pl-4',
                isNameColumn && 'pl-4'
              )}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          )
        })}
      </TableRow>
    ))
  }

  return (
    <>
      {/* Search Input and Position Filters - visible but disabled during loading */}
      <div className="flex flex-col mb-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder="Search Player"
          value={searchTerm ?? ""}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="max-w-xs mb-4 lg:mb-0"
          disabled={isLoading}
        />
        {/* Filter Buttons */}
        {onFilterChange && (
          <FilterButtons
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            disabled={isLoading}
          />
        )}
      </div>

      {/* Table - header always visible, body shows skeleton when loading */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {renderTableRows()}
        </TableBody>
      </Table>

      {/* Infinite Scroll Status and Loading - only show when not in initial loading */}
      {!isLoading && (
        <LoadingIndicator
          hasMore={hasMore}
          isNearBottom={isNearBottom}
          currentCount={data.length}
          totalCount={totalMatchingPlayers}
        />
      )}
    </>
  )
} 