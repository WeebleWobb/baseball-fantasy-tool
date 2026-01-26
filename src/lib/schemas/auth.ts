import { z } from 'zod';

/**
 * Yahoo OAuth schemas
 * Validates token responses and decoded JWTs from Yahoo
 */

// Decoded Yahoo ID token (JWT payload)
export const yahooIdTokenSchema = z.object({
  sub: z.string(),
  aud: z.string(),
  iss: z.string(),
  exp: z.number(),
  iat: z.number(),
}).passthrough();

export type YahooIdToken = z.infer<typeof yahooIdTokenSchema>;

// Token response from Yahoo OAuth (initial token or refresh)
// Uses passthrough() to allow additional fields like id_token
export const yahooTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  token_type: z.string().optional(),
  id_token: z.string().optional(),
}).passthrough();

export type YahooTokenResponse = z.infer<typeof yahooTokenResponseSchema>;

// Error response from Yahoo OAuth
export const yahooTokenErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
}).passthrough();

export type YahooTokenError = z.infer<typeof yahooTokenErrorSchema>;

/**
 * Parse Yahoo token response, distinguishing success from error
 */
export function parseYahooTokenResponse(data: unknown):
  | { success: true; tokens: YahooTokenResponse }
  | { success: false; error: YahooTokenError } {

  // Check if it's an object with an error field (error responses)
  if (data && typeof data === 'object' && 'error' in data && (data as Record<string, unknown>).error) {
    const errorResult = yahooTokenErrorSchema.safeParse(data);
    if (errorResult.success) {
      return { success: false, error: errorResult.data };
    }
  }

  // Try parsing as success (must have access_token)
  const tokenResult = yahooTokenResponseSchema.safeParse(data);
  if (tokenResult.success) {
    return { success: true, tokens: tokenResult.data };
  }

  // Unknown response format
  return {
    success: false,
    error: {
      error: 'invalid_response',
      error_description: `Unexpected response format from Yahoo OAuth: ${JSON.stringify(data)}`
    }
  };
}
