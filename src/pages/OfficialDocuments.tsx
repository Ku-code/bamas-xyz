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
  ChevronUp,
  Download
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
          
          {/* Action Button */}
          <div className="flex justify-center">
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
          
          {/* Commercial Register Link - Moved to text link below */}
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
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Сдружението носи наименованието „Българска асоциация за адитивно производство", съкратено <strong>БАЗАП</strong>.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>На английски език организацията използва наименованието „Bulgarian Additive Manufacturing Association", съкратено <strong>BAMAS</strong>.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Асоциацията е сдружение с нестопанска цел за осъществяване на дейност в частна полза, съгласно Закона за юридическите лица с нестопанска цел (ЗЮЛНЦ).</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">4.</span>В настоящия устав и във всички официални документи се използва терминът „асоциация" като международно разпознаваем еквивалент на „сдружение".</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">5.</span>Асоциацията е юридическо лице, което се създава и съществува в съответствие с българското законодателство.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">6.</span>Асоциацията придобива статут на юридическо лице от датата на вписването си в съответния регистър.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">7.</span>Седалището и адресът на управление са: <strong>гр. София, п.к. 1616, район Витоша, ул. Чукар №1</strong>.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">8.</span>Асоциацията може да открива клонове и представителства в страната и чужбина.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">9.</span>Асоциацията има кръгъл печат с надпис на български и английски език.</p>
                  <p><span className="font-bold text-primary mr-2">10.</span>Официалните езици на Асоциацията са български и английски.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 2. Защита на личните данни</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Асоциацията обработва лични данни в съответствие с Регламент (ЕС) 2016/679 (GDPR), Закона за защита на личните данни (ЗЗЛД) и вътрешните си правила.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Предприемат се всички необходими технически и организационни мерки за гарантиране на поверителността на личните данни.</p>
                  <p><span className="font-bold text-primary mr-2">3.</span>Всеки член има право на достъп, коригиране и изтриване на своите лични данни в съответствие с приложимото законодателство.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 3. Срок на съществуване</span>
                  <p><span className="font-bold text-primary mr-2">1.</span>Асоциацията се учредява за неопределен срок.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 4. Имущество и финансиране</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Имуществото на Асоциацията се състои от членски внос, дарения, спонсорства, приходи от дейност и други законни източници.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Имуществото на Асоциацията се използва единствено за постигане на уставните цели.</p>
                  <p><span className="font-bold text-primary mr-2">3.</span>Управителният съвет определя размера на членския внос.</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА ІІ. ЦЕЛИ И ЗАДАЧИ
                </h2>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 5. Цели на Асоциацията</span>
                  <p className="mb-3">Асоциацията има за цел:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Да обединява усилията на българските компании, специалисти и научни организации в областта на адитивното производство и 3D принтирането.</li>
                    <li>Да представлява и защитава интересите на своите членове пред държавни и международни органи.</li>
                    <li>Да популяризира постиженията и иновациите на своите членове в страната и чужбина.</li>
                    <li>Да подкрепя научноизследователската и развойна дейност в областта на адитивните технологии.</li>
                    <li>Да насърчава предприемачеството и създаването на нови продукти и технологии в областта на мехатрониката и роботизацията.</li>
                    <li>Да способства за развитието на образованието и квалификацията на кадрите в сектора.</li>
                    <li>Да съдейства за разработването на стандарти и нормативи в областта на адитивното производство.</li>
                    <li>Да организира и участва в национални и международни проекти, изложения, конференции и обучения.</li>
                    <li>Да развива партньорства и сътрудничество с български и международни организации със сходни цели.</li>
                    <li>Да стимулира участието на България в европейски проекти за чисти технологии и кръгова икономика.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 6. Задачи на Асоциацията</span>
                  <p className="mb-3">За постигане на своите цели Асоциацията извършва следните задачи:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Представителство на членовете пред държавни органи, обществени организации и бизнес структури.</li>
                    <li>Организиране на обучения, семинари, конференции и работни срещи.</li>
                    <li>Издаване на публикации, информационни материали и дигитални ресурси.</li>
                    <li>Консултантска дейност и експертни оценки в областта на адитивното производство.</li>
                    <li>Изграждане и поддържане на информационна платформа за членовете.</li>
                    <li>Участие в изработването на национални стратегии и политики в областта на високите технологии.</li>
                    <li>Създаване на условия за обмен на опит и добри практики между членовете.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 7. Предмет на дейност</span>
                  <p className="mb-3"><strong>1. Основна нестопанска дейност:</strong></p>
                  <p className="mb-3 pl-6">Обединяване и представителство на физически и юридически лица в областта на адитивното производство, 3D принтирането, дигиталното проектиране и автоматизацията. Организиране на образователни, научни и културни мероприятия.</p>
                  <p className="mb-3"><strong>2. Допълнителна стопанска дейност:</strong></p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Консултантски услуги в областта на адитивните технологии и дигиталното производство.</li>
                    <li>Организиране на обучения, семинари, курсове и сертификационни програми.</li>
                    <li>Маркетингови проучвания и анализи на пазара.</li>
                    <li>Издателска дейност - публикации, ръководства, методични материали.</li>
                    <li>Организиране на изложби, демонстрации и представяния.</li>
                  </ul>
                  <p className="pl-6"><strong>3.</strong> Приходите от допълнителната стопанска дейност се използват единствено за постигане на уставните цели на Асоциацията.</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА ІІІ. ЧЛЕНСТВО
                </h2>
                
                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 8. Видове членство</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Членството в Асоциацията е доброволно.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Членовете на Асоциацията се делят на:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Редовни членове</strong> – юридически лица или дееспособни физически лица, които отговарят на условията по чл. 9.</li>
                    <li><strong>Асоциирани членове</strong> – лица, които подкрепят дейността на Асоциацията, но нямат право на глас.</li>
                    <li><strong>Почетни членове</strong> – лица с изключителни заслуги към развитието на сектора на адитивното производство.</li>
                    <li><strong>Активни членове (доброволци)</strong> – лица, които участват пряко в проектите и инициативите на Асоциацията.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 9. Условия за членство</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Редовни членове могат да бъдат юридически лица или дееспособни физически лица, които:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Споделят целите и задачите на Асоциацията;</li>
                    <li>Подадат писмено заявление за членство;</li>
                    <li>Бъдат приети с решение на Управителния съвет;</li>
                    <li>Заплатят определения членски внос.</li>
                  </ul>
                  <p><span className="font-bold text-primary mr-2">2.</span>Почетни членове се избират от Общото събрание по предложение на Управителния съвет.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 10. Права на членовете</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Редовните членове имат право на:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Участие в Общото събрание с право на глас;</li>
                    <li>Избиране и да бъдат избирани в ръководните органи на Асоциацията;</li>
                    <li>Достъп до информация за дейността на Асоциацията;</li>
                    <li>Ползване на услугите и ресурсите на Асоциацията;</li>
                    <li>Внасяне на предложения по въпроси от дейността на Асоциацията;</li>
                    <li>Участие в проекти и инициативи на Асоциацията.</li>
                  </ul>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Асоциираните членове имат право на:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Участие в Общото събрание без право на глас;</li>
                    <li>Достъп до информация и ресурси на Асоциацията;</li>
                    <li>Ползване на определени услуги на Асоциацията.</li>
                  </ul>
                  <p><span className="font-bold text-primary mr-2">3.</span>Почетните членове имат всички права на редовните членове, освен ако сами се откажат от тях.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 11. Задължения на членовете</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Членовете на Асоциацията са длъжни да:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>Спазват устава и решенията на органите на Асоциацията;</li>
                    <li>Заплащат редовно членския си внос в определените срокове;</li>
                    <li>Съдействат активно за постигане на целите на Асоциацията;</li>
                    <li>Не извършват действия, които вредят на репутацията и интересите на Асоциацията;</li>
                    <li>Уведомяват своевременно за промени в данните си.</li>
                  </ul>
                  <p><span className="font-bold text-primary mr-2">2.</span>Неизпълнението на задълженията може да доведе до спиране или прекратяване на членството.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 12. Прекратяване на членството</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Членството в Асоциацията се прекратява:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>С писмена молба до Управителния съвет;</li>
                    <li>При смърт на физическото лице или прекратяване на юридическото лице;</li>
                    <li>При неплащане на членски внос за повече от една година;</li>
                    <li>При грубо нарушаване на устава или решенията на органите;</li>
                    <li>С решение на Общото събрание при действия, накърняващи престижа на Асоциацията.</li>
                  </ul>
                  <p><span className="font-bold text-primary mr-2">2.</span>Решението за изключване се взема от Управителния съвет и може да се обжалва пред Общото събрание.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 13. Членски внос</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Всеки член на Асоциацията заплаща годишен членски внос.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Размерът на членския внос се определя от Управителния съвет и се одобрява от Общото събрание.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Членският внос се заплаща в началото на всяка календарна година.</p>
                  <p><span className="font-bold text-primary mr-2">4.</span>Почетните членове могат да бъдат освободени от заплащане на членски внос с решение на Общото събрание.</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА IV. ОРГАНИ НА УПРАВЛЕНИЕ
                </h2>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 14. Органи на управление</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Органи на Асоциацията са:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Общото събрание</strong> – върховен орган;</li>
                    <li><strong>Управителният съвет</strong> – колективен изпълнителен орган.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 15. Общо събрание – състав и правомощия</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Общото събрание е върховен орган на Асоциацията.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Общото събрание се състои от всички редовни членове на Асоциацията.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Общото събрание:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Приема и изменя устава на Асоциацията;</li>
                    <li>Избира и освобождава членовете на Управителния съвет;</li>
                    <li>Приема годишния финансов отчет и бюджет;</li>
                    <li>Определя основните насоки на дейността;</li>
                    <li>Взема решение за приемане на почетни членове;</li>
                    <li>Взема решение за прекратяване дейността на Асоциацията;</li>
                    <li>Решава други въпроси, предвидени в устава.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 16. Свикване на Общо събрание</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Общото събрание се свиква най-малко веднъж годишно от Управителния съвет.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Извънредно Общо събрание се свиква:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>По инициатива на Управителния съвет;</li>
                    <li>При писмено искане на най-малко една трета от редовните членове.</li>
                  </ul>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Поканата за Общо събрание се изпраща на членовете най-малко 14 дни предварително.</p>
                  <p><span className="font-bold text-primary mr-2">4.</span>Поканата трябва да съдържа дневен ред, дата, час и място на провеждане.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 17. Кворум и гласуване</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Общото събрание е законно, ако присъстват повече от половината редовни членове.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>При липса на кворум се насрочва ново събрание един час по-късно, което е законно при всякакъв брой присъстващи.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Решенията се вземат с обикновено мнозинство, освен в случаите, предвидени в устава.</p>
                  <p><span className="font-bold text-primary mr-2">4.</span>За изменение на устава и прекратяване на Асоциацията се изисква мнозинство от две трети от присъстващите.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 18. Управителен съвет – състав</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Управителният съвет се състои от 3 до 7 членове.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Членовете на Управителния съвет се избират от Общото събрание за срок от 5 години.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Управителният съвет избира измежду членовете си Председател и Заместник-председател.</p>
                  <p><span className="font-bold text-primary mr-2">4.</span>Членовете на Управителния съвет могат да бъдат преизбирани неограничен брой пъти.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 19. Правомощия на Управителния съвет</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Управителният съвет:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Управлява дейността на Асоциацията между заседанията на Общото събрание;</li>
                    <li>Изпълнява решенията на Общото събрание;</li>
                    <li>Приема нови членове и решава въпросите за изключване;</li>
                    <li>Разпорежда се с имуществото на Асоциацията;</li>
                    <li>Подготвя годишния отчет и бюджет за одобрение от Общото събрание;</li>
                    <li>Свиква Общото събрание;</li>
                    <li>Представлява Асоциацията пред трети лица;</li>
                    <li>Назначава и освобождава служители;</li>
                    <li>Създава работни групи и комисии;</li>
                    <li>Взема решения по всички въпроси, които не са от изключителната компетентност на Общото събрание.</li>
                  </ul>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 20. Заседания на Управителния съвет</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Управителният съвет се събира най-малко веднъж на тримесечие.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Заседанията се свикват от Председателя или при искане на една трета от членовете.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">3.</span>Заседанието е законно при присъствие на повече от половината членове.</p>
                  <p><span className="font-bold text-primary mr-2">4.</span>Решенията се вземат с обикновено мнозинство от присъстващите.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 21. Председател на Управителния съвет</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Председателят:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Организира и ръководи дейността на Управителния съвет;</li>
                    <li>Представлява Асоциацията пред трети лица;</li>
                    <li>Подписва документите на Асоциацията;</li>
                    <li>Свиква и ръководи заседанията на Управителния съвет.</li>
                  </ul>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА V. ОТЧЕТНОСТ И ФИНАНСОВ КОНТРОЛ
                </h2>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 22. Отчетност</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Управителният съвет представя пред Общото събрание годишен отчет за дейността и финансов отчет.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Асоциацията води счетоводство и отчетност съгласно действащото законодателство.</p>
                  <p><span className="font-bold text-primary mr-2">3.</span>Финансовата година съвпада с календарната.</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА VI. ПРЕКРАТЯВАНЕ И ЛИКВИДАЦИЯ
                </h2>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 23. Прекратяване</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>Асоциацията се прекратява:</p>
                  <ul className="list-disc pl-6 space-y-2 mb-3">
                    <li>С решение на Общото събрание, прието с мнозинство от две трети от членовете;</li>
                    <li>По съдебен ред;</li>
                    <li>При обявяване в несъстоятелност;</li>
                    <li>При невъзможност за постигане на уставните цели.</li>
                  </ul>
                  <p><span className="font-bold text-primary mr-2">2.</span>При прекратяване се извършва ликвидация, освен в случаите на несъстоятелност.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 24. Разпределение на имуществото</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>При прекратяване на Асоциацията, след удовлетворяване на кредиторите, имуществото се предава на организация с подобни цели.</p>
                  <p><span className="font-bold text-primary mr-2">2.</span>Организацията се определя от Общото събрание.</p>
                </div>

                <h2 className="text-2xl font-bold text-primary mt-12 mb-6 uppercase tracking-wide">
                  ГЛАВА VII. ЗАКЛЮЧИТЕЛНИ РАЗПОРЕДБИ
                </h2>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 25. Спорове и компетентен съд</span>
                  <p><span className="font-bold text-primary mr-2">1.</span>Всички спорове, произтичащи от дейността на Асоциацията или свързани с нея, се решават от компетентния съд в гр. София.</p>
                </div>

                <div className="article-box mb-8 p-6 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors">
                  <span className="article-title block font-bold text-lg mb-3">Чл. 26. Заключителни разпоредби</span>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">1.</span>За всички неуредени в настоящия устав въпроси се прилагат разпоредбите на Закона за юридическите лица с нестопанска цел и общото българско законодателство.</p>
                  <p className="mb-3"><span className="font-bold text-primary mr-2">2.</span>Настоящият устав е приет на учредително събрание, проведено на <strong>06 януари 2026 година</strong>.</p>
                  <p><span className="font-bold text-primary mr-2">3.</span>Уставът влиза в сила от датата на вписване на Асоциацията в съответния регистър.</p>
                </div>

                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex flex-col items-center gap-6 mb-8">
                    <p className="text-center text-muted-foreground max-w-2xl">
                      Можете да изтеглите официалния документ на Устава в PDF формат за офлайн четене, архивиране или печат.
                    </p>
                    <Button
                      size="lg"
                      variant="default"
                      onClick={downloadPDF}
                      className="rounded-full shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/80 px-8"
                    >
                      <FileText className="mr-2 h-5 w-5" />
                      {t("documents.read_official_pdf") || "Read the Official Articles of Association Document"}
                      <Download className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  
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
