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

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
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
          scope: "openid fspt-r",
          prompt: "login"
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
    async jwt({ token, account }: { token: JWT; account: any }) {
      // Persist the OAuth access_token and refresh_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
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