# Claude Code Configuration

For complete project context, see [AGENTS.md](./AGENTS.md)

## Terminal Commands

- `npm run dev` - Start development server (runs server.js for HTTPS)
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Before Committing

1. Run `npm run lint` and fix all issues
2. Verify TypeScript compilation passes (no `tsc` errors)
3. Test authentication flow if auth-related code was modified

## Common Tasks

### Adding shadcn/ui Components
- Available components: https://ui.shadcn.com/docs/components
- Components are copied into `@/components/ui/` and can be modified directly

### Working with Yahoo Fantasy API
1. **Always verify endpoint exists** in official docs first: https://developer.yahoo.com/fantasysports/guide/
2. Add method to `YahooFantasyAPI` class in `/lib/yahoo-fantasy.ts`
3. Create Zod schema in `/lib/schemas/` for the API response (use `.passthrough()` for permissive validation)
4. Use `requestWithValidation()` method to validate responses
5. Add TanStack Query hook to `/hooks/use-yahoo-fantasy.ts`
6. Use hook in component with proper loading/error states

### Creating Data Tables
- Reference `/components/players-table/` for implementation patterns
- Use TanStack Table with shadcn/ui Data Table: https://ui.shadcn.com/docs/components/data-table

## Critical Reminders

1. **Never use `window.location` for navigation** - Use Next.js `useRouter()` from `next/navigation` (breaks Next.js benefits and testing)

2. **Yahoo stat IDs come from `/lib/constants.ts`** - Don't hardcode stat IDs like "60" or "7" directly

3. **All Yahoo API calls go through `/api/yahoo` proxy** - Never call `https://fantasysports.yahooapis.com` directly from client code

4. **Use Zod only for external data boundaries** - API responses, OAuth tokens, env vars. Use TypeScript interfaces for component props and internal logic

5. **Zod schemas use `.passthrough()`** - Yahoo API may return additional fields; never use `.strict()`

## Zod Schema Locations

- `src/lib/schemas/games.ts` - MLB game key responses
- `src/lib/schemas/users.ts` - User profile responses
- `src/lib/schemas/players.ts` - Player stats responses
- `src/lib/schemas/auth.ts` - OAuth tokens and JWT validation
- `src/lib/schemas/env.ts` - Environment variable validation