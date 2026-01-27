/**
 * Yahoo API Route Tests
 * Tests the core proxy functionality and error handling
 */

import { GET } from '@/app/api/yahoo/route'
import { NextResponse } from 'next/server'
import axios from 'axios'

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn(),
  },
}))

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
  AxiosError: class MockAxiosError extends Error {
    public response?: { status: number; data: unknown }
    public isAxiosError = true
    
    constructor(message: string, response?: { status: number; data: unknown }) {
      super(message)
      this.name = 'AxiosError'
      this.response = response
    }
  }
}))

const mockNextResponseJson = NextResponse.json as jest.Mock
const mockAxiosGet = axios.get as jest.Mock

describe('Yahoo API Route', () => {
  let consoleSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    mockNextResponseJson.mockImplementation((data, init) => ({
      json: () => Promise.resolve(data),
      status: init?.status || 200,
    }))
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  it('should reject requests with missing endpoint or authorization', async () => {
    // Missing endpoint
    const requestNoEndpoint = new Request('http://localhost:3000/api/yahoo', {
      headers: { 'Authorization': 'Bearer test-token' },
    })

    await GET(requestNoEndpoint)
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: 'Missing endpoint or access token' },
      { status: 400 }
    )

    // Missing authorization
    const requestNoAuth = new Request('http://localhost:3000/api/yahoo?endpoint=/test')
    await GET(requestNoAuth)
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: 'Missing endpoint or access token' },
      { status: 400 }
    )

    // Malformed authorization
    const requestBadAuth = new Request('http://localhost:3000/api/yahoo?endpoint=/test', {
      headers: { 'Authorization': 'InvalidFormat token' },
    })
    await GET(requestBadAuth)
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      { error: 'Missing endpoint or access token' },
      { status: 400 }
    )
  })

  it('should proxy valid requests to Yahoo API correctly', async () => {
    const request = new Request('http://localhost:3000/api/yahoo?endpoint=/users', {
      headers: { 'Authorization': 'Bearer valid-token' },
    })

    const mockYahooResponse = {
      data: { fantasy_content: { users: [] } }
    }
    mockAxiosGet.mockResolvedValue(mockYahooResponse)

    await GET(request)

    expect(mockAxiosGet).toHaveBeenCalledWith(
      'https://fantasysports.yahooapis.com/fantasy/v2/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer valid-token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }),
        params: { format: 'json' }
      })
    )

    expect(mockNextResponseJson).toHaveBeenCalledWith(mockYahooResponse.data)
  })

  it('should handle different endpoint formats', async () => {
    const endpoints = ['/users;use_login=1', '/games;game_keys=mlb', '/game/431/players']

    for (const endpoint of endpoints) {
      const request = new Request(
        `http://localhost:3000/api/yahoo?endpoint=${encodeURIComponent(endpoint)}`,
        { headers: { 'Authorization': 'Bearer test-token' } }
      )

      mockAxiosGet.mockResolvedValue({ data: { success: true } })
      await GET(request)

      expect(mockAxiosGet).toHaveBeenCalledWith(
        `https://fantasysports.yahooapis.com/fantasy/v2${endpoint}`,
        expect.any(Object)
      )
    }
  })

  it('should handle API errors and return appropriate responses', async () => {
    const request = new Request('http://localhost:3000/api/yahoo?endpoint=/test', {
      headers: { 'Authorization': 'Bearer test-token' },
    })

    // Test axios error with response
    const MockAxiosError = axios.AxiosError as new (...args: unknown[]) => Error
    const axiosErrorWithResponse = new MockAxiosError('Request failed', {
      status: 401,
      data: { error: { description: 'Invalid token' } }
    })
    mockAxiosGet.mockRejectedValue(axiosErrorWithResponse)

    await GET(request)
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error: 'Failed to fetch from Yahoo API',
        message: { error: { description: 'Invalid token' } },
        statusCode: 401
      },
      { status: 401 }
    )

    // Test axios error without response
    const axiosErrorNoResponse = new MockAxiosError('Network Error')
    mockAxiosGet.mockRejectedValue(axiosErrorNoResponse)

    await GET(request)
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error: 'Failed to fetch from Yahoo API',
        message: 'Network Error',
        statusCode: 500
      },
      { status: 500 }
    )

    // Test non-axios error
    mockAxiosGet.mockRejectedValue(new Error('Unexpected error'))
    await GET(request)
    expect(mockNextResponseJson).toHaveBeenCalledWith(
      {
        error: 'An unexpected error occurred',
        message: 'Unexpected error',
        statusCode: 500
      },
      { status: 500 }
    )
  })
}) 