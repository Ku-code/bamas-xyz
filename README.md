<p align="center">
  <img src="public/bamas-map-logo.png" width="200" alt="BAMAS Logo">
</p>

# Bulgarian Additive Manufacturing Association (BAMAS)

### Shaping the Future of Industry 4.0 in Bulgaria

The Bulgarian Additive Manufacturing Association (BAMAS) is a neutral, non-commercial platform established to drive the evolution of the 3D printing ecosystem in Bulgaria. We unite manufacturers, academic institutions, and technological innovators to foster a collaborative environment for industrial excellence.

---

## Vision & Mission

### Our Vision
To establish Bulgaria as a leading European hub for high-tech additive innovations and digital industrial excellence. We envision a future where a robust national network of Digital Innovation Hubs (DIH) and Centers of Excellence drives the development of proprietary materials, advanced mechatronics, and decentralized manufacturing models.

### Our Mission
To serve as the strategic catalyst for the Additive Manufacturing (AM) ecosystem in Bulgaria. We are dedicated to consolidating expert capacity across industry and academia to accelerate the integration of 3D printing, digital twinning, and industrial automation, ensuring global competitiveness within the circular economy.

---

## Core Objectives

*   **Strategic Collaboration**: Facilitating dialogue and knowledge sharing between industry stakeholders and research institutions.
*   **Technological Advancement**: Driving the integration of Industry 4.0 standards and fostering regulatory support for AM technologies.
*   **Startup & Innovation Support**: Providing visibility, mentorship, and guidance for emerging initiatives in the additive manufacturing sector.
*   **Global Integration**: Building international partnerships to implement global best practices and enhance Bulgaria's position on the worldwide stage.

---

## Technology Stack

The **BAMAS Digital Forge** is built using a modern, scalable tech stack:

*   **Frontend**: React 18, Vite, TypeScript
*   **Styling**: Vanilla CSS, Tailwind CSS, shadcn/ui
*   **Backend & DB**: Supabase (PostgreSQL, Realtime, Auth, Storage)
*   **Animations**: Framer Motion
*   **Internationalization**: i18next (English & Bulgarian support)
*   **Infrastructure**: Edge Functions (Deno), Netlify

---

## Features

### Unified Dashboard
A comprehensive management platform for association members, including:
*   **Member Directory**: Secure network of approved industry professionals.
*   **Document Management**: Centralized repository with digital signature capabilities for critical files.
*   **Additive Map**: Interactive visualization of the AM ecosystem in Bulgaria.
*   **EU Funding Radar**: Real-time tracking of funding opportunities (Horizon Europe, Digital Europe).
*   **Collaborative Whiteboard**: Real-time canvas for strategic planning and technical discussion.
*   **Governance Tools**: Integrated meeting agendas, voting polls, and activity history.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm or npm

### Installation
1. Clone the repository: `git clone <repo_url>`
2. Install dependencies: `npm install`
3. Configure environment variables in `.env`:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Start development: `npm run dev`

---

## Design System

The BAMAS visual identity pairs a deep industrial teal with a confident additive-green accent, signalling precision engineering and sustainable, forward-looking manufacturing.

### Typography

The entire interface uses a single typeface — **[Sofia Sans](https://fonts.google.com/specimen/Sofia+Sans)** — loaded with both **Latin and Cyrillic** subsets so English and Bulgarian render identically.

| Role | Family | Weight | Usage |
| --- | --- | --- | --- |
| Headings (`h1`–`h6`) | Sofia Sans | **800** ExtraBold | Page titles, section headers |
| Subtitles / labels | Sofia Sans | 600 SemiBold / 400 Regular | Emphasis, UI labels |
| Body | Sofia Sans | **300** Light (default) | Paragraphs, long-form text |

```css
font-family: 'Sofia Sans', sans-serif;   /* weights: 300, 400, 600, 800 (+ italics) */
```

### Brand Colors

Defined as Tailwind tokens under the `bama` namespace (`tailwind.config.ts`).

| Token | Hex | Role |
| --- | --- | --- |
| `bama.neon-green` | `#0C9D6A` | **Primary / accent** — CTAs, links, `theme-color` |
| `bama.blue` / `bama.dark` | `#052e40` | **Secondary** — deep teal, headings, dark surfaces |
| `bama.electric-blue` | `#3b82f6` | Highlights, data viz, interactive states |
| `bama.accent-red` | `#E62F29` | Alerts, destructive actions |
| `bama.gray` | `#64748b` | Muted text, borders |
| `bama.light` | `#f8fafc` | Light backgrounds, surfaces |

### Theme Tokens (light / dark)

Semantic colors are HSL CSS variables in `src/index.css`, consumed via `hsl(var(--token))`. The app **defaults to dark mode** (`<html class="dark">`).

| Token | Light | Dark |
| --- | --- | --- |
| `--background` | `#FFFFFF` | `#0F172A` (slate-900) |
| `--foreground` | `#052E40` | `#E2E8F0` |
| `--primary` | `#0C9D6A` | `#0C9D6A` |
| `--secondary` | `#052E40` | `#1E293B` |
| `--destructive` | `#EF4444` | `#7F1D1D` |
| `--radius` | `0.5rem` | `0.5rem` |

Animations (`fade-in`, `slide-right`, `gradient-x`) and the radius scale live in `tailwind.config.ts`, powered by `tailwindcss-animate` + Framer Motion.

---

## SEO & GEO

Discoverability is documented separately:

- **[SEO.md](./SEO.md)** — traditional search-engine optimization (meta tags, structured data, sitemap, keywords for Bulgarian additive manufacturing & 3D printing).
- **[GEO.md](./GEO.md)** — Generative Engine Optimization: how BAMAS is surfaced and cited by AI assistants (ChatGPT, Claude, Gemini, Perplexity).

---

## Project Structure

```text
src/
├── components/   # Modular UI elements and dashboard sections
├── contexts/     # State management (Auth, Language, Theme)
├── hooks/        # Specialized logic and data fetching
├── lib/          # Database clients and utility helpers
├── pages/        # Core application views
└── translations/ # Localization assets (EN/BG)
```

---

## License & Copyright

© 2024-2026 Bulgarian Additive Manufacturing Association. All rights reserved.  
Part of the (Add)liance - European Centre for Additive Manufacturing.

**Contact**: [info@bamas.xyz](mailto:info@bamas.xyz) | [www.bamas.xyz](https://bamas.xyz)
