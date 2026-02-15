import type { PlayerWithRank } from './yahoo-fantasy';

/**
 * Minimal player info stored in localStorage for draft list persistence
 */
export interface StoredDraftPlayer {
  player_key: string;
  name: string;
  team: string;
  position: string;
  originalRank: number;
}

/**
 * Draft list state structure for localStorage
 */
export interface DraftListState {
  players: StoredDraftPlayer[];
  version: number;
}

/**
 * Convert a full PlayerWithRank to StoredDraftPlayer for localStorage
 */
export function toStoredPlayer(player: PlayerWithRank): StoredDraftPlayer {
  return {
    player_key: player.player_key,
    name: player.name.full,
    team: player.editorial_team_abbr,
    position: player.display_position,
    originalRank: player.originalRank,
  };
}
