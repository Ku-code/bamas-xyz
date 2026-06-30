# SEO Strategy — BAMAS

Search Engine Optimization guide for the **Bulgarian Additive Manufacturing Association (BAMAS / БАЗАП)** — `bamas.xyz`.

The goal: rank for additive manufacturing and 3D printing intent in **Bulgaria and SE Europe**, in **both Bulgarian and English**, and capture industry, academic, and EU-funding audiences.

---

## 1. Target Audience & Intent

| Audience | Intent | Example queries |
| --- | --- | --- |
| Manufacturers / SMEs | Adopting AM, finding partners | "3D печат услуги България", "industrial 3D printing Bulgaria" |
| Academia / researchers | Collaboration, standards | "адитивно производство университет", "AM research Bulgaria" |
| Startups | Visibility, funding, mentorship | "3D printing startup Bulgaria", "адитивни технологии финансиране" |
| Policymakers / EU | Ecosystem data, DIH network | "Digital Innovation Hub Bulgaria additive", "Industry 4.0 Bulgaria" |
| Press / public | Who/what is BAMAS | "БАЗАП", "Българска асоциация адитивно производство" |

---

## 2. Primary Keywords

### Bulgarian (primary market)
- адитивно производство (additive manufacturing)
- 3D печат / триизмерен печат (3D printing)
- БАЗАП (the association acronym)
- Българска асоциация за адитивно производство
- 3D принтиране индустрия България
- адитивни технологии
- метален 3D печат (metal 3D printing)
- прототипиране / бързо прототипиране (rapid prototyping)
- Индустрия 4.0 България

### English (international / partnership)
- additive manufacturing Bulgaria
- 3D printing association Bulgaria
- industrial 3D printing SE Europe
- metal additive manufacturing
- Bulgarian Digital Innovation Hub
- Industry 4.0 Bulgaria
- rapid prototyping Bulgaria

### Long-tail / conversion
- "how to join an additive manufacturing association in Bulgaria"
- "3D печат услуги за индустрията София"
- "EU funding additive manufacturing Bulgaria Horizon Europe"
- "additive manufacturing standards Bulgaria"

---

## 3. On-Page SEO

### Meta tags (`index.html`)
Current implementation is solid (BG title + description, Open Graph, Twitter card). Recommended additions:

```html
<!-- Canonical -->
<link rel="canonical" href="https://bamas.xyz/" />

<!-- Language alternates (hreflang) for the bilingual site -->
<link rel="alternate" hreflang="bg" href="https://bamas.xyz/" />
<link rel="alternate" hreflang="en" href="https://bamas.xyz/en" />
<link rel="alternate" hreflang="x-default" href="https://bamas.xyz/" />

<meta name="keywords" content="адитивно производство, 3D печат, БАЗАП, additive manufacturing Bulgaria, 3D printing" />
<meta name="author" content="Bulgarian Additive Manufacturing Association" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="bg_BG" />
<meta property="og:locale:alternate" content="en_US" />
<meta property="og:site_name" content="BAMAS / БАЗАП" />
```

> ⚠️ **SPA caveat:** this is a Vite client-rendered SPA, so per-route meta tags are not present in the initial HTML. Crawlers that don't execute JS will only see the static `index.html`. Use **`react-helmet-async`** for per-page titles/descriptions, and consider **prerendering** (e.g. `vite-plugin-prerender`, `prerender.io`, or a Netlify prerender) for the public marketing routes (`/`, `/membership`, `/official-documents`, policy pages).

### Headings
- Exactly **one `<h1>` per page** containing the primary keyword (e.g. "Българска асоциация за адитивно производство").
- Logical `h2`/`h3` hierarchy mapping to Vision, Mission, Objectives, Membership.

### Images
- Descriptive `alt` text on all logos/photos (e.g. `alt="BAMAS additive manufacturing network Bulgaria"`).
- Serve WebP/AVIF; the repo currently ships large PNGs in `public/` — compress and resize.

---

## 4. Structured Data (JSON-LD)

Add to `index.html` (or inject per-route). Helps eligibility for rich results and feeds knowledge graphs.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Bulgarian Additive Manufacturing Association",
  "alternateName": ["BAMAS", "БАЗАП", "Българска асоциация за адитивно производство"],
  "url": "https://bamas.xyz",
  "logo": "https://bamas.xyz/bamas-uploads/BAMAS_Logo_bg.png",
  "description": "A neutral, non-commercial platform driving the additive manufacturing and 3D printing ecosystem in Bulgaria, uniting industry, academia and innovators.",
  "foundingLocation": { "@type": "Country", "name": "Bulgaria" },
  "areaServed": "BG",
  "knowsAbout": ["Additive Manufacturing", "3D Printing", "Industry 4.0", "Rapid Prototyping", "Digital Manufacturing"],
  "email": "info@bamas.xyz",
  "sameAs": [
    "https://www.linkedin.com/company/bamas",
    "https://bamas.bg"
  ]
}
</script>
```

Recommended additional types: `FAQPage` (membership questions), `Event` (meetings/webinars), `Article` (news/insights), `BreadcrumbList`.

---

## 5. Technical SEO

| Item | Status | Action |
| --- | --- | --- |
| `robots.txt` | ✅ present | Add `Sitemap:` directive |
| `sitemap.xml` | ❌ missing | Generate and submit to Google/Bing |
| Canonical tags | ❌ missing | Add (see §3) |
| hreflang | ❌ missing | Add BG/EN alternates |
| HTTPS | ✅ | — |
| Mobile-friendly | ✅ viewport set | — |
| Core Web Vitals | ⚠️ | Heavy deps (three.js, maplibre, fabric) — code-split & lazy-load dashboard-only libs off the public routes |
| Analytics | ✅ GA4 + Clarity | — |

### Add to `robots.txt`
```
Sitemap: https://bamas.xyz/sitemap.xml
```

### Minimal `sitemap.xml` (`public/sitemap.xml`)
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://bamas.xyz/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://bamas.xyz/membership-application</loc><priority>0.9</priority></url>
  <url><loc>https://bamas.xyz/official-documents</loc><priority>0.7</priority></url>
  <url><loc>https://bamas.xyz/privacy-policy</loc><priority>0.3</priority></url>
  <url><loc>https://bamas.xyz/terms-of-use</loc><priority>0.3</priority></url>
</urlset>
```

---

## 6. Content & Off-Page

- **Pillar content:** publish authoritative BG/EN articles on AM in Bulgaria — "Състояние на адитивното производство в България", "Metal 3D printing for Bulgarian industry", standards explainers, EU-funding guides. This is what earns links and AI citations (see [GEO.md](./GEO.md)).
- **Backlinks:** Bulgarian university engineering faculties (TU-Sofia, TU-Varna), cluster organizations, (Add)liance / European AM networks, EU DIH directories, chambers of commerce.
- **Local/entity:** Google Business Profile, Wikidata/Wikipedia entity for БАЗАП, LinkedIn company page — all reinforce the knowledge-graph identity.
- **Directories:** list in EU Digital Innovation Hub catalogue, Enterprise Europe Network, national cluster registries.

---

## 7. Measurement

| Tool | Tracks |
| --- | --- |
| Google Search Console | Impressions, queries, indexing, hreflang errors |
| Bing Webmaster Tools | Bing/Copilot visibility |
| GA4 (`G-RPJCMNG6NH`) | Traffic, conversions (membership applications) |
| Microsoft Clarity | UX / heatmaps |

**KPIs:** rankings for the §2 keyword set, organic sessions, membership-application conversions from organic, referring domains from `.bg` / `.edu` / EU sources.

---

_Last updated: 2026-06-30_
