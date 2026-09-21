import { useLanguage } from "@/contexts/LanguageContext";

const talks = [
  {
    name: "Kenan Boz",
    image: "/speakers/machtech-2026/kenan-boz.png",
    date: "2026-10-06",
    day: "6",
    title: "A Global Outlook on Additive Manufacturing from Today to Tomorrow",
    role: { bg: "Технически мениджър, EPMA", en: "Technical Manager, EPMA" },
    location: { bg: "Семинарна зала в Зала 5", en: "Hall 5 seminar room" },
  },
  {
    name: "Georgi Chervendinev",
    image: "/speakers/machtech-2026/georgi-chervendinev.png",
    date: "2026-10-08",
    day: "8",
    title: "ARCTONIC - Endless Game of Design / Дизайнът като безкрайна игра",
    role: { bg: "Дизайнер, инженер и преподавател", en: "Designer, engineer and educator" },
  },
];

export default function MachTechProgramme() {
  const { language } = useLanguage();
  const bg = language === "bg";

  return (
    <section id="machtech-programme" aria-labelledby="machtech-programme-title" className="scroll-mt-24 border-y border-primary/15 bg-background px-4 py-12 md:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-semibold text-primary">6–9 {bg ? "октомври" : "October"} 2026</p>
          <h2 id="machtech-programme-title" className="text-3xl font-bold leading-tight text-foreground md:text-4xl">MachTech &amp; InnoTech Expo 2026</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {bg ? "Потвърдени презентации на гост-лекторите на БАЗАП" : "Confirmed presentations from BAMAS guest speakers"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">{bg ? "Всички часове са в местно време за София." : "All times are local to Sofia."}</p>
        </header>
        <div className="divide-y divide-primary/20 border-y border-primary/20">
          {talks.map((talk) => (
            <article key={talk.date} className="grid gap-5 py-7 sm:grid-cols-[140px_1fr] md:grid-cols-[140px_160px_1fr] md:gap-8">
              <div className="flex items-baseline gap-4 sm:block">
                <time dateTime={`${talk.date}T12:00:00+03:00`} className="block text-xl font-semibold text-primary">
                  {talk.day} {bg ? "октомври" : "October"}
                </time>
                <p className="mt-1 whitespace-nowrap text-base font-semibold text-foreground">12:00–12:30</p>
              </div>
              <img src={talk.image} alt={talk.name} width={160} height={200} loading="lazy" className="h-auto w-32 self-start rounded-lg object-contain sm:w-40" />
              <div className="min-w-0 sm:col-start-2 md:col-start-auto">
                <h3 className="text-xl font-bold text-foreground md:text-2xl">{talk.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{talk.role[language]}</p>
                <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-foreground">{talk.title}</p>
                {talk.location && <p className="mt-3 text-sm text-muted-foreground">{talk.location[language]}</p>}
              </div>
            </article>
          ))}
          {["12:00–12:30", "15:45–16:15"].map((slot) => (
            <article key={slot} className="grid gap-3 py-6 sm:grid-cols-[140px_1fr] md:gap-8">
              <div>
                <p className="text-lg font-semibold text-muted-foreground">9 {bg ? "октомври" : "October"}</p>
                <p className="mt-1 text-sm text-muted-foreground">{slot}</p>
              </div>
              <div className="border-l-2 border-dashed border-primary/30 pl-5">
                <h3 className="text-lg font-semibold text-muted-foreground">{bg ? "Очаквайте скоро" : "To be announced"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{bg ? "Запазен час. Лекторът и темата предстои да бъдат потвърдени." : "Reserved slot. Speaker and topic pending confirmation."}</p>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {bg
            ? "Програмата е частична. Останалите лектори и програмни елементи са в процес на потвърждение. Допълнителни подробности ще бъдат публикувани скоро."
            : "This is a partial programme. Other speakers and programme items are pending confirmation. Additional details will follow."}
        </p>
      </div>
    </section>
  );
}
