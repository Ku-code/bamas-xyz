import { useEffect } from "react";

interface DocumentMeta {
  /** Page title — set as-is (include brand suffix yourself if wanted). */
  title: string;
  /** Meta description for this route. */
  description?: string;
  /** Canonical URL (absolute). Defaults to https://www.bamas.xyz + pathname. */
  canonical?: string;
  /** Set true on routes that must not be indexed (auth, dashboard, 404). */
  noindex?: boolean;
  /** Schema.org page type. Public routes default to WebPage. */
  schemaType?: "WebPage" | "AboutPage" | "CollectionPage" | "ContactPage";
  /** Absolute social preview image. Defaults to the branded BAMAS OG card. */
  image?: string;
}

const SITE_ORIGIN = "https://www.bamas.xyz";

/**
 * Per-route document metadata for a client-rendered SPA.
 *
 * Every route previously shared the single static <title>/<meta> from
 * index.html. This hook keeps title, description, canonical and robots in
 * sync with the active route, and restores the homepage defaults on unmount
 * so navigating back never leaves stale metadata behind.
 */
export function useDocumentMeta({ title, description, canonical, noindex, schemaType = "WebPage", image = `${SITE_ORIGIN}/og/bamas-social.webp` }: DocumentMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const ensureTag = (selector: string, create: () => HTMLElement) => {
      let el = document.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = create();
        document.head.appendChild(el);
      }
      return el;
    };

    // Description
    let prevDescription: string | null = null;
    if (description) {
      const meta = ensureTag('meta[name="description"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        return m;
      }) as HTMLMetaElement;
      prevDescription = meta.content;
      meta.content = description;
    }

    // Canonical
    const link = ensureTag('link[rel="canonical"]', () => {
      const l = document.createElement("link");
      l.setAttribute("rel", "canonical");
      return l;
    }) as HTMLLinkElement;
    const prevCanonical = link.href;
    link.href = canonical ?? `${SITE_ORIGIN}${window.location.pathname}`;

    const pageUrl = link.href;

    // Keep social previews aligned with the route metadata rather than the
    // homepage defaults from index.html.
    const socialTags: Array<[string, string, string]> = [
      ["property", "og:title", title],
      ["property", "og:description", description ?? ""],
      ["property", "og:url", pageUrl],
      ["property", "og:image", image],
      ["property", "og:type", "website"],
      ["name", "twitter:title", title],
      ["name", "twitter:description", description ?? ""],
      ["name", "twitter:image", image],
      ["name", "twitter:card", "summary_large_image"],
    ];
    const previousSocial = socialTags.map(([attribute, key, value]) => {
      if (!value) return null;
      const selector = `meta[${attribute}="${key}"]`;
      const tag = ensureTag(selector, () => {
        const m = document.createElement("meta");
        m.setAttribute(attribute, key);
        return m;
      }) as HTMLMetaElement;
      const previous = tag.content;
      tag.content = value;
      return { selector, previous };
    });

    // A compact page entity gives search engines and AI retrieval systems a
    // stable relationship between each route, the site, and the association.
    let routeSchema: HTMLScriptElement | null = null;
    if (!noindex) {
      routeSchema = document.createElement("script");
      routeSchema.type = "application/ld+json";
      routeSchema.id = "bamas-route-schema";
      routeSchema.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": schemaType,
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: title,
        description,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        about: { "@id": `${SITE_ORIGIN}/#organization` },
        inLanguage: document.documentElement.lang || "bg",
      });
      document.getElementById(routeSchema.id)?.remove();
      document.head.appendChild(routeSchema);
    }

    // Robots
    let robots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    const hadRobots = !!robots;
    const prevRobots = robots?.content ?? "";
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
    } else if (robots) {
      robots.remove();
      robots = null;
    }

    return () => {
      document.title = prevTitle;
      if (description && prevDescription !== null) {
        const meta = document.head.querySelector('meta[name="description"]') as HTMLMetaElement | null;
        if (meta) meta.content = prevDescription;
      }
      link.href = prevCanonical;
      routeSchema?.remove();
      previousSocial.forEach((entry) => {
        if (!entry) return;
        const tag = document.head.querySelector(entry.selector) as HTMLMetaElement | null;
        if (tag) tag.content = entry.previous;
      });
      const currentRobots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
      if (noindex && currentRobots) {
        if (hadRobots) currentRobots.content = prevRobots;
        else currentRobots.remove();
      }
    };
  }, [title, description, canonical, noindex, schemaType, image]);
}
