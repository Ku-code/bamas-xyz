# 🤖 Project: BAMAS Robustness & Feature Polish
> **Status:** 🛠️ Stabilization | **Agent:** Ralph Wiggum | **Priority:** Critical

## 🔴 Phase 1: Authentication "Ironclad" Stability
- [x] **Fix Ghost Logouts:**
    - [ ] Refactor `src/middleware.ts`: N/A (Vite SPA, no middleware). Auth uses AuthContext + getUser().
    - [x] useSessionHeartbeat in Dashboard: refreshSession() every 10 min to extend session.
- [x] **Auth Navigation Guard:** onAuthStateChange only clears user on SIGNED_OUT (from prior stabilization).

## 🔵 Phase 2: Strategic Calendar & Synchronization
- [x] **Calendar Logic:** StrategicCalendar loads `strategic_events` + `meetings` (loadMeetings). Meetings appear as calendar markers. "View in Meetings" for meeting items.
- [ ] **Event UI:** Color-coded categories already (Conference, Workshop, Meeting, etc.).

## 🟡 Phase 3: BAMAS Embed Dashboard (Badge Pro)
- [x] **Badge Redesign:** All styles use `https://bamas.xyz/logos/g2.PNG`. HTML/Markdown wraps in `<a href="https://bamas.xyz">`.
- [ ] **Snippet Generator:** HTML embed works in WordPress, Wix, custom HTML.

## 🟢 Phase 4: Final Integrity Audit
- [ ] **Zero-Break Policy:** Run `npm run typecheck` to ensure no existing dashboard features were touched by the auth refactor.
- [ ] **Production Deployment:**
    - [ ] `git add .`
    - [ ] `git commit -m "fix: ironclad auth stability and enhanced strategic tools"`
    - [ ] `git push origin main`

## 🪵 Progress Log
- [x] 2026-01-26: Auth useSessionHeartbeat; Embed BAMAS logo + link; Calendar sync Meetings→Strategic. Build ✓. Pushing.