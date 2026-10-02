import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface NewsEntry {
    slug: string;
    date: string;
    type: string;
    url: string;
    title_bg: string;
    title_en: string;
    source?: string;
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
    const groups = sortedItems.reduce<Record<string, NewsEntry[]>>((acc, it) => {
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
            <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 md:pt-36">
                <h1 className="text-3xl md:text-5xl font-extrabold text-primary text-center mb-3">
                    {language === "bg" ? "Блог" : "Blog"}
                </h1>
                <p className="text-center text-muted-foreground mb-10 md:mb-14">
                    {language === "bg"
                        ? "Проверени публикации, медийно отразяване и новини за БАЗАП и българската екосистема за адитивно производство."
                        : "Verified articles, media coverage and news about BAMAS and Bulgaria's additive manufacturing ecosystem."}
                </p>

                {failed && (
                    <p className="text-center text-muted-foreground">
                        {language === "bg" ? "Новините не могат да бъдат заредени в момента." : "News could not be loaded right now."}
                    </p>
                )}

                {orderedKeys.map((ym) => (
                    <section key={ym} className="mb-10">
                        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-muted-foreground">
                            {monthLabel(ym)}
                        </h2>
                        <ol className="space-y-3">
                            {groups[ym].map((it) => {
                                const style = TYPE_STYLES[it.type] ?? TYPE_STYLES.announcement;
                                const title = language === "bg" ? it.title_bg : it.title_en;
                                return (
                                    <li key={it.slug}>
                                        <Link
                                            to={`/blog/${it.slug}`}
                                            className="group flex items-start gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                                        >
                                            <span className={`mt-0.5 flex-shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${style.cls}`}>
                                                {language === "bg" ? style.label_bg : style.label_en}
                                            </span>
                                            <span className="min-w-0 flex-grow">
                                                <span className="block font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                                                    {title}
                                                </span>
                                                <time dateTime={it.date} className="mt-1 block text-xs text-muted-foreground">
                                                    {fmt(it.date)}
                                                    {it.source ? ` · ${it.source}` : ""}
                                                </time>
                                            </span>
                                            <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-primary/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
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
