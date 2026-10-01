import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Search, BookOpenText } from "lucide-react";
import { Link } from "react-router-dom";

interface Term {
    id: string;
    term_en: string;
    term_bg: string | null;
    description_en: string;
    description_bg: string | null;
    acronym: string | null;
    category: string;
}

const CATEGORY_LABELS: Record<string, { bg: string; en: string }> = {
    Materials: { bg: "Материали", en: "Materials" },
    Processes: { bg: "Процеси", en: "Processes" },
    Equipment: { bg: "Оборудване", en: "Equipment" },
    Software: { bg: "Софтуер", en: "Software" },
    Quality_Control: { bg: "Контрол на качеството", en: "Quality Control" },
    Post_Processing: { bg: "Последваща обработка", en: "Post-Processing" },
    Design: { bg: "Дизайн", en: "Design" },
    Standards: { bg: "Стандарти", en: "Standards" },
    General: { bg: "Общи", en: "General" },
};

/**
 * Public, read-only view of the bilingual AM terminology dictionary — the
 * association's most citable asset, previously locked behind login.
 * Requires migration 027 (anon SELECT on approved terms); renders a
 * members-teaser empty state until it is applied.
 */
const Glossary = () => {
    const { language } = useLanguage();
    const [terms, setTerms] = useState<Term[]>([]);
    const [loaded, setLoaded] = useState(false);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string>("all");

    const bg = language === "bg";

    useDocumentMeta({
        title: bg
            ? "Речник на адитивното производство | БАЗАП"
            : "Additive Manufacturing Glossary | BAMAS",
        description: bg
            ? "Двуезичен терминологичен речник за адитивно производство и 3D печат — материали, процеси, оборудване и стандарти, поддържан от БАЗАП."
            : "Bilingual additive manufacturing and 3D printing terminology dictionary — materials, processes, equipment and standards, maintained by BAMAS.",
        schemaType: "CollectionPage",
    });

    useEffect(() => {
        supabase
            .from("terminology_terms")
            .select("id, term_en, term_bg, description_en, description_bg, acronym, category")
            .eq("translation_status", "Approved")
            .order("term_en")
            .limit(1000)
            .then(({ data, error }) => {
                if (!error && data) setTerms(data as Term[]);
                setLoaded(true);
            });
    }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return terms.filter((t) => {
            if (category !== "all" && t.category !== category) return false;
            if (!q) return true;
            return [t.term_en, t.term_bg, t.acronym, t.description_en, t.description_bg]
                .filter(Boolean)
                .some((s) => (s as string).toLowerCase().includes(q));
        });
    }, [terms, query, category]);

    const categories = useMemo(
        () => Array.from(new Set(terms.map((t) => t.category))).sort(),
        [terms]
    );

    const jsonLd = useMemo(() => {
        if (terms.length === 0) return null;
        return {
            "@context": "https://schema.org",
            "@type": "DefinedTermSet",
            name: "BAMAS Additive Manufacturing Glossary / Речник на адитивното производство",
            url: "https://www.bamas.xyz/glossary",
            publisher: { "@id": "https://www.bamas.xyz/#organization" },
            hasDefinedTerm: terms.slice(0, 200).map((t) => ({
                "@type": "DefinedTerm",
                name: t.term_en,
                alternateName: t.term_bg ?? undefined,
                description: t.description_en,
            })),
        };
    }, [terms]);

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto max-w-4xl px-4 pb-20 pt-28 md:pt-36">
                <h1 className="mb-3 text-center text-3xl font-extrabold text-primary md:text-5xl">
                    {bg ? "Речник на адитивното производство" : "Additive Manufacturing Glossary"}
                </h1>
                <p className="mb-10 text-center text-muted-foreground">
                    {bg
                        ? "Двуезична терминология за 3D печат — поддържана от общността на БАЗАП."
                        : "Bilingual 3D printing terminology — maintained by the BAMAS community."}
                </p>

                {loaded && terms.length === 0 && (
                    <div className="mx-auto max-w-xl rounded-xl border border-primary/25 bg-primary/5 p-8 text-center">
                        <BookOpenText className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
                        <p className="mb-2 font-extrabold text-foreground">
                            {bg ? "Публичният речник се подготвя" : "The public glossary is being prepared"}
                        </p>
                        <p className="mb-6 text-sm text-muted-foreground">
                            {bg
                                ? "Пълният двуезичен речник с 200+ термина е достъпен за членове в платформата на БАЗАП."
                                : "The full bilingual dictionary with 200+ terms is available to members inside the BAMAS platform."}
                        </p>
                        <Link
                            to="/membership-application"
                            className="inline-block rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            {bg ? "Стани член" : "Become a member"}
                        </Link>
                    </div>
                )}

                {terms.length > 0 && (
                    <>
                        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                            <div className="relative flex-grow">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <label htmlFor="glossary-search" className="sr-only">
                                    {bg ? "Търсене на термин" : "Search terms"}
                                </label>
                                <Input
                                    id="glossary-search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={bg ? "Търси термин…" : "Search terms…"}
                                    className="pl-9"
                                />
                            </div>
                            <label htmlFor="glossary-category" className="sr-only">
                                {bg ? "Категория" : "Category"}
                            </label>
                            <select
                                id="glossary-category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="all">{bg ? "Всички категории" : "All categories"}</option>
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {CATEGORY_LABELS[c] ? (bg ? CATEGORY_LABELS[c].bg : CATEGORY_LABELS[c].en) : c}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="mb-4 text-xs text-muted-foreground">
                            {filtered.length} {bg ? "термина" : "terms"}
                        </p>

                        <dl className="space-y-4">
                            {filtered.map((t) => (
                                <div key={t.id} className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
                                    <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                        <span className="text-lg font-extrabold text-foreground">
                                            {bg ? (t.term_bg || t.term_en) : t.term_en}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {bg ? t.term_en : (t.term_bg ?? "")}
                                        </span>
                                        {t.acronym && (
                                            <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-primary">
                                                {t.acronym}
                                            </span>
                                        )}
                                        <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                            {CATEGORY_LABELS[t.category] ? (bg ? CATEGORY_LABELS[t.category].bg : CATEGORY_LABELS[t.category].en) : t.category}
                                        </span>
                                    </dt>
                                    <dd className="mt-2 text-sm leading-relaxed text-foreground/85 md:text-base">
                                        {bg ? (t.description_bg || t.description_en) : t.description_en}
                                    </dd>
                                </div>
                            ))}
                        </dl>

                        {jsonLd && (
                            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                        )}
                    </>
                )}
            </main>
            <FooterSection currentLanguage={language as "en" | "bg"} />
        </div>
    );
};

export default Glossary;
