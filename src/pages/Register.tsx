import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
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
import { UserPlus, Mail, Lock, User, X, ArrowLeft, Eye, EyeOff } from "lucide-react";

const Register = () => {
  const { t, language, setLanguage } = useLanguage();
  const { toast } = useToast();
  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: t("auth.register.error.title") || "Validation Error",
        description: t("auth.register.error.passwordMatch") || "Passwords do not match. Please make sure both password fields are identical.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await signUpWithEmail(email, password, name);
      toast({
        title: t("auth.register.success.title") || "Registration Successful",
        description: t("auth.register.success.description") || "Your account has been created successfully!",
      });
      navigate("/dashboard");
    } catch (error: any) {
      const errorInfo = formatErrorForToast(
        error,
        t("auth.register.error.title") || "Registration Failed",
        t("auth.register.error.description") || "Failed to create account"
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    console.log("Google Registration Success:", credentialResponse);
    
    if (credentialResponse.credential) {
      try {
        setIsLoading(true);
        await signInWithGoogle(credentialResponse.credential);
    toast({
      title: t("auth.register.success.title") || "Registration Successful",
      description: t("auth.google.success") || "Successfully registered with Google!",
    });
        navigate("/dashboard");
      } catch (error: any) {
        const errorInfo = formatErrorForToast(
          error,
          t("auth.google.error.title") || "Google Registration Failed",
          t("auth.google.error.description") || "Failed to register with Google"
        );
        toast({
          title: errorInfo.title,
          description: errorInfo.description,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleError = () => {
    toast({
      title: t("auth.google.error.title") || "Google Registration Failed",
      description: t("auth.google.error.description") || "Failed to register with Google. Please try again or use email/password registration.",
      variant: "destructive",
    });
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
              <CardTitle className="text-3xl font-bold">{t("auth.register.title") || "Register"}</CardTitle>
              <CardDescription>
                {t("auth.register.description") || "Create a new account to get started"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && import.meta.env.VITE_GOOGLE_CLIENT_ID.trim() !== '' ? (
                <>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="filled_black"
                    size="large"
                    text="signup_with"
                    shape="rectangular"
                    locale={language === "bg" ? "bg" : "en"}
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
                </>
              ) : (
                <div className="p-4 bg-muted rounded-lg text-center text-sm text-muted-foreground">
                  {t("auth.google.notConfigured") || "Google authentication is not configured. Please use email/password registration."}
                  {import.meta.env.MODE === 'production' && (
                    <div className="mt-2 text-xs">
                      Debug: VITE_GOOGLE_CLIENT_ID = {import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'Set' : 'Not set'}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.name") || "Full Name"}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={t("auth.name.placeholder") || "John Doe"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 rounded-full"
                      required
                    />
                  </div>
                </div>
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
                      minLength={6}
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.password.confirm") || "Confirm Password"}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t("auth.password.confirm.placeholder") || "Confirm your password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10 rounded-full"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8 rounded-full hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full rounded-full" 
                  disabled={isLoading}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? (t("auth.loading") || "Loading...") : (t("auth.register.button") || "Register")}
                </Button>
              </form>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {t("auth.hasAccount") || "Already have an account? "}
                </span>
                <Link to="/login" className="text-primary hover:underline font-medium">
                  {t("auth.login.link") || "Login"}
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

export default Register;
