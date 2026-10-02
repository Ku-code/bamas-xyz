import React, { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Robotics Strategy Forum 2026 × Additive Days banner (cube face 2).
 *
 * Ported from the supplied `rsf-additive-days-banner.html` bundle the same way
 * as the Additive Days banner: measured off the original's computed styles at
 * its 1920×160 design canvas, positions as percentages, type in `cqw` so the
 * strip scales fluidly. Below `md` it stacks.
 *
 * Layout: black left zone (animated AD mark + "Additive Days 2026 — special
 * zone with BAMAS"), white right zone (RSF logo, organiser PARAi, blue
 * headline, date and venue). Copy stays in Bulgarian as authored — it is the
 * partner's creative; only the accessible label is localised.
 */

const EVENT_URL = "https://additivedays.com/";

const BLACK = "#050505";
const RSF_BLUE = "#2E6FB5";

const W = 1920;
const H = 160;
const x = (px: number) => `${(px / W) * 100}%`;
const y = (px: number) => `${(px / H) * 100}%`;
const t = (px: number) => `${((px / W) * 100).toFixed(3)}cqw`;

const OSWALD = "'Oswald', 'Sofia Sans', sans-serif";

/** Source clip is black-on-#F2F2F2; invert + screen renders it white on black. */
const MARK_FILTER: React.CSSProperties = {
    filter: "invert(1) contrast(1.45)",
    mixBlendMode: "screen",
};

const AnimatedMark = ({ reducedMotion, className }: { reducedMotion: boolean; className?: string }) => {
    const ref = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.muted = true;
        void el.play().catch(() => {
            /* autoplay blocked — poster frame stays */
        });
    }, [reducedMotion]);

    if (reducedMotion) {
        return (
            <img
                src="/banners/additive-days-mark.webp"
                alt="Additive Days"
                className={className}
                style={MARK_FILTER}
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
            poster="/banners/additive-days-mark.webp"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
        />
    );
};

const RSFBanner = () => {
    const { language } = useLanguage();
    const [reducedMotion, setReducedMotion] = React.useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReducedMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const label =
        language === "bg"
            ? "Additive Days 2026 в рамките на Robotics Strategy Forum, 10.09.2026, София Тех Парк — отворете additivedays.com в нов раздел"
            : "Additive Days 2026 within Robotics Strategy Forum, 10.09.2026, Sofia Tech Park — open additivedays.com in a new tab";

    return (
        <div className="w-full h-full">
            <a
                href={EVENT_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
                {/* ── Desktop: faithful strip ─────────────────────────── */}
                <div
                    className="hidden md:block relative w-full h-full overflow-hidden"
                    style={{ containerType: "inline-size", backgroundColor: "#FFFFFF" }}
                >
                    {/* Black left zone */}
                    <div
                        className="absolute inset-y-0 left-0"
                        style={{ width: x(522), backgroundColor: BLACK }}
                    />

                    {/* Faint AD hexagon watermark (as in the original) */}
                    <img
                        src="/banners/ad-mark-white.svg"
                        alt=""
                        aria-hidden="true"
                        className="absolute pointer-events-none"
                        style={{ left: x(940), top: y(-60), width: x(420), opacity: 0.07 }}
                    />

                    {/* Animated AD lockup */}
                    <div
                        className="absolute overflow-hidden"
                        style={{ left: x(40), top: y(34), width: x(150), height: y(92) }}
                    >
                        <AnimatedMark
                            reducedMotion={reducedMotion}
                            className="absolute inset-0 h-full w-full object-contain"
                        />
                    </div>

                    <div
                        className="absolute whitespace-nowrap text-white"
                        style={{
                            left: x(208),
                            top: y(40),
                            fontFamily: OSWALD,
                            fontWeight: 600,
                            fontSize: t(29),
                            letterSpacing: t(-0.58),
                            lineHeight: 1,
                        }}
                    >
                        Additive Days 2026
                    </div>
                    <div
                        className="absolute"
                        style={{
                            left: x(208),
                            top: y(76),
                            width: x(282),
                            fontSize: t(15),
                            letterSpacing: t(0.6),
                            lineHeight: 1.35,
                            color: "#B8B8B8",
                        }}
                    >
                        Специална зона за адитивно производство · с БАЗАП
                    </div>

                    {/* RSF logo */}
                    <img
                        src="/banners/rsf-logo.webp"
                        alt="Robotics Strategy Forum 2026"
                        className="absolute object-contain"
                        style={{ left: x(570), top: y(24), width: x(239), height: y(112) }}
                        decoding="async"
                    />

                    {/* Organiser */}
                    <div
                        className="absolute whitespace-nowrap uppercase"
                        style={{
                            left: x(830),
                            top: y(45),
                            fontSize: t(14),
                            letterSpacing: t(1.12),
                            color: "#5A5A5A",
                        }}
                    >
                        Организатор
                    </div>
                    <img
                        src="/banners/parai-logo.webp"
                        alt="PARAi"
                        className="absolute object-contain"
                        style={{ left: x(830), top: y(70), width: x(136), height: y(42) }}
                        decoding="async"
                    />

                    {/* Headline block */}
                    <div
                        className="absolute whitespace-nowrap uppercase"
                        style={{
                            left: x(1015),
                            top: y(17),
                            fontSize: t(14),
                            letterSpacing: t(1.12),
                            color: RSF_BLUE,
                        }}
                    >
                        В рамките на Robotics Strategy Forum 2026
                    </div>
                    <div
                        className="absolute"
                        style={{
                            left: x(1015),
                            top: y(40),
                            width: x(452),
                            fontFamily: OSWALD,
                            fontWeight: 700,
                            fontSize: t(31),
                            letterSpacing: t(-0.62),
                            lineHeight: 1.1,
                            color: RSF_BLUE,
                        }}
                    >
                        Ренесанс на българската индустрия
                    </div>
                    <div
                        className="absolute whitespace-nowrap"
                        style={{
                            left: x(1015),
                            top: y(117),
                            fontSize: t(16),
                            letterSpacing: t(0.16),
                            color: "#3C3C3B",
                        }}
                    >
                        Инженеринг, роботика и AI: новата роля на България
                    </div>

                    {/* Date + venue */}
                    <div
                        className="absolute whitespace-nowrap"
                        style={{
                            left: x(1503),
                            top: y(58),
                            fontFamily: OSWALD,
                            fontWeight: 700,
                            fontSize: t(42),
                            letterSpacing: t(-1.68),
                            lineHeight: 0.9,
                            color: "#1C1C1C",
                        }}
                    >
                        10.09.2026
                    </div>
                    <div className="absolute" style={{ left: x(1697), top: y(54) }}>
                        <div
                            className="whitespace-nowrap"
                            style={{
                                fontFamily: OSWALD,
                                fontWeight: 600,
                                fontSize: t(23),
                                letterSpacing: t(-0.46),
                                lineHeight: 1.1,
                                color: "#1C1C1C",
                            }}
                        >
                            София Тех Парк
                        </div>
                        <div
                            className="whitespace-nowrap"
                            style={{ fontSize: t(16), lineHeight: 1.4, color: "#5A5A5A" }}
                        >
                            Зала „Джон Атанасов“
                        </div>
                    </div>
                </div>

                {/* ── Mobile: stacked ─────────────────────────────────── */}
                <div className="md:hidden h-full flex flex-col justify-between bg-white">
                    <div className="flex items-center justify-between gap-3 px-4 py-2" style={{ backgroundColor: BLACK }}>
                        <div className="min-w-0">
                            <div
                                className="text-white whitespace-nowrap"
                                style={{ fontFamily: OSWALD, fontWeight: 600, fontSize: "1.05rem", lineHeight: 1.1 }}
                            >
                                Additive Days 2026
                            </div>
                            <div className="text-[10px] leading-tight" style={{ color: "#B8B8B8" }}>
                                Специална зона за адитивно производство · с БАЗАП
                            </div>
                        </div>
                        <div className="h-8 w-16 flex-shrink-0 overflow-hidden">
                            <AnimatedMark reducedMotion={reducedMotion} className="h-full w-full object-contain" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 px-4 py-1.5">
                        <div className="min-w-0">
                            <div
                                className="text-[8px] uppercase tracking-widest leading-tight"
                                style={{ color: RSF_BLUE }}
                            >
                                В рамките на Robotics Strategy Forum 2026
                            </div>
                            <div
                                className="truncate"
                                style={{ fontFamily: OSWALD, fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.2, color: RSF_BLUE }}
                            >
                                Ренесанс на българската индустрия
                            </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                            <div
                                style={{ fontFamily: OSWALD, fontWeight: 700, fontSize: "1.1rem", lineHeight: 1, color: "#1C1C1C" }}
                            >
                                10.09.2026
                            </div>
                            <div className="text-[9px]" style={{ color: "#5A5A5A" }}>
                                София Тех Парк
                            </div>
                        </div>
                    </div>
                </div>
            </a>
        </div>
    );
};

export default RSFBanner;
