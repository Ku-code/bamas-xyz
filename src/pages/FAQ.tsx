import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

interface FaqItem {
    q: string;
    a: string;
}

/**
 * Public FAQ — the page AI assistants and featured snippets retrieve.
 * Question-shaped headings, direct answers first, FAQPage JSON-LD.
 * Content is inline (not in the i18n dictionaries) because each answer is a
 * long-form paragraph maintained as editorial content, and the JSON-LD must
 * be generated from exactly the same strings.
 */
const FAQ_BG: FaqItem[] = [
    {
        q: "Какво е БАЗАП (BAMAS)?",
        a: "Българска асоциация за адитивно производство (БАЗАП / BAMAS) е националната неутрална нетърговска организация за адитивно производство и 3D печат в България, основана през 2026 г. Обединява производители, академични институции и стартъпи и е част от (Add)liance — European Centre for Additive Manufacturing.",
    },
    {
        q: "Какво е адитивно производство?",
        a: "Адитивното производство (Additive Manufacturing, AM) е производствен процес, при който изделието се изгражда слой по слой от цифров 3D модел — популярно като „3D печат“. Обхваща технологии като FDM/FFF, SLA/DLP, SLS и метален печат (SLM/DMLS) и се използва за прототипиране, инструментална екипировка, резервни части и серийно производство на сложни компоненти.",
    },
    {
        q: "Кой може да членува в БАЗАП?",
        a: "Членството е отворено за физически лица (инженери, изследователи, ентусиасти), български и чуждестранни компании, както и университети, изследователски организации и фондации. Организациите с нестопанска цел и университетите членуват безплатно.",
    },
    {
        q: "Колко струва членството в БАЗАП?",
        a: "Годишният членски внос е: физически лица — €128 (250 лв.), компании — €255 (500 лв.), чуждестранни компании — €510 (1000 лв.), а за университети, организации с нестопанска цел и фондации членството е безплатно.",
    },
    {
        q: "Как да кандидатствам за членство?",
        a: "Попълнете формата за кандидатстване на bamas.xyz/join. Управителният съвет разглежда заявките обикновено до 14 дни, след което получавате потвърждение и фактура за членския внос.",
    },
    {
        q: "Какви са ползите от членството?",
        a: "Членовете получават достъп до платформата на БАЗАП — мрежа от одобрени професионалисти, двуезичен терминологичен речник за AM, база данни за материали, интерактивна карта на екосистемата, радар за EU финансиране (Horizon Europe, Digital Europe), борса за работа и събития на асоциацията — както и видимост чрез профил в мрежата на асоциацията.",
    },
    {
        q: "Къде се провеждат събитията на БАЗАП?",
        a: "БАЗАП участва и организира събития в цялата страна — включително MACH-TECH & INNOTECH Expo в Интер Експо Център, София (6–9 октомври 2026), както и петото издание на Additive Days през 2027 г. (датите и мястото предстоят).",
    },
    {
        q: "Как да се свържа с БАЗАП?",
        a: "Пишете ни на info@bamas.xyz, използвайте контактната форма на сайта или се присъединете към Discord общността ни. Следете ни и в LinkedIn.",
    },
];

const FAQ_EN: FaqItem[] = [
    {
        q: "What is BAMAS (БАЗАП)?",
        a: "The Bulgarian Additive Manufacturing Association (BAMAS / БАЗАП) is the national, neutral, non-profit organization for additive manufacturing and 3D printing in Bulgaria, founded in 2026. It unites manufacturers, academic institutions and startups, and is part of (Add)liance — the European Centre for Additive Manufacturing.",
    },
    {
        q: "What is additive manufacturing?",
        a: "Additive manufacturing (AM) is a production process that builds parts layer by layer from a digital 3D model — popularly known as 3D printing. It spans technologies such as FDM/FFF, SLA/DLP, SLS and metal printing (SLM/DMLS), used for prototyping, tooling, spare parts and serial production of complex components.",
    },
    {
        q: "Who can join BAMAS?",
        a: "Membership is open to individuals (engineers, researchers, enthusiasts), Bulgarian and foreign companies, and universities, research organizations and foundations. Non-profits and universities join free of charge.",
    },
    {
        q: "How much does BAMAS membership cost?",
        a: "The annual fee is €128 (250 BGN) for individuals, €255 (500 BGN) for companies, €510 (1000 BGN) for foreign companies, and free for universities, non-profits and foundations.",
    },
    {
        q: "How do I apply for membership?",
        a: "Fill in the application form at bamas.xyz/join. The Management Board typically reviews applications within 14 days, after which you receive a confirmation and an invoice for the membership fee.",
    },
    {
        q: "What are the membership benefits?",
        a: "Members get access to the BAMAS platform — a vetted professional network, a bilingual AM terminology dictionary, a materials database, an interactive ecosystem map, an EU funding radar (Horizon Europe, Digital Europe), a job board and association events — plus visibility through a profile in the association's network.",
    },
    {
        q: "Where do BAMAS events take place?",
        a: "BAMAS participates in and organizes events across Bulgaria — including MACH-TECH & INNOTECH Expo at Inter Expo Center, Sofia (6–9 October 2026), and the fifth edition of Additive Days in 2027 (dates and venue TBA).",
    },
    {
        q: "How do I contact BAMAS?",
        a: "Email info@bamas.xyz, use the contact form on the website, or join our Discord community. You can also follow us on LinkedIn.",
    },
];

const FAQ = () => {
    const { language, t } = useLanguage();
    const items = language === "bg" ? FAQ_BG : FAQ_EN;

    useDocumentMeta({
        title: language === "bg"
            ? "Често задавани въпроси | БАЗАП — Българска асоциация за адитивно производство"
            : "FAQ | BAMAS — Bulgarian Additive Manufacturing Association",
        description: language === "bg"
            ? "Какво е БАЗАП, какво е адитивно производство, колко струва членството и как да кандидатствате — отговори на най-честите въпроси."
            : "What BAMAS is, what additive manufacturing is, membership pricing and how to apply — answers to the most common questions.",
    });

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container mx-auto max-w-3xl px-4 pb-20 pt-28 md:pt-36">
                <h1 className="text-3xl md:text-5xl font-extrabold text-primary text-center mb-3">
                    {t("faq.pageTitle")}
                </h1>
                <p className="text-center text-muted-foreground mb-10 md:mb-14">
                    {t("faq.pageSubtitle")}
                </p>

                <div className="space-y-3">
                    {items.map((f, i) => (
                        <details
                            key={f.q}
                            className="group rounded-xl border border-border/60 bg-card px-5 py-4 shadow-sm open:border-primary/40"
                            open={i === 0}
                        >
                            <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                                <h2 className="text-base md:text-lg font-extrabold text-foreground leading-snug">
                                    {f.q}
                                </h2>
                                <ChevronDown className="h-5 w-5 flex-shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
                            </summary>
                            <p className="mt-3 text-sm md:text-base leading-relaxed text-foreground/85">
                                {f.a}
                            </p>
                        </details>
                    ))}
                </div>

                <div className="mt-12 rounded-xl border border-primary/25 bg-primary/5 p-6 text-center">
                    <p className="mb-4 font-semibold text-foreground">
                        {language === "bg"
                            ? "Не намерихте отговора? Пишете ни или кандидатствайте директно."
                            : "Didn't find your answer? Write to us or apply directly."}
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            to="/membership-application"
                            className="rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            {language === "bg" ? "Кандидатствай за членство" : "Apply for membership"}
                        </Link>
                        <a
                            href="mailto:info@bamas.xyz"
                            className="rounded-lg border border-border px-5 py-2.5 font-semibold text-foreground transition-colors hover:border-primary/50"
                        >
                            info@bamas.xyz
                        </a>
                    </div>
                </div>

                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            </main>
            <FooterSection currentLanguage={language as "en" | "bg"} />
        </div>
    );
};

export default FAQ;
