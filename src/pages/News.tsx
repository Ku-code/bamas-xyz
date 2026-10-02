import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { BlogThumbnail } from "@/components/blog/BlogThumbnail";

interface NewsEntry {
    slug: string;
    date: string;
    type: string;
    url: string;
    title_bg: string;
    title_en: string;
    source?: string;
    summary_bg?: string;
    summary_en?: string;
}

const TYPE_STYLES: Record<string, { label_bg: string; label_en: string; cls: string }> = {
    partner: { label_bg: "Партньор", label_en: "Partner", cls: "bg-primary/15 text-primary border-primary/30" },
    event: { label_bg: "Събитие", label_en: "Event", cls: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
    media: { label_bg: "Медия", label_en: "Media", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
    announcement: { label_bg: "Новина", label_en: "News", cls: "bg-foreground/10 text-foreground/80 border-foreground/20" },
};

/**
 * Public news archive rendered from /news.json — every ticker item becomes a
 * dated, crawlable entry. The ticker's LATEST badge links here.
 */
const News = () => {
    const { language } = useLanguage();
    const [items, setItems] = useState<NewsEntry[]>([]);
    const [failed, setFailed] = useState(false);

    useDocumentMeta({
        title: language === "bg"
            ? "Блог | БАЗАП — Българска асоциация за адитивно производство"
            : "Blog | BAMAS — Bulgarian Additive Manufacturing Association",
        description: language === "bg"
            ? "Партньорства, събития и съобщения от БАЗАП и българската екосистема за адитивно производство и 3D печат."
            : "Partnerships, events and announcements from BAMAS and the Bulgarian additive manufacturing ecosystem.",
        schemaType: "CollectionPage",
        canonical: "https://www.bamas.xyz/blog",
    });

    useEffect(() => {
        fetch("/news.json")
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
            .then((data) => setItems(data.items ?? []))
            .catch(() => setFailed(true));
    }, []);

    const fmt = (iso: string) =>
        new Date(iso + "T00:00:00").toLocaleDateString(language === "bg" ? "bg-BG" : "en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });

    // Group by year-month for scannable archive structure
    const sortedItems = useMemo(
        () => [...items].sort((a, b) => b.date.localeCompare(a.date)),
        [items],
    );
    const featured = sortedItems[0];
    const groups = sortedItems.slice(1).reduce<Record<string, NewsEntry[]>>((acc, it) => {
        const key = it.date.slice(0, 7);
        (acc[key] ??= []).push(it);
        return acc;
    }, {});
    const orderedKeys = Object.keys(groups).sort().reverse();

    const jsonLd = useMemo(() => ({
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: language === "bg" ? "Новини и медийни публикации за БАЗАП" : "BAMAS news and media coverage",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: items.length,
        itemListElement: sortedItems.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `https://www.bamas.xyz/blog/${item.slug}`,
            name: language === "bg" ? item.title_bg : item.title_en,
        })),
    }), [items.length, language, sortedItems]);

    const monthLabel = (ym: string) =>
        new Date(ym + "-01T00:00:00").toLocaleDateString(language === "bg" ? "bg-BG" : "en-GB", {
            month: "long",
            year: "numeric",
        });

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto max-w-6xl px-4 pb-24 pt-28 md:pt-36">
                <p className="mb-3 text-center text-xs font-black uppercase tracking-[0.25em] text-primary">BAMAS Insights</p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight text-foreground text-center mb-4">
                    {language === "bg" ? "Блог" : "Blog"}
                </h1>
                <p className="mx-auto max-w-2xl text-center text-base leading-7 text-muted-foreground mb-12 md:mb-16">
                    {language === "bg"
                        ? "Проверени публикации, медийно отразяване и новини за БАЗАП и българската екосистема за адитивно производство."
                        : "Verified articles, media coverage and news about BAMAS and Bulgaria's additive manufacturing ecosystem."}
                </p>

                {failed && (
                    <p className="text-center text-muted-foreground">
                        {language === "bg" ? "Новините не могат да бъдат заредени в момента." : "News could not be loaded right now."}
                    </p>
                )}

                {featured && (
                    <Link to={`/blog/${featured.slug}`} className="group mb-16 grid overflow-hidden rounded-3xl border border-border/70 bg-card shadow-xl shadow-black/5 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl md:grid-cols-[1.2fr_1fr]">
                        <BlogThumbnail
                            type={featured.type}
                            source={featured.source}
                            title={language === "bg" ? featured.title_bg : featured.title_en}
                            className="aspect-[16/10] min-h-[280px]"
                        />
                        <div className="flex flex-col justify-center p-7 md:p-10">
                            <span className="text-xs font-black uppercase tracking-[0.18em] text-primary">{language === "bg" ? "Акцент" : "Featured"}</span>
                            <h2 className="mt-4 text-2xl font-black leading-tight text-foreground transition-colors group-hover:text-primary md:text-4xl">
                                {language === "bg" ? featured.title_bg : featured.title_en}
                            </h2>
                            <p className="mt-4 line-clamp-3 leading-7 text-muted-foreground">
                                {(language === "bg" ? featured.summary_bg : featured.summary_en) || (language === "bg" ? "Последни новини от екосистемата на БАЗАП." : "Latest news from the BAMAS ecosystem.")}
                            </p>
                            <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-primary">
                                {language === "bg" ? "Прочети публикацията" : "Read the article"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>
                )}

                {orderedKeys.map((ym) => (
                    <section key={ym} className="mb-14">
                        <h2 className="mb-6 border-b border-border/60 pb-3 text-sm font-black uppercase tracking-widest text-muted-foreground">
                            {monthLabel(ym)}
                        </h2>
                        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {groups[ym].map((it) => {
                                const style = TYPE_STYLES[it.type] ?? TYPE_STYLES.announcement;
                                const title = language === "bg" ? it.title_bg : it.title_en;
                                return (
                                    <li key={it.slug}>
                                        <Link to={`/blog/${it.slug}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                                            <BlogThumbnail type={it.type} source={it.source} title={title} className="aspect-[16/10]" />
                                            <span className="flex flex-1 flex-col p-5">
                                                <span className={`mb-3 w-fit rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${style.cls}`}>
                                                    {language === "bg" ? style.label_bg : style.label_en}
                                                </span>
                                                <span className="line-clamp-3 text-lg font-bold leading-snug text-foreground transition-colors group-hover:text-primary">{title}</span>
                                                <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-xs text-muted-foreground">
                                                    <time dateTime={it.date}>{fmt(it.date)}</time>
                                                    <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ol>
                    </section>
                ))}
                {items.length > 0 && (
                    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                )}
            </main>
            <FooterSection currentLanguage={language as "en" | "bg"} />
        </div>
    );
};

export default News;
