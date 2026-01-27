import {
  yahooIdTokenSchema,
  yahooTokenResponseSchema,
  yahooTokenErrorSchema,
  parseYahooTokenResponse,
} from '@/lib/schemas/auth';

describe('Auth Schemas', () => {
  describe('yahooIdTokenSchema', () => {
    it('should validate valid ID token payload', () => {
      const validToken = {
        sub: 'user123',
        aud: 'client-id',
        iss: 'https://api.login.yahoo.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const result = yahooIdTokenSchema.safeParse(validToken);
      expect(result.success).toBe(true);
    });

    it('should allow additional fields with passthrough', () => {
      const tokenWithExtra = {
        sub: 'user123',
        aud: 'client-id',
        iss: 'https://api.login.yahoo.com',
        exp: 1234567890,
        iat: 1234567800,
        email: 'user@example.com',
        name: 'Test User',
      };

      const result = yahooIdTokenSchema.safeParse(tokenWithExtra);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('should reject invalid ID token', () => {
      const invalidToken = {
        sub: 'user123',
        // missing required fields
      };

      const result = yahooIdTokenSchema.safeParse(invalidToken);
      expect(result.success).toBe(false);
    });
  });

  describe('yahooTokenResponseSchema', () => {
    it('should validate valid token response', () => {
      const validResponse = {
        access_token: 'abc123',
        refresh_token: 'refresh456',
        expires_in: 3600,
        token_type: 'bearer',
      };

      const result = yahooTokenResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate minimal token response', () => {
      const minimalResponse = {
        access_token: 'abc123',
        expires_in: 3600,
      };

      const result = yahooTokenResponseSchema.safeParse(minimalResponse);
      expect(result.success).toBe(true);
    });

    it('should reject response without access_token', () => {
      const invalidResponse = {
        refresh_token: 'refresh456',
        expires_in: 3600,
      };

      const result = yahooTokenResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });
  });

  describe('yahooTokenErrorSchema', () => {
    it('should validate error response', () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'Token has expired',
      };

      const result = yahooTokenErrorSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it('should validate error without description', () => {
      const errorResponse = {
        error: 'access_denied',
      };

      const result = yahooTokenErrorSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('parseYahooTokenResponse', () => {
    it('should return success for valid token response', () => {
      const validResponse = {
        access_token: 'abc123',
        refresh_token: 'refresh456',
        expires_in: 3600,
      };

      const result = parseYahooTokenResponse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.tokens.access_token).toBe('abc123');
      }
    });

    it('should return error for error response', () => {
      const errorResponse = {
        error: 'invalid_grant',
        error_description: 'Token has expired',
      };

      const result = parseYahooTokenResponse(errorResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error).toBe('invalid_grant');
      }
    });

    it('should return error for invalid response format', () => {
      const invalidResponse = {
        random: 'data',
      };

      const result = parseYahooTokenResponse(invalidResponse);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.error).toBe('invalid_response');
      }
    });

    it('should handle null/undefined input', () => {
      const result = parseYahooTokenResponse(null);
      expect(result.success).toBe(false);
    });
  });
});
