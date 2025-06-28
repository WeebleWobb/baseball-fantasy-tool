import { NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

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

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error('Yahoo API Error Details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });

      return NextResponse.json(
        { 
          error: 'Failed to fetch from Yahoo API',
          details: error.response?.data || error.message
        },
        { status: error.response?.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 