import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import { storage } from "@/lib/storage";
import { 
  ArrowLeft, LogOut, Save, Upload, X, Globe, MapPin, Phone, Hash,
  Sun, Moon, Monitor, CreditCard, Calendar, AlertCircle, CheckCircle2, Clock,
  Building2
} from "lucide-react";
import { Link } from "react-router-dom";
import { format, formatDistanceToNow, addYears } from "date-fns";

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [hashtags, setHashtags] = useState<string[]>(user?.hashtags || []);
  const [hashtagInput, setHashtagInput] = useState("");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [companyName, setCompanyName] = useState(user?.company_name || "");
  const [imagePreview, setImagePreview] = useState<string | null>(user?.image || null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with user data when it changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
      setHashtags(user.hashtags || []);
      setLocation(user.location || "");
      setWebsite(user.website || "");
      setPhone(user.phone || "");
      setCompanyName(user.company_name || "");
      setImagePreview(user.image || null);
    }
  }, [user]);

  // Get billing status info
  const getBillingStatusInfo = () => {
    const billing = user?.billing;
    if (!billing) {
      return {
        status: 'pending' as const,
        label: t("settings.billing.status.pending") || "Pending",
        icon: Clock,
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
      };
    }

    switch (billing.status) {
      case 'paid':
        return {
          status: billing.status,
          label: t("settings.billing.status.paid") || "Paid",
          icon: CheckCircle2,
          color: "text-green-600",
          bgColor: "bg-green-100",
        };
      case 'overdue':
        return {
          status: billing.status,
          label: t("settings.billing.status.overdue") || "Overdue",
          icon: AlertCircle,
          color: "text-red-600",
          bgColor: "bg-red-100",
        };
      case 'exempt':
        return {
          status: billing.status,
          label: t("settings.billing.status.exempt") || "Exempt",
          icon: CheckCircle2,
          color: "text-blue-600",
          bgColor: "bg-blue-100",
        };
      default:
        return {
          status: billing.status,
          label: t("settings.billing.status.pending") || "Pending",
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
        };
    }
  };

  const billingInfo = getBillingStatusInfo();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: t("settings.profile.imageError.title") || "Invalid File",
        description: t("settings.profile.imageError.description") || "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: t("settings.profile.imageError.title") || "File Too Large",
        description: t("settings.profile.imageError.size") || "Image must be less than 2MB.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("settings.profile.imageError.title") || "Error",
        description: t("settings.profile.imageError.notLoggedIn") || "You must be logged in to upload images.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Upload to Supabase Storage
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/avatar.${fileExtension}`;
      
      await storage.uploadFile('avatars', filePath, file, {
        contentType: file.type,
        upsert: true, // Replace existing avatar
      });

      // Get public URL for preview
      const publicUrl = storage.getPublicUrl('avatars', filePath);
      setImagePreview(publicUrl);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: t("settings.profile.imageError.title") || "Upload Error",
        description: error.message || t("settings.profile.imageError.uploadFailed") || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHashtag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && hashtagInput.trim()) {
      e.preventDefault();
      const tag = hashtagInput.trim().replace('#', '');
      if (tag && !hashtags.includes(tag)) {
        setHashtags([...hashtags, tag]);
        setHashtagInput("");
      }
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // If imagePreview is a URL (from Supabase Storage), extract the path
      let imageUrl = imagePreview;
      if (imagePreview && imagePreview.startsWith('http')) {
        // Already a URL from Supabase Storage, use as is
        imageUrl = imagePreview;
      } else if (imagePreview && imagePreview.startsWith('data:')) {
        // Base64 image - upload to Supabase Storage first
        if (user?.id) {
          try {
            // Convert base64 to blob
            const response = await fetch(imagePreview);
            const blob = await response.blob();
            const fileExtension = blob.type.split('/')[1] || 'jpg';
            const filePath = `${user.id}/avatar.${fileExtension}`;
            
            await storage.uploadFile('avatars', filePath, blob, {
              contentType: blob.type,
              upsert: true,
            });
            
            imageUrl = storage.getPublicUrl('avatars', filePath);
          } catch (uploadError) {
            console.error("Error uploading base64 image:", uploadError);
            // Continue with base64 if upload fails (for backward compatibility)
          }
        }
      }

      await updateUser({ 
        name, 
        email, 
        bio,
        hashtags,
        location,
        website,
        phone,
        company_name: companyName || undefined,
        image: imageUrl || undefined,
      });
      toast({
        title: t("settings.save.success.title") || "Settings Saved",
        description: t("settings.save.success.description") || "Your settings have been updated successfully!",
      });
    } catch (error: any) {
      const errorInfo = formatErrorForToast(
        error,
        t("settings.save.error.title") || "Failed to Save Settings",
        t("settings.save.error.description") || "Failed to save settings"
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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: t("settings.logout.success") || "Logged Out",
        description: t("settings.logout.description") || "You have been logged out successfully.",
      });
      navigate("/");
    } catch (error: any) {
      const errorInfo = formatErrorForToast(
        error,
        t("settings.logout.error.title") || "Logout Failed",
        t("settings.logout.error.description") || "Failed to logout"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="rounded-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("settings.back") || "Back to Dashboard"}
            </Button>
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{t("settings.title") || "Settings"}</h1>
            <p className="text-muted-foreground mt-2">
              {t("settings.description") || "Manage your account settings and preferences"}
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.profile.title") || "Profile Information"}</CardTitle>
              <CardDescription>
                {t("settings.profile.description") || "Update your personal information"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imagePreview || user?.image} alt={user?.name} />
                    <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("settings.profile.upload") || "Upload Image"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("settings.profile.imageNote") || "JPG, PNG or GIF. Max size 2MB."}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("auth.name") || "Full Name"}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="rounded-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email") || "Email"}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="rounded-full"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">{t("settings.profile.bio") || "Bio"}</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t("settings.profile.bio.placeholder") || "Tell us about yourself..."}
                      className="min-h-[100px] rounded-lg"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {bio.length}/500
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hashtags">{t("settings.profile.hashtags") || "Hashtags"}</Label>
                    <Input
                      id="hashtags"
                      type="text"
                      value={hashtagInput}
                      onChange={(e) => setHashtagInput(e.target.value)}
                      onKeyDown={handleAddHashtag}
                      placeholder={t("settings.profile.hashtags.placeholder") || "Type a hashtag and press Enter"}
                      className="rounded-full"
                    />
                    {hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {hashtags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="rounded-full">
                            <Hash className="h-3 w-3 mr-1" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveHashtag(tag)}
                              className="ml-2 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">
                        <MapPin className="inline h-4 w-4 mr-1" />
                        {t("settings.profile.location") || "Location"}
                      </Label>
                      <Input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t("settings.profile.location.placeholder") || "City, Country"}
                        className="rounded-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">
                        <Globe className="inline h-4 w-4 mr-1" />
                        {t("settings.profile.website") || "Website"}
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder={t("settings.profile.website.placeholder") || "https://example.com"}
                        className="rounded-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">
                      <Phone className="inline h-4 w-4 mr-1" />
                      {t("settings.profile.phone") || "Phone"}
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t("settings.profile.phone.placeholder") || "+1 (555) 123-4567"}
                      className="rounded-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">
                      <Building2 className="inline h-4 w-4 mr-1" />
                      {t("settings.profile.company") || "Company / Organization"}
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t("settings.profile.company.placeholder") || "Your company or organization name"}
                      className="rounded-full"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="rounded-full" 
                  disabled={isLoading}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? (t("auth.loading") || "Loading...") : (t("settings.save.button") || "Save Changes")}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("settings.preferences.title") || "Preferences"}</CardTitle>
              <CardDescription>
                {t("settings.preferences.description") || "Customize your experience"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Language Selection */}
              <div className="space-y-2">
                <Label>{t("settings.preferences.language") || "Language"}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={language === "en" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setLanguage("en")}
                  >
                    🇬🇧 English
                  </Button>
                  <Button
                    type="button"
                    variant={language === "bg" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setLanguage("bg")}
                  >
                    🇧🇬 Български
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Theme Selection */}
              <div className="space-y-2">
                <Label>{t("settings.preferences.theme") || "Theme"}</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    {t("settings.preferences.theme.light") || "Light"}
                  </Button>
                  <Button
                    type="button"
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    {t("settings.preferences.theme.dark") || "Dark"}
                  </Button>
                  <Button
                    type="button"
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    className="rounded-full"
                    onClick={() => setTheme("system")}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    {t("settings.preferences.theme.system") || "System"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {theme === "system" 
                    ? (t("settings.preferences.theme.systemHint") || `Currently using ${resolvedTheme} mode based on your system settings`)
                    : (t("settings.preferences.theme.selected") || `Using ${theme} mode`)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {t("settings.billing.title") || "Membership & Billing"}
              </CardTitle>
              <CardDescription>
                {t("settings.billing.description") || "Your subscription status and payment information"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Billing Status Badge */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${billingInfo.bgColor}`}>
                    <billingInfo.icon className={`h-5 w-5 ${billingInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-medium">{t("settings.billing.subscriptionStatus") || "Subscription Status"}</p>
                    <Badge 
                      variant={billingInfo.status === 'paid' ? 'default' : billingInfo.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="mt-1"
                    >
                      {billingInfo.label}
                    </Badge>
                  </div>
                </div>
                {user?.billing?.amount && (
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {user.billing.amount} {user.billing.currency || 'BGN'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("settings.billing.yearlyFee") || "yearly fee"}
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Last Payment */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{t("settings.billing.lastPayment") || "Last Payment"}</span>
                  </div>
                  <p className="font-medium">
                    {user?.billing?.lastPaymentDate 
                      ? format(new Date(user.billing.lastPaymentDate), 'dd MMM yyyy')
                      : (t("settings.billing.neverPaid") || "No payment recorded")}
                  </p>
                  {user?.billing?.lastPaymentDate && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(user.billing.lastPaymentDate), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {/* Due Date */}
                <div className="p-4 rounded-lg border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{t("settings.billing.dueDate") || "Next Payment Due"}</span>
                  </div>
                  <p className="font-medium">
                    {user?.billing?.dueDate 
                      ? format(new Date(user.billing.dueDate), 'dd MMM yyyy')
                      : user?.billing?.status === 'exempt' 
                        ? (t("settings.billing.exempt") || "Exempt from payment")
                        : (t("settings.billing.awaitingPayment") || "Awaiting first payment")}
                  </p>
                  {user?.billing?.dueDate && (
                    <p className={`text-xs mt-1 ${
                      new Date(user.billing.dueDate) < new Date() 
                        ? 'text-red-600 font-medium' 
                        : 'text-muted-foreground'
                    }`}>
                      {new Date(user.billing.dueDate) < new Date()
                        ? (t("settings.billing.overdueDays") || "Overdue") + ` (${formatDistanceToNow(new Date(user.billing.dueDate))} ago)`
                        : formatDistanceToNow(new Date(user.billing.dueDate), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice ID */}
              {user?.billing?.invoiceId && (
                <div className="p-3 rounded-lg bg-muted/50 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {t("settings.billing.invoiceId") || "Invoice ID"}
                  </span>
                  <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                    {user.billing.invoiceId}
                  </code>
                </div>
              )}

              {/* Payment Info Note */}
              <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 {t("settings.billing.note") || "To make a payment or update your billing information, please contact the association at"}{" "}
                  <a href="mailto:billing@bamas.xyz" className="underline font-medium">
                    billing@bamas.xyz
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">{t("settings.account.title") || "Account Management"}</CardTitle>
              <CardDescription>
                {t("settings.account.description") || "Manage your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                className="rounded-full"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t("settings.logout.button") || "Logout"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;

