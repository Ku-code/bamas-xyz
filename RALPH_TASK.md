# 🤖 Project: Material Database & Compatibility Wizard
> **Status:** 🧪 Initialization | **Agent:** Ralph Wiggum | **Priority:** High

## 🔴 Phase 1: Database & Migration (Infrastructure)
- [x] Create `supabase/migrations/021_material_database.sql`.
    - [x] Tables: `materials`, `printer_specs`, `material_compatibility`.
    - [x] Seed Data: Populate with 50+ industrial materials (Ti64, AlSi10Mg, PEEK, Nylon 12, etc.).
- [x] Set up RLS: Public read access for materials; Admin-only CRUD.

## 🔵 Phase 2: Logic & UI Components
- [x] **Core Library:** Implement `src/lib/materials.ts` with the ranking algorithm.
- [x] **Wizard UI:** Build `MaterialWizard.tsx` (a multi-step modal/form).
    - [x] Step 1: Requirement filters (Physical/Thermal).
    - [x] Step 2: Scoring slider (Weight Cost vs. Strength).
    - [x] Step 3: Result list with "Compatibility Match %".
- [x] **Material Details:** Build `MaterialCard.tsx` showing spider charts for properties.

## 🟡 Phase 3: Integration & Polish
- [x] Add "Material Database" to the Dashboard menu.
- [x] Implement bilingual support (EN/BG) for all property names and tooltips.
- [x] **Feedback Loop:** Run `npm run typecheck` and verify the wizard logic with unit tests.

## 🪵 Progress Log
- [x] Material Database & Compatibility Wizard - COMPLETE