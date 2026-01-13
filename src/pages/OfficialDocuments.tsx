import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";
import { FooterSection } from "@/components/ui/footer-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  FileCode,
  Building2 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const OfficialDocuments = () => {
  const { t, language } = useLanguage();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const downloadHTML = () => {
    const htmlContent = document.getElementById('ustav-content')?.outerHTML || '';
    const fullHTML = `
<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Устав на БАЗАП | BAMAS Official Documents</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        :root {
            --bamas-blue: #0056b3;
            --bamas-dark: #1a1a1a;
            --text-gray: #4a4a4a;
            --bg-light: #f8f9fa;
            --white: #ffffff;
        }
        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-light);
            color: var(--bamas-dark);
            line-height: 1.7;
            margin: 0;
            padding: 40px;
            max-width: 900px;
            margin: 0 auto;
        }
        h1 { color: var(--bamas-dark); font-size: 1.8rem; border-left: 4px solid var(--bamas-blue); padding-left: 15px; margin-top: 40px; }
        h2 { color: var(--bamas-blue); font-size: 1.4rem; margin-top: 30px; text-transform: uppercase; letter-spacing: 1px; }
        .article-box {
            margin-bottom: 30px;
            padding: 20px;
            border-radius: 6px;
            background: white;
            border: 1px solid #e0e0e0;
        }
        .article-title { font-weight: 700; color: var(--bamas-dark); display: block; margin-bottom: 8px; font-size: 1.1rem; }
        ul { padding-left: 20px; }
        li { margin-bottom: 10px; }
        .logo-header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px 20px;
            background: var(--bamas-dark);
            color: white;
            border-radius: 8px;
        }
        .logo-container {
            font-weight: 800;
            font-size: 2.2rem;
            letter-spacing: -1px;
            margin-bottom: 10px;
        }
        .logo-container span {
            color: var(--bamas-blue);
        }
        .subtitle {
            font-size: 1.1rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="logo-header">
        <div class="logo-container">БАЗАП <span>BAMAS</span></div>
        <div class="subtitle">БЪЛГАРСКА АСОЦИАЦИЯ ЗА АДИТИВНО ПРОИЗВОДСТВО</div>
        <div class="subtitle">National Association for Additive Manufacturing in Bulgaria</div>
    </div>
    ${htmlContent}
</body>
</html>`;

    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'BAMAS-Ustav-Articles-of-Association.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    // Download the official PDF from public folder
    const link = document.createElement('a');
    link.href = '/OFFICIAL_DOCUMENTS/Устав на БАЗАП 06012026.pdf';
    link.download = 'BAMAS-Ustav-Articles-of-Association-06012026.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = document.getElementById('ustav-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save('BAMAS-Ustav-Web-Version.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <Navbar />
      
      {/* Hero Header */}
      <section className="pt-32 pb-16 px-4 bg-gradient-to-br from-primary/5 via-background to-background border-b border-border/40">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/lovable-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png"
              alt="BAMAS Logo"
              className="h-24 w-24 object-contain"
            />
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full shadow-lg hover:shadow-xl transition-all"
                  disabled={isGeneratingPDF}
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isGeneratingPDF 
                    ? t("documents.generating") || "Generating..." 
                    : t("documents.more_options") || "More Options"
                  }
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={downloadHTML}>
                  <FileCode className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{t("documents.download_html") || "Download as HTML"}</span>
                    <span className="text-xs text-muted-foreground">{t("documents.html_desc") || "Web version"}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={generatePDF} disabled={isGeneratingPDF}>
                  <FileText className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{t("documents.generate_pdf") || "Generate PDF from Page"}</span>
                    <span className="text-xs text-muted-foreground">{t("documents.pdf_desc") || "Current view"}</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
