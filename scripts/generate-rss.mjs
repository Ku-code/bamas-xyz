// Generates public/rss.xml from public/news.json at build time.
// Feeds are consumed aggressively by search AIs (Perplexity et al) and RSS
// readers — a zero-maintenance distribution channel for every news item.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const news = JSON.parse(readFileSync(join(root, "public/news.json"), "utf8"));
const site = "https://www.bamas.xyz";

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const items = news.items
  .slice()
  .sort((a, b) => (a.date < b.date ? 1 : -1))
  .map(
    (it) => {
      const articleUrl = `${site}/blog/${it.slug}`;
      return `    <item>
      <title>${esc(it.title_bg)}</title>
      <link>${esc(articleUrl)}</link>
      <guid isPermaLink="true">${esc(articleUrl)}</guid>
      <pubDate>${new Date(it.date + "T09:00:00Z").toUTCString()}</pubDate>
      <category>${esc(it.type)}</category>
      <description>${esc(it.summary_bg || it.title_bg)}</description>
      <source url="${esc(it.url)}">${esc(it.source || "Original source")}</source>
    </item>`;
    }
  )
  .join("\n");

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>BAMAS / БАЗАП — Новини</title>
    <link>https://www.bamas.xyz/blog</link>
    <atom:link href="https://www.bamas.xyz/rss.xml" rel="self" type="application/rss+xml" />
    <description>Партньорства, събития и съобщения от Българската асоциация за адитивно производство.</description>
    <language>bg</language>
${items}
  </channel>
</rss>
`;

writeFileSync(join(root, "public/rss.xml"), rss);

const staticPages = [
  ["/", "weekly", "1.0"],
  ["/documents", "monthly", "0.8"],
  ["/faq", "monthly", "0.8"],
  ["/blog", "weekly", "0.9"],
  ["/glossary", "weekly", "0.8"],
  ["/membership-application", "monthly", "0.7"],
  ["/privacy-policy", "yearly", "0.2"],
  ["/terms-of-use", "yearly", "0.2"],
  ["/cookie-policy", "yearly", "0.2"],
];
const today = new Date().toISOString().slice(0, 10);
const staticUrls = staticPages.map(([path, changefreq, priority]) => `  <url>
    <loc>${site}${path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n");
const articleUrls = news.items
  .slice()
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((it) => `  <url>
    <loc>${site}/blog/${esc(it.slug)}</loc>
    <lastmod>${it.date}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join("\n");
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls}
${articleUrls}
</urlset>
`;

writeFileSync(join(root, "public/sitemap.xml"), sitemap);
console.log(`rss.xml and sitemap.xml generated with ${news.items.length} blog articles`);
