import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, OAUTH_RETURN_KEY } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { AlertCircle, Loader2 } from "lucide-react";

/** Give the SDK a bounded window to exchange the token before we show an error. */
const CALLBACK_TIMEOUT_MS = 20000;

/**
 * Landing page for the Google OAuth redirect.
 *
 * The Supabase client is configured with `detectSessionInUrl`, so it consumes
 * the token from the URL on load and emits SIGNED_IN; all this page does is
 * wait for AuthContext to resolve the profile, then forward the user to
 * wherever they were headed before they signed in.
 */
const AuthCallback = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [timedOut, setTimedOut] = useState(false);

  useDocumentMeta({
    title: language === "bg" ? "Влизане… | БАЗАП" : "Signing in… | BAMAS",
    noindex: true,
  });

  // Google reports denial/misconfiguration in the query string (PKCE) or the
  // hash fragment (implicit), so check both.
  const providerError = useMemo(() => {
    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = query.get("error") || hash.get("error");
    if (!code) return null;
    const description =
      query.get("error_description") || hash.get("error_description") || code;
    return description.replace(/\+/g, " ");
  }, []);

  useEffect(() => {
    if (providerError) return;
    if (isLoading || !isAuthenticated) return;

    let target = "/dashboard";
    try {
      const stored = sessionStorage.getItem(OAUTH_RETURN_KEY);
      // Same-site paths only — never follow an absolute URL out of the app.
      if (stored && /^\/(?!\/)/.test(stored)) target = stored;
      sessionStorage.removeItem(OAUTH_RETURN_KEY);
    } catch {
      // sessionStorage unavailable (private mode) — the default is fine.
    }
    navigate(target, { replace: true });
  }, [providerError, isLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (providerError) return;
    const timer = setTimeout(() => setTimedOut(true), CALLBACK_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [providerError]);

  const failure = providerError || (timedOut && !isAuthenticated ? "timeout" : null);

  if (failure) {
    const isTimeout = failure === "timeout";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive" />
          <h1 className="text-2xl font-semibold">
            {language === "bg" ? "Влизането не успя" : "Sign-in didn't complete"}
          </h1>
          <p className="text-muted-foreground">
            {isTimeout
              ? language === "bg"
                ? "Google не върна сесия навреме. Моля, опитайте отново."
                : "Google didn't return a session in time. Please try again."
              : failure}
          </p>
          <div className="flex gap-2 justify-center">
            <Button asChild className="rounded-full">
              <Link to="/login">{language === "bg" ? "Към вход" : "Back to login"}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">{language === "bg" ? "Начало" : "Home"}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">
        {language === "bg" ? "Влизане в профила ви…" : "Signing you in…"}
      </p>
    </div>
  );
};

export default AuthCallback;
