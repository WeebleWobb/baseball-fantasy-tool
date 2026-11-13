import { z } from 'zod';

/**
 * Yahoo Fantasy Sports API - Players endpoint schema
 * Built from real API response: /game/{gameKey}/players;start=0;count=25;sort=AR;status=A;position=B/stats
 *
 * Key structure notes:
 * - players is object with numeric keys ("0", "1", etc.) + count field
 * - Each player entry has: player: [ [...metadata], { player_stats, player_advanced_stats } ]
 * - Metadata array contains objects with single keys + empty arrays
 * - Stats are wrapped: { stat: { stat_id, value } }
 * - Stat values can be "-" (string) when no data, or numeric strings
 */

// Stat value - can be "-" for no data, or a number/numeric string
export const statValueSchema = z.union([
  z.string(),  // "-" or numeric string like "0.300"
  z.number()
]);

// Individual stat entry - wrapped in { stat: {...} }
export const statEntrySchema = z.object({
  stat: z.object({
    stat_id: z.string(),
    value: statValueSchema
  })
});

// Player stats container - coverage info varies by stat type
export const playerStatsContainerSchema = z.object({
  '0': z.object({
    coverage_type: z.string().optional(),
    season: z.string().optional(),
    week: z.string().optional(),
    date: z.string().optional()
  }).loose().optional(),
  stats: z.array(statEntrySchema)
}).loose();

// Player name
export const playerNameSchema = z.object({
  full: z.string(),
  first: z.string(),
  last: z.string(),
  ascii_first: z.string().optional(),
  ascii_last: z.string().optional()
});

// Player metadata item - various single-key objects or empty arrays
export const playerMetadataItemSchema = z.union([
  z.object({ player_key: z.string() }).loose(),
  z.object({ player_id: z.string() }).loose(),
  z.object({ name: playerNameSchema }).loose(),
  z.object({ url: z.string() }).loose(),
  z.object({ status: z.string(), status_full: z.string() }).loose(), // Inactive players
  z.object({ editorial_player_key: z.string() }).loose(),
  z.object({ editorial_team_key: z.string() }).loose(),
  z.object({ editorial_team_full_name: z.string() }).loose(),
  z.object({ editorial_team_abbr: z.string() }).loose(),
  z.object({ editorial_team_url: z.string() }).loose(),
  z.object({ display_position: z.string() }).loose(),
  z.object({ position_type: z.string() }).loose(),
  z.object({ uniform_number: z.string() }).loose(),
  z.object({ headshot: z.unknown() }).loose(),
  z.object({ eligible_positions: z.array(z.unknown()) }).loose(),
  z.object({ eligible_positions_to_add: z.array(z.unknown()) }).loose(),
  z.object({ is_keeper: z.unknown() }).loose(),
  z.object({ is_undroppable: z.string() }).loose(),
  z.object({ has_player_notes: z.number() }).loose(),
  z.array(z.unknown()),  // Empty arrays that appear in metadata
  z.record(z.string(), z.unknown())  // Catch-all for other objects
]);

// Player stats wrapper (second element of player tuple)
export const playerStatsWrapperSchema = z.object({
  player_stats: playerStatsContainerSchema.optional(),
  player_advanced_stats: playerStatsContainerSchema.optional()
}).loose();

// Full player entry - use min-length array to allow additional elements
// Yahoo API returns varying array structures for different stat types
export const playerEntrySchema = z.object({
  player: z.tuple([
    z.array(playerMetadataItemSchema),  // Metadata array (first element)
    playerStatsWrapperSchema            // Stats object (second element)
  ]).rest(z.unknown())                  // Allow additional elements beyond the required two
});

// Players collection - object with numeric keys + count
export const playersCollectionSchema = z.record(
  z.string(),
  z.union([playerEntrySchema, z.number()])
);

// Game data in players response (first element of game tuple)
export const gameInfoSchema = z.object({
  game_key: z.string(),
  game_id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  url: z.string(),
  season: z.string(),
  is_registration_over: z.number(),
  is_game_over: z.number(),
  is_offseason: z.number()
}).loose();

// Players wrapper (second element of game tuple)
export const playersWrapperSchema = z.object({
  players: playersCollectionSchema
});

// Full players response
export const playersResponseSchema = z.object({
  fantasy_content: z.object({
    'xml:lang': z.string().optional(),
    'yahoo:uri': z.string().optional(),
    game: z.tuple([
      gameInfoSchema,
      playersWrapperSchema
    ]),
    time: z.string().optional(),
    copyright: z.string().optional(),
    refresh_rate: z.string().optional()
  }).loose()
});

export type PlayersResponse = z.infer<typeof playersResponseSchema>;
export type PlayerEntry = z.infer<typeof playerEntrySchema>;
export type PlayerStatsContainer = z.infer<typeof playerStatsContainerSchema>;
