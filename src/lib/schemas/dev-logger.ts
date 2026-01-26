/**
 * Development-only logger for capturing real Yahoo API responses
 * Used to build accurate Zod schemas from actual data
 *
 * NEVER import this in production code paths
 */

const IS_DEV = process.env.NODE_ENV === 'development';
const MAX_LOGS = 50;

interface ResponseLog {
  endpoint: string;
  timestamp: string;
  response: unknown;
}

// In-memory store for dev inspection
const responseLog: ResponseLog[] = [];

/**
 * Log a Yahoo API response for later inspection
 * Only works in development mode
 */
export function logResponse(endpoint: string, response: unknown): void {
  if (!IS_DEV) return;

  responseLog.push({
    endpoint,
    timestamp: new Date().toISOString(),
    response
  });

  // Keep only last N responses to prevent memory issues
  if (responseLog.length > MAX_LOGS) {
    responseLog.shift();
  }
}

/**
 * Get all captured response logs
 * Returns empty array in production
 */
export function getResponseLog(): ResponseLog[] {
  return IS_DEV ? [...responseLog] : [];
}

/**
 * Clear all captured logs
 */
export function clearResponseLog(): void {
  if (IS_DEV) {
    responseLog.length = 0;
  }
}

/**
 * Get logs for a specific endpoint pattern
 */
export function getLogsByEndpoint(pattern: string): ResponseLog[] {
  if (!IS_DEV) return [];
  return responseLog.filter(log => log.endpoint.includes(pattern));
}
