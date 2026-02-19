# Project: BAMAS Digital Forge Context
**Last Updated:** 2026-02-19 04:48 AM
**Stack:** React (Vite), Tailwind CSS, Supabase, Shadcn/UI

## Core Architecture
- **State Management:** React Context API (Auth, Language, Theme) + TanStack Query for server state.
- **Primary Data Flow:** 
  - Authentication and profile hydration are managed by `AuthService.ts` and provided via `AuthContext.tsx`.
  - Database operations use the generic `db.ts` wrapper for standard CRUD.
  - Security-sensitive operations (like user profile creation) utilize Supabase RPCs with `SECURITY DEFINER` permissions.

## Key Routes
- `/` - Landing Page (Hero, Mission, Partners)
- `/login` / `/register` - Authentication flows
- `/dashboard` - Protected main interface
- `/membership-application` - Direct application form
- `/documents` - Official association documents
- `/settings` - User profile and preferences

## Critical Dependencies & Rules
1. **Supabase Client:** Initialization is in `src/lib/supabase.ts`. Multi-tenant RLS is active; always verify user ID against `auth.uid()`.
2. **Animation:** Use `Framer Motion` for all transitions and micro-interactions.
3. **Icons:** Use `lucide-react`.
4. **UI Philosophy:** Use `Shadcn/UI` components located in `src/components/ui`.
5. **Auth Logic:** All authentication and session persistence logic must remain in `src/contexts/AuthContext.tsx` and `src/lib/auth-service.ts`.
6. **Bypass RLS Rule:** Always use the `create_user_profile` RPC for registration to ensure profiles are created regardless of initial RLS state.

## Current Data Schema
- `users`: Profiles, roles (`superadmin`, `member`, etc.), and membership status.
- `materials`: Technical specifications for additive manufacturing materials.
- `vault_documents`: Secure, board-only documentation.
- `strategic_events`: Industry calendar and association meetings.
- `companies`: Registered companies for the interactive map and directory.

## Recent Breaking Changes / Known Issues
- **2026-02-19**: **Auth Stability Overhaul**. Extracted `AuthService` to handle DB fallbacks and race conditions. Refactored `ProtectedRoute` to wait for session hydration (`isLoading`) to prevent "ghost logouts" on refresh.
- **2026-02-18**: **Typography Update**. Transitioned system font weights from "Thin 100" to "Regular 400" and "Light 300" for enhanced readability across languages.
- **2026-02-11**: **PDF Encoding Fix**. Resolved Cyrillic character bugs in certificate generation by implementing font-embedding for `pdf-lib`.
