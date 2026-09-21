import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Additive Days V Edition (2027) partner banner.
 *
 * Ported from the Additive Days design-system banner (1920×160, 12:1). The
 * desktop layout reproduces it 1:1 — positions are percentages of the design
 * canvas and type is sized in `cqw`, so the whole strip scales fluidly with
 * its container. Below `md` it falls back to a stacked layout, since a 12:1
 * strip is unreadable on a phone.
 *
 * The banner copy stays in English in both site languages: it reproduces the
 * partner's own creative, and the panel widths are set to the English strings.
 * Only the accessible label is localised.
 */

const EVENT_URL = "https://additivedays.com/";

const BLUE = "#F4D328";
const BLUE_HOVER = "#E3C21B";
const BLACK = "#050505";
const LINK_BLUE = "#F4D328";

/** Design canvas the original banner was authored at. */
const W = 1920;
const H = 160;

/** design px → % of canvas width / height */
const x = (px: number) => `${(px / W) * 100}%`;
const y = (px: number) => `${(px / H) * 100}%`;
/** design px → container-query width units, so type scales with the banner */
const t = (px: number) => `${((px / W) * 100).toFixed(3)}cqw`;

const OSWALD = "'Oswald', 'Sofia Sans', sans-serif";

/** Preserve the original animated lockup, black on the yellow face. */
const MARK_FILTER: React.CSSProperties = {
    filter: "contrast(1.45)",
    mixBlendMode: "multiply",
};

/**
 * Animated Additive Days lockup.
 *
 * The <video> is played imperatively: React assigns the `muted` property after
 * the element is created, which is too late for Chrome's autoplay policy, so
 * the declarative `autoPlay` attribute alone leaves it paused on frame 0.
 */
const LogoMark = ({ reducedMotion, className }: { reducedMotion: boolean; className?: string }) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.muted = true;
        void el.play().catch(() => {
            /* autoplay blocked — the poster frame stays visible */
        });
    }, [reducedMotion]);

    if (reducedMotion) {
        return (
            <img
                src="/banners/additive-days-mark.jpg"
                alt="Additive Days"
                className={className}
                style={MARK_FILTER}
                loading="lazy"
                decoding="async"
            />
        );
    }

    return (
        <video
            ref={ref}
            className={className}
            style={MARK_FILTER}
            src="/banners/additive-days-mark.mp4"
            poster="/banners/additive-days-mark.jpg"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            tabIndex={-1}
        />
    );
};

const Dot = ({ size }: { size: string }) => (
    <span
        aria-hidden="true"
        className="inline-block flex-shrink-0 bg-black"
        style={{ width: size, height: size }}
    />
);

const AdditiveDaysBanner = () => {
    const { language } = useLanguage();
    const [reducedMotion, setReducedMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const label =
        language === "bg"
            ? "Additive Days V издание, 2027 — датите и мястото предстоят"
            : "Additive Days V Edition, 2027 — dates and venue to be announced";

    return (
        <div className="w-full h-full">
            <a
                href={EVENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
            >
                {/* ── Desktop: faithful 12:1 strip ─────────────────────── */}
                <div
                    className="hidden md:block relative w-full h-full overflow-hidden"
                    style={{
                        containerType: "inline-size",
                        backgroundColor: BLUE,
                    }}
                >
                    {/* Black info panel */}
                    <div
                        className="absolute inset-y-0"
                        style={{ left: x(1110), width: x(470), backgroundColor: BLACK }}
                    />

                    {/* Animated Additive Days lockup */}
                    <div
                        className="absolute overflow-hidden"
                        style={{ left: x(52), top: y(20.5), width: x(280), height: y(92) }}
                    >
                        <LogoMark
                            reducedMotion={reducedMotion}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    </div>

                    {/* Meta row */}
                    <div
                        className="absolute flex items-center whitespace-nowrap uppercase text-black/95"
                        style={{
                            left: x(48),
                            top: y(125),
                            fontSize: t(13),
                            letterSpacing: t(1.04),
                            gap: t(20),
                            fontWeight: 500,
                        }}
                    >
                        <span style={{ fontWeight: 600 }}>V edition</span>
                        <Dot size={t(6.35)} />
                        <span>additivedays.com</span>
                        <Dot size={t(6.35)} />
                        <span>Conference · Expo · Workshops</span>
                    </div>

                    {/* Divider */}
                    <div
                        className="absolute bg-black/35"
                        style={{ left: x(580), top: y(35.5), width: "1px", height: y(88) }}
                    />

                    {/* Date */}
                    <div
                        className="absolute whitespace-nowrap text-black"
                        style={{
                            left: x(611),
                            top: y(56),
                            fontFamily: OSWALD,
                            fontWeight: 700,
                            fontSize: t(58),
                            letterSpacing: t(-2.32),
                            lineHeight: 0.85,
                        }}
                    >
                        2027
                    </div>

                    {/* Venue */}
                    <div className="absolute text-black" style={{ left: x(869), top: y(50) }}>
                        <div
                            className="whitespace-nowrap"
                            style={{
                                fontFamily: OSWALD,
                                fontWeight: 600,
                                fontSize: t(30),
                                letterSpacing: t(-0.6),
                                lineHeight: 1.15,
                            }}
                        >
                            {language === "bg" ? "Очаквайте" : "Coming soon"}
                        </div>
                        <div
                            className="whitespace-nowrap"
                            style={{ fontSize: t(14), letterSpacing: t(-0.14), lineHeight: 1.3 }}
                        >
                            {language === "bg" ? "Датите и мястото предстоят" : "Dates & venue to be announced"}
                        </div>
                    </div>

                    {/* Black panel — entry note + credit */}
                    <div
                        className="absolute whitespace-nowrap uppercase"
                        style={{
                            left: x(1166),
                            top: y(45),
                            fontFamily: OSWALD,
                            fontWeight: 600,
                            fontSize: t(22),
                            letterSpacing: t(-0.66),
                            color: "#F4D328",
                            lineHeight: 1.2,
                        }}
                    >
                        V edition · 2027
                    </div>
                    <div
                        className="absolute flex items-center whitespace-nowrap"
                        style={{ left: x(1166), top: y(88), gap: t(11), fontSize: t(16) }}
                    >
                        <span style={{ color: LINK_BLUE }}>additivedays.com</span>
                        <span
                            aria-hidden="true"
                            style={{ width: "1px", height: t(14), backgroundColor: "#363636" }}
                        />
                        <span style={{ color: "#828282", fontSize: t(14) }}>by</span>
                        <img
                            src="/banners/b2n-mark-white.png"
                            alt="B2N"
                            style={{ width: t(60) }}
                            loading="lazy"
                            decoding="async"
                        />
                    </div>

                    {/* CTA */}
                    <div
                        className="absolute inset-y-0 flex items-center justify-center transition-colors duration-300"
                        style={{ left: x(1580), width: x(340), backgroundColor: BLUE, gap: t(13) }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
                    >
                        <span
                            className="whitespace-nowrap uppercase text-black"
                            style={{
                                fontFamily: OSWALD,
                                fontWeight: 700,
                                fontSize: t(34),
                                letterSpacing: t(-0.68),
                            }}
                        >
                            Follow updates
                        </span>
                        <span
                            aria-hidden="true"
                            className="text-black transition-transform duration-300 group-hover:translate-x-1"
                            style={{ fontSize: t(30), lineHeight: 1 }}
                        >
                            →
                        </span>
                    </div>
                </div>

                {/* ── Mobile: stacked ──────────────────────────────────── */}
                <div className="md:hidden h-full flex flex-col justify-between" style={{ backgroundColor: BLUE }}>
                    <div className="px-4 pb-2 pt-3">
                        <div className="h-9 w-[168px] overflow-hidden">
                            <LogoMark reducedMotion={reducedMotion} className="h-full w-full object-cover" />
                        </div>

                        <div className="mt-2 flex items-baseline gap-2 text-black">
                            <span
                                style={{
                                    fontFamily: OSWALD,
                                    fontWeight: 700,
                                    fontSize: "1.75rem",
                                    letterSpacing: "-0.04em",
                                    lineHeight: 1,
                                }}
                            >
                                2027
                            </span>
                            <span
                                style={{
                                    fontFamily: OSWALD,
                                    fontWeight: 600,
                                    fontSize: "1rem",
                                    lineHeight: 1,
                                }}
                            >
                                {language === "bg" ? "Очаквайте" : "Coming soon"}
                            </span>
                        </div>

                        <div className="text-[11px] leading-snug text-black/85">
                            {language === "bg" ? "Датите и мястото предстоят" : "Dates & venue to be announced"}
                        </div>
                    </div>

                    <div
                        className="flex items-center justify-between gap-3 px-4 py-2"
                        style={{ backgroundColor: BLACK }}
                    >
                        <span
                            className="text-[10px] uppercase leading-tight"
                            style={{ fontFamily: OSWALD, fontWeight: 600, color: "#FAFAFA" }}
                        >
                            V edition · 2027
                        </span>
                        <span
                            className="flex-shrink-0 whitespace-nowrap text-[11px] uppercase text-white"
                            style={{ fontFamily: OSWALD, fontWeight: 700 }}
                        >
                            Follow updates →
                        </span>
                    </div>
                </div>
            </a>
        </div>
    );
};

export default AdditiveDaysBanner;
