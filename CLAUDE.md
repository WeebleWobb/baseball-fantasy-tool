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
3. Create Zod schema in `/lib/schemas/` for the API response
4. Add TanStack Query hook to `/hooks/use-yahoo-fantasy.ts`
5. Use hook in component with proper loading/error states

### Creating Data Tables
- Reference `/components/players-table/` for implementation patterns
- Use TanStack Table with shadcn/ui Data Table: https://ui.shadcn.com/docs/components/data-table

## Critical Reminders

1. **Never use `window.location` for navigation** - Use Next.js `useRouter()` from `next/navigation` (breaks Next.js benefits and testing)

2. **Yahoo stat IDs come from `/lib/constants.ts`** - Don't hardcode stat IDs like "60" or "7" directly

3. **All Yahoo API calls go through `/api/yahoo` proxy** - Never call `https://fantasysports.yahooapis.com` directly from client code

4. **Use Zod only for external data boundaries** - API responses, OAuth tokens, user input, env vars. Use TypeScript interfaces for component props and internal logic