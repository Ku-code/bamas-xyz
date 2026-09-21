import { CalendarDays, Video } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const MEET_URL = "https://meet.google.com/nzb-jzxp-aop";

const MonthlyMeetingBanner = () => {
  const { language } = useLanguage();
  const bg = language === "bg";

  return (
    <aside
      aria-label={bg ? "Месечна среща на БАЗАП" : "BAMAS monthly members meeting"}
      className="relative z-40 border-y border-border/60 bg-card/95 px-4 py-3 backdrop-blur"
    >
      <div className="container mx-auto flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="font-semibold text-foreground">
              {bg ? "Месечна среща на членовете" : "Monthly members meeting"}
            </p>
            <p className="text-sm text-muted-foreground">
              {bg
                ? "Всеки първи вторник от месеца · 16:00–17:00 ч. софийско време · онлайн"
                : "Every first Tuesday of the month · 16:00–17:00 Sofia time · online"}
            </p>
          </div>
        </div>
        <a
          href={MEET_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Video aria-hidden="true" className="h-4 w-4" />
          {bg ? "Вход в Google Meet" : "Join Google Meet"}
        </a>
      </div>
    </aside>
  );
};

export default MonthlyMeetingBanner;
