# 🚀 BAMAS Web App: Future Features & Strategic Upgrades
> **Agent:** Ralph Wiggum | **Priority:** Critical | **Status:** 🛠 In Progress

## 🔴 Phase 1: High-Risk Infrastructure & Map Fixes
- [x] **Fix 2D/3D Map Sync:**
    - [x] Resolve Dark/Light mode switching bug (MapLibre style reload).
    - [x] Fix Company Logo Bubbles: Remove floating physics; anchor to fixed Geo-coordinates.
    - [x] Update `Company Registration` flow: Add mandatory `address_full`, `latitude`, and `longitude` fields.
    - [x] **Automation:** Auto-create Map Marker + Network Node upon successful Company registration.
- [x] **Company Profile System:**
    - [x] Build `CompanyPage.tsx`: Dynamic details view (Logo, URL, Description, Tech Stack).
    - [x] Link User -> Company: Sub-text "Owner of [Company Name]" under user names in Network/Directory.
    - [x] Permissions: Owner-only Edit; Superadmin-only Edit/Delete.

## 🔵 Phase 2: Intelligence & Strategic Tools
- [x] **EU Funds Radar:**
    - [x] Create `EUFundsRadar.tsx`: Dashboard item with "EU Flag" styled button leading to [Portal](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals?isExactMatch=true&status=31094501,31094502,31094503&order=DESC&pageNumber=1&pageSize=50&sortBy=startDate).
    - [x] UI: Simple "How-to" guide + keyword cloud (Additive, AI, Digital Twins, etc.).
- [x] **Strategic Calendar Radar:**
    - [x] Build `StrategicCalendar.tsx`: View-only for members; Admin-only CRUD for national/international venues.
- [ ] **AM Standards Guide:**
    - [ ] Build `StandardsGuide.tsx`: Library for ISO/ASTM standards (Medical/Aerospace specific).
- [x] **Network Directory Search:**
    - [x] Add Search Bar to Network: Filter by Tech (SLS, FDM, Metal) or Material.

## 🟡 Phase 3: Collaboration & Vault Security
- [ ] **AM CLUB:**
    - [ ] Build `AMClub.tsx`: Forum/Q&A space with dropdown filters for medical, defense, automotive, etc.
- [x] **Collaborative Whiteboard:**
    - [x] Build `Whiteboard.tsx`: Fabric.js or Canvas-based space. 
    - [x] Features: Multi-color pens, Sticky Notes, Drag & Drop Images, Paste images.
    - [x] UI: Shortcuts legend in light grey at bottom.
- [x] **Bamas Vault (Documents):**
    - [x] Create "Bamas Vault" folder inside Documents.
    - [x] Security: Password-protection field + Superadmin-only access management.
- [ ] **Embed System (BAMAS Badge):**
    - [ ] Build `EmbedGenerator.tsx`: Generate script tags/banners for members to put on their sites.

## 🟢 Phase 4: Administrative & Finance
- [ ] **Event Calendar Integration:** Sync Meetings with a new `EventCalendar.tsx` view.
- [ ] **Budget Transparency:**
    - [ ] Build `BudgetDashboard.tsx`: All members see balance/details.
    - [ ] Admin Bank Management: Secure form to update IBAN, BIC, SWIFT, and Balance.

## ✅ Final Polish & Verification
- [x] Fix footer-section syntax error causing dev server crash.
- [ ] Update all RLS Policies in Supabase for new tables.
- [x] Verify Bilingual Support (EN/BG) for all new UI items.
- [ ] Run `npm run build` to ensure 0 production errors.
- [ ] Push Git Commit: "BAMAS Strategic Feature Build Complete".
