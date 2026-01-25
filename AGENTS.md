# Baseball Fantasy Tool - Project Context

A modern fantasy baseball web application that integrates with Yahoo Fantasy Sports API to help users analyze MLB player statistics and make informed fantasy decisions. The tool provides comprehensive player data tables with advanced filtering, sorting, and comparison capabilities.

**Primary Purpose**: Aid fantasy baseball players with data-driven player comparison and analysis tools.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Authentication**: NextAuth.js with Yahoo OAuth
- **State Management**: TanStack Query (React Query) for data fetching and caching
- **UI Components**: shadcn/ui (Radix UI primitives) + Tailwind CSS
- **Tables**: TanStack Table for data grids
- **HTTP Client**: Axios
- **Token Handling**: jwt-decode

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/auth/          # NextAuth configuration
│   ├── api/yahoo/         # Yahoo API proxy endpoint (CORS handling)
│   └── page.tsx           # Main application page
├── components/
│   ├── players-table/     # Data table components (reference for patterns)
│   └── ui/                # shadcn/ui components (customizable)
├── hooks/
│   └── use-yahoo-fantasy.ts # TanStack Query hooks for Yahoo API
├── lib/
│   ├── yahoo-fantasy.ts   # YahooFantasyAPI class (all API interactions)
│   ├── constants.ts       # Yahoo stat ID mappings (never hardcode IDs!)
│   ├── schemas/           # Zod schemas for external data validation
│   └── utils.ts           # Utility functions
└── types/
    └── next-auth.d.ts     # NextAuth type extensions
```

### Key File Purposes

- **`/lib/yahoo-fantasy.ts`**: YahooFantasyAPI class for all Yahoo Fantasy Sports API interactions, handles game keys, player data, stats retrieval, player comparison, and multi-season analysis
- **`/hooks/use-yahoo-fantasy.ts`**: React hooks wrapping Yahoo API calls with TanStack Query, includes caching strategies (different durations for current vs historical seasons)
- **`/components/players-table/`**: Reference implementation for data table patterns using TanStack Table
- **`/lib/constants.ts`**: Yahoo stat ID mappings - always use constants, never hardcode stat IDs

## Development Environment

**Critical**: Requires HTTPS in development (Yahoo OAuth requirement). Custom `server.js` handles HTTPS setup with localhost certificates (`localhost-key.pem`, `localhost.pem` in project root).

Required environment variables: See `.env.example`

## Validation Strategy (Critical)

### Zod at External Boundaries Only
- **Use Zod schemas for**: Yahoo API responses, OAuth tokens, user input, environment variables
- **Use TypeScript interfaces for**: Component props, hooks, state management, internal business logic
- **Schema Location**: All Zod schemas organized in `src/lib/schemas/` with centralized exports

### Validation Boundaries
Apply Zod validation at:
- API client methods (Yahoo API responses)
- Authentication flows (OAuth tokens)
- Data transformation utilities
- Environment variable parsing

**Do NOT use Zod for**: Internal component props, hook parameters, or application state

## Yahoo Fantasy Sports API Integration

### Official Documentation
**Always verify endpoints in official docs before implementing**: https://developer.yahoo.com/fantasysports/guide/

### Base Information
- **Base URL**: `https://fantasysports.yahooapis.com/fantasy/v2/`
- **Authentication**: 3-legged OAuth for user data, 2-legged for public data
- **OAuth Scopes**: `fspt-r` (read access), `fspt-w` (write access)
- **Resource Keys**: Uses composite formats like `{game_key}.l.{league_id}.t.{team_id}`

### Authentication Flow (Your Implementation)
1. User signs in with Yahoo OAuth
2. NextAuth manages token refresh automatically  
3. Access tokens passed to YahooFantasyAPI client
4. API requests proxied through `/api/yahoo` endpoint

### Key Endpoints Currently Used
- `/users;use_login=1/profile` - User profile information
- `/games;game_codes=mlb;seasons={year}` - MLB game keys by season
- `/game/{game_key}/players;start={start};count={count};sort=AR;status=A;position=B/stats` - Player statistics with pagination

### Data Fetching Patterns
- All Yahoo API calls go through the `YahooFantasyAPI` class
- Use TanStack Query hooks from `use-yahoo-fantasy.ts` for all data fetching
- Different cache strategies for current season (short cache) vs historical seasons (long cache)
- Automatic token refresh handling with fallback to sign-out on auth errors

## Yahoo API Implementation Rules

**CRITICAL**:
- **Never assume endpoint functionality exists** - Always verify in official documentation first
- **Never hallucinate API capabilities** - If uncertain, state "cannot be confirmed without checking official documentation"
- **Always check endpoint availability** before implementing new features
- **All API calls must go through `/api/yahoo` proxy** - Never call Yahoo API directly from client code
- **Use stat ID constants from `/lib/constants.ts`** - Never hardcode Yahoo stat IDs

### Yahoo API Response Structure
Yahoo wraps data in nested objects:
```typescript
{
  fantasy_content: {
    resource: [{
      // actual data here
    }]
  }
}
```

Handle unwrapping in the API class before returning to hooks.

## Security & API Patterns

### Security Boundaries
- All Yahoo API calls **must** go through `/api/yahoo` proxy endpoint
- Never expose API secrets in client-side code
- OAuth tokens handled securely through NextAuth session management
- Validate all external data with Zod schemas at API boundaries

### Proxy Pattern (Required)
```typescript
// ✅ CORRECT - Goes through proxy
const api = new YahooFantasyAPI(session.accessToken);
const data = await api.getMLBPlayers({ season, start, count });

// ❌ WRONG - Direct API call
fetch('https://fantasysports.yahooapis.com/...')
```

### Why Proxy is Required
- Handles CORS issues with Yahoo API
- Manages token refresh logic centrally
- Provides consistent error handling
- Protects API credentials

## Domain Knowledge

### Fantasy Baseball Context
- Player statistics used for fantasy league scoring and decisions
- Common categories: Batting Average, Home Runs, RBIs, Stolen Bases, Runs
- Players analyzed by position (B=Batter, P=Pitcher)
- Season-over-season comparison for player trends

### Yahoo Stat IDs
- Yahoo uses numeric stat IDs (e.g., "60" for Batting Average)
- All mappings defined in `/lib/constants.ts`
- Includes: hits, at-bats, runs, singles, doubles, triples, home runs, RBIs, stolen bases, walks, hit by pitch

## Key Development Principles

### YAGNI First
Only build features when actually needed - don't implement speculative functionality

### Follow Existing Patterns
Before creating new patterns, check the codebase:
- Reference `/components/players-table/` for data table implementations
- Reference `/lib/yahoo-fantasy.ts` for API client patterns
- Reference `/hooks/use-yahoo-fantasy.ts` for TanStack Query patterns

### Navigation Pattern (Critical)
**Always use Next.js router for navigation**:
```typescript
// ✅ CORRECT
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/destination')

// ❌ WRONG - Breaks Next.js benefits and testing
window.location.href = '/destination'
```

### Type Safety
- Use TypeScript interfaces for internal logic
- Use Zod schemas for external data validation
- Never use `any` types
- Define proper interfaces for all Yahoo API responses