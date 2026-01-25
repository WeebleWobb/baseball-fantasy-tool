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

Validate the Yahoo API response structure:
```typescript
export const ResourceSchema = z.object({
  // Match Yahoo's response structure
});
```

Export from `/lib/schemas/index.ts`

### 4. Add TanStack Query Hook
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

### 5. Use in Component
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
Yahoo API responses must be validated with Zod:
```typescript
const response = await fetch('/api/yahoo/resource');
const data = await response.json();
const validated = ResourceSchema.parse(data); // Validates structure
```

### Caching Strategy
- **Current season data**: Short cache (5-15 minutes)
- **Historical season data**: Long cache (1 hour+)
- **Player metadata**: Medium cache (30 minutes)

## Common Yahoo API Patterns

### Resource Keys
Yahoo uses composite keys: `{game_key}.l.{league_id}.t.{team_id}`

Example: `423.l.12345.t.1` (2024 season, league 12345, team 1)

### Nested Responses
Yahoo wraps data in nested objects:
```typescript
{
  fantasy_content: {
    league: [{
      // actual league data
    }]
  }
}
```

Handle this in the API class before returning to hooks.

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
- [ ] Zod schema validates Yahoo response structure
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