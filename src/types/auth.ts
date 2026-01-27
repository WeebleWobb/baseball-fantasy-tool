export interface YahooProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

import type { DefaultSession } from "next-auth";

export interface ExtendedSession extends DefaultSession {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: "RefreshAccessTokenError";
} 