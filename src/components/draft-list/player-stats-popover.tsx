'use client';

import { BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { BATTING_STAT_IDS, PITCHING_STAT_IDS } from '@/lib/constants';
import type { PlayerWithRank } from '@/types/yahoo-fantasy';

const PITCHER_POSITIONS = new Set(['SP', 'RP', 'P']);

function isPitcher(player: PlayerWithRank): boolean {
  const positions = player.display_position.split(',').map((p) => p.trim());
  return positions.some((pos) => PITCHER_POSITIONS.has(pos));
}

interface PlayerStatsPopoverProps {
  player: PlayerWithRank;
}

function getStatValue(player: PlayerWithRank, statId: number): string {
  const value = player.player_stats?.stats?.find((s) => s.stat_id === statId)?.value;
  return value !== undefined && value !== null ? value.toString() : '0';
}

function formatDecimal(value: string, decimals: number): string {
  const num = Number.parseFloat(value);
  return Number.isNaN(num) ? '0' : num.toFixed(decimals);
}

export function PlayerStatsPopover({ player }: PlayerStatsPopoverProps) {
  const playerIsPitcher = isPitcher(player);

  const battingStats = [
    { label: 'H/AB', value: `${getStatValue(player, BATTING_STAT_IDS.HITS)}/${getStatValue(player, BATTING_STAT_IDS.AT_BATS)}` },
    { label: 'Runs', value: getStatValue(player, BATTING_STAT_IDS.RUNS) },
    { label: 'HR', value: getStatValue(player, BATTING_STAT_IDS.HOME_RUNS) },
    { label: 'RBI', value: getStatValue(player, BATTING_STAT_IDS.RBI) },
    { label: 'SB', value: getStatValue(player, BATTING_STAT_IDS.STOLEN_BASES) },
    { label: 'BB', value: getStatValue(player, BATTING_STAT_IDS.WALKS) },
    { label: '1B', value: getStatValue(player, BATTING_STAT_IDS.SINGLES) },
    { label: '2B', value: getStatValue(player, BATTING_STAT_IDS.DOUBLES) },
    { label: '3B', value: getStatValue(player, BATTING_STAT_IDS.TRIPLES) },
  ];

  const pitchingStats = [
    { label: 'IP', value: formatDecimal(getStatValue(player, PITCHING_STAT_IDS.INNINGS_PITCHED), 1) },
    { label: 'ERA', value: formatDecimal(getStatValue(player, PITCHING_STAT_IDS.ERA), 2) },
    { label: 'WHIP', value: formatDecimal(getStatValue(player, PITCHING_STAT_IDS.WHIP), 2) },
    { label: 'W', value: getStatValue(player, PITCHING_STAT_IDS.WINS) },
    { label: 'SV', value: getStatValue(player, PITCHING_STAT_IDS.SAVES) },
    { label: 'K', value: getStatValue(player, PITCHING_STAT_IDS.STRIKEOUTS) },
    { label: 'BB', value: getStatValue(player, PITCHING_STAT_IDS.WALKS_ALLOWED) },
    { label: 'H', value: getStatValue(player, PITCHING_STAT_IDS.HITS_ALLOWED) },
    { label: 'ER', value: getStatValue(player, PITCHING_STAT_IDS.EARNED_RUNS) },
  ];

  const stats = playerIsPitcher ? pitchingStats : battingStats;

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <BarChart2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>View Stats</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 p-4" align="start">
        {/* Player Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 relative">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {player.name.first?.[0]}{player.name.last?.[0]}
            </div>
            <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-xs font-medium px-1.5 py-0.5 rounded">
              #{player.originalRank}
            </span>
            <span className="absolute -bottom-1 -right-1 bg-muted-foreground text-muted text-xs font-medium px-1.5 py-0.5 rounded">
              {player.display_position.split(',')[0]}
            </span>
          </div>
          <div className="min-w-0">
            <h4 className="font-semibold text-sm truncate">{player.name.full}</h4>
            <p className="text-xs text-muted-foreground">{player.editorial_team_abbr}</p>
          </div>
        </div>

        {/* Season Stats */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">Season Stats</h5>
          <div className="grid grid-cols-3 gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">{stat.label}</div>
                <div className="text-sm font-medium">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
