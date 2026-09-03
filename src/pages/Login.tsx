import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import { LogIn, Mail, Lock, X, ArrowLeft, Eye, EyeOff } from "lucide-react";

import { useDocumentMeta } from "@/hooks/useDocumentMeta";
const Login = () => {

  const { t, language, setLanguage } = useLanguage();
  useDocumentMeta({
    title: language === 'bg' ? 'Вход | БАЗАП' : 'Login | BAMAS',
    noindex: true,
  });
  const { toast } = useToast();
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await signInWithEmail(email, password);
      toast({
        title: t("auth.login.success.title") || "Login Successful",
        description: t("auth.login.success.description") || "Welcome back!",
      });
      const returnTo = searchParams.get('returnTo') || '/dashboard';
      navigate(returnTo);
    } catch (error: any) {
      const errorInfo = formatErrorForToast(
        error,
        t("auth.login.error.title") || "Login Failed",
        t("auth.login.error.description") || "Invalid email or password"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="rounded-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("auth.back") || "Back to Home"}
              </Button>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card className="border-2">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-3xl font-bold">{t("auth.login.title") || "Login"}</CardTitle>
              <CardDescription>
                {t("auth.login.description") || "Enter your credentials to access your account"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GoogleAuthButton
                returnTo={searchParams.get('returnTo') || '/dashboard'}
                mode="signin"
                disabled={isLoading}
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    {t("auth.or") || "Or continue with"}
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email") || "Email"}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.email.placeholder") || "name@example.com"}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rounded-full"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password") || "Password"}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t("auth.password.placeholder") || "Enter your password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-full"
                      required
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8 rounded-full hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Link 
                      to="/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      {t("auth.forgotPassword.link") || "Forgot Password?"}
                    </Link>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full" 
                  disabled={isLoading}
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? (t("auth.loading") || "Loading...") : (t("auth.login.button") || "Login")}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {t("auth.noAccount") || "Don't have an account? "}
                </span>
                <Link to="/register" className="text-primary hover:underline font-medium">
                  {t("auth.register.link") || "Register"}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <FooterSection
        translations={{}}
        socialLinks={{}}
        currentLanguage={language}
        onLanguageChange={setLanguage}
      />
    </div>
  );
};

export default Login;
