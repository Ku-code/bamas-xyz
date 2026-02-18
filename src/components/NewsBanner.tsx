import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Newspaper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface NewsItem {
    url: string;
    title: string;
}

const NewsBanner = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const { language } = useLanguage();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await fetch("/news.txt");
                if (!response.ok) throw new Error("News file not found");
                const text = await response.text();
                const items = text
                    .split("\n")
                    .filter((line) => line.trim() && line.includes("|"))
                    .map((line) => {
                        const [url, title] = line.split("|").map((s) => s.trim());
                        return { url, title };
                    });
                setNews(items);
                if (items.length > 0) {
                    setIsVisible(true);
                }
            } catch (error) {
                console.error("Failed to fetch news:", error);
            }
        };

        fetchNews();

        // Refresh news every 5 minutes
        const interval = setInterval(fetchNews, 300000);
        return () => clearInterval(interval);
    }, []);

    if (!isVisible || news.length === 0) return null;

    const marqueeItems = news;

    return (
        <div className="w-full bg-background/60 backdrop-blur-xl border-y border-primary/20 overflow-hidden py-4 md:py-5 relative z-[40] shadow-sm">
            <div className="container mx-auto px-4 flex items-center">
                <div className="flex-shrink-0 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 mr-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                    <Newspaper className="w-4 h-4 md:w-5 md:h-5 animate-pulse" />
                    <span className="text-[10px] md:text-sm font-black uppercase tracking-widest leading-none">
                        {language === 'bg' ? 'НОВИНИ' : 'LATEST'}
                    </span>
                </div>

                <div className="relative flex-grow overflow-hidden whitespace-nowrap group h-full flex items-center">
                    <motion.div
                        className="flex items-center w-max"
                        initial={{ x: "0%" }}
                        animate={{ x: "-50%" }}
                        transition={{
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear",
                            repeatType: "loop"
                        }}
                    >
                        {/* Render two identical sets to create a seamless infinite loop */}
                        {[1, 2].map((setIndex) => (
                            <div key={`set-${setIndex}`} className="flex items-center">
                                {news.map((item, idx) => (
                                    <div key={`${setIndex}-${idx}`} className="flex items-center gap-16 px-8">
                                        <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-3 text-sm md:text-base lg:text-lg font-bold text-foreground/90 hover:text-primary transition-all duration-300 group/item whitespace-nowrap"
                                        >
                                            <span className="relative">
                                                {item.title}
                                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover/item:w-full" />
                                            </span>
                                            <ExternalLink className="w-4 h-4 opacity-40 group-hover/item:opacity-100 group-hover/item:translate-x-1 group-hover/item:-translate-y-1 transition-all duration-300 text-primary" />
                                        </a>
                                        <span className="text-primary/40 font-bold select-none text-xl">✦</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </motion.div>

                    {/* Gradient Fades for Smooth Edges */}
                    <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background via-background/20 to-transparent pointer-events-none z-10" />
                    <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background via-background/20 to-transparent pointer-events-none z-10" />
                </div>
            </div>
        </div>
    );
};

export default NewsBanner;
