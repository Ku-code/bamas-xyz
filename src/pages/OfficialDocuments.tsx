import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  ExternalLink,
  Building2,
  X,
  ChevronUp,
  Download,
  Eye
} from "lucide-react";

interface OfficialDocument {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  fileName: string;
  path: string;
}

const OFFICIAL_DOCS: OfficialDocument[] = [
  {
    id: "ustav",
    title: "Устав на БАЗАП",
    titleEn: "BAMAS Articles of Association",
    description: "Официален устав на сдружението от 06.01.2026",
    descriptionEn: "Official Articles of Association from 06.01.2026",
    fileName: "Устав на БАЗАП 06012026.pdf",
    path: "/OFFICIAL_DOCUMENTS/Устав на БАЗАП 06012026.pdf"
  },
  {
    id: "info-package",
    title: "Информационен пакет",
    titleEn: "Information Package",
    description: "Информационен пакет за членство в БАЗАП",
    descriptionEn: "BAMAS membership information package",
    fileName: "Информационен пакет БАЗАП.pdf",
    path: "/OFFICIAL_DOCUMENTS/Информационен пакет БАЗАП.pdf"
  },
  {
    id: "application-form-1",
    title: "Формуляр за кандидатстване",
    titleEn: "Application Form",
    description: "Формуляр за кандидатстване за членство в БАЗАП",
    descriptionEn: "BAMAS membership application form",
    fileName: "БАЗАП Формуляр за кандидатстване.pdf",
    path: "/OFFICIAL_DOCUMENTS/БАЗАП Формуляр за кандидатстване.pdf"
  },
  {
    id: "application-form-2",
    title: "Формуляр за кандидатстване (алтернативен)",
    titleEn: "Application Form (Alternative)",
    description: "Алтернативен формуляр за кандидатстване",
    descriptionEn: "Alternative membership application form",
    fileName: "БАЗАП Формуляр за кандидатстване (1).pdf",
    path: "/OFFICIAL_DOCUMENTS/БАЗАП Формуляр за кандидатстване (1).pdf"
  }
];

const OfficialDocuments = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [selectedDoc, setSelectedDoc] = useState<OfficialDocument | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return true;
  });

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
      return language === 'bg'
        ? '/bamas-uploads/BAMAS_Logo_bg.png'
        : '/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
    } else {
      return language === 'bg'
        ? '/logos/BAMAS_LOGO_inkscape_file_6.PNG'
        : '/logos/BAMAS_LOGO_inkscape_file_4 2.PNG';
    }
  }, [language, isDarkMode]);

  const downloadPDF = (doc: OfficialDocument) => {
    const link = document.createElement('a');
    link.href = doc.path;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash && window.location.pathname === '/documents') {
        navigate('/' + window.location.hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />

      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="fixed top-20 right-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 shadow-lg hover:bg-background hover:scale-110 transition-all"
        title={t("documents.close") || "Close"}
      >
        <X className="h-5 w-5" />
      </Button>

      {showScrollTop && (
        <Button
          variant="default"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-8 right-4 z-50 h-12 w-12 rounded-full bg-primary shadow-lg hover:shadow-xl hover:scale-110 transition-all animate-in fade-in slide-in-from-bottom-5"
          title={t("documents.scroll_to_top") || "Back to Top"}
        >
          <ChevronUp className="h-6 w-6" />
        </Button>
      )}

      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-primary/5 via-background to-background border-b border-border/40">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="h-32 w-32 md:h-40 md:w-40">
              <img
                key={`${logoPath}-${isDarkMode}`}
                src={logoPath}
                alt={language === "bg" ? "БАЗАП Лого" : "BAMAS Logo"}
                style={{ borderRadius: '1.5rem' }}
                className="w-full h-full object-contain transition-opacity duration-300 shadow-lg"
                loading="eager"
                fetchPriority="high"
                onError={(e) => {
                  if (!isDarkMode) {
                    const fallbackPath = language === 'bg'
                      ? '/bamas-uploads/BAMAS_Logo_bg.png'
                      : '/bamas-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
                    e.currentTarget.src = fallbackPath;
                  }
                }}
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            {t("documents.title") || "Official Documents"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8 font-normal">
            {t("documents.subtitle") || "Articles of Association and Official Registry Information"}
          </p>

          <div className="mt-6 text-center">
            <a
              href="https://portal.registryagency.bg/CR/en/Reports/ActiveConditionTabResult?uic=208630654"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <Building2 className="h-4 w-4" />
              {t("documents.commercial_register") || "View Commercial Register"}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {OFFICIAL_DOCS.map((doc) => (
              <Card
                key={doc.id}
                className="shadow-lg border-border/40 hover:shadow-xl transition-all cursor-pointer group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold mb-2">
                        {language === 'bg' ? doc.title : doc.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4 font-normal">
                        {language === 'bg' ? doc.description : doc.descriptionEn}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => setSelectedDoc(doc)}
                          className="flex-1"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          {language === 'bg' ? 'Преглед' : 'View'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPDF(doc)}
                          className="flex-1"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {language === 'bg' ? 'Изтегли' : 'Download'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDoc && (
            <Card className="shadow-2xl border-2 border-primary/20">
              <CardContent className="p-0">
                <div className="bg-muted/20 p-4 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold">
                      {language === 'bg' ? selectedDoc.title : selectedDoc.titleEn}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadPDF(selectedDoc)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {language === 'bg' ? 'Изтегли' : 'Download'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDoc(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="w-full h-[800px]">
                  <iframe
                    src={selectedDoc.path}
                    className="w-full h-full border-0"
                    title={language === 'bg' ? selectedDoc.title : selectedDoc.titleEn}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default OfficialDocuments;
