import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Send } from "lucide-react";

/**
 * Real contact form — stores the message in `contact_messages` (migration 026).
 * Replaces the mailto-only contact card, which lost everyone whose machine has
 * no mail client configured. mailto stays as a fallback link.
 */
const ContactForm = () => {
    const { language } = useLanguage();
    const { toast } = useToast();
    const [sending, setSending] = useState(false);
    const navigate = useNavigate();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const bg = language === "bg";

    const TOPICS = [
        { value: "membership", bg: "Членство", en: "Membership" },
        { value: "partnership", bg: "Партньорство", en: "Partnership" },
        { value: "media", bg: "Медии и преса", en: "Media & press" },
        { value: "general", bg: "Общ въпрос", en: "General question" },
    ];

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);

        // Honeypot — bots fill it, humans never see it
        if (data.get("website_hp")) {
            return;
        }

        const record = {
            name: String(data.get("name") ?? "").trim(),
            email: String(data.get("email") ?? "").trim().toLowerCase(),
            topic: String(data.get("topic") ?? "general"),
            message: String(data.get("message") ?? "").trim(),
            language,
        };
        const nextErrors: Record<string, string> = {};
        if (record.name.length < 2) nextErrors.name = bg ? "Въведете име с поне 2 знака." : "Enter at least 2 characters.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) nextErrors.email = bg ? "Въведете валиден имейл адрес." : "Enter a valid email address.";
        if (record.message.length < 10) nextErrors.message = bg ? "Съобщението трябва да е поне 10 знака." : "Message must be at least 10 characters.";
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length) return;
        setSending(true);
        // Preferred path: edge function stores AND emails (confirmation to the
        // sender, notification to info@bamas.xyz). Fallback: direct insert.
        let failed = false;
        try {
            const { data: fnData, error: fnError } = await supabase.functions.invoke("notify-signup", {
                body: { type: "contact", ...record },
            });
            failed = !!fnError || (fnData as { success?: boolean } | null)?.success !== true;
        } catch {
            failed = true;
        }
        if (failed) {
            const { error } = await supabase.from("contact_messages").insert(record);
            failed = !!error;
        }
        setSending(false);

        if (failed) {
            console.error("Contact message could not be stored or sent");
            toast({
                title: bg ? "Грешка при изпращане" : "Sending failed",
                description: bg
                    ? "Моля, опитайте отново или ни пишете директно на info@bamas.xyz."
                    : "Please try again or email us directly at info@bamas.xyz.",
                variant: "destructive",
            });
            return;
        }
        form.reset();
        navigate("/thank-you", { state: { name: record.name } });
        toast({
            title: bg ? "Съобщението е изпратено" : "Message sent",
            description: bg
                ? "Благодарим! Ще се свържем с вас възможно най-скоро."
                : "Thank you! We will get back to you as soon as possible.",
        });
    };

    return (
        <form onSubmit={onSubmit} className="flex h-full flex-col gap-3">
            {/* Honeypot */}
            <input
                type="text"
                name="website_hp"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
            />

            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <label htmlFor="cf-name" className="sr-only">{bg ? "Име" : "Name"}</label>
                    <Input id="cf-name" name="name" required autoComplete="name" aria-invalid={!!errors.name} aria-describedby={errors.name ? "cf-name-error" : undefined}
                        placeholder={bg ? "Вашето име" : "Your name"} />
                    {errors.name && <p id="cf-name-error" className="mt-1 text-xs text-destructive">{errors.name}</p>}
                </div>
                <div>
                    <label htmlFor="cf-email" className="sr-only">{bg ? "Имейл" : "Email"}</label>
                    <Input id="cf-email" name="email" type="email" required autoComplete="email" aria-invalid={!!errors.email} aria-describedby={errors.email ? "cf-email-error" : undefined}
                        placeholder={bg ? "Имейл адрес" : "Email address"} />
                    {errors.email && <p id="cf-email-error" className="mt-1 text-xs text-destructive">{errors.email}</p>}
                </div>
            </div>

            <div>
                <label htmlFor="cf-topic" className="sr-only">{bg ? "Тема" : "Topic"}</label>
                <select
                    id="cf-topic"
                    name="topic"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    defaultValue="general"
                >
                    {TOPICS.map((topic) => (
                        <option key={topic.value} value={topic.value}>
                            {bg ? topic.bg : topic.en}
                        </option>
                    ))}
                </select>
            </div>

            <div className="flex-grow">
                <label htmlFor="cf-message" className="sr-only">{bg ? "Съобщение" : "Message"}</label>
                <Textarea id="cf-message" name="message" required rows={4} maxLength={5000} aria-invalid={!!errors.message} aria-describedby={errors.message ? "cf-message-error" : undefined}
                    placeholder={bg ? "Вашето съобщение…" : "Your message…"} className="h-full min-h-[96px]" />
                {errors.message && <p id="cf-message-error" className="mt-1 text-xs text-destructive">{errors.message}</p>}
            </div>

            {/* Footnote sits above the button so the submit button lands on
                the card bottom — level with the Discord/Viber buttons. */}
            <p className="text-center text-xs text-muted-foreground">
                {bg ? "или директно на " : "or directly at "}
                <a href="mailto:info@bamas.xyz" className="text-primary hover:underline">info@bamas.xyz</a>
            </p>
            <Button type="submit" disabled={sending} className="mt-auto w-full bg-primary text-primary-foreground hover:bg-primary/90">
                {sending ? (bg ? "Изпращане…" : "Sending…") : (bg ? "Изпрати съобщение" : "Send message")}
            </Button>
        </form>
    );
};

export default ContactForm;
