"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PlayerWithRank } from "@/types/yahoo-fantasy"
import { DataTableColumnHeader } from "@/components/players-table/data-table-column-header"
import { BATTING_STAT_IDS, PITCHING_STAT_IDS } from "@/lib/constants"
import { PlayerStatsCell } from "@/components/players-table/player-stats-cell"
import type { PlayerFilterType } from "@/types/hooks"

// Common columns for both batters and pitchers
const commonColumns: ColumnDef<PlayerWithRank>[] = [
  {
    id: "rank",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rank" />
    ),
    accessorKey: "globalRank",
    cell: ({ row }) => {
      const rank = row.original.globalRank;
      return <span className="font-medium text-sm">{rank}</span>;
    },
  },
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
];

// Batter-specific columns
const batterColumns: ColumnDef<PlayerWithRank>[] = [
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
];

// Pitcher-specific columns (in specified order: IP, WHIP, ERA, W, SV, OUT, H, ER, BB, HBP, K, BS)
const pitcherColumns: ColumnDef<PlayerWithRank>[] = [
  {
    id: "innings_pitched",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="IP" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.INNINGS_PITCHED} />;
    },
  },
  {
    id: "whip",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="WHIP" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.WHIP} />;
    },
  },
  {
    id: "era",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ERA" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.ERA} />;
    },
  },
  {
    id: "wins",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="W" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.WINS} />;
    },
  },
  {
    id: "saves",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SV" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.SAVES} />;
    },
  },
  {
    id: "outs",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="OUT" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.OUTS} />;
    },
  },
  {
    id: "hits_allowed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="H" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.HITS_ALLOWED} />;
    },
  },
  {
    id: "earned_runs",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ER" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.EARNED_RUNS} />;
    },
  },
  {
    id: "walks_allowed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="BB" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.WALKS_ALLOWED} />;
    },
  },
  {
    id: "hit_by_pitch_allowed",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="HBP" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.HIT_BY_PITCH_ALLOWED} />;
    },
  },
  {
    id: "strikeouts",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="K" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.STRIKEOUTS} />;
    },
  },
  {
    id: "blown_saves",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="BS" />
    ),
    cell: ({ row }) => {
      return <PlayerStatsCell player={row.original} statId={PITCHING_STAT_IDS.BLOWN_SAVES} />;
    },
  },
];

// Function to get columns based on filter type
export function getColumns(filterType: PlayerFilterType): ColumnDef<PlayerWithRank>[] {
  // Determine if this is a pitcher filter
  const isPitcherFilter = filterType === 'ALL_PITCHERS' || filterType === 'SP' || filterType === 'RP' || filterType === 'P';
  
  if (isPitcherFilter) {
    return [...commonColumns, ...pitcherColumns];
  } else {
    return [...commonColumns, ...batterColumns];
  }
}

// Default export for backward compatibility (uses batter columns)
export const columns = getColumns('ALL_BATTERS'); 