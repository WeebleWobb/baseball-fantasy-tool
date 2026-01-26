import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates required env vars at application startup
 */

const envSchema = z.object({
  // NextAuth
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(1),

  // Yahoo OAuth
  YAHOO_CLIENT_ID: z.string().min(1),
  YAHOO_CLIENT_SECRET: z.string().min(1),

  // Optional
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validate environment variables
 * Call this at app startup to fail fast on misconfiguration
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const missing = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${msgs?.join(', ')}`)
      .join('\n');

    throw new Error(`Missing or invalid environment variables:\n${missing}`);
  }

  return result.data;
}

/**
 * Get validated env vars (throws if invalid)
 * Use this instead of accessing process.env directly
 */
let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = validateEnv();
  }
  return cachedEnv;
}
