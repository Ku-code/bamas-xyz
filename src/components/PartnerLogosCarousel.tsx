import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Partner {
  logo: string;
  name: string;
  url: string;
  hasWhiteBackground?: boolean;
  subtext?: string;
}

// Partner logos with their website URLs
const PARTNERS: Partner[] = [
  {
    logo: "/partnerlogos/WAATERS-Logo.svg",
    name: "WAATERS",
    url: "https://waaters.org/",
    subtext: "UK Official Partner",
  },
  {
    logo: "/partnerlogos/addliancelogo.png",
    name: "Addliance",
    url: "https://addliance.eu/",
  },
  {
    logo: "/partnerlogos/IndustryInfo_logo.png",
    name: "IndustryInfo",
    url: "https://industryinfo.bg/",
    hasWhiteBackground: true,
    subtext: "Media Partner",
  },
  {
    logo: "/partnerlogos/8cell_logo.png",
    name: "8Cell",
    url: "https://8cell.bg/",
  },
  {
    logo: "/partnerlogos/B2N_logo.jpg",
    name: "B2N",
    url: "https://b2n.bg/",
  },
  {
    logo: "/partnerlogos/01_HabitAdd_Logo_RGB.png",
    name: "HabitAdd",
    url: "https://habitadd.bg/en/",
  },
  {
    logo: "/partnerlogos/GreMa3D_Blue.png",
    name: "GreMa3D",
    url: "https://www.grema3d.bg/bg/",
  },
  {
    logo: "/partnerlogos/3Dbgprint_logo.png",
    name: "3DBGPrint",
    url: "https://3dbgprint.com/",
  },
  {
    logo: "/partnerlogos/edufacturing_logo.jpeg",
    name: "EduFacturing",
    url: "https://edufacturing.com/en/home/",
  },
  {
    logo: "/partnerlogos/parai_logo.png",
    name: "Parai",
    url: "https://para.expert/",
  },
  {
    logo: "/partnerlogos/solidfill_logo.jpg",
    name: "SolidFill",
    url: "https://solidfill.com/en/home-en/",
  },
  {
    logo: "/partnerlogos/3dopendesign_logo.png",
    name: "3D Open Design",
    url: "https://www.3dopendesign.com/",
  },
  {
    logo: "/partnerlogos/3dprintx_logo.png",
    name: "3D PrintX",
    url: "https://3dprintx.bg/",
  },
  {
    logo: "/partnerlogos/resonator_logo.png",
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
    name: "Buildplatez",
    url: "https://buildplatez.com/",
  },
  {
    logo: "/partnerlogos/3Druck Logo.png",
    name: "3Druck.com",
    url: "https://3druck.com/",
  },
];

// Duplicate partners for seamless infinite loop
const INFINITE_PARTNERS = [...PARTNERS, ...PARTNERS, ...PARTNERS];

const PartnerLogosCarousel = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

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

      // Continuous scroll to the right (faster: 2px per frame instead of 1px)
      container.scrollBy({
        left: 2,
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

  const renderLogo = (partner: Partner, key: string) => (
    <a
      key={key}
      href={partner.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex-shrink-0 flex items-center justify-center h-52 w-96 hover:opacity-80 transition-opacity duration-300 group cursor-pointer"
    >
      {partner.hasWhiteBackground ? (
        <div className="h-40 w-96 flex flex-col items-center justify-center bg-white rounded-lg p-4 shadow-sm">
          <img
            src={partner.logo}
            alt={`${partner.name} Logo`}
            className="h-auto w-auto object-contain max-h-28 max-w-full"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              console.error(`Failed to load logo: ${partner.logo}`);
            }}
          />
          {partner.subtext && (
            <p className="text-xs font-extrabold text-gray-700 mt-2 text-center uppercase tracking-wider">
              {partner.subtext}
            </p>
          )}
        </div>
      ) : (
        <div className="h-52 w-96 flex flex-col items-center justify-center bg-card/50 rounded-lg p-6 shadow-sm border border-white/5">
          <img
            src={partner.logo}
            alt={`${partner.name} Logo`}
            className="h-auto w-auto object-contain max-h-36 max-w-full opacity-90 group-hover:opacity-100 transition-opacity"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              console.error(`Failed to load logo: ${partner.logo}`);
            }}
          />
          {partner.subtext && (
            <p className="text-xs font-black text-primary mt-4 text-center uppercase tracking-widest">
              {partner.subtext}
            </p>
          )}
        </div>
      )}
    </a>
  );

  return (
    <div className="relative w-full py-8">
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
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
        {canScrollRight && (
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
      </div>
    </div>
  );
};

export default PartnerLogosCarousel;
