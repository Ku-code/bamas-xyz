import { useEffect, useRef, useMemo, useCallback, useState, Suspense, lazy } from "react";
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
import { motion } from "framer-motion";
import { ArrowRight, Zap as ZapIcon, Target, Rocket as RocketIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load DotGlobeHero to defer Three.js library loading
const DotGlobeHero = lazy(() => import("@/components/ui/globe-hero").then(module => ({ default: module.DotGlobeHero })));

const Index = () => {
  const { toast } = useToast();
  const { t, language, setLanguage } = useLanguage();
  const isMobile = useIsMobile();
  const [expandedCard, setExpandedCard] = useState<'vision' | 'mission' | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.add('translate-y-0');
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

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));

    return () => {
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
      <Navbar />
      
      <section id="home" className="relative pt-20 md:pt-24 scroll-mt-20 md:scroll-mt-24">
        <Suspense fallback={
          <div className="bg-gradient-to-br from-background via-background/95 to-muted/10 relative overflow-hidden min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        }>
          <DotGlobeHero
            rotationSpeed={0.004}
            className="bg-gradient-to-br from-background via-background/95 to-muted/10 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/30" />
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/3 rounded-full blur-3xl animate-pulse pointer-events-none" />
            
            <div className="relative z-10 text-center space-y-8 md:space-y-12 max-w-5xl mx-auto px-4 md:px-6 pt-8 md:pt-12 pb-12 md:pb-16">
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
                  className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tight leading-tight select-none"
                  style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                >
                  <span className="block relative">
                    <span className="bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent font-black relative z-10">
                      {t("hero.title")}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent font-black blur-2xl opacity-50 scale-105" 
                         style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                      {t("hero.title")}
                    </div>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                      className="absolute -bottom-6 left-0 h-3 bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full shadow-lg shadow-primary/50"
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
                <p className="text-base sm:text-xl md:text-2xl text-muted-foreground leading-relaxed font-medium px-4" 
                   style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                  {t("hero.subtitle")}
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
        </Suspense>
      </section>

      <section id="about" className="py-12 md:py-20 bg-muted/30 relative overflow-hidden scroll-mt-20 md:scroll-mt-24">
        {/* Background image with reduced opacity - centered behind text */}
        <div 
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'url(/bamas-map-logo.png)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center 10%',
            backgroundSize: isMobile ? 'auto 70%' : 'auto 120%',
            opacity: 0.25
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
            {t("about.title")}
          </h2>
          <div className="max-w-3xl mx-auto animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100">
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4 md:mb-6 px-4">
              {t("about.description")}
            </p>
            <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4">
              {t("about.subtitle")}
            </p>
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
          <div className="text-center mb-16 animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
            <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4">
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
                className="animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100"
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
                      <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4">
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
                className="animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-200"
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
                        <h3 className="text-2xl md:text-3xl font-bold text-foreground">
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
                      <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4">
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
              <div className="text-center mb-12 animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300">
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
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
                    className="animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out"
                    style={{transitionDelay: `${400 + index * 100}ms`}}
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
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
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
              <Card key={index} className="bg-card shadow-md hover:shadow-lg transition-all animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out" style={{transitionDelay: `${index * 100}ms`}}>
                <div className="p-6 flex flex-col items-center text-center">
                  <div className="p-3 rounded-full bg-primary/10 mb-4 text-primary">
                    {objective.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{objective.title}</h3>
                  <p className="text-foreground/70">{objective.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="membership-pricing" className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
            {t("membership.pricing.title")}
          </h2>
          <p className="text-lg text-center text-foreground/70 mb-12 animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100">
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
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl animate-on-scroll opacity-0 translate-y-4 bg-card ${
                  tier.isHighlighted 
                    ? "border-2 border-primary shadow-lg scale-105" 
                    : "border border-border/40 hover:border-primary/50"
                }`}
                style={{transitionDelay: `${index * 100}ms`}}
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
                    className={`w-full ${
                      tier.isHighlighted 
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                        : tier.isFree
                        ? "bg-muted hover:bg-muted/80 text-foreground"
                        : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
                    }`}
                    asChild
                  >
                    <a href="#contact">{t("membership.pricing.cta")}</a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="membership" className="py-12 md:py-20 bg-background scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
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
              <Card key={index} className="border border-primary/20 hover:border-primary/50 transition-all animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out bg-card" style={{transitionDelay: `${index * 100}ms`}}>
                <div className="p-6 flex flex-col">
                  <div className="flex items-center mb-4">
                    <div className="text-destructive mr-4">
                      {benefit.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{benefit.title}</h3>
                  </div>
                  <p className="text-foreground/70">{benefit.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="events" className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
            {t("events.title")}
          </h2>
          
          {/* Timeline Container - Single Line Layout */}
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              {/* Past Events Section */}
              <div className="flex-1 max-w-md animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
                <h3 className="text-lg font-semibold mb-4 text-center text-foreground/60">
                  {t("events.past.title")}
                </h3>
                <div className="bg-muted/70 p-6 rounded-lg shadow-sm border border-border/30">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-foreground/30 mt-2"></div>
                    <div className="flex-grow">
                      <h4 className="text-lg font-bold text-foreground/60 mb-2">{t("events.conference.title")}</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="bg-background/60 px-2 py-1 rounded text-xs font-medium text-foreground/50">{t("events.conference.date")}</div>
                        <div className="bg-background/60 px-2 py-1 rounded text-xs font-medium text-foreground/50">{t("events.conference.location")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Arrow/Divider */}
              <div className="flex-shrink-0 flex items-center justify-center animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-200">
                <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                  <div className="hidden md:block flex-grow h-0.5 w-12 bg-gradient-to-r from-foreground/20 to-transparent"></div>
                  <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary flex items-center justify-center">
                        <ArrowRight className="h-3 w-3 md:h-5 md:w-5 text-primary-foreground" />
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block flex-grow h-0.5 w-12 bg-gradient-to-l from-primary to-transparent"></div>
                </div>
              </div>

              {/* Upcoming Events Section */}
              <div className="flex-1 max-w-md animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300">
                <h3 className="text-lg font-semibold mb-4 text-center text-primary">
                  {t("events.upcoming.title")}
                </h3>
                <div className="bg-gradient-to-br from-primary via-primary to-primary/80 p-6 rounded-lg shadow-lg text-primary-foreground">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-foreground mt-2 animate-pulse"></div>
                    <div className="flex-grow">
                      <h4 className="text-lg font-bold mb-2">{t("events.planning2026.title")}</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <div className="bg-primary-foreground/20 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">{t("events.planning2026.date")}</div>
                        <div className="bg-primary-foreground/20 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">{t("events.planning2026.location")}</div>
                      </div>
                      <p className="text-primary-foreground/90 text-sm leading-relaxed mb-4">
                        {t("events.planning2026.description")}
                      </p>
                      <Button 
                        size="sm"
                        className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg text-xs"
                        asChild
                      >
                        <a href="#contact">
                          {t("membership.pricing.cta")}
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="partner" className="py-12 md:py-20 bg-background scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
            {t("partner.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-12 mt-8">
            <div className="animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4 md:mb-6 px-4">
                {t("partner.description1")}
              </p>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed px-4">
                {t("partner.description2")}
              </p>
            </div>
            <div className="bg-card p-8 rounded-lg shadow-sm animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t("partner.interest.title")}</h3>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-4 md:mb-6 px-4">
                {t("partner.interest.description")}
              </p>
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
                asChild
              >
                <a href="https://forms.gle/gU4GR2iWpJ22hiC26" target="_blank" rel="noopener noreferrer">
                  {t("partner.interest.cta")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Current Partners Section */}
      <section className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6 text-center text-primary animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
            {language === "bg" ? "Компаниите, които формират индустрията за адитивно производство в България" : "The Companies Shaping Bulgaria's Additive Manufacturing Industry"}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground text-center mb-8 md:mb-12 px-4 max-w-3xl mx-auto animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100">
            {language === "bg" ? "Заедно изграждаме бъдещето на 3D технологиите и иновациите" : "Building the future of 3D technologies and innovation, together"}
          </p>
          <div className="animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
            <PartnerLogosCarousel />
          </div>
        </div>
      </section>

      <section id="contact" className="py-12 md:py-20 bg-muted/30 scroll-mt-20 md:scroll-mt-24">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-8 md:mb-12 text-center text-foreground animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out px-4">
            {t("contact.title")}
          </h2>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8">
              <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100 flex flex-col h-full">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">{t("contact.form.title")}</h3>
                <p className="text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed mb-4 sm:mb-6 flex-grow">
                  {t("contact.form.description")}
                </p>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground w-full text-sm sm:text-base mt-auto"
                  asChild
                >
                  <a href="mailto:info@bamas.xyz?subject=Contact%20from%20BAMAS%20Website">
                    {t("contact.form.cta")}
                  </a>
                </Button>
              </div>
              
              <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-200 flex flex-col h-full">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">{t("contact.discord.title")}</h3>
                <p className="text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed mb-4 sm:mb-6 flex-grow">
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
              
              <div className="bg-card p-6 sm:p-8 rounded-lg shadow-md animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-300 sm:col-span-2 lg:col-span-1 flex flex-col h-full">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">{t("contact.viber.title")}</h3>
                <p className="text-sm sm:text-base md:text-lg text-foreground/80 leading-relaxed mb-4 sm:mb-6 flex-grow">
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
            <div className="bg-card p-8 rounded-lg shadow-md animate-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-400">
              <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
                {t("contact.location.title")}
              </h3>
              <p className="text-base md:text-lg text-foreground/80 leading-relaxed mb-6 text-center px-4">
                {t("contact.location.description")}
              </p>
              <div className="w-full rounded-lg overflow-hidden border border-border/50 shadow-sm">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6019356.767090495!2d14.43004323370686!3d42.5523403136874!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6dbf683d01fab4c3%3A0x74dbbf4def49e93a!2sBulgarian%20Additive%20Manufacturing%20Association%20(BAMAS)!5e0!3m2!1sen!2sbg!4v1767378707394!5m2!1sen!2sbg"
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                  title="BAMAS Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

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
        onNewsletterSubmit={(email) => {
          toast({
            title: "Newsletter Subscription",
            description: `Thank you for subscribing with ${email}! We'll keep you updated.`,
          });
        }}
      />
    </div>
  );
};

export default Index;
