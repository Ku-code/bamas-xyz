import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ExternalLink,
  Lightbulb,
  Target,
  FileText,
  Users,
  Euro,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

// EU Funding Portal URL
const EU_FUNDING_PORTAL_URL = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/calls-for-proposals?isExactMatch=true&status=31094501,31094502,31094503&order=DESC&pageNumber=1&pageSize=50&sortBy=startDate";

// Keywords for additive manufacturing and related technologies
const KEYWORDS = [
  { term: "Additive Manufacturing", hot: true },
  { term: "3D Printing", hot: true },
  { term: "Digital Twins", hot: true },
  { term: "Industry 4.0", hot: false },
  { term: "Advanced Materials", hot: true },
  { term: "AI & Machine Learning", hot: true },
  { term: "Smart Manufacturing", hot: false },
  { term: "Robotics", hot: false },
  { term: "Automation", hot: false },
  { term: "Sustainable Production", hot: true },
  { term: "Circular Economy", hot: false },
  { term: "Green Technology", hot: true },
  { term: "Aerospace", hot: false },
  { term: "Medical Devices", hot: false },
  { term: "Automotive", hot: false },
  { term: "Defence & Security", hot: false },
  { term: "Energy Efficiency", hot: false },
  { term: "IoT & Sensors", hot: false },
  { term: "Photonics", hot: false },
  { term: "Nanotechnology", hot: false },
];

const EUFundsRadar = () => {
  const { t } = useLanguage();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
  };

  const buildSearchUrl = () => {
    if (selectedKeywords.length === 0) {
      return EU_FUNDING_PORTAL_URL;
    }
    // Build search query with selected keywords
    const searchTerms = selectedKeywords.join(" OR ");
    return `${EU_FUNDING_PORTAL_URL}&keywords=${encodeURIComponent(searchTerms)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* EU Flag styled icon */}
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
              <div className="flex flex-wrap w-6 h-6 gap-0.5 items-center justify-center">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 bg-yellow-400 rounded-full"
                    style={{
                      transform: `rotate(${i * 30}deg) translateY(-3px)`,
                      transformOrigin: "center center",
                    }}
                  />
                ))}
              </div>
            </div>
            <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{t("dashboard.eufunds.title") || "EU Funds Radar"}</h2>
            <p className="text-sm text-muted-foreground">
              {t("dashboard.eufunds.subtitle") || "Discover funding opportunities for additive manufacturing"}
            </p>
          </div>
        </div>
      </div>

      {/* Main EU Portal Button */}
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32">
            {/* EU Stars pattern */}
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                style={{
                  top: `${50 + 45 * Math.sin((i * 30 * Math.PI) / 180)}%`,
                  left: `${50 + 45 * Math.cos((i * 30 * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>
        </div>
        <CardContent className="py-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold mb-2">
                {t("dashboard.eufunds.portal.title") || "EU Funding & Tenders Portal"}
              </h3>
              <p className="text-blue-100 max-w-xl">
                {t("dashboard.eufunds.portal.description") || "Access the official European Commission portal for Horizon Europe, Digital Europe, and other EU funding programmes."}
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold rounded-full shadow-lg px-8"
            >
              <a href={buildSearchUrl()} target="_blank" rel="noopener noreferrer">
                <Euro className="h-5 w-5 mr-2" />
                {t("dashboard.eufunds.portal.button") || "Explore Opportunities"}
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Keyword Cloud */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {t("dashboard.eufunds.keywords.title") || "Search Keywords"}
            </CardTitle>
            <CardDescription>
              {t("dashboard.eufunds.keywords.description") || "Select keywords to filter funding opportunities"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {KEYWORDS.map(({ term, hot }) => (
                <Badge
                  key={term}
                  variant={selectedKeywords.includes(term) ? "default" : "outline"}
                  className={`cursor-pointer transition-all rounded-full px-3 py-1 ${
                    selectedKeywords.includes(term)
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-primary/10"
                  } ${hot ? "border-yellow-500/50" : ""}`}
                  onClick={() => toggleKeyword(term)}
                >
                  {hot && <Sparkles className="h-3 w-3 mr-1 text-yellow-500" />}
                  {term}
                </Badge>
              ))}
            </div>
            {selectedKeywords.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedKeywords.length} {t("dashboard.eufunds.keywords.selected") || "keywords selected"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedKeywords([])}
                  className="rounded-full"
                >
                  {t("dashboard.eufunds.keywords.clear") || "Clear all"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* How-to Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              {t("dashboard.eufunds.howto.title") || "How to Apply"}
            </CardTitle>
            <CardDescription>
              {t("dashboard.eufunds.howto.description") || "Quick guide to EU funding applications"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium">{t("dashboard.eufunds.howto.step1.title") || "Create an Account"}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.eufunds.howto.step1.description") || "Register on the EU Funding & Tenders Portal with your organization details."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium">{t("dashboard.eufunds.howto.step2.title") || "Find a Call"}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.eufunds.howto.step2.description") || "Browse open calls matching your expertise and project ideas."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium">{t("dashboard.eufunds.howto.step3.title") || "Build a Consortium"}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.eufunds.howto.step3.description") || "Partner with organizations from different EU countries."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">4</span>
              </div>
              <div>
                <h4 className="font-medium">{t("dashboard.eufunds.howto.step4.title") || "Submit Proposal"}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.eufunds.howto.step4.description") || "Prepare and submit your proposal before the deadline."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Programmes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t("dashboard.eufunds.programmes.title") || "Key EU Programmes"}
          </CardTitle>
          <CardDescription>
            {t("dashboard.eufunds.programmes.description") || "Relevant funding programmes for additive manufacturing"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <h4 className="font-bold text-lg mb-1">Horizon Europe</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t("dashboard.eufunds.programmes.horizon.description") || "Research & Innovation programme with €95.5B budget (2021-2027)"}
              </p>
              <div className="flex items-center gap-2 text-xs text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {t("dashboard.eufunds.programmes.horizon.focus") || "Advanced Manufacturing, Digital Technologies"}
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <h4 className="font-bold text-lg mb-1">Digital Europe</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t("dashboard.eufunds.programmes.digital.description") || "Digital transformation programme with €7.5B budget"}
              </p>
              <div className="flex items-center gap-2 text-xs text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {t("dashboard.eufunds.programmes.digital.focus") || "AI, Cybersecurity, Digital Skills"}
              </div>
            </div>
            <div className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <h4 className="font-bold text-lg mb-1">EIC Accelerator</h4>
              <p className="text-sm text-muted-foreground mb-3">
                {t("dashboard.eufunds.programmes.eic.description") || "Support for startups and SMEs with breakthrough innovations"}
              </p>
              <div className="flex items-center gap-2 text-xs text-primary">
                <CheckCircle2 className="h-3 w-3" />
                {t("dashboard.eufunds.programmes.eic.focus") || "Up to €2.5M grant + €15M equity"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BAMAS Support CTA */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">
                  {t("dashboard.eufunds.support.title") || "Need Help with EU Proposals?"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.eufunds.support.description") || "BAMAS members can access consortium-building support and proposal review services."}
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => window.location.href = "mailto:info@bamas.xyz"}
            >
              {t("dashboard.eufunds.support.button") || "Contact BAMAS"}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EUFundsRadar;
