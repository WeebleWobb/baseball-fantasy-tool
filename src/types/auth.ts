export interface YahooProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

export interface YahooIdToken {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

export interface YahooTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

import type { DefaultSession } from "next-auth";

export interface ExtendedSession extends DefaultSession {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: "RefreshAccessTokenError";
} 