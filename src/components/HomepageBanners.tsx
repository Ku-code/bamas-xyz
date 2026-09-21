import { useState } from "react";
import { Box, ChevronLeft, ChevronRight, Drone, Factory, Layers3, Newspaper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import "./homepage-banners.css";

const banners = [
  { id: "machtech", title: "MachTech & InnoTech Expo 2026", short: "MachTech", icon: Factory,
    bg: "#BCCE1E", fg: "#171B00", date: { bg: "6–9 октомври 2026", en: "6–9 October 2026" },
    description: { bg: "Интер Експо Център, София. Открийте участието и презентациите на БАЗАП.", en: "Inter Expo Center, Sofia. Explore BAMAS participation and presentations." },
    href: "#machtech-programme", cta: { bg: "Вижте програмата", en: "View programme" } },
  { id: "drone", title: "Inter Drone Expo 2026", short: "Drone Expo", icon: Drone,
    bg: "#D2D8BF", fg: "#142D35", date: { bg: "6–9 октомври 2026", en: "6–9 October 2026" },
    description: { bg: "Безпилотни технологии в Интер Експо Център, София.", en: "Unmanned technologies at Inter Expo Center, Sofia." },
    href: "https://interdroneexpo.bg/online-ticket/", cta: { bg: "Научете повече", en: "Learn more" } },
  { id: "industry", title: "IndustryInfo.bg", short: "IndustryInfo", icon: Newspaper,
    bg: "#052E40", fg: "#FFFFFF", date: { bg: "Медиен партньор", en: "Media partner" },
    description: { bg: "Новини, технологии и компании от българската индустрия.", en: "News, technology and companies from Bulgarian industry." },
    href: "https://industryinfo.bg/", cta: { bg: "Прочетете новините", en: "Read the news" } },
  { id: "europm", title: "Euro PM2026", short: "Euro PM2026", icon: Layers3,
    bg: "#173B43", fg: "#FFFFFF", date: { bg: "11–14 октомври 2026", en: "11–14 October 2026" },
    description: { bg: "Конгрес и изложение за прахова металургия. Будапеща, Унгария.", en: "Powder metallurgy congress and exhibition. Budapest, Hungary." },
    href: "https://www.europm2026.com/", cta: { bg: "Научете повече", en: "Learn more" } },
  { id: "additive", title: "Additive Days 2027", short: "Additive Days", icon: Box,
    bg: "#F4D328", fg: "#000000", date: { bg: "Пето издание", en: "Fifth edition" },
    description: { bg: "Датите и мястото предстои да бъдат обявени.", en: "Dates and venue to be announced." },
    href: "https://additivedays.com/", cta: { bg: "Следете новостите", en: "Follow updates" } },
];

export default function HomepageBanners() {
  const { language } = useLanguage();
  const [active, setActive] = useState(0);
  const banner = banners[active];
  const Icon = banner.icon;
  const bg = language === "bg";
  const change = (index: number) => setActive((index + banners.length) % banners.length);

  return (
    <section className="homepage-banners" aria-label={bg ? "Събития и партньори" : "Events and partners"} aria-roledescription="carousel">
      <div className="homepage-banner" style={{ backgroundColor: banner.bg, color: banner.fg }}>
        <article className="homepage-banner-inner" aria-live="polite" aria-atomic="true" aria-label={banner.title}>
          <div className="homepage-banner-copy">
            <p className="homepage-banner-date">{banner.date[language]}</p>
            <h2>{banner.title}</h2>
            <p className="homepage-banner-description">{banner.description[language]}</p>
            <a className="homepage-banner-cta" href={banner.href}
              {...(banner.href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {banner.cta[language]}
              <ChevronRight aria-hidden="true" size={20} />
            </a>
          </div>
          <div className="homepage-banner-art" aria-hidden="true">
            <div className="homepage-banner-emblem"><Icon strokeWidth={1.25} /></div>
            <span>{banner.short}</span>
          </div>
        </article>
      </div>
      <nav className="homepage-banner-controls" aria-label={bg ? "Навигация на банерите" : "Banner navigation"}>
        <button type="button" onClick={() => change(active - 1)} aria-label={bg ? "Предишен банер" : "Previous banner"}><ChevronLeft aria-hidden="true" /></button>
        <div className="homepage-banner-dots">
          {banners.map((item, index) => <button key={item.id} type="button" onClick={() => change(index)}
            aria-label={`${bg ? "Банер" : "Banner"} ${index + 1}: ${item.short}`} aria-current={active === index ? "true" : undefined}>
            <span />
          </button>)}
        </div>
        <button type="button" onClick={() => change(active + 1)} aria-label={bg ? "Следващ банер" : "Next banner"}><ChevronRight aria-hidden="true" /></button>
      </nav>
    </section>
  );
}
