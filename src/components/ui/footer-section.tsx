import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Linkedin, Moon, Send, Sun, Twitter, Languages } from "lucide-react"

interface FooterSectionProps {
  translations?: {
    newsletter?: {
      title?: string
      description?: string
      placeholder?: string
      subscribe?: string
    }
    quickLinks?: {
      title?: string
      home?: string
      about?: string
      mission?: string
      membership?: string
      events?: string
      contact?: string
    }
    contact?: {
      title?: string
      address?: string
      city?: string
      phone?: string
      email?: string
    }
    followUs?: {
      title?: string
      facebook?: string
      twitter?: string
      instagram?: string
      linkedin?: string
    }
    darkMode?: string
    language?: string
    copyright?: string
    privacy?: string
    terms?: string
    cookieSettings?: string
    addliance?: string
  }
  onNewsletterSubmit?: (email: string) => void
  socialLinks?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  currentLanguage?: "en" | "bg"
  onLanguageChange?: (lang: "en" | "bg") => void
}

function FooterSection({ 
  translations,
  onNewsletterSubmit,
  socialLinks,
  currentLanguage = "en",
  onLanguageChange
}: FooterSectionProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    // Default to dark mode, only use light mode if explicitly set by user via toggle
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("darkMode")
      // Return false only if explicitly set to "false" by user, otherwise default to true (dark mode)
      return stored !== "false"
    }
    // Always default to dark mode
    return true
  })
  const [email, setEmail] = React.useState("")

  // Initialize dark mode state on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Ensure dark class matches the state
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
      } else {
        document.documentElement.classList.remove("dark")
      }
    }
  }, [])

  // Update dark mode when toggle changes
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      if (isDarkMode) {
        document.documentElement.classList.add("dark")
        localStorage.setItem("darkMode", "true")
      } else {
        document.documentElement.classList.remove("dark")
        localStorage.setItem("darkMode", "false")
      }
    }
  }, [isDarkMode])

  const handleDarkModeToggle = React.useCallback((checked: boolean) => {
    setIsDarkMode(checked)
  }, [])

  const handleLanguageToggle = React.useCallback((checked: boolean) => {
    const newLang = checked ? "bg" : "en"
    if (onLanguageChange) {
      onLanguageChange(newLang)
    }
  }, [onLanguageChange])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onNewsletterSubmit && email) {
      onNewsletterSubmit(email)
      setEmail("")
    }
  }

  // Determine which logo to show based on language and theme
  // Light mode uses specific logos from /logos folder
  // Dark mode uses the existing logos
  const getLogoPath = () => {
    if (isDarkMode) {
      // Dark mode: use existing logos
      if (currentLanguage === "bg") {
        return "/bamas-uploads/BAMAS_Logo_bg.png";
      } else {
        return "/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png";
      }
    } else {
      // Light mode: use logos from /logos folder
      if (currentLanguage === "bg") {
        // Bulgarian version for light mode (file ending with 6)
        return "/logos/BAMAS_LOGO_inkscape_file_6.PNG";
      } else {
        // English version for light mode (file ending with 42)
        return "/logos/BAMAS_LOGO_inkscape_file_4 2.PNG";
      }
    }
  };
  
  const logoPath = getLogoPath();
  
  // Fallback paths if primary doesn't exist (for dark mode)
  const fallbackLogoPath = currentLanguage === "bg" 
    ? "/bamas-uploads/BAMAS_Logo_bg.png"
    : "/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png";

  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            {/* BAMAS Logo - positioned above newsletter title */}
            <div className="mb-6 flex justify-start">
              <a 
                href="#home" 
                className="inline-block transition-all hover:opacity-80 hover:scale-105 cursor-pointer"
                aria-label={currentLanguage === "bg" ? "Отиди към началото" : "Go to home"}
              >
                <img
                  key={`${logoPath}-${isDarkMode}`}
                  src={logoPath}
                  alt={currentLanguage === "bg" ? "БАЗАП Лого" : "BAMAS Logo"}
                  className="h-12 md:h-16 w-auto object-contain max-w-full shadow-sm"
                  loading="eager"
                  decoding="async"
                  style={{ display: 'block', maxHeight: '64px', borderRadius: '1rem' }}
                  onError={(e) => {
                    console.warn('BAMAS logo failed to load from primary path:', e.currentTarget.src);
                    // Try fallback path only in dark mode
                    if (isDarkMode && e.currentTarget.src !== fallbackLogoPath) {
                      console.log('Trying fallback path:', fallbackLogoPath);
                      e.currentTarget.src = fallbackLogoPath;
                    } else {
                      console.error('Logo failed to load:', e.currentTarget.src);
                    }
                  }}
                  onLoad={() => {
                    console.log('BAMAS logo loaded successfully from:', logoPath);
                  }}
                />
              </a>
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight">
              {translations?.newsletter?.title || "Join BAMAS"}
            </h2>
            <p className="mb-6 text-muted-foreground">
              {translations?.newsletter?.description || "Join our newsletter for the latest updates and exclusive offers."}
            </p>
            <form className="relative" onSubmit={handleSubmit}>
              <Input
                type="email"
                placeholder={translations?.newsletter?.placeholder || "Enter your email"}
                className="pr-12 backdrop-blur-sm rounded-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">{translations?.newsletter?.subscribe || "Subscribe"}</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              {translations?.quickLinks?.title || "Quick Links"}
            </h3>
            <nav className="space-y-2 text-sm">
              <a href="#home" className="block transition-colors hover:text-primary">
                {translations?.quickLinks?.home || "Home"}
              </a>
              <a href="#about" className="block transition-colors hover:text-primary">
                {translations?.quickLinks?.about || "About Us"}
              </a>
              <a href="#mission" className="block transition-colors hover:text-primary">
                {translations?.quickLinks?.mission || "Our Mission"}
              </a>
              <a href="#membership" className="block transition-colors hover:text-primary">
                {translations?.quickLinks?.membership || "Membership"}
              </a>
              <a href="#events" className="block transition-colors hover:text-primary">
                {translations?.quickLinks?.events || "Events"}
              </a>
              <a href="#contact" className="block transition-colors hover:text-primary">
                {translations?.quickLinks?.contact || "Contact"}
              </a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">
              {translations?.contact?.title || "Contact Us"}
            </h3>
            <address className="space-y-2 text-sm not-italic">
              <p>{translations?.contact?.address || "Sofia, Bulgaria"}</p>
              <p>{translations?.contact?.city || ""}</p>
              <p>{translations?.contact?.phone || ""}</p>
              <p>{translations?.contact?.email || "info@bamas.xyz"}</p>
              <div className="flex items-center gap-3 mt-4">
                <span className="text-2xl leading-none" title="Bulgaria" aria-label="Bulgaria">🇧🇬</span>
                <span className="text-2xl leading-none" title="European Union" aria-label="European Union">🇪🇺</span>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40">
                <div className="mb-3 flex items-center">
                  <a 
                    href="https://addliance.eu/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-block hover:opacity-80 transition-opacity"
                  >
                    <img
                      src="/addliancelogo.png"
                      alt="Addliance Logo" 
                      className="h-16 w-auto object-contain"
                      style={{ 
                        maxWidth: '250px',
                        height: 'auto',
                        display: 'block',
                        visibility: 'visible',
                        opacity: 1,
                        filter: 'none',
                        imageRendering: 'auto',
                        borderRadius: '1rem'
                      }}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        console.error('Addliance logo failed to load. Attempted path:', e.currentTarget.src);
                        console.error('Full URL:', window.location.origin + e.currentTarget.src);
                      }}
                      onLoad={(e) => {
                        console.log('Addliance logo loaded successfully from:', e.currentTarget.src);
                      }}
                    />
                  </a>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  {translations?.addliance || "Part of (Add)liance - The European Additive Manufacturing Hub"}
                </p>
              </div>
            </address>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">
              {translations?.followUs?.title || "Follow Us"}
            </h3>
            <div className="mb-6 flex space-x-4">
              {socialLinks?.linkedin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        asChild
                      >
                        <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4" />
                          <span className="sr-only">{translations?.followUs?.linkedin || "LinkedIn"}</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{translations?.followUs?.linkedin || "Connect with us on LinkedIn"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {socialLinks?.facebook && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        asChild
                      >
                        <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4" />
                          <span className="sr-only">{translations?.followUs?.facebook || "Facebook"}</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{translations?.followUs?.facebook || "Follow us on Facebook"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {socialLinks?.twitter && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        asChild
                      >
                        <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4" />
                          <span className="sr-only">{translations?.followUs?.twitter || "Twitter"}</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{translations?.followUs?.twitter || "Follow us on Twitter"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              {socialLinks?.instagram && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="rounded-full"
                        asChild
                      >
                        <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4" />
                          <span className="sr-only">{translations?.followUs?.instagram || "Instagram"}</span>
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{translations?.followUs?.instagram || "Follow us on Instagram"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sun className="h-4 w-4" />
                <Switch
                  id="dark-mode"
                  checked={isDarkMode}
                  onCheckedChange={handleDarkModeToggle}
                />
                <Moon className="h-4 w-4" />
                <Label htmlFor="dark-mode" className="sr-only">
                  {translations?.darkMode || "Toggle dark mode"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">EN</span>
                <Switch
                  id="language-toggle"
                  checked={currentLanguage === "bg"}
                  onCheckedChange={handleLanguageToggle}
                />
                <span className="text-sm font-medium">BG</span>
                <Languages className="h-4 w-4 ml-1" />
                <Label htmlFor="language-toggle" className="sr-only">
                  {translations?.language || "Toggle language"}
                </Label>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            {translations?.copyright || `© ${new Date().getFullYear()} BAMAS. All rights reserved.`}
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="/privacy-policy" className="transition-colors hover:text-primary">
              {translations?.privacy || "Privacy Policy"}
            </a>
            <a href="/terms-of-use" className="transition-colors hover:text-primary">
              {translations?.terms || "Terms of Service"}
            </a>
            <a href="/cookie-policy" className="transition-colors hover:text-primary">
              {translations?.cookieSettings || "Cookie Policy"}
            </a>
          </nav>
        </div>
      </div>
      {/* Large stylized text at bottom - full width */}
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-12 pt-12 border-t border-border/10 overflow-hidden">
        <div className="w-full text-center px-2 sm:px-4 md:px-6 lg:px-8">
          <h1 
            className="w-full font-black tracking-tighter leading-none select-none pointer-events-none block"
            style={{
              fontSize: 'clamp(3.5rem, 30vw, 22rem)',
              color: 'transparent',
              WebkitTextStroke: isDarkMode ? '1.5px' : '2px',
              WebkitTextStrokeColor: isDarkMode 
                ? 'hsl(159, 88%, 33%)' 
                : '#E62F29',
              opacity: isDarkMode ? 0.4 : 0.5,
              letterSpacing: currentLanguage === "bg" ? '-0.15em' : '-0.12em',
              lineHeight: '0.7',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto',
              wordBreak: 'keep-all',
              overflowWrap: 'normal',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'clip',
            }}
          >
            {currentLanguage === "bg" ? "БАЗАП" : "BAMAS"}
          </h1>
        </div>
      </div>
    </footer>
  )
}

export { FooterSection }
