import { useState } from "react";
import { Github, Linkedin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, type OAuthProvider } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const GoogleMark = () => (
  <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 0 1 9.77 24c0-1.6.27-3.15.76-4.59l-7.98-6.19A23.94 23.94 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const PROVIDERS: Array<{
  id: OAuthProvider;
  name: string;
  icon: React.ReactNode;
}> = [
  { id: "google", name: "Google", icon: <GoogleMark /> },
  { id: "linkedin_oidc", name: "LinkedIn", icon: <Linkedin className="h-5 w-5 text-[#0A66C2]" /> },
  { id: "github", name: "GitHub", icon: <Github className="h-5 w-5" /> },
];

interface SocialAuthButtonsProps {
  returnTo?: string;
  mode?: "signin" | "signup";
  disabled?: boolean;
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({
  returnTo = "/dashboard",
  mode = "signin",
  disabled = false,
}) => {
  const { signInWithOAuth } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [redirecting, setRedirecting] = useState<OAuthProvider | null>(null);

  const start = async (provider: OAuthProvider) => {
    setRedirecting(provider);
    try {
      await signInWithOAuth(provider, returnTo);
    } catch (error) {
      setRedirecting(null);
      toast({
        title: language === "bg" ? "Неуспешен вход" : "Sign-in failed",
        description: error instanceof Error ? error.message : language === "bg" ? "Моля, опитайте отново." : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-2">
      {PROVIDERS.map((provider) => {
        const busy = redirecting === provider.id;
        const verb = mode === "signup"
          ? language === "bg" ? "Регистрация с" : "Sign up with"
          : language === "bg" ? "Продължи с" : "Continue with";
        return (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full rounded-full h-11 gap-3 font-medium"
            onClick={() => void start(provider.id)}
            disabled={disabled || redirecting !== null}
          >
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : provider.icon}
            {busy
              ? language === "bg" ? "Пренасочване…" : "Redirecting…"
              : `${verb} ${provider.name}`}
          </Button>
        );
      })}
    </div>
  );
};

export default SocialAuthButtons;
