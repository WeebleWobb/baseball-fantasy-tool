import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you based on your tsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jose|openid-client|oauth|@panva/hkdf|preact-render-to-string|preact|next-auth)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
    '!src/__tests__/utils/**',
    '!src/app/api/auth/**',
    '!src/app/api/dev/**',
    '!src/lib/utils.ts',
    '!src/lib/constants.ts',
    '!src/lib/auth.ts',
    '!src/lib/schemas/dev-logger.ts',
    '!src/components/ui/**',
  ],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  testPathIgnorePatterns: [
    '<rootDir>/.next/', 
    '<rootDir>/node_modules/',
    '<rootDir>/src/__tests__/utils/test-fixtures.ts'
  ],
  // Optimize file watching to prevent EMFILE errors
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/.git/',
    '<rootDir>/logs/',
    '<rootDir>/public/',
    '<rootDir>/specs/',
  ],
  // Use polling for file watching on macOS to avoid file descriptor limits
  watchman: false,
  // Limit the number of workers to reduce resource usage
  maxWorkers: '50%',
  // Coverage thresholds
  coverageThreshold: {
    global: {
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig) 