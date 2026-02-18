import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "./ui/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { t, language } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Update scroll state with throttling for performance
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);

          // Find the current active section (throttled)
          const sections = document.querySelectorAll("section[id]");
          sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top + window.scrollY;
            const sectionHeight = rect.height;
            if (window.scrollY >= (sectionTop - 300) && window.scrollY < (sectionTop + sectionHeight - 300)) {
              setActiveSection(section.getAttribute("id") || "");
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu on scroll (mobile only)
  useEffect(() => {
    if (isMenuOpen) {
      const handleScroll = () => {
        setIsMenuOpen(false);
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [isMenuOpen]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const navLinks = [
    { name: t("nav.home"), href: "#home" },
    { name: t("nav.about"), href: "#about" },
    { name: t("nav.mission"), href: "#mission" },
    { name: t("nav.membership"), href: "#membership" },
    { name: t("nav.documents"), href: "/documents", isRoute: true },
    { name: t("nav.events"), href: "#events" },
    { name: t("nav.contact"), href: "#contact" },
  ];

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  // Detect dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true; // Default to dark mode
  });

  // Listen for dark mode changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const logoPath = useMemo(() => {
    if (isDarkMode) {
      // Dark mode: use white logos from /bamas-uploads
      return language === 'bg'
        ? '/bamas-uploads/BAMAS_Logo_bg.png'
        : '/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
    } else {
      // Light mode: use dark logos from /logos folder
      return language === 'bg'
        ? '/logos/BAMAS_LOGO_inkscape_file_6.PNG'
        : '/logos/BAMAS_LOGO_inkscape_file_4 2.PNG';
    }
  }, [language, isDarkMode]);

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-background/90 shadow-md backdrop-blur-sm py-2 border-b border-border/40" : "bg-transparent py-4"
        } ${isMenuOpen ? "bg-background/95" : ""}`}
      style={{ minHeight: isScrolled ? '64px' : '80px' }}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <a href="#home" className="flex items-center">
          <div className="h-12 w-12">
            <img
              key={`${logoPath}-${isDarkMode}`}
              src={logoPath}
              alt={language === "bg" ? "БАЗАП Лого" : "BAMAS Logo"}
              style={{ borderRadius: '1rem' }}
              className="w-full h-full object-contain transition-opacity duration-300"
              loading="eager"
              fetchPriority="high"
              onError={(e) => {
                console.warn('Navbar logo failed to load:', e.currentTarget.src);
                // Fallback to dark mode logos if light mode logos fail
                if (!isDarkMode) {
                  const fallbackPath = language === 'bg'
                    ? '/bamas-uploads/BAMAS_Logo_bg.png'
                    : '/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
                  e.currentTarget.src = fallbackPath;
                }
              }}
            />
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <ul className="flex space-x-6">
            {navLinks.map((link) => (
              <li key={link.name}>
                {link.isRoute ? (
                  <Link
                    to={link.href}
                    className="text-sm font-semibold transition-colors text-foreground hover:text-primary"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    className={`text-sm font-semibold transition-colors ${activeSection === link.href.substring(1)
                      ? "text-destructive"
                      : "text-foreground hover:text-primary"
                      }`}
                  >
                    {link.name}
                    {activeSection === link.href.substring(1) && (
                      <span className="block h-0.5 mt-1 bg-destructive"></span>
                    )}
                  </a>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 ml-6 pl-6 border-l border-border/40">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.image} alt={user?.name} />
                      <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <User className="mr-2 h-4 w-4" />
                    {t("nav.dashboard") || "Dashboard"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("nav.settings") || "Settings"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("nav.logout") || "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                  >
                    {t("nav.login")}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button
                    size="sm"
                    className="rounded-full shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {t("nav.register")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2 rounded-full">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.image} alt={user?.name} />
                    <AvatarFallback className="text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { navigate("/dashboard"); closeMenu(); }}>
                  <User className="mr-2 h-4 w-4" />
                  {t("nav.dashboard") || "Dashboard"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { navigate("/settings"); closeMenu(); }}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("nav.settings") || "Settings"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { handleLogout(); closeMenu(); }} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout") || "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2 border-l border-border/40 pl-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs rounded-full">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="h-8 px-3 text-xs rounded-full">
                  {t("nav.register")}
                </Button>
              </Link>
            </div>
          )}
          <button
            className={`text-foreground p-2 ml-2 z-[60] relative transition-colors ${isMenuOpen ? 'text-destructive hover:text-destructive/80' : 'hover:text-primary'}`}
            onClick={toggleMenu}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X size={24} className="animate-in fade-in" /> : <Menu size={24} className="animate-in fade-in" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop overlay - click to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={closeMenu}
              aria-hidden="true"
            />
            {/* Mobile menu */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed right-0 top-0 bottom-0 w-full max-w-sm bg-background shadow-2xl border-l border-border z-50 overflow-y-auto overscroll-contain"
              style={{
                height: '100vh',
                paddingTop: isScrolled ? '64px' : '80px'
              }}
            >
              {/* Close button inside menu - always visible at top */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/95 backdrop-blur-sm sticky top-0 z-10">
                <span className="text-xl font-bold text-foreground">{t("nav.menu") || "Menu"}</span>
                <button
                  className="text-foreground hover:text-destructive active:text-destructive p-2 -mr-2 rounded-lg transition-all active:scale-95 touch-manipulation hover:bg-muted/50"
                  onClick={closeMenu}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="px-6 py-6">
                <ul className="space-y-2">
                  {navLinks.map((link, index) => (
                    <motion.li
                      key={link.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                      {link.isRoute ? (
                        <Link
                          to={link.href}
                          className="block text-lg font-semibold transition-all duration-200 py-3 px-4 rounded-lg text-foreground hover:text-primary hover:bg-muted/50"
                          onClick={closeMenu}
                        >
                          {link.name}
                        </Link>
                      ) : (
                        <a
                          href={link.href}
                          className={`block text-lg font-semibold transition-all duration-200 py-3 px-4 rounded-lg ${activeSection === link.href.substring(1)
                              ? "text-primary bg-primary/10 border-l-4 border-primary"
                              : "text-foreground hover:text-primary hover:bg-muted/50"
                            }`}
                          onClick={closeMenu}
                        >
                          {link.name}
                          {activeSection === link.href.substring(1) && (
                            <span className="ml-2 text-primary">●</span>
                          )}
                        </a>
                      )}
                    </motion.li>
                  ))}

                  <li className="pt-4 mt-4 border-t border-border/50">
                    {isAuthenticated ? (
                      <div className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: navLinks.length * 0.05, duration: 0.3 }}
                        >
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 text-lg font-medium transition-all duration-200 text-foreground hover:text-primary hover:bg-muted/50 py-3 px-4 rounded-lg"
                            onClick={closeMenu}
                          >
                            <User className="h-5 w-5" />
                            {t("nav.dashboard") || "Dashboard"}
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navLinks.length + 1) * 0.05, duration: 0.3 }}
                        >
                          <Link
                            to="/settings"
                            className="flex items-center gap-3 text-lg font-medium transition-all duration-200 text-foreground hover:text-primary hover:bg-muted/50 py-3 px-4 rounded-lg"
                            onClick={closeMenu}
                          >
                            <Settings className="h-5 w-5" />
                            {t("nav.settings") || "Settings"}
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navLinks.length + 2) * 0.05, duration: 0.3 }}
                        >
                          <button
                            onClick={() => { handleLogout(); closeMenu(); }}
                            className="flex items-center gap-3 text-lg font-medium transition-all duration-200 text-destructive hover:bg-destructive/10 w-full text-left py-3 px-4 rounded-lg"
                          >
                            <LogOut className="h-5 w-5" />
                            {t("nav.logout") || "Logout"}
                          </button>
                        </motion.div>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-2">
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: navLinks.length * 0.05, duration: 0.3 }}
                        >
                          <Link
                            to="/login"
                            className="block text-center text-lg font-medium transition-all duration-200 text-foreground hover:text-primary border-2 border-border hover:border-primary py-3 px-6 rounded-lg"
                            onClick={closeMenu}
                          >
                            {t("nav.login")}
                          </Link>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navLinks.length + 1) * 0.05, duration: 0.3 }}
                        >
                          <Link
                            to="/register"
                            className="block text-center text-lg font-semibold transition-all duration-200 text-primary-foreground bg-primary hover:bg-primary/90 py-3 px-6 rounded-lg shadow-lg hover:shadow-xl"
                            onClick={closeMenu}
                          >
                            {t("nav.register")}
                          </Link>
                        </motion.div>
                      </div>
                    )}
                  </li>
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
