import { cn } from "@/lib/utils";

interface BrandLogoProps { language: "bg" | "en"; compact?: boolean; className?: string }

export default function BrandLogo({ language, compact = false, className }: BrandLogoProps) {
  const bg = language === "bg";
  return <span className={cn("inline-flex min-w-0 items-center gap-3 text-foreground", className)}>
    <img src="/brand/bamas-symbol.webp" alt="" width="56" height="56" className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-sm sm:h-14 sm:w-14" decoding="async" />
    {!compact && <span className="min-w-0 leading-tight">
      <strong className="block text-[15px] font-extrabold uppercase leading-[1.05] tracking-[-0.02em] sm:text-[17px]">{bg ? "Българска асоциация" : "Bulgarian Additive"}</strong>
      <span className="mt-1 block max-w-[235px] text-[10px] font-semibold uppercase leading-[1.15] tracking-[0.025em] text-foreground/75 sm:text-[11px]">{bg ? "за адитивно производство" : "Manufacturing Association"}</span>
    </span>}
  </span>;
}
