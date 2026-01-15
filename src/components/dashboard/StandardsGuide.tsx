import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BookOpen,
  Search,
  ExternalLink,
  FileText,
  Shield,
  Plane,
  Stethoscope,
  Factory,
  Cog,
  Filter,
  Star,
  Info,
} from "lucide-react";

interface Standard {
  id: string;
  code: string;
  title: string;
  description: string;
  organization: 'ISO' | 'ASTM' | 'EN' | 'DIN' | 'Other';
  category: 'general' | 'medical' | 'aerospace' | 'materials' | 'testing' | 'quality' | 'safety';
  scope?: string;
  year?: string;
  url?: string;
  tags: string[];
  isFeatured?: boolean;
}

// AM Standards Database
const STANDARDS_DATABASE: Standard[] = [
  // General AM Standards
  {
    id: "1",
    code: "ISO/ASTM 52900",
    title: "Additive manufacturing — General principles — Fundamentals and vocabulary",
    description: "Establishes and defines terms used in additive manufacturing (AM) technology. It applies to all stages of the AM process chain.",
    organization: "ISO",
    category: "general",
    scope: "Defines the fundamental concepts, terminology, and processes for additive manufacturing.",
    year: "2021",
    url: "https://www.iso.org/standard/74514.html",
    tags: ["terminology", "fundamentals", "vocabulary", "basics"],
    isFeatured: true,
  },
  {
    id: "2",
    code: "ISO/ASTM 52901",
    title: "Additive manufacturing — General principles — Requirements for purchased AM parts",
    description: "Specifies the technical requirements that should be agreed upon between buyer and supplier when buying AM parts.",
    organization: "ISO",
    category: "general",
    year: "2017",
    url: "https://www.iso.org/standard/67288.html",
    tags: ["procurement", "requirements", "purchasing", "specifications"],
  },
  {
    id: "3",
    code: "ISO/ASTM 52910",
    title: "Additive manufacturing — Design — Requirements, guidelines and recommendations",
    description: "Gives guidelines and recommendations for using additive manufacturing in product design.",
    organization: "ISO",
    category: "general",
    year: "2018",
    url: "https://www.iso.org/standard/67289.html",
    tags: ["design", "guidelines", "DfAM", "recommendations"],
    isFeatured: true,
  },
  {
    id: "4",
    code: "ISO/ASTM 52911-1",
    title: "Additive manufacturing — Design — Part 1: Laser-based powder bed fusion of metals",
    description: "Provides design recommendations for additive manufacturing using laser-based powder bed fusion of metals.",
    organization: "ISO",
    category: "general",
    year: "2019",
    url: "https://www.iso.org/standard/72951.html",
    tags: ["design", "LPBF", "metal", "powder bed"],
  },
  {
    id: "5",
    code: "ISO/ASTM 52911-2",
    title: "Additive manufacturing — Design — Part 2: Laser-based powder bed fusion of polymers",
    description: "Provides design recommendations for additive manufacturing using laser-based powder bed fusion of polymers.",
    organization: "ISO",
    category: "general",
    year: "2019",
    url: "https://www.iso.org/standard/72952.html",
    tags: ["design", "LPBF", "polymer", "SLS"],
  },
  
  // Medical/Healthcare Standards
  {
    id: "10",
    code: "ISO 13485",
    title: "Medical devices — Quality management systems",
    description: "Specifies requirements for a quality management system for medical device organizations.",
    organization: "ISO",
    category: "medical",
    year: "2016",
    url: "https://www.iso.org/standard/59752.html",
    tags: ["medical", "quality", "QMS", "devices"],
    isFeatured: true,
  },
  {
    id: "11",
    code: "ASTM F3177",
    title: "Standard Specification for Metal Powder Bed Fusion for Implant Applications",
    description: "Covers requirements for metal powder bed fusion AM processes used to fabricate medical implants.",
    organization: "ASTM",
    category: "medical",
    year: "2015",
    url: "https://www.astm.org/f3177-15.html",
    tags: ["implants", "metal", "powder bed", "medical"],
    isFeatured: true,
  },
  {
    id: "12",
    code: "ASTM F3001",
    title: "Standard Specification for Titanium Alloy for Powder Bed Fusion",
    description: "Covers titanium-6aluminum-4vanadium (Ti-6Al-4V) produced by additive manufacturing using powder bed fusion technology.",
    organization: "ASTM",
    category: "medical",
    year: "2021",
    url: "https://www.astm.org/f3001-21.html",
    tags: ["titanium", "Ti-6Al-4V", "powder bed", "implants"],
  },
  {
    id: "13",
    code: "FDA Guidance",
    title: "Technical Considerations for Additive Manufactured Medical Devices",
    description: "FDA guidance document outlining technical considerations for devices manufactured using AM technology.",
    organization: "Other",
    category: "medical",
    year: "2017",
    url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/technical-considerations-additive-manufactured-medical-devices",
    tags: ["FDA", "regulatory", "guidance", "USA"],
    isFeatured: true,
  },
  
  // Aerospace Standards
  {
    id: "20",
    code: "SAE AMS7003",
    title: "Laser Powder Bed Fusion Process",
    description: "Establishes requirements for the laser powder bed fusion process for critical aerospace applications.",
    organization: "Other",
    category: "aerospace",
    year: "2018",
    url: "https://www.sae.org/standards/content/ams7003/",
    tags: ["aerospace", "LPBF", "process", "SAE"],
    isFeatured: true,
  },
  {
    id: "21",
    code: "SAE AMS7004",
    title: "Directed Energy Deposition for Aerospace Components",
    description: "Covers DED process requirements for aerospace applications.",
    organization: "Other",
    category: "aerospace",
    year: "2019",
    tags: ["aerospace", "DED", "components", "SAE"],
  },
  {
    id: "22",
    code: "NADCAP AC7110/14",
    title: "Additive Manufacturing",
    description: "NADCAP audit criteria for additive manufacturing processes in aerospace.",
    organization: "Other",
    category: "aerospace",
    year: "2020",
    tags: ["NADCAP", "audit", "certification", "aerospace"],
    isFeatured: true,
  },
  {
    id: "23",
    code: "AS9100D",
    title: "Quality Management Systems - Requirements for Aviation, Space, and Defense",
    description: "QMS standard for aerospace industry including AM applications.",
    organization: "Other",
    category: "aerospace",
    year: "2016",
    url: "https://www.sae.org/standards/content/as9100d/",
    tags: ["QMS", "aerospace", "quality", "certification"],
  },
  
  // Materials Standards
  {
    id: "30",
    code: "ISO/ASTM 52907",
    title: "Additive manufacturing — Feedstock materials — Methods to characterize metal powders",
    description: "Specifies methods for characterizing metal powders used in additive manufacturing.",
    organization: "ISO",
    category: "materials",
    year: "2019",
    url: "https://www.iso.org/standard/73565.html",
    tags: ["powder", "metal", "characterization", "testing"],
    isFeatured: true,
  },
  {
    id: "31",
    code: "ASTM F3049",
    title: "Standard Guide for Characterizing Properties of Metal Powders",
    description: "Guide for characterizing properties of metal powders used in AM processes.",
    organization: "ASTM",
    category: "materials",
    year: "2021",
    url: "https://www.astm.org/f3049-21.html",
    tags: ["powder", "metal", "characterization", "properties"],
  },
  {
    id: "32",
    code: "ASTM F3091",
    title: "Standard Specification for Powder Bed Fusion of Plastic Materials",
    description: "Covers requirements for plastic materials used in powder bed fusion AM processes.",
    organization: "ASTM",
    category: "materials",
    year: "2014",
    tags: ["polymer", "plastic", "SLS", "powder"],
  },
  
  // Testing Standards
  {
    id: "40",
    code: "ISO/ASTM 52902",
    title: "Additive manufacturing — Test artifacts — Geometric capability assessment of AM systems",
    description: "Specifies a test artifact for geometric capability assessment of AM systems.",
    organization: "ISO",
    category: "testing",
    year: "2019",
    url: "https://www.iso.org/standard/73012.html",
    tags: ["testing", "geometry", "accuracy", "artifact"],
    isFeatured: true,
  },
  {
    id: "41",
    code: "ISO/ASTM 52904",
    title: "Additive manufacturing — Process characteristics and performance — Metal PBF process specifications",
    description: "Establishes specifications for the metal powder bed fusion process.",
    organization: "ISO",
    category: "testing",
    year: "2019",
    url: "https://www.iso.org/standard/73565.html",
    tags: ["process", "metal", "LPBF", "specifications"],
  },
  {
    id: "42",
    code: "ASTM E3166",
    title: "Standard Guide for Nondestructive Examination of Metal AM Parts",
    description: "Guide for NDE methods applicable to metal parts produced by additive manufacturing.",
    organization: "ASTM",
    category: "testing",
    year: "2020",
    url: "https://www.astm.org/e3166-20.html",
    tags: ["NDE", "NDT", "inspection", "metal"],
    isFeatured: true,
  },
  
  // Quality Standards
  {
    id: "50",
    code: "ISO/ASTM 52920",
    title: "Additive manufacturing — Qualification principles — Requirements for industrial AM processes and sites",
    description: "Specifies requirements for qualification of industrial AM processes and production sites.",
    organization: "ISO",
    category: "quality",
    year: "2023",
    url: "https://www.iso.org/standard/79528.html",
    tags: ["qualification", "industrial", "process", "site"],
    isFeatured: true,
  },
  {
    id: "51",
    code: "ISO/ASTM 52930",
    title: "Additive manufacturing — Qualification principles — Installation, operation and performance (IQ/OQ/PQ) of PBF-LB equipment",
    description: "Specifies installation, operation and performance qualification for laser-based PBF equipment.",
    organization: "ISO",
    category: "quality",
    year: "2021",
    url: "https://www.iso.org/standard/79004.html",
    tags: ["IQ", "OQ", "PQ", "qualification", "LPBF"],
  },
  
  // Safety Standards
  {
    id: "60",
    code: "ISO/ASTM 52931",
    title: "Additive manufacturing — Environmental health and safety — General principles for use of metallic materials",
    description: "Provides guidance on environmental health and safety for AM with metallic materials.",
    organization: "ISO",
    category: "safety",
    year: "2023",
    tags: ["safety", "health", "environment", "metal"],
    isFeatured: true,
  },
  {
    id: "61",
    code: "ASTM F3432",
    title: "Standard Guide for Additive Manufacturing — Facility Safety",
    description: "Guide for establishing safe facilities for additive manufacturing operations.",
    organization: "ASTM",
    category: "safety",
    year: "2020",
    tags: ["facility", "safety", "operations", "guidelines"],
  },
];

const CATEGORIES = [
  { value: 'all', label: 'All Categories', icon: BookOpen },
  { value: 'general', label: 'General AM', icon: Cog },
  { value: 'medical', label: 'Medical/Healthcare', icon: Stethoscope },
  { value: 'aerospace', label: 'Aerospace', icon: Plane },
  { value: 'materials', label: 'Materials', icon: Factory },
  { value: 'testing', label: 'Testing/Inspection', icon: FileText },
  { value: 'quality', label: 'Quality/Qualification', icon: Shield },
  { value: 'safety', label: 'Safety', icon: Shield },
];

const ORGANIZATIONS = [
  { value: 'all', label: 'All Organizations' },
  { value: 'ISO', label: 'ISO' },
  { value: 'ASTM', label: 'ASTM International' },
  { value: 'EN', label: 'European Standards' },
  { value: 'Other', label: 'Other (SAE, FDA, etc.)' },
];

const StandardsGuide = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedOrg, setSelectedOrg] = useState("all");
  const [selectedStandard, setSelectedStandard] = useState<Standard | null>(null);
  
  // Filter standards
  const filteredStandards = STANDARDS_DATABASE.filter(standard => {
    // Category filter
    if (selectedCategory !== "all" && standard.category !== selectedCategory) return false;
    
    // Organization filter
    if (selectedOrg !== "all" && standard.organization !== selectedOrg) return false;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        standard.code.toLowerCase().includes(query) ||
        standard.title.toLowerCase().includes(query) ||
        standard.description.toLowerCase().includes(query) ||
        standard.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  });
  
  // Featured standards
  const featuredStandards = STANDARDS_DATABASE.filter(s => s.isFeatured);
  
  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    const Icon = cat?.icon || BookOpen;
    return <Icon className="h-4 w-4" />;
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'bg-red-500/10 text-red-600 border-red-500/30';
      case 'aerospace': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'materials': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'testing': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'quality': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case 'safety': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
    }
  };
  
  const getOrgBadge = (org: string) => {
    switch (org) {
      case 'ISO': return 'bg-blue-600 text-white';
      case 'ASTM': return 'bg-red-600 text-white';
      case 'EN': return 'bg-indigo-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.standards.title") || "AM Standards Guide"}</h2>
        </div>
      </div>
      
      <p className="text-muted-foreground">
        {t("dashboard.standards.description") || "Comprehensive library of ISO, ASTM, and industry standards for additive manufacturing. Essential for medical, aerospace, and industrial applications."}
      </p>
      
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder={t("dashboard.standards.search.placeholder") || "Search by code, title, or keyword..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rounded-full pl-10"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px] rounded-full">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    <span className="flex items-center gap-2">
                      <cat.icon className="h-4 w-4" />
                      {cat.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedOrg} onValueChange={setSelectedOrg}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-full">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                {ORGANIZATIONS.map(org => (
                  <SelectItem key={org.value} value={org.value}>{org.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Featured Standards */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {t("dashboard.standards.featured") || "Key Standards"}
            </CardTitle>
            <CardDescription>
              {t("dashboard.standards.featuredDesc") || "Most important standards for AM"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {featuredStandards.map(standard => (
                  <Card
                    key={standard.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedStandard(standard)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge className={`${getOrgBadge(standard.organization)} rounded-full text-xs`}>
                          {standard.organization}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-sm font-semibold text-primary">{standard.code}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{standard.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`rounded-full text-xs ${getCategoryColor(standard.category)}`}>
                          {getCategoryIcon(standard.category)}
                          <span className="ml-1">{standard.category}</span>
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Standards List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("dashboard.standards.list") || "Standards Library"}
              <Badge variant="secondary" className="ml-2 rounded-full">{filteredStandards.length}</Badge>
            </CardTitle>
            <CardDescription>
              {t("dashboard.standards.listDesc") || "Browse all AM standards"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <Accordion type="single" collapsible className="w-full">
                {CATEGORIES.filter(c => c.value !== 'all').map(category => {
                  const categoryStandards = filteredStandards.filter(s => s.category === category.value);
                  if (categoryStandards.length === 0) return null;
                  
                  return (
                    <AccordionItem key={category.value} value={category.value}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-2">
                          <category.icon className="h-4 w-4" />
                          <span>{category.label}</span>
                          <Badge variant="secondary" className="ml-2 rounded-full">{categoryStandards.length}</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {categoryStandards.map(standard => (
                            <Card
                              key={standard.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => setSelectedStandard(standard)}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge className={`${getOrgBadge(standard.organization)} rounded-full text-xs`}>
                                        {standard.organization}
                                      </Badge>
                                      <span className="font-mono text-sm font-semibold text-primary">{standard.code}</span>
                                      {standard.year && (
                                        <span className="text-xs text-muted-foreground">({standard.year})</span>
                                      )}
                                    </div>
                                    <p className="text-sm">{standard.title}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {standard.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="outline" className="rounded-full text-xs">{tag}</Badge>
                                      ))}
                                      {standard.tags.length > 3 && (
                                        <Badge variant="outline" className="rounded-full text-xs">+{standard.tags.length - 3}</Badge>
                                      )}
                                    </div>
                                  </div>
                                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              
              {filteredStandards.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t("dashboard.standards.noResults") || "No standards found matching your criteria"}</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Standard Detail Dialog */}
      <Dialog open={!!selectedStandard} onOpenChange={(open) => !open && setSelectedStandard(null)}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedStandard && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`${getOrgBadge(selectedStandard.organization)} rounded-full`}>
                    {selectedStandard.organization}
                  </Badge>
                  <Badge variant="outline" className={`rounded-full ${getCategoryColor(selectedStandard.category)}`}>
                    {getCategoryIcon(selectedStandard.category)}
                    <span className="ml-1">{selectedStandard.category}</span>
                  </Badge>
                  {selectedStandard.isFeatured && (
                    <Badge variant="secondary" className="rounded-full">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>
                <DialogTitle className="font-mono text-xl text-primary">{selectedStandard.code}</DialogTitle>
                <DialogDescription className="text-base">{selectedStandard.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <h4 className="font-semibold mb-2">{t("dashboard.standards.detail.description") || "Description"}</h4>
                  <p className="text-sm text-muted-foreground">{selectedStandard.description}</p>
                </div>
                
                {selectedStandard.scope && (
                  <div>
                    <h4 className="font-semibold mb-2">{t("dashboard.standards.detail.scope") || "Scope"}</h4>
                    <p className="text-sm text-muted-foreground">{selectedStandard.scope}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedStandard.year && (
                    <div>
                      <span className="text-muted-foreground">{t("dashboard.standards.detail.year") || "Year"}:</span>
                      <span className="ml-2 font-medium">{selectedStandard.year}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">{t("dashboard.standards.detail.org") || "Organization"}:</span>
                    <span className="ml-2 font-medium">{selectedStandard.organization}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">{t("dashboard.standards.detail.tags") || "Keywords"}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedStandard.tags.map(tag => (
                      <Badge key={tag} variant="outline" className="rounded-full">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              {selectedStandard.url && (
                <div className="pt-2">
                  <Button
                    onClick={() => window.open(selectedStandard.url, '_blank')}
                    className="w-full rounded-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("dashboard.standards.viewOfficial") || "View Official Document"}
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StandardsGuide;
