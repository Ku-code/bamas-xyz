import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight, CalendarDays, MapPin, Play, Ticket } from "lucide-react";

type Bi = { bg: string; en: string };

interface Talk {
  name: string;
  image?: string;
  date: string;
  day: string;
  time: string;
  title: string;
  role: Bi;
  summary: Bi;
  videos?: { href: string; label: Bi }[];
}

const talks: Talk[] = [
  {
    name: "Kenan Boz",
    image: "/speakers/machtech-2026/kenan-boz.webp",
    date: "2026-10-06",
    day: "6",
    time: "12:00–12:30",
    title: "A Global Outlook on Additive Manufacturing — from Today to Tomorrow",
    role: { bg: "Технически мениджър, EPMA", en: "Technical Manager, EPMA" },
    summary: {
      bg: "Световни тенденции, нови технологии, метална адитивна фабрикация, мултиматериални процеси, устойчивост и стандартизация.",
      en: "Global trends, emerging technologies, metal additive manufacturing, multi-material processes, sustainability and standardisation.",
    },
  },
  {
    name: "Georgi Chervendinev",
    image: "/speakers/machtech-2026/georgi-chervendinev.webp",
    date: "2026-10-08",
    day: "8",
    time: "12:00–12:30",
    title: "ARCTONIC — Endless Game of Design / Дизайнът като безкрайна игра",
    role: { bg: "Дизайнер, инженер и преподавател", en: "Designer, engineer and educator" },
    summary: {
      bg: "От дизайнерската концепция до реалната разработка чрез CAD, инженеринг, прототипиране и дигитално производство.",
      en: "From design concept to physical development through CAD, engineering, prototyping and digital manufacturing.",
    },
  },
  {
    name: "Han-Zu Haller",
    image: "/speakers/machtech-2026/han-zu-haller.webp",
    date: "2026-10-09",
    day: "9",
    time: "12:00–12:30",
    title: "Inert Printing in Open Atmosphere",
    role: {
      bg: "Chief Commercial Officer, LabAM24 Inc.",
      en: "Chief Commercial Officer, LabAM24 Inc.",
    },
    summary: {
      bg: "Нови възможности за металното адитивно производство чрез инертно принтиране в открита атмосфера.",
      en: "New possibilities for metal additive manufacturing through inert printing in an open atmosphere.",
    },
  },
  {
    name: "Ivan Petkov",
    image: "/speakers/machtech-2026/ivan-petkov.webp",
    date: "2026-10-09",
    day: "9",
    time: "12:45–13:15",
    title: "Automation in Action / Автоматизация в действие",
    role: {
      bg: "Мениджър продажби, отдел „Роботика“, Солтех ЕООД",
      en: "Sales Manager, Robotics Department, Soltec Ltd.",
    },
    summary: {
      bg: "Практически опит от реални производствени проекти — от идеята за автоматизация до избора на технология и работещо решение.",
      en: "Practical lessons from real manufacturing projects — from the first automation idea to technology selection and a working solution.",
    },
  },
  {
    name: "Petya Galinova",
    image: "/speakers/machtech-2026/petya-galinova.webp",
    date: "2026-10-09",
    day: "9",
    time: "15:45–16:00",
    title: "3D Printing of Houses / 3D принтиране на къщи",
    role: {
      bg: "Специален гост · PERI Construction Bulgaria",
      en: "Special guest · PERI Construction Bulgaria",
    },
    summary: {
      bg: "Кратко въведение в строителното 3D принтиране и практическото му приложение при изграждането на къщи.",
      en: "A short introduction to construction 3D printing and its practical application in building houses.",
    },
    videos: [
      {
        href: "https://youtu.be/BSDwU8MWFXA?si=2_FlQ3n0S82FeLQ2",
        label: { bg: "Видео 1", en: "Video 1" },
      },
      {
        href: "https://youtu.be/LRaANFFrhP4?si=LE0JqdeU44aKBHDc",
        label: { bg: "Видео 2", en: "Video 2" },
      },
    ],
  },
  {
    name: "Kuzo Donchev",
    image: "/speakers/machtech-2026/kuzo-donchev.webp",
    date: "2026-10-09",
    day: "9",
    time: "16:00–16:15",
    title: "AI Automation and Digital Fabrication",
    role: {
      bg: "Председател на БАЗАП · Основател и CEO, 3D OPEN DESIGN",
      en: "Chairman, BAMAS · Founder & CEO, 3D OPEN DESIGN",
    },
    summary: {
      bg: "Как AI, автоматизацията и дигиталната фабрикация свързват идеята, CAD процеса, производственото решение и физическия продукт.",
      en: "How AI, automation and digital fabrication connect the idea, CAD process, manufacturing decision and physical product.",
    },
  },
];

const eventPhase = () => {
  const today = new Date().toISOString().slice(0, 10);
  if (today < "2026-10-06") return "upcoming";
  if (today <= "2026-10-09") return "live";
  return "past";
};

export default function MachTechProgramme() {
  const { language } = useLanguage();
  const bg = language === "bg";
  const phase = eventPhase();
  const phaseLabel = phase === "live"
    ? bg ? "Провежда се сега" : "Happening now"
    : phase === "upcoming"
      ? bg ? "Следващото събитие на БАЗАП" : "BAMAS next event"
      : bg ? "Програма 2026" : "2026 programme";

  return (
    <section
      id="machtech-programme"
      aria-labelledby="machtech-programme-title"
      className="scroll-mt-24 border-y border-primary/15 bg-[linear-gradient(180deg,hsl(var(--primary)/.08),transparent_26%)] px-4 py-14 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-primary px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-primary-foreground">{phaseLabel}</span>
            <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-primary">
              <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4" />6–9 {bg ? "октомври" : "October"} 2026</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" />{bg ? "Интер Експо Център · Зала 5" : "Inter Expo Center · Hall 5"}</span>
            </p>
            <h2 id="machtech-programme-title" className="mt-4 text-3xl font-black leading-tight text-foreground md:text-5xl">MachTech &amp; InnoTech Expo 2026</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {bg
                ? "Пълната програма на БАЗАП: пет презентации и специално гост-участие за адитивното производство, индустриалния дизайн, роботиката, строителното 3D принтиране, AI и дигиталната фабрикация."
                : "The complete BAMAS programme: five presentations and a special guest introduction spanning additive manufacturing, industrial design, robotics, construction 3D printing, AI and digital fabrication."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <a href="https://machtech.bg/posetiteli/bileti/" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5">
              <Ticket className="h-4 w-4" />{bg ? "Билети" : "Tickets"}<ArrowRight className="h-4 w-4" />
            </a>
            <a href="https://machtech.bg/ot-aditivnoto-proizvodstvo-do-ai-na-machtech/" target="_blank" rel="noopener noreferrer" className="inline-flex h-11 items-center gap-2 rounded-full border border-primary/25 bg-background px-5 text-sm font-bold text-foreground transition-colors hover:border-primary/60">
              {bg ? "Официална програма" : "Official programme"}<ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          {talks.map((talk) => (
            <article key={`${talk.date}-${talk.time}`} className="group overflow-hidden rounded-2xl border border-primary/15 bg-background shadow-sm transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg">
              <div className="grid min-h-full grid-cols-[112px_1fr] sm:grid-cols-[150px_1fr]">
                {talk.image ? (
                  <img src={talk.image} alt={talk.name} width={800} height={1000} loading="lazy" className="h-full min-h-56 w-full object-cover object-top" />
                ) : (
                  <div className="flex min-h-56 items-center justify-center bg-primary/10 px-3 text-center" aria-hidden="true">
                    <span className="text-3xl font-black tracking-tight text-primary">PERI</span>
                  </div>
                )}
                <div className="flex min-w-0 flex-col p-5 sm:p-6">
                  <time dateTime={`${talk.date}T${talk.time.slice(0, 5)}:00+03:00`} className="text-xs font-black uppercase tracking-[0.14em] text-primary">
                    {talk.day} {bg ? "октомври" : "October"} · {talk.time}
                  </time>
                  <h3 className="mt-3 text-xl font-black text-foreground sm:text-2xl">{talk.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{talk.role[language]}</p>
                  <p className="mt-4 text-base font-bold leading-snug text-foreground">{talk.title}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{talk.summary[language]}</p>
                  {talk.videos && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {talk.videos.map((video) => (
                        <a key={video.href} href={video.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:border-primary hover:bg-primary/5">
                          <Play className="h-3 w-3 fill-current" />{video.label[language]}
                        </a>
                      ))}
                    </div>
                  )}
                  <p className="mt-auto pt-5 text-xs font-semibold text-primary">{bg ? "Семинарна зала · Зала 5" : "Seminar room · Hall 5"}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-7 text-sm leading-relaxed text-muted-foreground">
          {bg
            ? "Всички часове са местно време за София. Програмата и лекторите са потвърдени към 1 октомври 2026 г."
            : "All times are local to Sofia. Programme and speakers confirmed as of 1 October 2026."}
        </p>
      </div>
    </section>
  );
}
