import { z } from 'zod';

/**
 * Yahoo Fantasy Sports API - Users endpoint schema
 * Built from real API response: /users;use_login=1/profile
 *
 * Key structure notes:
 * - users is an object with numeric string keys ("0"), not an array
 * - Each user entry has array: [{ guid }, { profile: {...} }]
 * - Profile contains display_name, image_url, etc.
 */

// User profile data
export const userProfileSchema = z.object({
  display_name: z.string(),
  fantasy_profile_url: z.string(),
  legal_jurisdiction: z.string().optional(),
  image_url: z.string(),
  unique_username: z.string().optional()
}).passthrough();

// User entry - array with guid object and profile object
export const userEntrySchema = z.object({
  user: z.array(
    z.union([
      z.object({ guid: z.string() }).passthrough(),
      z.object({ profile: userProfileSchema }).passthrough()
    ])
  ).min(1)
});

// Users collection - object with numeric keys + count
export const usersCollectionSchema = z.record(
  z.union([userEntrySchema, z.number()])
).refine(
  (data) => typeof data.count === 'number',
  { message: 'Users collection must have count field' }
);

// Full users response
export const usersResponseSchema = z.object({
  fantasy_content: z.object({
    'xml:lang': z.string().optional(),
    'yahoo:uri': z.string().optional(),
    users: usersCollectionSchema,
    time: z.string().optional(),
    copyright: z.string().optional(),
    refresh_rate: z.string().optional()
  }).passthrough()
});

export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
