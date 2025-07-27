"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

function Table({ ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="border rounded-md w-ful max-h-[calc(100vh-324px)] overflow-auto"
    >
      <table
        data-slot="table"
        className="w-full text-sm"
        {...props}
      />
    </div>
  )
}

function TableHeader({ ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
              className="bg-muted shadow-[inset_0_-1px_0_0_oklch(0.929_0.013_255.508)] sticky top-0"
      {...props}
    />
  )
}

function TableBody({...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      {...props}
    />
  )
}

function TableRow({ ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className="border-b last:border-b-0 hover:bg-muted/50 data-[state=selected]:bg-muted transition-colors"
      {...props}
    />
  )
}

function TableHead({...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className="h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]"
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
}
