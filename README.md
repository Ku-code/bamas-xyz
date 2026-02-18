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
