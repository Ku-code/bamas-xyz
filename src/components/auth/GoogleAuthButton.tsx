import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

/** Official Google "G" mark. Inline so the button works offline and in both themes. */
const GoogleMark = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path
      fill="#EA4335"
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
    />
    <path
      fill="#4285F4"
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
    />
    <path
      fill="#FBBC05"
      d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.15.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z"
    />
    <path
      fill="#34A853"
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
    />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

interface GoogleAuthButtonProps {
  /** Path to land on after a successful sign-in. Defaults to /dashboard. */
  returnTo?: string;
  /** Copy variant — sign-in vs sign-up. */
  mode?: "signin" | "signup";
  disabled?: boolean;
}

/**
 * Sign in with Google via Supabase's server-side OAuth redirect.
 *
 * This deliberately does NOT use Google Identity Services / One Tap: that path
 * needs a `VITE_GOOGLE_CLIENT_ID` in every build environment and is broken by
 * third-party-cookie restrictions. The redirect flow only needs the Google
 * provider enabled in the Supabase dashboard, so it works in every deployment
 * without extra frontend configuration.
 */
const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  returnTo = "/dashboard",
  mode = "signin",
  disabled = false,
}) => {
  const { signInWithGoogleRedirect } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);

  const label =
    mode === "signup"
      ? t("auth.google.signup") || "Sign up with Google"
      : t("auth.google.signin") || "Continue with Google";

  const handleClick = async () => {
    setIsRedirecting(true);
    try {
      // On success the browser navigates away, so this never resolves visibly.
      await signInWithGoogleRedirect(returnTo);
    } catch (error) {
      setIsRedirecting(false);
      toast({
        title: t("auth.google.error.title") || "Google sign-in failed",
        description:
          error instanceof Error
            ? error.message
            : t("auth.google.error.description") || "Please try again or use email and password.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-full h-11 gap-3 font-medium"
      onClick={handleClick}
      disabled={disabled || isRedirecting}
    >
      {isRedirecting ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleMark />}
      {isRedirecting ? t("auth.google.redirecting") || "Redirecting to Google…" : label}
    </Button>
  );
};

export default GoogleAuthButton;
