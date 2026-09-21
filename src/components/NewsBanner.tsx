import { useEffect, useRef, useState } from "react";
import { ExternalLink, Newspaper } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

export interface NewsItem {
    url: string;
    title: string;
    date?: string;
    type?: string;
}

interface RawNewsItem {
    url: string;
    date?: string;
    type?: string;
    title_bg?: string;
    title_en?: string;
    title?: string;
}

const TWO_ROWS_CHAR_THRESHOLD = 250;

/** Type tag palette — small badges so major news reads differently from routine items. */
const TYPE_LABELS: Record<string, { bg: string; en: string }> = {
    partner: { bg: "Партньор", en: "Partner" },
    event: { bg: "Събитие", en: "Event" },
    media: { bg: "Медия", en: "Media" },
    announcement: { bg: "Новина", en: "News" },
};

const formatDate = (iso: string | undefined, lang: string) => {
    if (!iso) return null;
    try {
        return new Date(iso + "T00:00:00").toLocaleDateString(lang === "bg" ? "bg-BG" : "en-GB", {
            day: "numeric",
            month: "short",
        });
    } catch {
        return null;
    }
};

const MarqueeRow = ({ items, language, duration, paused }: { items: NewsItem[]; language: string; duration: number; paused: boolean }) => {
    const mobile = useIsMobile();
    const rail = useRef<HTMLDivElement>(null);
    const resumeAt = useRef(0);
    const touching = useRef(false);

    useEffect(() => {
        if (!mobile || !rail.current) return;
        const el = rail.current;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let frame = 0;
        let previous = 0;
        let position = el.scrollLeft;
        const tick = (now: number) => {
            const elapsed = previous ? Math.min(now - previous, 50) : 0;
            previous = now;
            if (!document.hidden && !motion.matches && !touching.current && now >= resumeAt.current) {
                const loopWidth = el.scrollWidth / 2;
                // This is a continuous news ticker, not a timed slide transition.
                // Mobile takes 1.45x as long per loop; desktop CSS is untouched.
                position = (position + loopWidth * elapsed / (duration * 1.45 * 1000)) % Math.max(1, loopWidth);
                el.scrollLeft = position;
            } else {
                position = el.scrollLeft;
            }
            frame = requestAnimationFrame(tick);
        };
        const restart = () => { previous = 0; resumeAt.current = performance.now() + 1500; };
        document.addEventListener("visibilitychange", restart);
        motion.addEventListener("change", restart);
        frame = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(frame);
            document.removeEventListener("visibilitychange", restart);
            motion.removeEventListener("change", restart);
        };
    }, [mobile, duration, items, language]);

    return (
    <div ref={rail} className={`relative flex-grow whitespace-nowrap group h-full flex items-center min-h-[1.75rem] ${mobile ? "overflow-x-auto [scrollbar-width:none]" : "overflow-hidden"}`}
        onPointerDown={() => { touching.current = true; }}
        onPointerUp={() => { touching.current = false; resumeAt.current = performance.now() + 1500; }}
        onPointerCancel={() => { touching.current = false; resumeAt.current = performance.now() + 1500; }}
        onTouchEnd={() => { touching.current = false; resumeAt.current = performance.now() + 1500; }}
        onWheel={() => { resumeAt.current = performance.now() + 1500; }}
        onFocusCapture={() => { touching.current = true; }}
        onBlurCapture={() => { touching.current = false; resumeAt.current = performance.now() + 1500; }}>
        <div
            className="flex items-center w-max marquee-track"
            style={{
                animationDuration: `${duration}s`,
                animationPlayState: paused ? "paused" : "running",
                animationName: mobile ? "none" : undefined,
                flexShrink: mobile ? 0 : undefined,
            }}
        >
            {[1, 2].map((setIndex) => (
                <div key={`set-${setIndex}`} className="flex items-center" aria-hidden={setIndex === 2 || undefined}>
                    {items.map((item, idx) => {
                        const tag = item.type ? TYPE_LABELS[item.type] : undefined;
                        const date = formatDate(item.date, language);
                        return (
                            <div key={`${setIndex}-${idx}`} className="flex items-center gap-10 px-6">
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2.5 text-xs md:text-sm lg:text-base font-bold text-foreground/90 hover:text-primary transition-all duration-300 group/item whitespace-nowrap"
                                >
                                    {tag && (
                                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-primary/90">
                                            {language === "bg" ? tag.bg : tag.en}
                                        </span>
                                    )}
                                    <span className="relative">
                                        {item.title}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/item:w-full" />
                                    </span>
                                    {date && (
                                        <span className="text-[10px] md:text-xs font-semibold text-muted-foreground">
                                            {date}
                                        </span>
                                    )}
                                    <ExternalLink className="w-3.5 h-3.5 opacity-40 group-hover/item:opacity-100 group-hover/item:translate-x-1 group-hover/item:-translate-y-1 transition-all duration-300 text-primary" />
                                </a>
                                <span className="text-primary/40 font-bold select-none text-base" aria-hidden="true">✦</span>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    </div>
    );
};

const NewsBanner = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [paused, setPaused] = useState(false);
    const { language } = useLanguage();

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Preferred source: dated, typed, bilingual news.json
                const response = await fetch("/news.json");
                if (response.ok) {
                    const data = await response.json();
                    const items: NewsItem[] = (data.items as RawNewsItem[])
                        .map((it) => ({
                            url: it.url,
                            title: (language === "bg" ? it.title_bg : it.title_en) || it.title_bg || it.title_en || it.title || "",
                            date: it.date,
                            type: it.type,
                        }))
                        .filter((it) => it.title);
                    setNews(items);
                    setIsVisible(items.length > 0);
                    return;
                }
                // Legacy fallback: pipe-separated news.txt
                const legacy = await fetch("/news.txt");
                if (!legacy.ok) throw new Error("No news source found");
                const text = await legacy.text();
                const items = text
                    .split("\n")
                    .filter((line) => line.trim() && line.includes("|"))
                    .map((line) => {
                        const [url, title] = line.split("|").map((s) => s.trim());
                        return { url, title };
                    });
                setNews(items);
                setIsVisible(items.length > 0);
            } catch (error) {
                console.error("Failed to fetch news:", error);
            }
        };

        fetchNews();
        const interval = setInterval(fetchNews, 300000);
        return () => clearInterval(interval);
    }, [language]);

    if (!isVisible || news.length === 0) return null;

    const totalChars = news.reduce((sum, item) => sum + item.title.length, 0);
    const useTwoRows = totalChars > TWO_ROWS_CHAR_THRESHOLD;
    const firstRow = useTwoRows ? news.filter((_, idx) => idx % 2 === 0) : news;
    const secondRow = useTwoRows ? news.filter((_, idx) => idx % 2 === 1) : [];
    // Reading-speed-derived duration: ~28 chars/sec, min 45s so it never races.
    const rowDuration = Math.max(45, Math.round(totalChars / (useTwoRows ? 2 : 1) / 28) * 2);

    return (
        <div
            className="w-full bg-background/60 backdrop-blur-xl border-y border-primary/20 overflow-hidden py-2 md:py-2.5 relative z-[40] shadow-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="container mx-auto px-4 flex items-center">
                <Link
                    to="/news"
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 mr-5 md:mr-6 shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:bg-primary/30 transition-colors"
                    aria-label={language === 'bg' ? 'Всички новини' : 'All news'}
                >
                    <Newspaper className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse" />
                    <span className="text-[9px] md:text-xs font-black uppercase tracking-widest leading-none">
                        {language === 'bg' ? 'НОВИНИ' : 'LATEST'}
                    </span>
                </Link>

                <div className="relative flex-grow flex flex-col gap-1 overflow-hidden">
                    <MarqueeRow items={firstRow} language={language} duration={rowDuration} paused={paused} />
                    {useTwoRows && <MarqueeRow items={secondRow} language={language} duration={rowDuration} paused={paused} />}

                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/20 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background via-background/20 to-transparent pointer-events-none z-10" />
                </div>
            </div>
        </div>
    );
};

export default NewsBanner;
