import Logo from "@/components/Logo";

interface BlogThumbnailProps {
  type: string;
  source?: string;
  title: string;
  className?: string;
}

const ACCENTS: Record<string, string> = {
  media: "from-amber-400/25 via-primary/15 to-sky-500/25",
  event: "from-sky-500/30 via-primary/15 to-indigo-500/25",
  partner: "from-emerald-400/30 via-primary/20 to-cyan-500/20",
  member: "from-primary/35 via-emerald-500/15 to-lime-400/20",
  announcement: "from-primary/30 via-background/10 to-rose-500/20",
};

const LABELS: Record<string, string> = {
  media: "MEDIA COVERAGE",
  event: "EVENT",
  partner: "PARTNERSHIP",
  member: "MEMBER NEWS",
  announcement: "BAMAS NEWS",
};

export const BlogThumbnail = ({ type, source, title, className = "" }: BlogThumbnailProps) => (
  <div className={`relative isolate overflow-hidden bg-slate-950 ${className}`}>
    <div className={`absolute inset-0 bg-gradient-to-br ${ACCENTS[type] ?? ACCENTS.announcement}`} />
    <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
    <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-white/15 bg-primary/10 blur-[1px]" />
    <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full border border-white/10 bg-white/5" />
    <div className="relative flex h-full flex-col justify-between p-5 text-white md:p-7">
      <div className="flex items-center justify-between gap-4">
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black tracking-[0.18em] backdrop-blur-sm">
          {LABELS[type] ?? LABELS.announcement}
        </span>
        <Logo variant="light" className="h-11 w-11 opacity-95" />
      </div>
      <div>
        <p className="line-clamp-2 max-w-[90%] text-lg font-black leading-tight tracking-tight md:text-2xl">{title}</p>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/65">{source || "BAMAS · Bulgaria"}</p>
      </div>
    </div>
  </div>
);
