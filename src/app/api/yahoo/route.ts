import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { logResponse } from '@/lib/schemas/dev-logger';

const YAHOO_FANTASY_BASE_URL = 'https://fantasysports.yahooapis.com/fantasy/v2';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const accessToken = request.headers.get('Authorization')?.split('Bearer ')[1];

    if (!endpoint || !accessToken) {
      return NextResponse.json(
        { error: 'Missing endpoint or access token' },
        { status: 400 }
      );
    }

    const response = await axios.get(`${YAHOO_FANTASY_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      params: {
        format: 'json'
      }
    });

    // Log response in development for schema building
    logResponse(endpoint, response.data);

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch from Yahoo API',
          message: error.response?.data || error.message,
          statusCode: error.response?.status || 500
        },
        { status: error.response?.status || 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        message: error instanceof Error ? error.message : 'Unknown error',
        statusCode: 500
      },
      { status: 500 }
    );
  }
}
