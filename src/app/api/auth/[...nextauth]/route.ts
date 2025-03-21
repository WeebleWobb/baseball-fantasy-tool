import NextAuth from "next-auth";
import type { DefaultSession, NextAuthOptions } from "next-auth";
import type { OAuthConfig } from "next-auth/providers/oauth";
import type { JWT } from "next-auth/jwt";
import { jwtDecode } from "jwt-decode";

interface YahooProfile {
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

interface YahooIdToken {
  sub: string;
  aud: string;
  iss: string;
  exp: number;
  iat: number;
}

interface YahooTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface ExtendedSession extends DefaultSession {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  error?: "RefreshAccessTokenError";
}

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";
  }
}

export const authOptions: NextAuthOptions = {
  debug: true,
  logger: {
    error: (code: string, ...message: unknown[]) => {
      console.error(code, message);
    },
    warn: (code: string, ...message: unknown[]) => {
      console.warn(code, message);
    },
    debug: (code: string, ...message: unknown[]) => {
      console.debug(code, message);
    },
  },
  providers: [
    {
      id: "yahoo",
      name: "Yahoo",
      type: "oauth",
      authorization: {
        url: "https://api.login.yahoo.com/oauth2/request_auth",
        params: {
          response_type: "code",
          scope: "openid fspt-r"
        },
      },
      token: {
        url: "https://api.login.yahoo.com/oauth2/get_token",
        async request({ params, provider }) {
          const redirectUri = "https://localhost:3000/api/auth/callback/yahoo";
          console.log("Attempting token exchange with redirect URI:", redirectUri);
          
          const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${provider.clientId}:${provider.clientSecret}`).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "authorization_code",
              code: params.code || "",
              redirect_uri: redirectUri,
            } as Record<string, string>),
          });

          const tokens = await response.json();
          console.log("Token response:", tokens);
          
          if (tokens.error) {
            console.error("Token error:", tokens.error, tokens.error_description);
            throw new Error(tokens.error_description || tokens.error);
          }
          
          return { tokens };
        },
      },
      clientId: process.env.YAHOO_CLIENT_ID,
      clientSecret: process.env.YAHOO_CLIENT_SECRET,
      checks: ["state"],
      profile(profile: YahooProfile, tokens: { id_token?: string }) {
        if (tokens.id_token) {
          const idToken = jwtDecode<YahooIdToken>(tokens.id_token);
          console.log("Decoded ID token:", idToken);
          return {
            id: idToken.sub,
            name: idToken.sub, // Yahoo doesn't provide name in ID token
            email: undefined,
            image: undefined,
          };
        }
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    } as OAuthConfig<YahooProfile>,
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Access token has expired, try to refresh it
      if (token.refreshToken) {
        try {
          const response = await fetch("https://api.login.yahoo.com/oauth2/get_token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: token.refreshToken,
            }),
          });

          const tokens = await response.json() as YahooTokens;

          if (!response.ok) throw tokens;

          return {
            ...token,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? token.refreshToken,
            expiresAt: Math.floor(Date.now() / 1000 + tokens.expires_in),
          };
        } catch (error) {
          console.error("Error refreshing access token", error);
          // The error property will be used client-side to handle the refresh token error
          return { ...token, error: "RefreshAccessTokenError" as const };
        }
      }

      return token;
    },
    async session({ session, token }: { session: ExtendedSession; token: JWT }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      session.expiresAt = token.expiresAt;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    error: "/auth/error",
  },
  events: {
    async signOut({ token }: { token: JWT | null }) {
      // Revoke Yahoo session
      if (token?.accessToken) {
        try {
          await fetch("https://api.login.yahoo.com/oauth2/revoke", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(`${process.env.YAHOO_CLIENT_ID}:${process.env.YAHOO_CLIENT_SECRET}`).toString("base64")}`,
            },
            body: new URLSearchParams({
              token: token.accessToken as string,
            }),
          });
        } catch (error) {
          console.error("Error revoking Yahoo token:", error);
        }
      }
    }
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST }; 