'use client';

import React from 'react';
import { Search } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RankedPlayer {
  name: string;
  rank: number;
}

interface RankMovePopoverProps {
  playerName: string;
  currentRank: number;
  allPlayers: RankedPlayer[];
  onMoveToRank: (newRank: number) => void;
  children: React.ReactNode;
}

export function RankMovePopover({
  playerName,
  currentRank,
  allPlayers,
  onMoveToRank,
  children,
}: RankMovePopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Filter players based on search term (matches rank number)
  const filteredPlayers = React.useMemo(() => {
    if (!searchTerm.trim()) return allPlayers;
    return allPlayers.filter((player) =>
      player.rank.toString().includes(searchTerm.trim())
    );
  }, [allPlayers, searchTerm]);

  const handleSelectRank = (newRank: number) => {
    if (newRank !== currentRank) {
      onMoveToRank(newRank);
    }
    setOpen(false);
    setSearchTerm('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <PopoverHeader className="p-3 pb-2">
          <PopoverTitle>Move Player</PopoverTitle>
          <PopoverDescription>Select new rank</PopoverDescription>
        </PopoverHeader>

        <div className="px-3 pb-2 text-sm font-medium border-b">
          {playerName} (#{currentRank})
        </div>

        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>

        <div className="max-h-48 overflow-y-auto p-1">
          {filteredPlayers.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No positions found
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const isCurrent = player.rank === currentRank;
              return (
                <Button
                  key={player.rank}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-8 px-2 font-normal',
                    isCurrent && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={isCurrent}
                  onClick={() => handleSelectRank(player.rank)}
                >
                  {player.rank}. {player.name}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (current)
                    </span>
                  )}
                </Button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
