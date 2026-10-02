import { useLanguage } from "@/contexts/LanguageContext";

/**
 * MACH-TECH & INNOTECH Expo banner (cube face 3).
 *
 * Direct port of the supplied "MachTech Design System" event-banner export
 * (banner-export.html): 1920×160 chartreuse strip, Rubik type, all dimensions
 * in cqw so it scales fluidly with the container. Below `md` it stacks.
 *
 * The whole strip links to machtech.bg via an absolutely-positioned underlay
 * anchor (the export's own pattern — it avoids nesting the "Купи билет" CTA
 * anchor inside another anchor, which would be invalid HTML). The CTA sits
 * above it at z-[1].
 */

const MT_GREEN = "#BCCE1E";
const MT_ACCENT = "#A5B516";
const MT_DARK = "#3A3A3A";
const MT_OLIVE = "#2E3300";

const RUBIK = "'Rubik', -apple-system, 'Segoe UI', sans-serif";

const MachTechBanner = () => {
    const { language } = useLanguage();

    const label =
        language === "bg"
            ? "MACH-TECH & INNOTECH Expo, 6–9 октомври 2026, София — отворете machtech.bg в нов раздел"
            : "MACH-TECH & INNOTECH Expo, 6–9 October 2026, Sofia — open machtech.bg in a new tab";

    /** White logo/info card, as in the export (11.5×7 cqw, radius .3cqw). */
    const card = "flex-none bg-white rounded-[0.3cqw] flex items-center justify-center";

    return (
        <div className="w-full h-full" style={{ fontFamily: RUBIK }}>
            {/* ── Desktop: faithful 12:1 strip ─────────────────────── */}
            <div
                className="hidden md:flex relative w-full h-full items-center overflow-hidden"
                style={{
                    containerType: "inline-size",
                    backgroundColor: MT_GREEN,
                    gap: "1.4cqw",
                    padding: "0 2cqw",
                }}
            >
                {/* Whole-strip link underlay */}
                <a
                    href="https://machtech.bg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
                />

                <span className={card} style={{ width: "11.5cqw", height: "7cqw", padding: "0.5cqw 0.7cqw" }}>
                    <img
                        src="/banners/bamas-logo-card.webp"
                        alt="Bulgarian Additive Manufacturing Association"
                        className="block h-auto w-auto max-h-full max-w-full"
                        decoding="async"
                    />
                </span>

                <span className={card} style={{ width: "11.5cqw", height: "7cqw" }}>
                    <img
                        src="/banners/machtech-mark.webp"
                        alt="Machtech mark"
                        className="block w-auto"
                        style={{ height: "5.6cqw" }}
                        decoding="async"
                    />
                </span>

                <span className="block min-w-0 flex-1">
                    <span
                        className="block whitespace-nowrap uppercase text-white"
                        style={{ fontWeight: 700, letterSpacing: "0.02em", fontSize: "2.15cqw", lineHeight: 1.15 }}
                    >
                        Machtech &amp; Innotech Expo
                    </span>
                    <span
                        className="block whitespace-nowrap"
                        style={{ color: MT_OLIVE, fontWeight: 500, fontSize: "1.35cqw", lineHeight: 1.4, marginTop: "0.4cqw" }}
                    >
                        Щандова зона и кийноут сесия за 3Д принт индустрията · София
                    </span>
                </span>

                <span
                    className={`${card} flex-col whitespace-nowrap text-center`}
                    style={{ width: "11.5cqw", height: "7cqw" }}
                >
                    <span style={{ color: MT_ACCENT, fontWeight: 700, fontSize: "2.5cqw", lineHeight: 1.1 }}>
                        06-09
                    </span>
                    <span
                        className="uppercase"
                        style={{ color: MT_DARK, fontWeight: 700, fontSize: "1.05cqw", lineHeight: 1.4, letterSpacing: "0.03em" }}
                    >
                        Октомври 2026
                    </span>
                </span>

                <span className="relative z-[1] flex flex-none flex-col" style={{ gap: "0.55cqw" }}>
                    <a
                        href="https://machtech.bg/posetiteli/bileti/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center whitespace-nowrap text-center uppercase no-underline transition-colors duration-300 hover:!bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        style={{
                            width: "11.5cqw",
                            height: "7cqw",
                            backgroundColor: MT_DARK,
                            color: "#fff",
                            fontWeight: 700,
                            letterSpacing: "0.02em",
                            fontSize: "1.4cqw",
                            borderRadius: "0.3cqw",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = MT_ACCENT)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#fff")}
                    >
                        Купи билет
                    </a>
                </span>
            </div>

            {/* ── Mobile: stacked ─────────────────────────────────── */}
            <div
                className="md:hidden relative h-full flex flex-col justify-between"
                style={{ backgroundColor: MT_GREEN }}
            >
                <a
                    href="https://machtech.bg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="absolute inset-0 z-0"
                />

                <div className="px-4 pt-3">
                    <div
                        className="uppercase text-white whitespace-nowrap"
                        style={{ fontWeight: 700, letterSpacing: "0.02em", fontSize: "1.05rem", lineHeight: 1.15 }}
                    >
                        Machtech &amp; Innotech Expo
                    </div>
                    <div
                        className="text-[10px] leading-snug"
                        style={{ color: MT_OLIVE, fontWeight: 500 }}
                    >
                        Щандова зона и кийноут сесия за 3Д принт индустрията · София
                    </div>
                </div>

                <div className="relative z-[1] flex items-center justify-between gap-3 px-4 pb-3">
                    <div className="flex items-baseline gap-1.5 rounded bg-white px-2.5 py-1">
                        <span style={{ color: MT_ACCENT, fontWeight: 700, fontSize: "0.95rem", lineHeight: 1 }}>
                            06-09
                        </span>
                        <span
                            className="uppercase"
                            style={{ color: MT_DARK, fontWeight: 700, fontSize: "0.55rem", letterSpacing: "0.03em" }}
                        >
                            Октомври 2026
                        </span>
                    </div>
                    <a
                        href="https://machtech.bg/posetiteli/bileti/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded px-3 py-1.5 text-[11px] uppercase text-white no-underline"
                        style={{ backgroundColor: MT_DARK, fontWeight: 700, letterSpacing: "0.02em" }}
                    >
                        Купи билет
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MachTechBanner;
