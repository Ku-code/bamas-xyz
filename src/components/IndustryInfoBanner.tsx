import { useLanguage } from "@/contexts/LanguageContext";

/**
 * BAMAS × IndustryInfo.bg partnership banner (cube face 4).
 *
 * Ported from the supplied "BAMAS x IndustryInfo Banner.html" bundle: measured
 * off its 1920×160 design canvas, positions as percentages, type in `cqw`.
 * Uses Sofia Sans — the site's own face — so no new font is loaded.
 *
 * Layout: green/red accent stripe on the left edge; white zone with the BAMAS
 * logo, "in partnership with" cross divider, and the IndustryInfo.bg logo;
 * dark-teal zone (diagonal clip on its left edge) with faint circuit traces,
 * eyebrow, headline and an orange industryinfo.bg pill CTA. Whole strip links
 * to https://industryinfo.bg/. Below `md` it stacks.
 */

const TEAL_DEEP = "#052E40";
const GREEN = "#0C9D6A";
const RED = "#E62F29";
const MINT = "#5FE0AC";
const ORANGE = "#EE7203";

const W = 1920;
const H = 160;
const x = (px: number) => `${(px / W) * 100}%`;
const y = (px: number) => `${(px / H) * 100}%`;
const t = (px: number) => `${((px / W) * 100).toFixed(3)}cqw`;

/** Dark zone spans design x 850→1920 (width 1070), with a 66px diagonal cut. */
const DARK_LEFT = 850;
const DARK_W = W - DARK_LEFT;
/** left-% for children of the dark zone — their percentages resolve against
 *  the zone's own 1070-wide box, not the full canvas. */
const xd = (px: number) => `${((px - DARK_LEFT) / DARK_W) * 100}%`;

const IndustryInfoBanner = () => {
    const { language } = useLanguage();

    const label =
        language === "bg"
            ? "BAMAS в партньорство с IndustryInfo.bg — порталът на българската индустрия. Отворете industryinfo.bg в нов раздел"
            : "BAMAS in partnership with IndustryInfo.bg — the portal of Bulgarian industry. Open industryinfo.bg in a new tab";

    /** Faint circuit traces from the original, authored in the dark zone's own
     *  1070×160 coordinate space. */
    const circuits = (
        <svg
            viewBox="0 0 1070 160"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
        >
            <g stroke={MINT} fill="none" opacity="0.22" strokeWidth="2.5">
                <path d="M690 160 V104 L744 50 V-8" />
                <path d="M745 160 V118 L820 43 V-8" />
                <circle cx="690" cy="98" r="7" />
            </g>
            <g stroke={RED} fill="none" opacity="0.3" strokeWidth="2.5">
                <path d="M660 160 V120 L610 70 V38" />
                <circle cx="610" cy="32" r="7" />
            </g>
        </svg>
    );

    const darkBackground =
        `radial-gradient(700px 320px at 85% -40%, rgba(12,157,106,0.35), transparent 60%), ` +
        `linear-gradient(158deg, #063648 0%, ${TEAL_DEEP} 46%, #04222F 100%)`;

    return (
        <div className="w-full h-full">
            <a
                href="https://industryinfo.bg/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="group block w-full h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            >
                {/* ── Desktop: faithful 12:1 strip ─────────────────────── */}
                <div
                    className="hidden md:block relative w-full h-full overflow-hidden bg-white"
                    style={{ containerType: "inline-size" }}
                >
                    {/* Left accent stripe */}
                    <div
                        className="absolute inset-y-0 left-0"
                        style={{
                            width: x(10),
                            background: `linear-gradient(${GREEN} 0%, ${GREEN} 62%, ${RED} 62%, ${RED} 100%)`,
                        }}
                    />

                    {/* BAMAS logo */}
                    <img
                        src="/banners/bamas-logo-card.webp"
                        alt="Bulgarian Additive Manufacturing Association"
                        className="absolute object-contain"
                        style={{ left: x(46), top: y(30), width: x(244), height: y(98) }}
                        decoding="async"
                    />

                    {/* Partnership divider */}
                    <div className="absolute" style={{ left: x(315), top: y(46), width: x(125) }}>
                        <svg
                            viewBox="0 0 26 26"
                            aria-hidden="true"
                            className="mx-auto block"
                            style={{ width: t(26), height: t(26) }}
                        >
                            <path d="M13 2v8m0 6v8M2 13h8m6 0h8" stroke={GREEN} strokeWidth="3" strokeLinecap="round" />
                            <circle cx="13" cy="13" r="3.4" fill={RED} />
                        </svg>
                        <div
                            className="text-center uppercase"
                            style={{
                                marginTop: t(6),
                                fontSize: t(13),
                                fontWeight: 800,
                                letterSpacing: t(2.08),
                                lineHeight: 1.45,
                                color: "#5B6E76",
                            }}
                        >
                            In partnership with
                        </div>
                    </div>

                    {/* IndustryInfo logo */}
                    <img
                        src="/banners/industryinfo-logo.webp"
                        alt="IndustryInfo.bg — порталът на българската индустрия"
                        className="absolute object-contain"
                        style={{ left: x(466), top: y(41), width: x(311), height: y(80) }}
                        decoding="async"
                    />

                    {/* Dark zone with diagonal left edge */}
                    <div
                        className="absolute inset-y-0 right-0"
                        style={{
                            left: x(DARK_LEFT),
                            background: darkBackground,
                            clipPath: `polygon(${t(66)} 0, 100% 0, 100% 100%, 0 100%)`,
                        }}
                    >
                        {circuits}

                        {/* Eyebrow */}
                        <div
                            className="absolute flex items-center"
                            style={{ left: xd(946), top: y(43), gap: t(10) }}
                        >
                            <span
                                aria-hidden="true"
                                className="rounded-full"
                                style={{ width: t(8), height: t(8), backgroundColor: RED }}
                            />
                            <span
                                className="whitespace-nowrap uppercase"
                                style={{ fontSize: t(15), fontWeight: 800, letterSpacing: t(3.6), color: MINT }}
                            >
                                Порталът на българската индустрия
                            </span>
                        </div>

                        {/* Headline */}
                        <div
                            className="absolute whitespace-nowrap text-white"
                            style={{
                                left: xd(946),
                                top: y(66),
                                fontSize: t(44),
                                fontWeight: 900,
                                letterSpacing: t(-1.2),
                                lineHeight: 1,
                            }}
                        >
                            Stay Informed about the Industry
                        </div>

                        {/* CTA pill */}
                        <div
                            className="absolute flex items-center justify-center transition-colors duration-300 group-hover:brightness-110"
                            style={{
                                left: xd(1600),
                                top: y(48),
                                width: `${(274 / DARK_W) * 100}%`,
                                height: y(63),
                                backgroundColor: ORANGE,
                                borderRadius: t(40),
                                gap: t(12),
                            }}
                        >
                            <span
                                className="whitespace-nowrap uppercase text-white"
                                style={{ fontSize: t(19), fontWeight: 800, letterSpacing: t(1.14) }}
                            >
                                industryinfo.bg
                            </span>
                            <svg
                                viewBox="0 0 20 12"
                                aria-hidden="true"
                                className="transition-transform duration-300 group-hover:translate-x-0.5"
                                style={{ width: t(20), height: t(12) }}
                            >
                                <path d="M1 6h16M13 1.5 17.8 6 13 10.5" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* ── Mobile: stacked ─────────────────────────────────── */}
                <div className="md:hidden relative h-full flex flex-col justify-between overflow-hidden bg-white">
                    <div
                        className="absolute inset-y-0 left-0 w-1"
                        style={{ background: `linear-gradient(${GREEN} 0%, ${GREEN} 62%, ${RED} 62%, ${RED} 100%)` }}
                    />

                    <div className="flex items-center gap-3 px-4 pt-2.5">
                        <img
                            src="/banners/bamas-logo-card.webp"
                            alt="BAMAS"
                            className="h-9 w-auto object-contain"
                            decoding="async"
                        />
                        <span
                            className="text-[8px] uppercase leading-tight"
                            style={{ fontWeight: 800, letterSpacing: "0.16em", color: "#5B6E76" }}
                        >
                            In partnership with
                        </span>
                        <img
                            src="/banners/industryinfo-logo.webp"
                            alt="IndustryInfo.bg"
                            className="h-7 w-auto object-contain"
                            decoding="async"
                        />
                    </div>

                    <div
                        className="relative flex items-center justify-between gap-3 px-4 py-2"
                        style={{ background: darkBackground }}
                    >
                        {circuits}
                        <div className="relative min-w-0">
                            <div
                                className="truncate text-[8px] uppercase"
                                style={{ fontWeight: 800, letterSpacing: "0.2em", color: MINT }}
                            >
                                Порталът на българската индустрия
                            </div>
                            <div
                                className="truncate text-white"
                                style={{ fontSize: "0.95rem", fontWeight: 900, letterSpacing: "-0.02em" }}
                            >
                                Stay Informed about the Industry
                            </div>
                        </div>
                        <span
                            className="relative flex-shrink-0 rounded-full px-3 py-1.5 text-[10px] uppercase text-white"
                            style={{ backgroundColor: ORANGE, fontWeight: 800, letterSpacing: "0.06em" }}
                        >
                            industryinfo.bg →
                        </span>
                    </div>
                </div>
            </a>
        </div>
    );
};

export default IndustryInfoBanner;
