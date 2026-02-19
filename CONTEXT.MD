# Project: BAMAS Digital Forge Context
**Last Updated:** 2026-02-19 05:10 AM (EET)
**Stack:** React 18 (Vite 7), Tailwind CSS 3, Supabase, Shadcn/UI

## Core Architecture
- **State Management:** React Context API (Auth, Language, Theme) + TanStack Query for server state.
- **Primary Data Flow:** 
  - Authentication, profile hydration, and session persistence are **self-contained in `AuthContext.tsx`**. Do NOT create a separate auth service file — this caused a production-breaking circular dependency.
  - Database operations use the generic `db.ts` wrapper for standard CRUD.
  - Security-sensitive operations (like user profile creation) utilize Supabase RPCs with `SECURITY DEFINER` permissions.
- **Deployment:** Push to `main` triggers auto-deploy. Build must pass `npm run build` with 0 errors.

## Key Routes
| Path | Access | Component |
|------|--------|-----------|
| `/` | Public | Landing Page (Hero, Mission, Partners) |
| `/login` | Public | Email/password + Google OAuth |
| `/register` | Public | Registration with RPC profile creation |
| `/dashboard` | Protected | Main member interface |
| `/membership-application` | Public | Direct application form |
| `/documents` | Public | Official association documents |
| `/settings` | Protected | User profile and preferences |
| `/forgot-password` | Public | Password reset request |
| `/reset-password` | Public | Password reset completion |

## Critical Dependencies & Rules
1. **Auth is self-contained:** All auth logic lives in `src/contexts/AuthContext.tsx`. Never split into a separate service (caused a circular dependency crash on 2026-02-19).
2. **Supabase Client:** Initialization is in `src/lib/supabase.ts`. RLS is active; always verify user against `auth.uid()`.
3. **Protected Routes:** `ProtectedRoute.tsx` checks `isLoading` before redirecting. Never remove this guard — it prevents ghost logouts on page refresh.
4. **RPC for Registration:** Always use the `create_user_profile` RPC for profile creation to bypass RLS during registration.
5. **Hooks Rule:** Never call React hooks after an early return. This was a bug in `ParticleSystem.tsx` that caused lint errors.
6. **Translations:** JSON files in `src/translations/` are loaded via `import.meta.glob` (eager). Do NOT `fetch()` them at runtime — this causes MIME type errors in production.
7. **UI:** Use `Shadcn/UI` components (in `src/components/ui`), `Framer Motion` for animations, `lucide-react` for icons.

## Current Data Schema
| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | Profiles & membership | `id`, `email`, `name`, `role`, `status`, `approved` |
| `materials` | AM material specs | `id`, `name`, `category`, `properties` |
| `vault_documents` | Board-only docs | `id`, `title`, `file_url`, `access_level` |
| `strategic_events` | Calendar/meetings | `id`, `title`, `date`, `location` |
| `companies` | Interactive map | `id`, `name`, `headquarters_latitude/longitude` |

### Roles & Statuses
- **Roles:** `superadmin`, `admin`, `member`, `board_member`, `wg_lead`
- **Statuses:** `pending`, `approved`, `rejected`, `suspended`
- **Superadmin Emails (hardcoded):** `kuzodonchev@3dopendesign.com`, `kuzodonchev@gmail.com`, `info@bamas.xyz`

## Environment Variables
| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase publishable key |
| `VITE_GOOGLE_CLIENT_ID` | Optional | Google OAuth (empty = disabled) |
| `VITE_MAPTILER_API_KEY` | Optional | Map tiles (fallback to OSM) |

## Recent Breaking Changes / Known Issues
- **2026-02-19 (CRITICAL FIX)**: `auth-service.ts` was **never committed** but `AuthContext.tsx` imported it. This caused a module resolution crash on production, resulting in a blank page. Fixed by inlining all auth logic into `AuthContext.tsx` and deleting the file. Also fixed Rules of Hooks violation in `ParticleSystem.tsx` and empty catch block in `map.tsx`.
- **2026-02-19**: Refactored `ProtectedRoute` to wait for `isLoading` state before redirecting, preventing "ghost logouts" on page refresh.
- **2026-02-18**: Typography update — font weights changed from "Thin 100" to "Regular 400" / "Light 300".
- **2026-02-11**: PDF Encoding Fix — resolved Cyrillic character bugs in certificate generation.
