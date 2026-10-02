import { CheckCircle2, Home, Mail } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const ThankYou = () => {
  const { language } = useLanguage();
  const { state } = useLocation();
  const bg = language === "bg";
  const name = (state as { name?: string } | null)?.name;

  useDocumentMeta({
    title: bg ? "Благодарим ви | БАЗАП" : "Thank You | BAMAS",
    description: bg ? "Потвърждение, че съобщението ви до БАЗАП е получено." : "Confirmation that BAMAS received your message.",
    noindex: true,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="relative flex min-h-[78vh] items-center overflow-hidden px-4 pb-16 pt-28">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,hsl(var(--primary)/0.18),transparent_42%)]" />
        <section className="relative mx-auto w-full max-w-3xl rounded-[2rem] border border-primary/20 bg-card/80 p-7 text-center shadow-2xl backdrop-blur-xl sm:p-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            {bg ? `Благодарим ви${name ? `, ${name}` : ""}.` : `Thank you${name ? `, ${name}` : ""}.`}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            {bg ? "Получихме съобщението ви. Екипът на БАЗАП ще отговори на посочения имейл възможно най-скоро." : "We received your message. The BAMAS team will reply to the email you provided as soon as possible."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg"><Link to="/"><Home className="mr-2 h-4 w-4" />{bg ? "Към началната страница" : "Back to homepage"}</Link></Button>
            <Button asChild size="lg" variant="outline"><a href="mailto:info@bamas.xyz"><Mail className="mr-2 h-4 w-4" />info@bamas.xyz</a></Button>
          </div>
        </section>
      </main>
      <FooterSection />
    </div>
  );
};

export default ThankYou;
