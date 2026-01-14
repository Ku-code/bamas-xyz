# 🤖 Master Project Plan: BAMAS Dashboard (Mission: 3D & UX)
> **Agent Mode:** Ralph Wiggum Loop | **Tech Stack:** Next.js 15, Three.js, Supabase, Tailwind

## ✅ Phase 0: System Guardrails (Pre-Flight)
- [x] Terminology Dictionary (Bilingual/Search)
- [x] Job Board (Basic Schema/UI)
- [ ] **Sanity Check:** Run `npm run typecheck` to ensure no existing errors.

## 🔴 Phase 1: 3D Network Map Rescue (NetworkGraph3D.tsx)
- [ ] **Rendering Fix:**
    - [ ] Wrap `NetworkGraph3D` in a parent `div` with `relative w-full h-[600px]`.
    - [ ] Ensure the `<Canvas>` component has `resize={{ scroll: false }}`.
    - [ ] Fix any "ResizeObserver" or "WebGL context lost" errors in console.
- [ ] **Interactivity & Visuals:**
    - [ ] **Nodes:** Render Member nodes as Spheres and Company nodes as Cubes/Octahedrons.
    - [ ] **Hover Effect:** Change node color/scale on `onPointerOver`. Show a CSS2D or HTML tooltip with the entity name.
    - [ ] **Click Action:** Implement a `camera.lookAt` transition when a node is clicked using `drei/PerspectiveCamera`.
    - [ ] **Connections:** Use `THREE.Line` or `drei/Line` to draw physical links between related members/companies.
- [ ] **UI Integration:** Add a `ViewToggle` component (Button Group) to switch between `Map.tsx` (2D) and `NetworkGraph3D.tsx` (3D).

## 🔵 Phase 2: Job Board Search & UX "Power Upgrade"
- [ ] **Command-Center Search Bar:**
    - [ ] Create `JobSearchAutocomplete.tsx`.
    - [ ] **Functionality:** Fetch and display suggestions from the `terminology_terms` table as the user types.
    - [ ] **Visuals:** Add a "Command+K" badge and a blur effect (`backdrop-blur-md`) to the search dropdown.
- [ ] **Tokenized Filtering:**
    - [ ] Allow users to click "Remote" or "Full-Time" and turn them into removable `Badge` components *inside* the input field.
    - [ ] Ensure backspace removes the last "token/chip."
- [ ] **Bilingual Fuzzy Logic:**
    - [ ] Modify `src/lib/jobs.ts` search query to use PostgreSQL `tsvector` for both English and Bulgarian simultaneously.
    - [ ] Add an "Instant Result Count" label that updates via a debounce hook (300ms).

## 🟡 Phase 3: Final Polish & Safety
- [ ] **Error #306 Prevention:** Ensure all new components use `export default`.
- [ ] **Performance:** Implement `React.memo` on `JobPostingCard` to prevent re-renders during search typing.
- [ ] **Documentation:** Update `progress.txt` with specific Three.js performance metrics (FPS/Draw Calls).

## 🪵 Progress Log
- [ ] Initialize session...