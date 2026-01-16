# 🛠️ Operation: Production Polish & Stability
> **Agent Mode:** Ralph Wiggum (Autonomous) | **Priority:** Critical
> **Goal:** Fix Auth Loops, Localize UI, and Finalize Embed Tools.

## 🔴 Phase 1: Authentication & Theme Stability (Critical)
- [ ] **Fix Persistent Logout Bug:**
    - [ ] Audit `src/middleware.ts`. Ensure the session check doesn't trigger a redirect to `/` if the user is already authenticated but the locale is switching.
    - [ ] Ensure `Supabase` session persistence is configured for `localStorage` or `cookies` correctly to prevent "Hero Section" kicks.
- [ ] **Dark Mode Default Enforcement:**
    - [ ] Force `dark` theme as the primary default in `src/app/layout.tsx` or your `ThemeProvider`.
    - [ ] Ensure the first-load logic checks for a saved theme; if none exists, set `theme = 'dark'`.
    - [ ] Prevent "Flash of Light Mode" on initial load.

## 🔵 Phase 2: Translation & Content Localization
- [ ] **Human-Readable Dictionary Update:**
    - [ ] Scan all components for keys like `dashboard.menu.item`. 
    - [ ] Update `public/locales/en.json` and `public/locales/bg.json` with actual strings (e.g., "EU Funds Radar" / "Радар за финансиране от ЕС").
    - [ ] **Strict Rule:** No raw translation keys should be visible in the UI. Every title, subtitle, and description must be in prose.
- [ ] **Accurate Terminology:** Use the `terminology_terms` table to verify technical additive manufacturing terms in Bulgarian.

## 🟡 Phase 3: Badge Embed Tool & EU Radar Enhancements
- [ ] **BAMAS Badge Upgrade:**
    - [ ] Replace placeholder icons with `public/logos/g2.png` or `public/logos/g3 2.png`.
    - [ ] **Functional Linking:** Wrap the generated badge code in an `<a>` tag pointing to `https://bamas.xyz/`.
    - [ ] Ensure the "Copy Snippet" includes the `target="_blank"` attribute.
- [ ] **EU Radar Contact Fix:**
    - [ ] Locate the button "Свържете се с БАЗАП".
    - [ ] Update its action to: `window.location.href = "mailto:info@bamas.xyz"`.

## 🟢 Phase 4: UI/UX Audit & Clean Code
- [ ] **Visual Consistency Check:**
    - [ ] Ensure all dashboard items have consistent padding, border-radius (rounded-xl), and backdrop-blurs.
    - [ ] Remove any "debug" console logs left over from previous builds.
- [ ] **Stability Test:**
    - [ ] Run `npm run build` to ensure no "Type Errors" or "MIME type" issues remain.
    - [ ] Manually test the login flow 5 times to confirm no random logouts occur.

## 🪵 Progress Log
- [ ] Waiting for Ralph to initialize...