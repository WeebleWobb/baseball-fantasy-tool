import { validateEnv } from '@/lib/schemas/env';

describe('Env Schema', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateEnv', () => {
    it('should validate complete environment', () => {
      process.env = {
        ...process.env,
        NEXTAUTH_URL: 'https://example.com',
        NEXTAUTH_SECRET: 'super-secret-key',
        YAHOO_CLIENT_ID: 'client-id-123',
        YAHOO_CLIENT_SECRET: 'client-secret-456',
        NODE_ENV: 'test',
      };

      const result = validateEnv();
      expect(result.NEXTAUTH_URL).toBe('https://example.com');
      expect(result.NEXTAUTH_SECRET).toBe('super-secret-key');
      expect(result.YAHOO_CLIENT_ID).toBe('client-id-123');
      expect(result.YAHOO_CLIENT_SECRET).toBe('client-secret-456');
      expect(result.NODE_ENV).toBe('test');
    });

    it('should throw on missing required env vars', () => {
      process.env = {
        NODE_ENV: 'test',
        // Missing all required vars
      };

      expect(() => validateEnv()).toThrow('Missing or invalid environment variables');
    });

    it('should throw on invalid NEXTAUTH_URL', () => {
      process.env = {
        ...process.env,
        NEXTAUTH_URL: 'not-a-url',
        NEXTAUTH_SECRET: 'secret',
        YAHOO_CLIENT_ID: 'id',
        YAHOO_CLIENT_SECRET: 'secret',
      };

      expect(() => validateEnv()).toThrow();
    });

    it('should default NODE_ENV to development', () => {
      process.env = {
        NEXTAUTH_URL: 'https://example.com',
        NEXTAUTH_SECRET: 'secret',
        YAHOO_CLIENT_ID: 'id',
        YAHOO_CLIENT_SECRET: 'secret',
      } as unknown as NodeJS.ProcessEnv;

      const result = validateEnv();
      expect(result.NODE_ENV).toBe('development');
    });
  });

});
