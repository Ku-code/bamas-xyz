import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const EVENT_URL = "https://formnext.mesago.com/frankfurt/en/expo.html";
const NAVY = "#00567A";
const CYAN = "#008BC3";
const MAGENTA = "#D50057";

const FormnextBanner = () => {
  const { language } = useLanguage();
  const bg = language === "bg";
  const label = bg
    ? "Formnext 2026, 17–20 ноември, Франкфурт — отваря официалния сайт в нов раздел"
    : "Formnext 2026, 17–20 November, Frankfurt — opens the official website in a new tab";

  return (
    <div className="h-full w-full bg-white">
      <a
        href={EVENT_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="group block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#D50057]"
      >
        <div className="relative hidden h-full w-full overflow-hidden md:block" style={{ containerType: "inline-size" }}>
          <div className="absolute inset-y-0 left-0 w-[29%]" style={{ backgroundColor: NAVY }}>
            <div className="absolute right-[7%] top-[15%] font-sans text-[4.2cqw] font-black leading-none tracking-[-0.07em] text-white">
              formnext
            </div>
            <div className="absolute bottom-[16%] left-[10%] text-[0.95cqw] font-bold text-white/80">
              Hub for Additive Manufacturing
            </div>
          </div>

          <div className="absolute inset-y-0 left-[29%] w-[46%] bg-white px-[3.2cqw] py-[1.3cqw] text-[#272727]">
            <p className="text-[1.05cqw] font-semibold leading-none text-[#5B5B5B]">Frankfurt am Main</p>
            <p className="mt-[0.65cqw] text-[2.45cqw] font-black leading-[0.95] tracking-[-0.045em]">
              17–20 November 2026
            </p>
            <p className="mt-[0.55cqw] max-w-[38cqw] text-[1.05cqw] font-medium leading-snug text-[#4A4A4A]">
              {bg ? "Водещата европейска среща за индустриален 3D печат" : "Europe’s leading meeting point for industrial 3D printing"}
            </p>
          </div>

          <div className="absolute inset-y-0 right-0 w-[25%]" style={{ backgroundColor: CYAN }}>
            <div className="absolute left-0 top-0 h-[34%] w-[38%]" style={{ backgroundColor: MAGENTA }} />
            <div className="absolute right-[8%] top-[14%] text-right text-[0.92cqw] font-bold leading-tight text-white">
              EXPO<br />&amp; CONVENTION
            </div>
            <div className="absolute bottom-[16%] left-[10%] flex items-center gap-[0.65cqw] text-[1.1cqw] font-black text-white">
              {bg ? "Виж програмата" : "Explore Formnext"}
              <ArrowUpRight className="h-[1.45cqw] w-[1.45cqw] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </div>
          </div>

          <div className="absolute bottom-0 left-[29%] h-[0.42cqw] w-[46%]" style={{ backgroundColor: MAGENTA }} />
        </div>

        <div className="grid h-full grid-cols-[1fr_1.2fr] overflow-hidden md:hidden">
          <div className="relative flex flex-col justify-between p-4 text-white" style={{ backgroundColor: NAVY }}>
            <span className="text-2xl font-black leading-none tracking-[-0.07em]">formnext</span>
            <span className="text-[10px] font-semibold text-white/70">Frankfurt · 17–20.11.2026</span>
          </div>
          <div className="relative flex flex-col justify-center bg-white px-4 pr-12 text-[#252525]">
            <span className="text-base font-black leading-tight">{bg ? "Индустриален 3D печат на световно ниво" : "Industrial 3D printing at global scale"}</span>
            <span className="mt-2 text-[10px] font-bold" style={{ color: CYAN }}>{bg ? "Виж програмата" : "Explore the programme"}</span>
            <span className="absolute inset-y-0 right-0 w-9" style={{ backgroundColor: CYAN }}>
              <span className="absolute right-0 top-0 h-8 w-5" style={{ backgroundColor: MAGENTA }} />
            </span>
          </div>
        </div>
      </a>
    </div>
  );
};

export default FormnextBanner;
