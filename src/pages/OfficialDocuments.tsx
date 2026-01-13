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
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const OfficialDocuments = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);

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

  // Use same logo logic as navbar
  const logoPath = useMemo(() => {
    if (isDarkMode) {
      // Dark mode: use white logos from /lovable-uploads
      return language === 'bg' 
        ? '/lovable-uploads/BAMAS_Logo_bg.png'
        : '/lovable-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
    } else {
      // Light mode: use dark logos from /logos folder
      return language === 'bg'
        ? '/logos/BAMAS_LOGO_inkscape_file_6.PNG'
        : '/logos/BAMAS_LOGO_inkscape_file_4 2.PNG';
    }
  }, [language, isDarkMode]);

  const downloadPDF = () => {
    // Download the official PDF from public folder
    const link = document.createElement('a');
    link.href = '/OFFICIAL_DOCUMENTS/Устав на БАЗАП 06012026.pdf';
    link.download = 'BAMAS-Ustav-Articles-of-Association-06012026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Search functionality
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === search.toLowerCase() 
        ? `<mark class="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded px-0.5">${part}</mark>`
        : part
    ).join('');
  };


  // Search functionality
  const highlightText = (text: string, search: string) => {
    if (!search.trim()) return text;
    
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === search.toLowerCase() 
        ? `<mark class="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded px-0.5">${part}</mark>`
        : part
    ).join('');
  };

  // Effect to count and highlight matches
  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchCount(0);
      setCurrentMatch(0);
      // Remove all highlights
      const content = document.getElementById('ustav-content');
      if (content) {
        const marks = content.querySelectorAll('mark');
        marks.forEach(mark => {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
            parent.normalize();
          }
        });
      }
      return;
    }

    const content = document.getElementById('ustav-content');
    if (!content) return;

    const textContent = content.innerText.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    const regex = new RegExp(searchLower, 'gi');
    const matches = textContent.match(regex);
    setMatchCount(matches ? matches.length : 0);
    setCurrentMatch(matches && matches.length > 0 ? 1 : 0);

    // Highlight all matches
    const walker = document.createTreeWalker(
      content,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent || '';
      if (regex.test(text)) {
        const span = document.createElement('span');
        span.innerHTML = text.replace(regex, (match) => 
          `<mark class="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white rounded px-0.5 transition-colors">${match}</mark>`
        );
        textNode.parentNode?.replaceChild(span, textNode);
      }
    });

    // Scroll to first match
    const firstMark = content.querySelector('mark');
    if (firstMark) {
      firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstMark.classList.add('ring-2', 'ring-primary');
    }
  }, [searchTerm]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    const content = document.getElementById('ustav-content');
    if (!content) return;

    const marks = Array.from(content.querySelectorAll('mark'));
    if (marks.length === 0) return;

    // Remove current highlight
    marks.forEach(mark => mark.classList.remove('ring-2', 'ring-primary'));

    let newIndex = currentMatch - 1; // Convert to 0-based
    if (direction === 'next') {
      newIndex = (newIndex + 1) % marks.length;
    } else {
      newIndex = (newIndex - 1 + marks.length) % marks.length;
    }

    setCurrentMatch(newIndex + 1); // Convert back to 1-based
    const targetMark = marks[newIndex];
    targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    targetMark.classList.add('ring-2', 'ring-primary');
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      {/* Close Button - Fixed Position */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/')}
        className="fixed top-20 right-4 z-50 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/40 shadow-lg hover:bg-background hover:scale-110 transition-all"
        title={t("documents.close") || "Close"}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Search Bar - Fixed Position */}
      <div className="fixed top-32 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
        <Card className="shadow-lg border-border/40 bg-background/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("documents.search_placeholder") || "Search in document..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {searchTerm && (
                <>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                    <span className="font-medium">{currentMatch}/{matchCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigateMatch('prev')}
                      disabled={matchCount === 0}
                      title={t("documents.previous_match") || "Previous"}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => navigateMatch('next')}
                      disabled={matchCount === 0}
                      title={t("documents.next_match") || "Next"}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={clearSearch}
                      title={t("documents.clear_search") || "Clear"}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Hero Header */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-primary/5 via-background to-background border-b border-border/40">
        <div className="container mx-auto max-w-4xl text-center">
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
                  console.warn('Documents page logo failed to load:', e.currentTarget.src);
                  // Fallback to dark mode logos if light mode logos fail
                  if (!isDarkMode) {
                    const fallbackPath = language === 'bg'
                      ? '/lovable-uploads/BAMAS_Logo_bg.png'
                      : '/lovable-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';
                    e.currentTarget.src = fallbackPath;
                  }
                }}
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            {t("documents.title") || "Official Documents"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("documents.subtitle") || "Articles of Association and Official Registry Information"}
          </p>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              size="lg"
              variant="default"
              className="rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={() => window.open('https://portal.registryagency.bg/CR/en/Reports/ActiveConditionTabResult?uic=208630654', '_blank')}
            >
              <Building2 className="mr-2 h-5 w-5" />
              {t("documents.commercial_register") || "Commercial Register"}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
            
            <Button
              size="lg"
              variant="default"
              className="rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/80"
              onClick={downloadPDF}
            >
              <FileText className="mr-2 h-5 w-5" />
              {t("documents.download_official_pdf") || "Download Official PDF"}
            </Button>
          </div>
        </div>
      </section>

      {/* Document Content */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-2xl">
            <CardContent className="p-8 md:p-12" id="ustav-content">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                <h1 className="text-3xl font-bold mb-2 border-l-4 border-primary pl-4">ОФИЦИАЛЕН УСТАВ</h1>
                <p className="text-muted-foreground italic mb-8">
                  На Сдружение „Българска асоциация за адитивно производство" (БАЗАП)
                </p>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА І. ОБЩИ ПОЛОЖЕНИЯ
                </h2>
                
                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 1. Наименование и правен статут</span>
                  <p className="mb-3">1. Сдружението носи наименованието „Българска асоциация за адитивно производство", съкратено <strong>БАЗАП</strong>.</p>
                  <p className="mb-3">2. На английски език организацията използва наименованието „Bulgarian Additive Manufacturing Association", съкратено <strong>BAMAS</strong>.</p>
                  <p className="mb-3">3. Асоциацията е сдружение с нестопанска цел за осъществяване на дейност в частна полза, съгласно ЗЮЛНЦ.</p>
                  <p>7. Седалището и адресът на управление са: <strong>гр. София, п.к. 1616, район Витоша, ул. Чукар №1</strong>.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 2. Защита на личните данни</span>
                  <p>1. Асоциацията обработва лични данни в съответствие с Регламент (ЕС) 2016/679 (GDPR) и Закона за защита на личните данни (ЗЗЛД).</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА ІІ. ЦЕЛИ И ЗАДАЧИ
                </h2>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 3. Цели на Асоциацията</span>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Да обединява усилията на българските компании, специалисти и научни организации в областта на адитивното производство и 3D принтирането.</li>
                    <li>Да представлява и защитава интересите на своите членове пред държавни и международни органи.</li>
                    <li>Да популяризира постиженията и иновациите на своите членове в страната и чужбина.</li>
                    <li>Да насърчава предприемачеството и създаването на нови продукти и технологии в областта на мехатрониката и роботизацията.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 5. Предмет на дейност</span>
                  <p className="mb-3"><strong>Основна нестопанска дейност:</strong> Обединяване и представителство на лица в областта на 3D принтирането, дигиталното проектиране и автоматизацията.</p>
                  <p><strong>Допълнителна стопанска дейност:</strong> Консултантски услуги, обучения, семинари и маркетингови проучвания, свързани с целите на асоциацията.</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА ІІІ. ЧЛЕНСТВО
                </h2>
                
                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 8. Видове членство</span>
                  <p className="mb-3">Членството е доброволно. Членовете на Асоциацията се делят на:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Редовни членове</li>
                    <li>Асоциирани членове</li>
                    <li>Почетни членове</li>
                    <li>Активни членове (доброволци)</li>
                  </ul>
                </div>

                <div className="mt-12 pt-8 border-t border-border">
                  <p className="text-sm text-muted-foreground text-center">
                    © 2026 БАЗАП / BAMAS. Всички права запазени. | 
                    <a href="mailto:info@bamas.xyz" className="text-primary hover:underline ml-1">
                      info@bamas.xyz
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <FooterSection />
    </div>
  );
};

export default OfficialDocuments;
