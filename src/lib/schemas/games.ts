import { z } from 'zod';

/**
 * Yahoo Fantasy Sports API - Games endpoint schema
 * Built from real API response: /games;game_codes=mlb;seasons={year}
 *
 * Key structure notes:
 * - games is an object with numeric string keys ("0", "1", etc.), not an array
 * - Each game entry contains a single-element array with game data
 * - Includes count field and metadata fields
 */

// Individual game data
export const gameDataSchema = z.object({
  game_key: z.string(),
  game_id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
  url: z.string(),
  season: z.string(),
  is_registration_over: z.number(),
  is_game_over: z.number(),
  is_offseason: z.number(),
  alternate_start_deadline: z.string().optional()
}).passthrough();

// Game wrapper - Yahoo returns game data in single-element array
export const gameWrapperSchema = z.object({
  game: z.array(gameDataSchema).min(1)
});

// Games collection - object with numeric keys + count
export const gamesCollectionSchema = z.record(
  z.union([gameWrapperSchema, z.number()])
).refine(
  (data) => typeof data.count === 'number',
  { message: 'Games collection must have count field' }
);

// Full games response
export const gamesResponseSchema = z.object({
  fantasy_content: z.object({
    'xml:lang': z.string().optional(),
    'yahoo:uri': z.string().optional(),
    games: gamesCollectionSchema,
    time: z.string().optional(),
    copyright: z.string().optional(),
    refresh_rate: z.string().optional()
  }).passthrough()
});

export type GamesResponse = z.infer<typeof gamesResponseSchema>;
export type GameData = z.infer<typeof gameDataSchema>;
