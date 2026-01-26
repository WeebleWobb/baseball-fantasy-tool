---
name: yahoo-api
description: Yahoo Fantasy Sports API integration patterns, validation workflow, and implementation checklist
---

# Yahoo Fantasy Sports API Integration

## Quick Reference

**Official Documentation**: https://developer.yahoo.com/fantasysports/guide/

**Base URL**: `https://fantasysports.yahooapis.com/fantasy/v2/`

**Authentication**: OAuth 3-legged flow with scopes `fspt-r` (read), `fspt-w` (write)

## Implementation Workflow

When adding a new Yahoo API feature, follow this pattern:

### 1. Verify Endpoint Exists
- Check official Yahoo Fantasy Sports API documentation
- Confirm the endpoint, parameters, and response structure
- Note any rate limits or special requirements

### 2. Add to YahooFantasyAPI Class
Location: `/lib/yahoo-fantasy.ts`

```typescript
async getResourceName(params: ResourceParams): Promise<ResourceType> {
  return this.makeRequest<ResourceType>('/resource/path', {
    // parameters
  });
}
```

### 3. Create Zod Schema
Location: `/lib/schemas/[resource-name].ts`

Validate the Yahoo API response structure using `.passthrough()`:
```typescript
export const resourceSchema = z.object({
  // Match Yahoo's response structure
  field: z.string(),
}).passthrough(); // Always use passthrough - Yahoo may add fields

export const resourceResponseSchema = z.object({
  fantasy_content: z.object({
    resource: z.tuple([...])
  }).passthrough()
}).passthrough();
```

Export from `/lib/schemas/index.ts`

### 4. Use requestWithValidation
In `YahooFantasyAPI` class, use the validation method:
```typescript
async getResource(): Promise<ResourceType> {
  const data = await this.requestWithValidation(
    '/resource/path',
    resourceResponseSchema
  );
  return transformResourceResponse(data);
}
```

### 5. Add TanStack Query Hook
Location: `/hooks/use-yahoo-fantasy.ts`

```typescript
const useResourceName = (params: ResourceParams) => {
  return useQuery({
    queryKey: ['resourceName', params],
    queryFn: () => yahooAPI.getResourceName(params),
    staleTime: 1000 * 60 * 5, // Adjust based on data volatility
  });
};
```

### 6. Use in Component
```typescript
const { data, isLoading, error } = useYahooFantasy().useResourceName(params);
```

## Critical Patterns

### All Calls Go Through Proxy
Never call Yahoo API directly from client code:
```typescript
// ✅ CORRECT
const yahooAPI = new YahooFantasyAPI(session);
const data = await yahooAPI.getPlayers();

// ❌ WRONG
fetch('https://fantasysports.yahooapis.com/...') 
```

### Zod Validation at Boundary
Yahoo API responses are validated via `requestWithValidation()`:
```typescript
// In YahooFantasyAPI class
private async requestWithValidation<T>(
  endpoint: string,
  schema: { parse: (data: unknown) => T }
): Promise<T> {
  const data = await this.request<unknown>(endpoint);
  return schema.parse(data);
}
```

### Existing Schemas
| Schema | File | Validates |
|--------|------|-----------|
| `gamesResponseSchema` | `games.ts` | `/games;game_codes=mlb;seasons={year}` |
| `usersResponseSchema` | `users.ts` | `/users;use_login=1/profile` |
| `playersResponseSchema` | `players.ts` | `/game/{key}/players;.../stats` |
| `yahooTokenResponseSchema` | `auth.ts` | OAuth token responses |
| `yahooIdTokenSchema` | `auth.ts` | Decoded JWT tokens |

### Caching Strategy
- **Current season data**: Short cache (5-15 minutes)
- **Historical season data**: Long cache (1 hour+)
- **Player metadata**: Medium cache (30 minutes)

## Common Yahoo API Patterns

### Resource Keys
Yahoo uses composite keys: `{game_key}.l.{league_id}.t.{team_id}`

Example: `423.l.12345.t.1` (2024 season, league 12345, team 1)

### Nested Responses
Yahoo wraps data in nested objects with numeric string keys (NOT arrays):
```typescript
{
  fantasy_content: {
    game: [
      { game_key: "431", ... },
      {
        players: {
          "0": { player: [...] },
          "1": { player: [...] },
          count: 25
        }
      }
    ]
  }
}
```

**Key quirks to handle in schemas**:
- Collections use objects with `"0"`, `"1"`, etc. keys plus a `count` field
- Stats are wrapped: `{ stat: { stat_id: 60, value: ".300" } }`
- Stat values can be `"-"` string for no data
- Player metadata is an array of mixed object types

Use transformer functions (e.g., `transformPlayersResponse()`) to convert to clean TypeScript types.

### Error Handling
Common Yahoo API errors:
- `401`: Token expired (trigger re-authentication)
- `403`: Insufficient OAuth scopes
- `404`: Resource not found (league doesn't exist, invalid ID)
- `999`: Rate limit exceeded (back off and retry)

## Yahoo Stat IDs

Always use constants from `/lib/constants.ts`:
```typescript
import { BATTING_STATS } from '@/lib/constants';

const avgStatId = BATTING_STATS.AVG; // Not hardcoded "60"
```

## Testing Checklist

After implementing new Yahoo API feature:
- [ ] Endpoint verified in official documentation
- [ ] API method added to YahooFantasyAPI class
- [ ] Zod schema created with `.passthrough()` (never `.strict()`)
- [ ] Schema exported from `/lib/schemas/index.ts`
- [ ] `requestWithValidation()` used for API call
- [ ] Transformer function created if response needs reshaping
- [ ] TanStack Query hook created with appropriate caching
- [ ] Component uses hook with loading/error states
- [ ] Authentication flow tested (token refresh works)
- [ ] Error cases handled (404, rate limits, etc.)

## When This Skill Applies

Invoke this skill when:
- Adding new Yahoo Fantasy Sports API endpoints
- Debugging Yahoo API authentication issues
- Implementing new fantasy baseball features that require Yahoo data
- Questions about Yahoo API structure or patterns