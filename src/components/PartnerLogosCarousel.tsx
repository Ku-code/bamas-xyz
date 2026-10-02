import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useLanguage } from "@/contexts/LanguageContext";

interface Partner {
  logo: string;
  name: string;
  url: string;
  hasWhiteBackground?: boolean;
  subtext?: string | { bg: string; en: string };
  logoDark?: string;
}

// Partner logos with their website URLs
const PARTNERS: Partner[] = [
  {
    logo: "/partnerlogos/clap-bas.webp",
    name: "Central Laboratory of Applied Physics – BAS",
    url: "https://www.clap-bas.com/",
    hasWhiteBackground: true,
    subtext: { bg: "Нов член на БАЗАП", en: "New BAMAS Member" },
  },
  {
    logo: "/partnerlogos/WAATERS-Logo.svg",
    name: "WAATERS",
    url: "https://waaters.org/",
    subtext: "UK Official Partner",
  },
  {
    logo: "/partnerlogos/addliancelogo.webp",
    name: "Addliance",
    url: "https://addliance.eu/",
  },
  {
    logo: "/partnerlogos/IndustryInfo_logo.webp",
    name: "IndustryInfo",
    url: "https://industryinfo.bg/",
    hasWhiteBackground: true,
    subtext: "Media Partner",
  },
  {
    logo: "/partnerlogos/8cell_logo.webp",
    name: "8Cell",
    url: "https://8cell.bg/",
  },
  {
    logo: "/partnerlogos/B2N_logo.webp",
    name: "B2N",
    url: "https://b2n.bg/",
    hasWhiteBackground: true,
  },
  {
    logo: "/partnerlogos/01_HabitAdd_Logo_RGB.webp",
    name: "HabitAdd",
    url: "https://habitadd.bg/en/",
  },
  {
    logo: "/partnerlogos/GreMa3D_Blue.webp",
    name: "GreMa3D",
    url: "https://www.grema3d.bg/bg/",
  },
  {
    logo: "/partnerlogos/3Dbgprint_logo.webp",
    name: "3DBGPrint",
    url: "https://3dbgprint.com/",
  },
  {
    logo: "/partnerlogos/edufacturing_logo.webp",
    name: "EduFacturing",
    url: "https://edufacturing.com/en/home/",
    hasWhiteBackground: true,
  },
  {
    logo: "/partnerlogos/parai_logo.webp",
    name: "Parai",
    url: "https://para.expert/",
  },
  {
    logo: "/partnerlogos/solidfill_logo.webp",
    name: "SolidFill",
    url: "https://solidfill.com/en/home-en/",
    hasWhiteBackground: true,
  },
  {
    logo: "/partnerlogos/3dopendesign_logo.webp",
    name: "3D Open Design",
    url: "https://www.3dopendesign.com/",
  },
  {
    logo: "/partnerlogos/3dprintx_logo.webp",
    name: "3D PrintX",
    url: "https://3dprintx.bg/",
    hasWhiteBackground: true,
  },
  {
    logo: "/partnerlogos/resonator_logo.webp",
    name: "Resonator",
    url: "https://www.rsntr.com/",
  },
  {
    logo: "/partnerlogos/experify logo.svg",
    name: "Experify",
    url: "https://experify3d.com/",
  },
  {
    logo: "/partnerlogos/buildplatez.svg",
    logoDark: "/partnerlogos/buildplatez-white.svg",
    name: "Buildplatez",
    url: "https://buildplatez.com/",
  },
  {
    logo: "/partnerlogos/3Druck Logo.webp",
    name: "3Druck.com",
    url: "https://3druck.com/",
  },
  {
    logo: "/partnerlogos/epma logo.webp",
    name: "EPMA",
    url: "https://www.epma.com/",
    hasWhiteBackground: true,
  },
  {
    logo: "/partnerlogos/Betma Logo.webp",
    name: "BETMA",
    url: "https://www.betma.eu/",
    logoDark: "/partnerlogos/Betma Logo white.webp",
  },
  {
    logo: "/partnerlogos/peri-logo.webp",
    name: "PERI Bulgaria",
    url: "https://www.peri.bg/",
    hasWhiteBackground: true,
  },
  {
    logo: "/partnerlogos/concreef_logo.webp",
    logoDark: "/partnerlogos/concreef_logo_white.webp",
    name: "CONCREEF",
    url: "https://www.concreef.eu/",
  },
  {
    // Supplied as white artwork on the brand blue; both variants are that same
    // artwork with the coverage recovered as alpha, so neither theme needs a plate.
    logo: "/partnerlogos/interexpocenter.webp",
    logoDark: "/partnerlogos/interexpocenter-white.webp",
    name: "Inter Expo Center",
    url: "https://iec.bg/",
  },
];

// Duplicate partners for seamless infinite loop
const INFINITE_PARTNERS = [...PARTNERS, ...PARTNERS, ...PARTNERS];

const PartnerLogosCarousel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { resolvedTheme } = useTheme();
  const { language } = useLanguage();

  // Check scroll position
  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Infinite auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || !isAutoScrolling) return;

    const container = scrollContainerRef.current;
    let scrollInterval: NodeJS.Timeout;
    const singleSetWidth = PARTNERS.length * (384 + 48); // w-96 (384px) + gap-12 (48px) per logo

    const autoScroll = () => {
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;

      // If we've scrolled past the first set, reset to beginning seamlessly
      if (scrollLeft >= singleSetWidth) {
        container.scrollLeft = scrollLeft - singleSetWidth;
      }

      // Continuous scroll to the right (4px per 10ms tick)
      container.scrollBy({
        left: 4,
        behavior: "auto", // Use auto for smoother infinite scroll
      });
    };

    // Faster: 10ms interval instead of 20ms
    scrollInterval = setInterval(autoScroll, 10);

    return () => clearInterval(scrollInterval);
  }, [isAutoScrolling]);

  // Check scroll position on mount and scroll events
  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    setIsAutoScrolling(false); // Pause auto-scroll when user manually scrolls

    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });

    // Resume auto-scroll after 5 seconds
    setTimeout(() => setIsAutoScrolling(true), 5000);
  };

  const renderLogo = (partner: Partner, key: string, compact = false) => {
    const logoSrc = partner.logoDark && resolvedTheme === "dark" ? partner.logoDark : partner.logo;
    return (
    <a
      key={key}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${partner.name} — ${partner.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}`}
      className={`flex items-center justify-center hover:opacity-80 transition-opacity duration-300 group cursor-pointer ${
        compact ? "h-36 w-full" : "flex-shrink-0 h-52 w-96"
      }`}
    >
      {partner.hasWhiteBackground ? (
        /* Dark artwork needs a light plate to stay readable on the dark
           theme — kept as a snug chip around the logo, not a full card. */
        <div className="flex flex-col items-center justify-center">
          <div className={`inline-flex items-center justify-center rounded-xl bg-white ${compact ? "px-4 py-2.5" : "px-6 py-4"}`}>
            <img
              src={logoSrc}
              alt={`${partner.name} Logo`}
              className={`h-auto w-auto object-contain ${compact ? "max-h-16 max-w-[180px]" : "max-h-24 max-w-[280px]"}`}
              loading="lazy"
              decoding="async"
              onError={(e) => {
                console.error(`Failed to load logo: ${partner.logo}`);
              }}
            />
          </div>
          {partner.subtext && (
            <p className="text-xs font-black text-primary mt-3 text-center uppercase tracking-widest">
              {typeof partner.subtext === "string" ? partner.subtext : partner.subtext[language]}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <img
            src={logoSrc}
            alt={`${partner.name} Logo`}
            className={`h-auto w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${compact ? "max-h-20 max-w-[200px]" : "max-h-36 max-w-[320px]"}`}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              console.error(`Failed to load logo: ${partner.logo}`);
            }}
          />
          {partner.subtext && (
            <p className="text-xs font-black text-primary mt-4 text-center uppercase tracking-widest">
              {typeof partner.subtext === "string" ? partner.subtext : partner.subtext[language]}
            </p>
          )}
        </div>
      )}
    </a>
    );
  };

  return (
    <div className="relative w-full py-8">
      <div className="relative">
        {/* Left scroll button */}
        {!showAll && canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}

        {/* Right scroll button */}
        {!showAll && canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg hover:bg-background"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}

        {/* Scrollable container with infinite loop */}
        {!showAll && (
          <div
            ref={scrollContainerRef}
            className="flex gap-12 overflow-x-auto scrollbar-hide px-16 py-8"
            onMouseEnter={() => setIsAutoScrolling(false)}
            onMouseLeave={() => setIsAutoScrolling(true)}
          >
            {INFINITE_PARTNERS.map((partner, index) =>
              renderLogo(partner, `${partner.name}-${index}`)
            )}
          </div>
        )}

        {/* Static all-partners grid */}
        {showAll && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-8 sm:grid-cols-3 lg:grid-cols-4">
            {PARTNERS.map((partner) => renderLogo(partner, `grid-${partner.name}`, true))}
          </div>
        )}
      </div>

      {/* Expand / collapse */}
      <div className="mt-2 flex justify-center">
        <Button
          variant="outline"
          onClick={() => {
            setShowAll((v) => {
              const next = !v;
              setIsAutoScrolling(!next);
              return next;
            });
          }}
          className="gap-2 rounded-full border-primary/30 px-6 font-semibold hover:border-primary/60 hover:bg-primary/10"
        >
          {showAll
            ? (language === "bg" ? "Скрий" : "Collapse")
            : (language === "bg" ? `Виж всички (${PARTNERS.length})` : `View all (${PARTNERS.length})`)}
          {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default PartnerLogosCarousel;
