# 🤖 Project: BAMAS Production Stabilization
> **Status:** 🔴 CRITICAL REPAIR | **Agent:** Ralph Wiggum | **Priority:** P0

## 🔴 Phase 1: Authentication & Session Robustness
- [ ] **Fix Middleware Session Refresh:**
    - [ ] Update `src/middleware.ts` to use `supabase.auth.getUser()` (NOT `getSession`) to verify session validity on every request.
    - [ ] Ensure the middleware correctly updates cookies to prevent "sudden logout" loops.
- [ ] **Auth State Sync:**
    - [ ] Audit the `AuthProvider` or root layout to ensure `onAuthStateChange` correctly handles session expiration without kicking the user to the hero section.

## 🔵 Phase 2: Theme & Visual Performance
- [ ] **Force Dark Mode Default:**
    - [ ] Update `ThemeProvider` in `layout.tsx` to `defaultTheme="dark"` and `enableSystem={false}`.
    - [ ] Add `color-scheme: dark` to the global CSS to prevent the white flash during SSR.
- [ ] **Instant Globe Initialization:**
    - [ ] Optimize `Hero.tsx`: Use `dynamic()` with `ssr: false` for the Globe component.
    - [ ] Implement a lightweight SVG or CSS placeholder so the hero section has a "shape" before the 3D globe renders.
- [ ] **Partner Logo Visibility:**
    - [ ] Update the Logo Carousel: Apply `dark:invert-0 invert` or `brightness-0 dark:brightness-100` filters to ensure logos are visible in both themes.

## 🟡 Phase 3: UI/UX Continuity
- [ ] **Dashboard Persistence:**
    - [ ] Verify that navigating between dashboard items doesn't trigger unnecessary re-renders or auth checks.
- [ ] **Responsive Audit:**
    - [ ] Fix Globe scaling on mobile (ensure it doesn't overlap text).

## 🟢 Phase 4: Final Verification & Deploy
- [ ] **Production Readiness:**
    - [ ] Run `npm run build` to confirm no hydration or environment variable errors.
- [ ] **Git Deployment:**
    - [ ] `git add .`
    - [ ] `git commit -m "fix: production stabilization - auth loops, dark mode default, and hero optimization"`
    - [ ] `git push origin main`

## 🪵 Progress Log
- [ ] Waiting for Ralph to initialize...