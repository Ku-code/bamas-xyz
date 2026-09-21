import type { ReactNode } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
    Timeline,
    TimelineContent,
    TimelineDate,
    TimelineHeader,
    TimelineIndicator,
    TimelineItem,
    TimelineSeparator,
    TimelineTitle,
} from "@/components/reui/timeline";
import { cn } from "@/lib/utils";
import { CheckIcon, CalendarClock, CircleIcon, Sparkles, ExternalLink, MapPin } from "lucide-react";

type Bi = { bg: string; en: string };

interface BamasEvent {
    key: string;
    /** ISO start date — drives past/upcoming split and schema.org markup */
    start: string;
    end?: string;
    date: Bi;
    title: Bi;
    place: Bi;
    desc: Bi;
    url?: string;
    badge?: Bi;
    /** the big annual event gets the branded card + CTA */
    flagship?: boolean;
    /** schema.org Event markup for search engines (upcoming events only) */
    schemaLocation?: { name: string; locality: string; country: string };
    organizer?: string;
}

/**
 * One chronological timeline of every important BAMAS event — founding
 * history through this season's fairs (incl. Formnext Frankfurt). Built on
 * the ReUI timeline primitives (components/reui/timeline). Content is
 * inline-bilingual like the rest of the homepage data blocks.
 */
const EVENTS: BamasEvent[] = [
    {
        key: "vision",
        start: "2025-07-02",
        date: { bg: "2 юли 2025", en: "2 July 2025" },
        title: { bg: "Първа среща за визия", en: "Initial Vision Meeting" },
        place: { bg: "Capital Fort, София", en: "Capital Fort, Sofia" },
        desc: {
            bg: "Първа среща за установяване на основната идея на асоциацията.",
            en: "First meeting for establishing the core idea of the association.",
        },
    },
    {
        key: "foundation",
        start: "2025-11-05",
        date: { bg: "5 ноември 2025", en: "5 November 2025" },
        title: { bg: "Официално учредително събрание", en: "Official Foundation Assembly" },
        place: { bg: "Resonator, София", en: "Resonator, Sofia" },
        desc: {
            bg: "Официално събрание на Управителния съвет за учредяване на БАЗАП.",
            en: "Official Board Assembly for establishing BAMAS.",
        },
        badge: { bg: "Основаване", en: "Founded" },
    },
    {
        key: "kickoff",
        start: "2026-01-26",
        date: { bg: "26 януари 2026", en: "26 January 2026" },
        title: { bg: "Годишно откриване 2026", en: "2026 Annual Kick-off" },
        place: { bg: "Resonator, София", en: "Resonator, Sofia" },
        desc: {
            bg: "Първа стратегическа среща за пътната карта през 2026 г.",
            en: "First strategic meeting for the 2026 roadmap.",
        },
    },
    {
        key: "applications",
        start: "2026-02-18",
        date: { bg: "18 февруари 2026", en: "18 February 2026" },
        title: { bg: "Отворени заявления за членство", en: "Membership Applications Open" },
        place: { bg: "Онлайн — bamas.xyz", en: "Online — bamas.xyz" },
        desc: {
            bg: "БАЗАП отваря официално приема на нови членове — компании, институции и физически лица.",
            en: "BAMAS officially opens membership intake — companies, institutions and individuals.",
        },
    },
    {
        key: "additive-days",
        start: "2027",
        date: { bg: "2027 · датата предстои", en: "2027 · date TBA" },
        title: { bg: "Additive Days — V издание", en: "Additive Days — V Edition" },
        place: { bg: "Мястото предстои", en: "Venue TBA" },
        desc: {
            bg: "Петото издание предстои през 2027 г.; ранният списък за интерес е отворен.",
            en: "The fifth edition is coming in 2027; the early-interest list is open.",
        },
        url: "https://additivedays.com/",
        badge: { bg: "Ранен списък", en: "Early bird" },
        organizer: "B2N",
    },
    {
        key: "board-september",
        start: "2026-09-25",
        date: { bg: "Септември 2026 · очаквайте дата", en: "September 2026 · date TBA" },
        title: { bg: "Общо събрание", en: "Board Assembly" },
        place: { bg: "Онлайн", en: "Online" },
        desc: {
            bg: "Преглед на стратегическите цели с всички членове — онлайн формат.",
            en: "Review of strategic goals with all members — held online.",
        },
    },
    {
        key: "mach-tech",
        start: "2026-10-06",
        end: "2026-10-09",
        date: { bg: "6–9 октомври 2026", en: "6–9 October 2026" },
        title: { bg: "MACH-TECH & INNOTECH Expo 2026", en: "MACH-TECH & INNOTECH Expo 2026" },
        place: { bg: "Интер Експо Център, София", en: "Inter Expo Center, Sofia" },
        desc: {
            bg: "Щанд и кийноут сесия на БАЗАП на водещото индустриално изложение в България.",
            en: "BAMAS booth and keynote session at Bulgaria's leading industrial expo.",
        },
        url: "https://machtech.bg/",
        badge: { bg: "Кийноут на БАЗАП", en: "BAMAS keynote" },
        schemaLocation: { name: "Inter Expo Center", locality: "Sofia", country: "BG" },
    },
    {
        key: "epma",
        start: "2026-10-11",
        end: "2026-10-14",
        date: { bg: "11–14 октомври 2026", en: "11–14 October 2026" },
        title: { bg: "EPMA Powder Metallurgy Congress 2026", en: "EPMA Powder Metallurgy Congress 2026" },
        place: { bg: "Будапеща, Унгария", en: "Budapest, Hungary" },
        desc: {
            bg: "Европейски конгрес и изложение за прахова металургия, организирани от партньора ни EPMA.",
            en: "European powder metallurgy congress and exhibition, organized by our partner EPMA.",
        },
        url: "https://www.powdermetallurgycongress.com/",
        badge: { bg: "Партньор", en: "Partner event" },
        schemaLocation: { name: "Budapest", locality: "Budapest", country: "HU" },
        organizer: "EPMA",
    },
    {
        key: "formnext",
        start: "2026-11-17",
        end: "2026-11-20",
        date: { bg: "17–20 ноември 2026", en: "17–20 November 2026" },
        title: { bg: "Formnext 2026", en: "Formnext 2026" },
        place: { bg: "Messe Frankfurt, Франкфурт, Германия", en: "Messe Frankfurt, Frankfurt, Germany" },
        desc: {
            bg: "Водещото световно изложение за адитивно производство — срещнете общността на БАЗАП във Франкфурт.",
            en: "The world's leading additive manufacturing trade fair — meet the BAMAS community in Frankfurt.",
        },
        url: "https://formnext.mesago.com/frankfurt/en.html",
        badge: { bg: "Международно", en: "International" },
        schemaLocation: { name: "Messe Frankfurt", locality: "Frankfurt am Main", country: "DE" },
        organizer: "Mesago Messe Frankfurt",
    },
    {
        key: "conference",
        start: "2026-11-30",
        date: { bg: "Ноември 2026 · очаквайте дата", en: "November 2026 · date TBA" },
        title: { bg: "БАЗАП Конференция и Общо събрание", en: "BAMAS Conference & General Assembly" },
        place: { bg: "София, България", en: "Sofia, Bulgaria" },
        desc: {
            bg: "Основното годишно събитие за всички членове на асоциацията.",
            en: "The premier annual event for all members of the association.",
        },
        flagship: true,
    },
].sort((a, b) => a.start.localeCompare(b.start));

const TODAY_SPLIT = () => {
    const today = new Date().toISOString().slice(0, 10);
    return EVENTS.filter((ev) => (ev.end ?? ev.start) < today).length;
};

const EventsTimeline = () => {
    const { language } = useLanguage();
    const bg = language === "bg";
    const pastCount = TODAY_SPLIT();

    const schemaEvents = EVENTS.filter((ev, i) => i >= pastCount && ev.schemaLocation).map((ev) => ({
        "@context": "https://schema.org",
        "@type": "Event",
        name: ev.title.en,
        startDate: ev.start,
        ...(ev.end ? { endDate: ev.end } : {}),
        location: {
            "@type": "Place",
            name: ev.schemaLocation!.name,
            address: {
                "@type": "PostalAddress",
                addressLocality: ev.schemaLocation!.locality,
                addressCountry: ev.schemaLocation!.country,
            },
        },
        ...(ev.url ? { url: ev.url } : {}),
        ...(ev.organizer ? { organizer: { "@type": "Organization", name: ev.organizer } } : {}),
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    }));

    return (
        <div className="max-w-2xl mx-auto animate-on-scroll transition-all duration-700 ease-out">
            <Timeline value={pastCount} className="w-full">
                {EVENTS.map((ev, i) => {
                    const isPast = i < pastCount;
                    const isNext = i === pastCount;
                    const items: ReactNode[] = [];

                    // Chip splitting history from what's ahead
                    if (isNext) {
                        items.push(
                            <div key="upcoming-chip" className="relative flex justify-center py-3">
                                <span className="bg-primary/5 text-primary px-3 py-0.5 rounded-full text-[10px] font-bold border border-primary/10 backdrop-blur-sm uppercase tracking-widest">
                                    {bg ? "Предстоящи" : "Upcoming"}
                                </span>
                            </div>
                        );
                    }

                    const card = (
                        <div
                            className={cn(
                                "rounded-lg border p-4 transition-colors",
                                ev.flagship
                                    ? "border-none bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground shadow-lg"
                                    : isPast
                                        ? "bg-background/50 border-border/50 hover:border-primary/20"
                                        : "bg-primary/5 border-primary/20 shadow-sm hover:border-primary/40"
                            )}
                        >
                            <div className="flex flex-wrap items-center gap-2">
                                <TimelineTitle
                                    className={cn(
                                        "text-sm font-extrabold",
                                        ev.flagship ? "text-primary-foreground text-base" : isPast ? "text-foreground/80" : "text-foreground"
                                    )}
                                >
                                    {bg ? ev.title.bg : ev.title.en}
                                </TimelineTitle>
                                {isNext && (
                                    <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-primary-foreground">
                                        {bg ? "Следващо" : "Next up"}
                                    </span>
                                )}
                                {ev.badge && !isNext && (
                                    <span
                                        className={cn(
                                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest",
                                            ev.flagship
                                                ? "bg-primary-foreground/20 text-primary-foreground"
                                                : "bg-primary/10 text-primary"
                                        )}
                                    >
                                        {bg ? ev.badge.bg : ev.badge.en}
                                    </span>
                                )}
                                {ev.url && (
                                    <ExternalLink className={cn("ml-auto h-3.5 w-3.5 shrink-0", ev.flagship ? "opacity-80" : "text-primary/60")} />
                                )}
                            </div>
                            <p className={cn("mt-1 flex items-center gap-1 text-xs", ev.flagship ? "opacity-90" : "text-muted-foreground")}>
                                <MapPin className="h-3 w-3 shrink-0" />
                                {bg ? ev.place.bg : ev.place.en}
                            </p>
                            <TimelineContent className={cn("mt-1.5 text-xs", ev.flagship && "text-primary-foreground/90")}>
                                {bg ? ev.desc.bg : ev.desc.en}
                            </TimelineContent>
                            {ev.flagship && (
                                <Button
                                    size="sm"
                                    className="mt-3 h-8 bg-background px-4 text-[10px] font-bold text-primary hover:bg-background/90"
                                    asChild
                                >
                                    <a href="#contact">{bg ? "Заявка за интерес" : "Register interest"}</a>
                                </Button>
                            )}
                        </div>
                    );

                    items.push(
                        <TimelineItem key={ev.key} step={i + 1}>
                            <TimelineHeader>
                                <TimelineSeparator className={cn(isPast ? "bg-primary/30" : "bg-border")} />
                                <TimelineDate
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-widest",
                                        isPast ? "text-muted-foreground" : "text-primary"
                                    )}
                                >
                                    {bg ? ev.date.bg : ev.date.en}
                                </TimelineDate>
                                <TimelineIndicator
                                    className={cn(
                                        "flex size-6 items-center justify-center border-none",
                                        ev.flagship
                                            ? "bg-primary text-primary-foreground shadow-md"
                                            : isPast
                                                ? "bg-muted text-muted-foreground"
                                                : isNext
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-primary/15 text-primary"
                                    )}
                                >
                                    {ev.flagship ? (
                                        <Sparkles className="size-3.5" />
                                    ) : isPast ? (
                                        <CheckIcon className="size-3.5" />
                                    ) : isNext ? (
                                        <CalendarClock className="size-3.5" />
                                    ) : (
                                        <CircleIcon className="size-3" />
                                    )}
                                </TimelineIndicator>
                            </TimelineHeader>
                            {ev.url ? (
                                <a href={ev.url} target="_blank" rel="noopener noreferrer" className="mt-1.5 block group">
                                    {card}
                                </a>
                            ) : (
                                <div className="mt-1.5">{card}</div>
                            )}
                        </TimelineItem>
                    );
                    return items;
                })}
            </Timeline>

            {/* Rich-result markup for the upcoming public events */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaEvents) }} />
        </div>
    );
};

export default EventsTimeline;
