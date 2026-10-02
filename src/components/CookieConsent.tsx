import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { X, Cookie, BarChart3, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Cookie consent — a compact card anchored to the bottom-left corner.
 * It used to be a full-width max-w-4xl panel centred over the content
 * column, which sat on top of centred page controls (the board slideshow
 * arrows and dots) until the visitor dismissed it.
 */
const CookieConsent = () => {
  const { t } = useLanguage();
  const [show, setShow] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookieConsent");
    if (!cookieConsent) {
      // Show after a short delay for better UX
      setTimeout(() => {
        setShow(true);
      }, 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({ essential: true, analytics: true, updatedAt: new Date().toISOString() }));
    setShow(false);
    // index.html listens for this and only then loads GA4 + Clarity (GDPR).
    window.dispatchEvent(new Event("cookie-consent-accepted"));
  };

  const handleReject = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({ essential: true, analytics: false, updatedAt: new Date().toISOString() }));
    setShow(false);
  };

  const handleSave = () => {
    localStorage.setItem("cookieConsent", JSON.stringify({ essential: true, analytics, updatedAt: new Date().toISOString() }));
    setShow(false);
    if (analytics) window.dispatchEvent(new Event("cookie-consent-accepted"));
  };

  if (!show) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:justify-start sm:p-4">
      <div
        role="dialog"
        aria-label={t("cookies.consent.title") || "Cookie Consent"}
        className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Cookie className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">
              {t("cookies.consent.title") || "Cookie Consent"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {t("cookies.consent.description") || "Essential storage keeps the site working. Optional analytics helps us understand anonymous traffic and improve BAMAS."}
            </p>
            <Link
              to="/cookie-policy"
              className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
            >
              {t("cookies.consent.policyLink") || "Cookie Policy"}
            </Link>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 rounded-full"
            onClick={handleReject}
            aria-label={t("cookies.consent.close") || "Close"}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {customize && <div className="mt-4 space-y-2 border-t border-border pt-3">
          <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3"><div className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs font-semibold">Essential</p><p className="text-[11px] text-muted-foreground">Always active</p></div></div><span className="text-[11px] font-medium text-primary">Required</span></div>
          <label className="flex cursor-pointer items-center justify-between rounded-xl bg-muted/50 p-3"><div className="flex gap-2"><BarChart3 className="mt-0.5 h-4 w-4 text-primary" /><div><p className="text-xs font-semibold">Analytics</p><p className="text-[11px] text-muted-foreground">Google Analytics and Microsoft Clarity</p></div></div><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} className="h-4 w-4 accent-[hsl(var(--primary))]" /></label>
        </div>}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="h-8 flex-1 rounded-full text-xs"
          >
            {t("cookies.consent.reject") || "Reject"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => customize ? handleSave() : setCustomize(true)} className="h-8 rounded-full text-xs">{customize ? "Save choices" : "Customize"}</Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="col-span-2 h-8 rounded-full text-xs"
          >
            {t("cookies.consent.accept") || "Accept All"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
