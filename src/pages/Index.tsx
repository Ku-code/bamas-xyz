import { useEffect, useRef, useMemo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  Rocket,
  Brain,
  LineChart,
  MessageSquare,
  Lightbulb,
  Zap,
  Globe,
  Calendar,
  CircleCheck
} from "@/components/ui/icons";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { FooterSection } from "@/components/ui/footer-section";
import { useLanguage } from "@/contexts/LanguageContext";
import PartnerLogosCarousel from "@/components/PartnerLogosCarousel";
import BoardMembersCarousel from "@/components/BoardMembersCarousel";
import NewsBanner from "@/components/NewsBanner";
import EventsTimeline from "@/components/EventsTimeline";
import AdditiveDaysBanner from "@/components/AdditiveDaysBanner";
import BannerCube from "@/components/BannerCube";
import MachTechBanner from "@/components/MachTechBanner";
import IndustryInfoBanner from "@/components/IndustryInfoBanner";
import ImageBanner from "@/components/ImageBanner";
import MonthlyMeetingBanner from "@/components/MonthlyMeetingBanner";
import MachTechProgramme from "@/components/MachTechProgramme";
import { motion } from "framer-motion";
import { ArrowRight, Zap as ZapIcon, Target, Rocket as RocketIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MembershipForm, { ApplicationType } from "@/components/MembershipForm";
import { supabase } from "@/lib/supabase";
import ContactForm from "@/components/ContactForm";
import LazyMap from "@/components/LazyMap";
import { DotGlobeHero } from "@/components/ui/globe-hero";

const Index = () => {
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [expandedCard, setExpandedCard] = useState<'vision' | 'mission' | null>(null);
  const [isMembershipOpen, setIsMembershipOpen] = useState(false);
  const [membershipType, setMembershipType] = useState<ApplicationType | undefined>(undefined);

  const openMembership = (type?: ApplicationType) => {
    setMembershipType(type);
    setIsMembershipOpen(true);
  };

  const handleMembershipSuccess = (data: { email: string; name: string }) => {
    setIsMembershipOpen(false);
    navigate('/membership-success', { state: data });
  };

  useEffect(() => {
    // Entrance animations are pure enhancement: elements are hidden only when
    // <html> carries .js-anim (set in main.tsx when JS runs + motion allowed).
    if (!document.documentElement.classList.contains('js-anim')) return;

    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            // Unobserve after animation to improve performance
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    animatedElements.forEach(el => observer.observe(el));

    // Safety net: if anything is still hidden after 3s (observer edge cases,
    // fast deep-links), reveal it — content must never stay invisible.
    const failSafe = window.setTimeout(() => {
      animatedElements.forEach(el => el.classList.add('in-view'));
    }, 3000);

    return () => {
      window.clearTimeout(failSafe);
      animatedElements.forEach(el => observer.unobserve(el));
    };
  }, []);

  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>, formType: string) => {
    e.preventDefault();
    toast({
      title: "Form Submitted",
      description: `Your ${formType} information has been received. We'll be in touch soon.`,
    });
    e.currentTarget.reset();
  }, [toast]);

  const logoPath = useMemo(() => {
    return language === 'bg'
      ? '/bamas-uploads/BAMAS_Logo_bg.png'
      : '/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
  }, [language]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        {language === 'bg' ? 'Към съдържанието' : 'Skip to content'}
      </a>
      <Navbar />

      <main>
      <section id="home" className="relative pt-20 md:pt-24 scroll-mt-20 md:scroll-mt-24 overflow-hidden">
        {/* Partner banners on the faces of a forward-tumbling prism. The
            background colours below are sampled from each creative's own edge
            pixels so the letterboxing is invisible — see ImageBanner. */}
        <BannerCube
          intervalMs={2000}
          faces={[
            <MachTechBanner key="machtech" />,
            <ImageBanner
              key="interdrone-expo"
              src="/banners/interdrone-expo-2026.gif"
              href={"https://interdroneexpo.bg/online-ticket/"}
              alt="INTER DRONE EXPO, 6–9 October 2026, Inter Expo Center — opens interdroneexpo.bg in a new tab"
              background="#C4CCB5"
            />,
            <IndustryInfoBanner key="industryinfo" />,
            <ImageBanner
              key="europm-2026"
              src="/banners/europm-2026.webp"
              href="https://www.europm2026.com/"
              alt="EURO PM2026 Congress & Exhibition, 11–14 October 2026, Budapest, Hungary — opens europm2026.com in a new tab"
              background="#0B1F2A"
            />,
            <AdditiveDaysBanner key="additive-days" />,
          ]}
        />
        <NewsBanner />
        <MonthlyMeetingBanner />
        <DotGlobeHero
          rotationSpeed={0.004}
          className="bg-gradient-to-br from-background via-background/95 to-muted/10 relative overflow-hidden min-h-[82svh] md:min-h-[85svh]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 via-transparent to-background/20 z-[2]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse pointer-events-none z-[2]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-pulse pointer-events-none z-[2]" />

          <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center text-center space-y-8 md:space-y-12 max-w-5xl mx-auto px-4 md:px-6 w-full h-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border border-primary/30 backdrop-blur-xl shadow-2xl scale-90 md:scale-100"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-ping" />
                <span className="relative z-10 text-xs md:text-sm font-bold text-primary tracking-wider uppercase">{t("hero.badge")}</span>
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-primary rounded-full animate-ping animation-delay-500" />
              </motion.div>

              <div className="space-y-6">
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className={`font-extrabold select-none ${language === 'bg'
                    ? 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl tracking-normal leading-[1.15] text-center px-2 sm:px-4 md:px-6 max-w-full'
                    : 'text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl tracking-tight leading-tight'
                    }`}
                >
                  <span className={`block relative ${language === 'bg' ? 'text-center' : ''}`}>
                    <span className={`bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent font-extrabold relative z-10 ${language === 'bg' ? 'inline-block break-words' : ''
                      }`}>
                      {t("hero.title")}
                    </span>
                    <div aria-hidden="true" className={`absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent font-extrabold blur-2xl opacity-50 scale-105 ${language === 'bg' ? 'text-center' : ''
                      }`}>
                      {t("hero.title")}
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                      className={`absolute -bottom-4 sm:-bottom-6 h-2 sm:h-3 bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full shadow-lg shadow-primary/50 ${language === 'bg' ? 'left-1/2 -translate-x-1/2 w-3/4 sm:w-2/3 md:w-1/2' : 'left-0'
                        }`}
                    />
                  </span>
                </motion.h1>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="max-w-3xl mx-auto space-y-4"
              >
                <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-foreground/80 leading-relaxed px-4 font-normal">
                  {t("hero.tagline")}
                </p>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4"
            >
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 25px hsl(var(--primary) / 0.3)",
                  y: -2
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground rounded-xl font-semibold text-sm md:text-lg shadow-xl hover:shadow-primary/30 transition-all duration-500 overflow-hidden border border-primary/20"
                onClick={() => {
                  const membershipSection = document.getElementById('membership');
                  membershipSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                <span className="relative z-10 tracking-wide">{t("hero.cta")}</span>
                <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.05,
                  backgroundColor: "hsl(var(--accent))",
                  borderColor: "hsl(var(--primary))",
                  boxShadow: "0 15px 30px rgba(0,0,0,0.1), 0 0 15px hsl(var(--primary) / 0.1)",
                  y: -2
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2 md:gap-3 px-6 md:px-8 py-3 md:py-4 border-2 border-border/40 rounded-xl font-semibold text-sm md:text-lg hover:border-primary/40 transition-all duration-500 backdrop-blur-xl bg-background/60 hover:bg-background/90 shadow-lg overflow-hidden"
                onClick={() => {
                  const aboutSection = document.getElementById('about');
                  aboutSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <ZapIcon className="relative z-10 w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                <span className="relative z-10 tracking-wide">{t("nav.about")}</span>
              </motion.button>
            </motion.div>
          </div>
        </DotGlobeHero>
      </section>

      <MachTechProgramme />

      <section id="about" className="py-12 md:py-20 bg-muted/30 relative overflow-hidden scroll-mt-20 md:scroll-mt-24">
        {/* Background image with reduced opacity - centered behind text */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/bamas-map-logo.webp)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center 10%',
            backgroundSize: isMobile ? 'auto 70%' : 'auto 120%',
            opacity: 0.25
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 md:mb-12 text-center text-foreground animate-on-scroll transition-all duration-700 ease-out px-4">
            {t("about.title")}
          </h2>
          {/* Canonical facts block — the sentence search engines and AI
              assistants should retrieve verbatim (kept in sync with llms.txt
              and the Organization JSON-LD). Styled as a distinct lead card so
              it doesn't read as a duplicate of the description below. */}
          <div className="max-w-3xl mx-auto mb-8 md:mb-10 rounded-xl border-l-4 border-primary bg-primary/5 px-5 py-4 md:px-6 md:py-5">
            <p className="text-base md:text-lg text-foreground/90 leading-relaxed font-normal">
              {t("about.intro")}
            </p>
          </div>
          <div className="max-w-3xl mx-auto animate-on-scroll transition-all duration-700 ease-out delay-100">
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4 md:mb-6 px-4 font-normal">
              {t("about.description")}
            </p>
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4 font-normal">
              {t("about.subtitle")}
            </p>
          </div>

          {/* Board Members Section */}
          <div className="mt-16 animate-on-scroll transition-all duration-700 ease-out delay-200">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold mb-8 text-center text-foreground px-4">
              {language === "bg" ? "Управителен съвет и Представителство" : "Board of Directors"}
            </h3>
            <BoardMembersCarousel />
          </div>
        </div>
      </section>

      <section id="mission" className="py-16 md:py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden scroll-mt-20 md:scroll-mt-24">
        {/* Background decorative elements - Green bloom effects */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16 animate-on-scroll transition-all duration-700 ease-out">
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              {t("mission.section.title")}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto shadow-lg shadow-primary/50"></div>
          </div>

          {/* Vision and Mission Side by Side */}
          <div className="max-w-6xl mx-auto mb-16">
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              {/* Vision Card */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="animate-on-scroll transition-all duration-700 ease-out delay-100"
              >
                <Card
                  className="h-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
                  onClick={() => setExpandedCard(expandedCard === 'vision' ? null : 'vision')}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <Target className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
                          {t("mission.vision.title")}
                        </h3>
                      </div>
                      {expandedCard === 'vision' ? (
                        <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary/60 flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4 font-normal">
                        {t("mission.vision.short")}
                      </p>
                      {expandedCard === 'vision' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4 pt-2 border-t border-primary/20">
                            {t("mission.vision.description")}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Mission Card */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="animate-on-scroll transition-all duration-700 ease-out delay-200"
              >
                <Card
                  className="h-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 cursor-pointer"
                  onClick={() => setExpandedCard(expandedCard === 'mission' ? null : 'mission')}
                >
                  <div className="p-8">
                    <div className="flex items-center justify-between gap-4 mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <RocketIcon className="h-6 w-6 text-primary" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-foreground">
                          {t("mission.mission.title")}
                        </h3>
                      </div>
                      {expandedCard === 'mission' ? (
                        <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-primary/60 flex-shrink-0" />
                      )}
                    </div>
                    <div className="space-y-3">
                      <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4 font-normal">
                        {t("mission.mission.short")}
                      </p>
                      {expandedCard === 'mission' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4 pt-2 border-t border-primary/20">
                            {t("mission.mission.description")}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Mission Pillars Grid */}
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 animate-on-scroll transition-all duration-700 ease-out delay-300">
                <h3 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
                  {t("mission.mission.subtitle")}
                </h3>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    icon: <Users className="h-7 w-7" />,
                    text: t("mission.mission.item1"),
                    color: "from-primary/20 to-primary/10",
                    borderColor: "border-primary/30",
                    iconBg: "bg-primary/20",
                    iconColor: "text-primary"
                  },
                  {
                    icon: <Rocket className="h-7 w-7" />,
                    text: t("mission.mission.item2"),
                    color: "from-primary/25 to-primary/15",
                    borderColor: "border-primary/30",
                    iconBg: "bg-primary/20",
                    iconColor: "text-primary"
                  },
                  {
                    icon: <Lightbulb className="h-7 w-7" />,
                    text: t("mission.mission.item3"),
                    color: "from-primary/20 to-primary/10",
                    borderColor: "border-primary/30",
                    iconBg: "bg-primary/20",
                    iconColor: "text-primary"
                  },
                  {
                    icon: <Globe className="h-7 w-7" />,
                    text: t("mission.mission.item4"),
                    color: "from-primary/25 via-primary/20 to-primary/15",
                    borderColor: "border-primary/30",
                    iconBg: "bg-primary/20",
                    iconColor: "text-primary"
                  }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    className="animate-on-scroll transition-all duration-700 ease-out"
                    style={{ transitionDelay: `${400 + index * 100}ms` }}
                  >
                    <Card className={`h-full bg-card border-2 ${item.borderColor} hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02] bg-gradient-to-br ${item.color}`}>
                      <div className="p-6">
                        <div className={`w-14 h-14 rounded-xl ${item.iconBg} flex items-center justify-center mb-4 ${item.iconColor}`}>
                          {item.icon}
                        </div>
                        <p className="text-base text-foreground leading-relaxed font-medium">
                          {item.text}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="objectives" className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 md:mb-12 text-center text-foreground animate-on-scroll transition-all duration-700 ease-out px-4">
            {t("objectives.title")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              {
                icon: <MessageSquare className="h-10 w-10" />,
                title: t("objectives.item1.title"),
                description: t("objectives.item1.description")
              },
              {
                icon: <Rocket className="h-10 w-10" />,
                title: t("objectives.item2.title"),
                description: t("objectives.item2.description")
              },
              {
                icon: <Lightbulb className="h-10 w-10" />,
                title: t("objectives.item3.title"),
                description: t("objectives.item3.description")
              },
              {
                icon: <LineChart className="h-10 w-10" />,
                title: t("objectives.item4.title"),
                description: t("objectives.item4.description")
              }
            ].map((objective, index) => (
              <Card key={index} className="bg-card shadow-md hover:shadow-lg transition-all animate-on-scroll transition-all duration-700 ease-out" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 text-primary">
                    {objective.icon}
                  </div>
                  <h3 className="text-xl font-extrabold mb-3 text-foreground">{objective.title}</h3>
                  <p className="text-foreground/70 font-body-light">{objective.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="membership-pricing" className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-center text-foreground animate-on-scroll transition-all duration-700 ease-out">
            {t("membership.pricing.title")}
          </h2>
          <p className="text-lg text-center text-foreground/70 mb-12 animate-on-scroll transition-all duration-700 ease-out delay-100 font-normal">
            {t("membership.pricing.subtitle")}
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {[
              {
                title: t("membership.pricing.individual.title"),
                description: t("membership.pricing.individual.description"),
                priceBGN: 250,
                priceEUR: 128,
                isFree: false,
                isHighlighted: false
              },
              {
                title: t("membership.pricing.company.title"),
                description: t("membership.pricing.company.description"),
                priceBGN: 500,
                priceEUR: 255,
                isFree: false,
                isHighlighted: true
              },
              {
                title: t("membership.pricing.organization.title"),
                description: t("membership.pricing.organization.description"),
                priceBGN: 0,
                priceEUR: 0,
                isFree: true,
                isHighlighted: false
              },
              {
                title: t("membership.pricing.foreign.title"),
                description: t("membership.pricing.foreign.description"),
                priceBGN: 1000,
                priceEUR: 510,
                isFree: false,
                isHighlighted: false
              }
            ].map((tier, index) => (
              <Card
                key={index}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-on-scroll bg-card ${tier.isHighlighted
                  ? "border-2 border-primary shadow-lg scale-105"
                  : "border border-border/40 hover:border-primary/50"
                  }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {tier.isHighlighted && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                <div className="p-6 flex flex-col h-full">
                  <h3 className="text-xl font-bold text-foreground mb-2">{tier.title}</h3>
                  <p className="text-sm text-foreground/70 mb-6 flex-grow">{tier.description}</p>

                  <div className="mb-6">
                    {tier.isFree ? (
                      <div className="text-center">
                        <div className="text-5xl font-black text-primary mb-2">
                          {t("membership.pricing.free")}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                          <span className="text-4xl md:text-5xl font-black text-foreground">
                            €{tier.priceEUR}
                          </span>
                          <span className="text-lg text-foreground/60 font-medium">
                            EUR
                          </span>
                        </div>
                        <div className="text-sm text-foreground/50">
                          {tier.priceBGN} BGN
                        </div>
                        <div className="text-xs text-foreground/40 mt-1">
                          {t("membership.pricing.perYear")}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className={`w-full ${tier.isHighlighted
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : tier.isFree
                        ? "bg-muted hover:bg-muted/80 text-foreground"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                      }`}
                    onClick={() => {
                      const types: ApplicationType[] = ['individual', 'company', 'academic', 'foreign'];
                      openMembership(types[index]);
                    }}
                  >
                    {t("membership.pricing.cta")}
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Pricing FAQ — answers the questions that block a join decision.
              Native <details> so it is crawlable without JS. */}
          <div className="max-w-3xl mx-auto mt-12">
            <h3 className="text-lg md:text-xl font-extrabold text-foreground mb-4 text-center">
              {language === 'bg' ? 'Често задавани въпроси за членството' : 'Membership FAQ'}
            </h3>
            <div className="space-y-2">
              {(language === 'bg' ? [
                { q: 'Кога започва членството ми?', a: 'Членството започва след одобрение на заявката от Управителния съвет и заплащане на годишния членски внос. Обикновено разглеждаме заявките до 14 дни.' },
                { q: 'Получавам ли фактура за членския внос?', a: 'Да — след одобрение издаваме фактура с банковите данни на асоциацията. Плащането е по банков път.' },
                { q: 'Защо членството за университети и организации с нестопанска цел е безплатно?', a: 'Мисията ни изисква силна връзка между индустрията и академичните среди. Затова университети, изследователски организации и фондации членуват безплатно.' },
                { q: 'Мога ли да сменя типа членство по-късно?', a: 'Да — пишете ни на info@bamas.xyz и ще прехвърлим членството към новия тип от следващия период.' },
              ] : [
                { q: 'When does my membership start?', a: 'Membership starts once the Management Board approves your application and the annual fee is paid. Applications are typically reviewed within 14 days.' },
                { q: 'Do I get an invoice for the membership fee?', a: 'Yes — after approval we issue an invoice with the association’s bank details. Payment is by bank transfer.' },
                { q: 'Why is membership free for universities and non-profits?', a: 'Our mission depends on a strong bridge between industry and academia, so universities, research organizations and foundations join free of charge.' },
                { q: 'Can I switch membership tiers later?', a: 'Yes — email info@bamas.xyz and we will move your membership to the new tier from the next period.' },
              ]).map((f) => (
                <details key={f.q} className="group rounded-lg border border-border/60 bg-card px-4 py-3">
                  <summary className="cursor-pointer list-none font-semibold text-foreground flex items-center justify-between gap-3">
                    {f.q}
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="mt-2 text-sm md:text-base text-foreground/80 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="membership" className="py-12 md:py-20 bg-background scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 md:mb-12 text-center text-foreground animate-on-scroll transition-all duration-700 ease-out px-4">
            {t("membership.title")}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
            {[
              {
                icon: <Brain className="h-8 w-8" />,
                title: t("membership.benefits.item1.title"),
                description: t("membership.benefits.item1.description")
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: t("membership.benefits.item2.title"),
                description: t("membership.benefits.item2.description")
              },
              {
                icon: <Calendar className="h-8 w-8" />,
                title: t("membership.benefits.item3.title"),
                description: t("membership.benefits.item3.description")
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: t("membership.benefits.item4.title"),
                description: t("membership.benefits.item4.description")
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: t("membership.benefits.item5.title"),
                description: t("membership.benefits.item5.description")
              },
              {
                icon: <MessageSquare className="h-8 w-8" />,
                title: t("membership.benefits.item6.title"),
                description: t("membership.benefits.item6.description")
              }
            ].map((benefit, index) => (
              <Card key={index} className="border border-primary/20 hover:border-primary/50 transition-all animate-on-scroll transition-all duration-700 ease-out bg-card" style={{ transitionDelay: `${index * 100}ms` }}>
                <div className="p-6 flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="text-destructive mr-4">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-extrabold text-foreground">{benefit.title}</h3>
                  </div>
                  <p className="text-foreground/70 font-body-light">{benefit.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Apply for Membership CTA */}
          <div className="mt-12 text-center animate-on-scroll transition-all duration-700 ease-out delay-500">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-6 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-primary/30 transition-all duration-300 group"
                onClick={() => openMembership()}
              >
                <span>{language === 'bg' ? 'Кандидатствайте за членство' : 'Apply for Membership'}</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <p className="mt-4 text-sm text-foreground/60">
                {language === 'bg'
                  ? 'Попълнете формуляра за кандидатстване и станете част от БАЗАП'
                  : 'Fill out the application form and become a BAMAS member'}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="events" className="py-16 md:py-24 bg-muted/30 scroll-mt-20 md:scroll-mt-24 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 animate-on-scroll transition-all duration-700 ease-out">
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-4">
              {t("events.title")}
            </h2>
            <div className="w-16 h-1 bg-primary mx-auto"></div>
          </div>

          <EventsTimeline />
        </div>
      </section>

      <section id="partner" className="py-12 md:py-20 bg-background scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 md:mb-12 text-center text-foreground animate-on-scroll transition-all duration-700 ease-out px-4">
            {t("partner.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-12 mt-8">
            <div className="animate-on-scroll transition-all duration-700 ease-out">
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4 md:mb-6 px-4 font-body-light">
                {t("partner.description1")}
              </p>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4 font-body-light">
                {t("partner.description2")}
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg shadow-sm animate-on-scroll transition-all duration-700 ease-out delay-100">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t("partner.interest.title")}</h3>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4 md:mb-6 px-4">
                {t("partner.interest.description")}
              </p>
              <Button
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                onClick={() => openMembership('foreign')}
              >
                {t("partner.interest.cta")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Current Partners Section */}
      <section className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-4 md:mb-6 text-center text-primary animate-on-scroll transition-all duration-700 ease-out px-4">
            {language === "bg" ? "Компаниите, които формират индустрията за адитивно производство в България" : "The Companies Shaping Bulgaria's Additive Manufacturing Industry"}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-center mb-8 md:mb-12 px-4 max-w-3xl mx-auto animate-on-scroll transition-all duration-700 ease-out delay-100 font-light">
            {language === "bg" ? "Заедно изграждаме бъдещето на 3D технологиите и иновациите" : "Building the future of 3D technologies and innovation, together"}
          </p>
          <div className="animate-on-scroll transition-all duration-700 ease-out">
            <PartnerLogosCarousel />
          </div>
        </div>
      </section>

      <section id="contact" className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-8 md:mb-12 text-center text-foreground animate-on-scroll transition-all duration-700 ease-out px-4">
            {t("contact.title")}
          </h2>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
              <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md animate-on-scroll transition-all duration-700 ease-out delay-100 flex flex-col h-full">
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-3 sm:mb-4">{t("contact.form.title")}</h3>
                <ContactForm />
              </div>

              <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md animate-on-scroll transition-all duration-700 ease-out delay-200 flex flex-col h-full">
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-3 sm:mb-4">{t("contact.discord.title")}</h3>
                <p className="text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed mb-4 sm:mb-6 flex-grow font-body-light">
                  {t("contact.discord.description")}
                </p>
                <Button
                  className="bg-[#5865F2] hover:bg-[#5865F2]/90 text-white w-full text-sm sm:text-base mt-auto"
                  asChild
                >
                  <a href="https://discord.gg/hM6Snchf9N" target="_blank" rel="noopener noreferrer">
                    {t("contact.discord.cta")}
                  </a>
                </Button>
              </div>

              <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md animate-on-scroll transition-all duration-700 ease-out delay-300 sm:col-span-2 lg:col-span-1 flex flex-col h-full">
                <h3 className="text-lg sm:text-xl font-extrabold text-foreground mb-3 sm:mb-4">{t("contact.viber.title")}</h3>
                <p className="text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed mb-4 sm:mb-6 flex-grow font-body-light">
                  {t("contact.viber.description")}
                </p>
                <Button
                  className="bg-[#665CAC] hover:bg-[#665CAC]/90 text-white w-full text-sm sm:text-base mt-auto"
                  asChild
                >
                  <a href="https://invite.viber.com/?g2=AQA7VGQ9uWfQ3FWlDylP2%2BUG%2FEvuxPVitIKgm0VBBfQ6locvqZmob4hpS4rjkhXO" target="_blank" rel="noopener noreferrer">
                    {t("contact.viber.cta")}
                  </a>
                </Button>
              </div>
            </div>

            {/* Google Maps Section */}
            <div className="bg-card p-8 rounded-lg shadow-md animate-on-scroll transition-all duration-700 ease-out delay-400">
              <h3 className="text-xl font-extrabold text-foreground mb-4 text-center">
                {t("contact.location.title")}
              </h3>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-6 text-center px-4 font-body-light">
                {t("contact.location.description")}
              </p>
              <LazyMap
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6019356.767090495!2d14.43004323370686!3d42.5523403136874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6dbf683d01fab4c3%3A0x74dbbf4def49e93a!2sBulgarian%20Additive%20Manufacturing%20Association%20(BAMAS)!5e0!3m2!1sen!2sbg!4v1767378707394!5m2!1sen!2sbg"
                title="BAMAS Location"
                className="w-full rounded-lg overflow-hidden border border-border/50 shadow-sm"
              />

              {/* Legal identity — trust signal and Organization-schema consistency */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                {language === 'bg'
                  ? 'Българска асоциация за адитивно производство (БАЗАП) · сдружение с нестопанска цел · София, България · info@bamas.xyz'
                  : 'Bulgarian Additive Manufacturing Association (BAMAS) · non-profit association · Sofia, Bulgaria · info@bamas.xyz'}
              </p>
            </div>
          </div>
        </div>
      </section>
      </main>

      <FooterSection
        translations={{
          newsletter: {
            title: t("footer.newsletter.title"),
            description: t("footer.newsletter.description"),
            placeholder: t("footer.newsletter.placeholder"),
            subscribe: t("footer.newsletter.subscribe")
          },
          quickLinks: {
            title: t("footer.resources"),
            home: t("nav.home"),
            about: t("nav.about"),
            mission: t("nav.mission"),
            membership: t("nav.membership"),
            events: t("nav.events"),
            contact: t("nav.contact")
          },
          contact: {
            title: t("footer.contact"),
            address: "Sofia, Bulgaria",
            email: "info@bamas.xyz"
          },
          followUs: {
            title: "Follow Us",
            linkedin: "Connect with us on LinkedIn"
          },
          copyright: t("footer.copyright").replace("{year}", new Date().getFullYear().toString()),
          privacy: t("footer.privacy"),
          terms: t("footer.terms"),
          cookieSettings: "Cookie Settings",
          addliance: t("footer.addliance.text")
        }}
        socialLinks={{
          linkedin: "https://www.linkedin.com/company/bulgarian-additive-manufacturing-association/"
        }}
        currentLanguage={language}
        onLanguageChange={setLanguage}
        onNewsletterSubmit={async (email) => {
          // Store + confirmation email via edge function; direct insert as a
          // fallback so a subscription is never lost if the function is down.
          const clean = email.trim().toLowerCase();
          let ok = false;
          try {
            const { data, error } = await supabase.functions.invoke('notify-signup', {
              body: { type: 'newsletter', email: clean, language, source: 'footer' },
            });
            ok = !error && (data as { success?: boolean } | null)?.success === true;
          } catch { /* fall through to direct insert */ }
          if (!ok) {
            const { error } = await supabase
              .from('newsletter_subscribers')
              .insert({ email: clean, language, source: 'footer' });
            ok = !error || error.code === '23505';
          }
          if (!ok) {
            toast({
              title: language === 'bg' ? 'Грешка' : 'Something went wrong',
              description: language === 'bg'
                ? 'Абонирането не се получи. Опитайте отново или ни пишете на info@bamas.xyz.'
                : 'Subscription failed. Please try again or email info@bamas.xyz.',
              variant: 'destructive',
            });
            return;
          }
          toast({
            title: language === 'bg' ? 'Успешен абонамент' : 'Subscribed',
            description: language === 'bg'
              ? `Благодарим! Изпратихме потвърждение на ${clean}.`
              : `Thank you! A confirmation was sent to ${clean}.`,
          });
        }}
      />

      <Dialog open={isMembershipOpen} onOpenChange={setIsMembershipOpen}>
        <DialogContent className="max-w-5xl max-h-[98vh] sm:max-h-[90vh] bg-slate-950 border-white/10 p-0 sm:rounded-3xl overflow-hidden glassmorphism shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Membership Application</DialogTitle>
          </DialogHeader>
          <div className="h-[98vh] sm:h-[90vh]">
            <MembershipForm
              initialType={membershipType}
              onSuccess={handleMembershipSuccess}
              onClose={() => setIsMembershipOpen(false)}
              isModal={true}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
