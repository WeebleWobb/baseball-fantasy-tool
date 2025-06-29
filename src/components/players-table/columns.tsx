"use client"

import { ColumnDef } from "@tanstack/react-table"
import { YahooPlayerStats } from "@/types/yahoo-fantasy"
import { DataTableColumnHeader } from "@/components/players-table/data-table-column-header"
import { BATTING_STAT_IDS } from "@/lib/constants"
import { PlayerStatsCell } from "@/components/players-table/player-stats-cell"

export const columns: ColumnDef<YahooPlayerStats>[] = [
  {
    accessorKey: "name.full",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
  },
  {
    accessorKey: "editorial_team_abbr",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Team" />
    ),
  },
  {
    accessorKey: "display_position",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Position" />
    ),
  },
  {
    id: "batting_avg",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="H/AB" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex gap-1">
          <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.HITS} />
          <span>/</span>
          <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.AT_BATS} />
        </div>
      );
    },
  },
  {
    id: "runs",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="R" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.RUNS} />;
    },
  },
  {
    id: "singles",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="1B" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.SINGLES} />;
    },
  },
  {
    id: "doubles",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="2B" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.DOUBLES} />;
    },
  },
  {
    id: "triples",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="3B" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.TRIPLES} />;
    },
  },
  {
    id: "home_runs",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="HR" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.HOME_RUNS} />;
    },
  },
  {
    id: "rbi",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="RBI" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.RBI} />;
    },
  },
  {
    id: "stolen_bases",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SB" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.STOLEN_BASES} />;
    },
  },
  {
    id: "walks",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="BB" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.WALKS} />;
    },
  },
  {
    id: "hit_by_pitch",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="HBP" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={BATTING_STAT_IDS.HIT_BY_PITCH} />;
    },
  },
] 