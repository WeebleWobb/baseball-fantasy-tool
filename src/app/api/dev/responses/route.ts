import { NextResponse } from 'next/server';
import { getResponseLog, clearResponseLog, getLogsByEndpoint } from '@/lib/schemas/dev-logger';

/**
 * Development-only endpoint to view captured Yahoo API responses
 * GET /api/dev/responses - Get all captured responses
 * GET /api/dev/responses?endpoint=games - Filter by endpoint pattern
 * DELETE /api/dev/responses - Clear all logs
 */

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const endpointFilter = searchParams.get('endpoint');

  const logs = endpointFilter
    ? getLogsByEndpoint(endpointFilter)
    : getResponseLog();

  return NextResponse.json({
    count: logs.length,
    logs
  });
}

export async function DELETE() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  clearResponseLog();

  return NextResponse.json({ message: 'Logs cleared' });
}
