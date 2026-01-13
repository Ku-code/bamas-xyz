# 💼 Project: BAMAS Job Board Implementation
> **Priority:** Resolve Crash + Full Feature Build | **Agent:** Ralph Wiggum

## 🚨 CRITICAL: Fix React Error #306
- [x] **Audit `src/pages/Dashboard.tsx`:** - [x] Locate the `lazy(() => import(...))` line for the Job Board.
    - [x] Ensure the file path exactly matches the actual filename (case-sensitive).
- [x] **Fix `JobBoardContent.tsx` Export:** - [x] Ensure the file exists and starts with `export default function JobBoardContent()`. 
    - [x] If it uses a named export, change it to a default export.
- [x] **Suspense Check:** Ensure the component is wrapped in `<Suspense fallback={<LoadingSpinner />}>` inside the Dashboard.

## 🏗 Phase 1: Database & Storage (Supabase)
- [x] **Migration:** Execute `supabase/migrations/020_job_board.sql`.
    - [x] Create: `job_postings`, `job_seeker_profiles`, `job_applications`, `job_favorites`.
- [ ] **Storage:** Create the `job-files` bucket for resumes and portfolios.
- [x] **RLS:** Set policies so users can only edit their own posts/profiles.

## 🧠 Phase 2: API Integration
- [x] **Job Library:** Create `src/lib/jobs.ts` with functions: `loadJobPostings`, `createJobPosting`, `uploadResume`.

## 🎨 Phase 3: UI Components
- [x] **Main Hub:** Build `JobBoardContent.tsx` with Tabs (All Jobs, Talent Pool, My Posts).
- [x] **Forms:** Build `JobPostingForm.tsx` and `JobSeekerForm.tsx` with portfolio upload logic.
- [x] **Cards:** Build `JobPostingCard.tsx` and `JobSeekerCard.tsx`.

## 🌍 Phase 4: Localization
- [x] **Translations:** Add the 80+ job board keys to `src/translations/en.json` and `bg.json`.
- [x] **Verify:** Ensure all AM categories display correctly in English and Bulgarian.

## ✅ Final Verification
- [ ] Test "Quick Apply" functionality.
- [x] Confirm no more React #306 errors on the Dashboard.