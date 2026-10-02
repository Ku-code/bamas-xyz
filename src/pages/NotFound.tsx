import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, FileQuestion, Home, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const NotFound = () => {
  const { language } = useLanguage();
  const bg = language === "bg";
  useDocumentMeta({
    title: '404 — Page Not Found | BAMAS',
    noindex: true,
  });

  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="relative flex min-h-[78vh] items-center overflow-hidden px-4 pb-16 pt-28">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,hsl(var(--primary)/0.16),transparent_38%)]" />
      <section className="relative mx-auto grid w-full max-w-5xl gap-10 rounded-[2rem] border border-border/70 bg-card/75 p-7 shadow-2xl backdrop-blur-xl md:grid-cols-[0.8fr_1.2fr] md:p-12">
        <div className="flex min-h-56 items-center justify-center rounded-[1.5rem] border border-primary/20 bg-primary/5"><div className="relative text-primary"><FileQuestion className="h-28 w-28" strokeWidth={1} /><span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-6xl font-extrabold">404</span></div></div>
        <div className="flex flex-col justify-center">
          <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary"><Search className="h-4 w-4" />{bg ? "Страницата не е намерена" : "Page not found"}</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{bg ? "Тази връзка не води до активна страница." : "This link does not lead to an active page."}</h1>
          <p className="mt-5 max-w-xl leading-7 text-muted-foreground">{bg ? "Възможно е адресът да е променен. Върнете се към началната страница или разгледайте блога на БАЗАП." : "The address may have changed. Return to the homepage or continue with the BAMAS blog."}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link to="/"><Home className="mr-2 h-4 w-4" />{bg ? "Начална страница" : "Homepage"}</Link></Button><Button asChild size="lg" variant="outline"><Link to="/blog"><ArrowLeft className="mr-2 h-4 w-4" />{bg ? "Към блога" : "Browse the blog"}</Link></Button></div>
        </div>
      </section>
    </main>
    <FooterSection />
  </div>;
};

export default NotFound;
