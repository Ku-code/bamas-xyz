import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { BlogThumbnail } from "@/components/blog/BlogThumbnail";

interface NewsEntry {
  slug: string;
  date: string;
  type: string;
  url: string;
  source?: string;
  title_bg: string;
  title_en: string;
  summary_bg?: string;
  summary_en?: string;
}

const TYPE_LABELS: Record<string, { bg: string; en: string }> = {
  partner: { bg: "Партньорство", en: "Partnership" },
  event: { bg: "Събитие", en: "Event" },
  media: { bg: "Медийно отразяване", en: "Media coverage" },
  member: { bg: "Нов член", en: "New member" },
  announcement: { bg: "Новина", en: "News" },
};

const NewsArticle = () => {
  const { slug } = useParams();
  const { language } = useLanguage();
  const [item, setItem] = useState<NewsEntry | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/news.json")
      .then((response) => response.json())
      .then((data) => setItem((data.items as NewsEntry[]).find((entry) => entry.slug === slug) ?? null))
      .finally(() => setLoaded(true));
  }, [slug]);

  const title = item ? (language === "bg" ? item.title_bg : item.title_en) : "BAMAS News";
  const summary = item
    ? (language === "bg" ? item.summary_bg : item.summary_en) ||
      (language === "bg"
        ? "Проверена новина от Българската асоциация за адитивно производство и нейната партньорска мрежа."
        : "Verified news from the Bulgarian Additive Manufacturing Association and its partner network.")
    : "BAMAS news and media coverage.";

  useDocumentMeta({
    title: `${title} | ${language === "bg" ? "БАЗАП" : "BAMAS"}`,
    description: summary,
    canonical: slug ? `https://www.bamas.xyz/blog/${slug}` : "https://www.bamas.xyz/blog",
  });

  const jsonLd = useMemo(() => item ? {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary,
    datePublished: item.date,
    dateModified: item.date,
    mainEntityOfPage: `https://www.bamas.xyz/blog/${item.slug}`,
    author: { "@id": "https://www.bamas.xyz/#organization" },
    publisher: { "@id": "https://www.bamas.xyz/#organization" },
    about: { "@id": "https://www.bamas.xyz/#organization" },
    isBasedOn: item.url,
    inLanguage: language === "bg" ? "bg" : "en",
  } : null, [item, language, summary, title]);

  const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString(
    language === "bg" ? "bg-BG" : "en-GB",
    { day: "numeric", month: "long", year: "numeric" },
  );

  if (loaded && !item) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="container mx-auto max-w-3xl px-4 pb-20 pt-32 text-center">
          <h1 className="text-3xl font-extrabold">{language === "bg" ? "Новината не е намерена" : "Article not found"}</h1>
          <Link to="/blog" className="mt-6 inline-flex text-primary hover:underline">{language === "bg" ? "Към блога" : "Back to the blog"}</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 pb-24 pt-28 md:pt-36">
        <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> {language === "bg" ? "Всички публикации" : "All articles"}
        </Link>
        {item && (
          <article className="mx-auto max-w-4xl">
            <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-bold uppercase tracking-wider text-primary">
                {TYPE_LABELS[item.type]?.[language === "bg" ? "bg" : "en"] ?? item.type}
              </span>
              <time dateTime={item.date}>{fmt(item.date)}</time>
              {item.source && <span>· {item.source}</span>}
            </div>
            <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-foreground md:text-6xl">{title}</h1>
            <p className="mt-7 max-w-3xl text-xl leading-8 text-muted-foreground">{summary}</p>
            <BlogThumbnail type={item.type} source={item.source} title={title} className="mt-10 aspect-[16/8] min-h-[300px] rounded-3xl shadow-2xl shadow-black/10" />
            <div className="mt-10 grid gap-8 md:grid-cols-[1fr_280px]">
              <div className="rounded-3xl border border-border/70 bg-card p-7 md:p-9">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">{language === "bg" ? "За публикацията" : "About this coverage"}</p>
                <p className="mt-5 text-lg leading-8 text-foreground/85">{summary}</p>
                <p className="mt-5 leading-7 text-muted-foreground">
                  {language === "bg"
                    ? "БАЗАП събира на едно място проверени новини, партньорства и медийни публикации, които проследяват развитието на адитивното производство в България."
                    : "BAMAS brings together verified news, partnerships and media coverage that track the development of additive manufacturing in Bulgaria."}
                </p>
              </div>
              <aside className="h-fit rounded-3xl border border-primary/20 bg-primary/5 p-6">
              <h2 className="text-lg font-bold">{language === "bg" ? "Източник и контекст" : "Source and context"}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                {language === "bg"
                  ? "Тази публикация обобщава проверено външно отразяване или официално съобщение, свързано с БАЗАП. Следвайте оригиналния източник за пълния материал."
                  : "This post summarizes verified external coverage or an official announcement related to BAMAS. Follow the original source for the complete material."}
              </p>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">
                {language === "bg" ? "Отвори оригиналния източник" : "Open the original source"} <ExternalLink className="h-4 w-4" />
              </a>
              </aside>
            </div>
            {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
          </article>
        )}
      </main>
      <FooterSection currentLanguage={language as "en" | "bg"} />
    </div>
  );
};

export default NewsArticle;
