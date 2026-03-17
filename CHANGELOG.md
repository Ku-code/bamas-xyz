# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Job Board Search Enhancement**: New `JobSearchAutocomplete` component with:
  - Autocomplete suggestions from terminology_terms
  - Tokenized filter chips for skills
  - Bilingual (EN/BG) fuzzy search support
  - Integration with common AM skills and job titles
- **Experify Partner**: Added Experify (https://experify3d.com/) to partner carousel
- **TypeScript Support**: Added `npm run typecheck` script

### Fixed
- Partner carousel now includes all partner logos

---

## [2026-02-19] - Production Stability Release

### Fixed
- Eliminated circular dependency crashing production
- Fixed auth context to prevent ghost logouts on page refresh
- Fixed ProtectedRoute to wait for isLoading before redirecting

### Changed
- Updated typography: font weights from "Thin 100" to "Regular 400" / "Light 300"
- Dark mode set as default on first visit

---

## [2026-02-18] - Partnership & Brand Updates

### Added
- WAATERS UK Partnership integration
- WAATERS logo in partner carousel with "UK Official Partner" subtext
- Announcement in news marquee linking to waaters.org

### Changed
- Professional README overhaul
- Full Bulgarian translation for navigation, contact, footer, FAQs, policies

---

## [2026-02-11] - Encoding Fixes

### Fixed
- PDF Cyrillic character encoding error (WinAnsi) in membership certificate generation

---

## [2026-02-09] - Lint Cleanup

### Fixed
- Resolved project-wide ESLint errors (any types, empty catch blocks, require imports)

---

## [2026-02-06] - Mobile UI Enhancements

### Added
- Optimized mobile UI fit (cards, bottom nav) for Bulgarian labels
- Enhanced immersive gallery with Masonry layout, lightbox, keyboard/swipe navigation

### Fixed
- Horizontal line overflow for "built by" credits on mobile

---

## [2026-02-05] - Translation & Brand

### Added
- Full Bulgarian translation for navigation, contact, footer, FAQs, policies
- Animated burger menu loader based on scroll progress

### Changed
- Updated branding and logo assets
- Refined SloganMarquee and translated apartment details

---

## [2026-02-04] - Dashboard Permissions

### Added
- Superadmin access for user management

---

## [2026-02-03] - Membership & Events

### Added
- Membership application form as modal triggered by "Join us" buttons
- Dual-notification email system (BAMAS info + applicant copy)
- Events Timeline with historical dates (2025-2026)

---

## [2026-02-02] - Carousel & Products

### Added
- Refined board members carousel with smooth infinite scrolling
- ProductPage component with ImageCarousel integration

---

## [2026-01-26] - BAMAS Robustness Protocol

### Added
- Session heartbeat (10-minute refresh) to prevent auth token expiry
- Embed badge logo and clickable links to bamas.xyz

### Fixed
- Dark mode flash prevention with index.html pre-render script
- Hero globe CSS placeholder before 3D canvas loads
- Partner logos dark theme visibility (invert filter)

---

## [2026-01-16] - Production Polish

### Fixed
- Removed debug fetch calls to 127.0.0.1:7242
- Dark mode as default (was "system")
- EU Funds Radar mailto link fix

### Added
- Translation keys: standards, amclub, embed, calendarintegration

---

## [2026-01-15] - Strategic Expansion Phase 3

### Added (BAMAS Vault)
- Password-protected vault for board documents
- Supabase Storage integration for file uploads
- Audit trail with access logs

### Added (Strategic Calendar)
- Full calendar view with month navigation
- Event filtering by scope (national/european/international)
- Create/Edit/Delete for superadmins

### Added (Network Directory Search)
- Technology filter chips (FDM, SLA, SLS, SLM, etc.)
- Search by name, email, company, technologies

### Added (Standards Guide)
- 30+ ISO/ASTM/SAE standards database
- Search and filter by category/organization

### Added (AM Club Forum)
- Post categories: Questions, Discussions, Announcements, Tips, Showcase
- Upvote system and accepted answers

### Added (Badge Generator)
- 4 badge styles: Standard, Compact, Minimal, Premium
- HTML/Markdown embed code generation
- SVG download option

### Added (Budget Dashboard)
- Bank accounts management (IBAN display)
- Transactions with CSV export
- Annual budget vs actual tracking

### Added (Calendar Integration)
- ICS file generation (RFC 5545)
- Google Calendar / Outlook Web URLs
- Reminder settings

---

## [2026-01-14] - Material Database

### Added
- Material database with 50+ materials (metals & polymers)
- Material Wizard with requirements filters
- Compatibility scoring algorithm
- MaterialCard with spider chart (RadarChart)

### Fixed
- JSON MIME type error (switched to eager: true import.meta.glob)
- Recharts initialization error (removed from manual chunking)

---

## [2026-01-14] - Ralph Loop Mode

### Added
- NetworkGraph3D with member/company nodes
- 3D visualization with camera controls
- Connection lines between related entities

---

## [2024-2025] - Initial Development

### Added (Pre-2026)
- Landing page with hero globe animation
- Authentication (email/password + Google OAuth)
- Dashboard with member management
- Company directory with interactive map
- Membership application system
- Supabase database with RLS policies
- Full Bulgarian/English localization
- Responsive design with Tailwind CSS

---

## Categories

- **Added**: New features
- **Changed**: Existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes
