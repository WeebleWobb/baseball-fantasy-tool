"use client"

import * as React from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableMeta } from "@/types/table-pagination"
import { FilterButtons } from "@/components/players-table/filter-buttons"
import type { PlayerFilterType } from "@/types/hooks"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  pageIndex?: number
  onPageChange?: (page: number) => void
  totalPages?: number
  pageSize?: number
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
  pageIndex = 0,
  onPageChange,
  totalPages = 1,
  pageSize = 25,
  activeFilter = 'ALL_BATTERS',
  onFilterChange,
  disabled = false,
  searchTerm = "",
  onSearchChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    meta: {
      pageIndex,
      pageSize,
    } as DataTableMeta,
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
    <div className="space-y-4">
      {/* Filter Buttons */}
      {onFilterChange && (
        <FilterButtons
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
          disabled={disabled}
        />
      )}
      
      {/* Search Input */}
      <div className="flex items-center py-4">
        <Input
          placeholder="Search Player"
          value={searchTerm ?? ""}
          onChange={(event) => onSearchChange?.(event.target.value)}
          className="max-w-sm"
        />
      </div>
      
      {/* Table */}
      <div className="rounded-md border">
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
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
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
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pageIndex - 1)}
            disabled={pageIndex <= 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(pageIndex + 1)}
            disabled={pageIndex >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
} 