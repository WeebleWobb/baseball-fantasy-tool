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
  totalMatchingPlayers?: number
  hasMore?: boolean
  onLoadMore?: () => void
  activeFilter?: PlayerFilterType
  onFilterChange?: (filter: PlayerFilterType) => void
  disabled?: boolean
  searchTerm?: string
  onSearchChange?: (searchTerm: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  totalMatchingPlayers = 0,
  hasMore = false,
  onLoadMore,
  activeFilter = 'ALL_BATTERS',
  onFilterChange,
  disabled = false,
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

  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
        <div className="rounded-lg border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 border-b bg-gray-50 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Search Input */}
      <div className="flex flex-col mb-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder="Search Player"
          value={searchTerm ?? ""}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="max-w-xs mb-4 lg:mb-0"
        />
        {/* Filter Buttons */}
        {onFilterChange && (
          <FilterButtons
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
            disabled={disabled}
          />
        )}
      </div>
      <Table>
        <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      
      {/* Infinite Scroll Status and Loading */}
      <LoadingIndicator 
        hasMore={hasMore} 
        isNearBottom={isNearBottom}
        currentCount={data.length}
        totalCount={totalMatchingPlayers}
      />
    </>
  )
} 