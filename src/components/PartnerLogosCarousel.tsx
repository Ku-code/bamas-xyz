import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Partner {
  logo: string;
  name: string;
  url: string;
  hasWhiteBackground?: boolean;
}

// Partner logos with their website URLs
const PARTNERS: Partner[] = [
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
];

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

  // Auto-scroll functionality
  useEffect(() => {
    if (!scrollContainerRef.current || !isAutoScrolling) return;

    const container = scrollContainerRef.current;
    let scrollInterval: NodeJS.Timeout;
    let scrollDirection = 1; // 1 for right, -1 for left

    const autoScroll = () => {
      if (!container) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft >= maxScroll - 5) {
        scrollDirection = -1; // Reverse direction
      } else if (scrollLeft <= 5) {
        scrollDirection = 1; // Reverse direction
      }

      container.scrollBy({
        left: scrollDirection * 1,
        behavior: "smooth",
      });
    };

    scrollInterval = setInterval(autoScroll, 20);

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

        {/* Scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-12 overflow-x-auto scrollbar-hide px-16 py-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onMouseEnter={() => setIsAutoScrolling(false)}
          onMouseLeave={() => setIsAutoScrolling(true)}
        >
          {PARTNERS.map((partner, index) => (
            <a
              key={index}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center justify-center h-56 w-96 hover:opacity-80 transition-opacity duration-300 group cursor-pointer"
            >
              {partner.hasWhiteBackground ? (
                <div
                  className="bg-white rounded-2xl p-8 flex items-center justify-center h-full w-full shadow-sm"
                  style={{
                    borderRadius: "1rem",
                  }}
                >
                  <img
                    src={partner.logo}
                    alt={`${partner.name} Logo`}
                    className="h-auto w-auto object-contain max-h-full max-w-full"
                    style={{
                      maxHeight: "144px",
                      maxWidth: "100%",
                      objectFit: "contain",
                    }}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      console.error(`Failed to load logo: ${partner.logo}`);
                    }}
                  />
                </div>
              ) : (
                <div className="h-52 w-96 flex items-center justify-center bg-card/50 rounded-lg p-6 border border-border/30">
                  <img
                    src={partner.logo}
                    alt={`${partner.name} Logo`}
                    className="h-auto w-auto object-contain max-h-44 max-w-full opacity-90 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      console.error(`Failed to load logo: ${partner.logo}`);
                    }}
                  />
                </div>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default PartnerLogosCarousel;
