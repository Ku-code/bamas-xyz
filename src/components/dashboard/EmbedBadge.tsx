import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Code,
  Copy,
  Check,
  ExternalLink,
  Award,
  Shield,
  Star,
  Zap,
  Download,
  Palette,
  Layout,
  Type,
  Image,
} from "lucide-react";

type BadgeStyle = 'standard' | 'compact' | 'minimal' | 'premium';
type BadgeTheme = 'dark' | 'light' | 'auto';
type MemberType = 'member' | 'certified' | 'founding' | 'partner';

interface BadgeConfig {
  style: BadgeStyle;
  theme: BadgeTheme;
  memberType: MemberType;
  showName: boolean;
  showYear: boolean;
  customText?: string;
  width: number;
  language: 'en' | 'bg';
}

const BADGE_STYLES = [
  { value: 'standard', label: 'Standard', description: 'Full badge with logo and text' },
  { value: 'compact', label: 'Compact', description: 'Smaller badge, ideal for footers' },
  { value: 'minimal', label: 'Minimal', description: 'Text-only, very subtle' },
  { value: 'premium', label: 'Premium', description: 'Enhanced design with effects' },
];

const MEMBER_TYPES = [
  { value: 'member', label: 'Member', icon: Shield, color: '#3B82F6' },
  { value: 'certified', label: 'Certified Member', icon: Award, color: '#10B981' },
  { value: 'founding', label: 'Founding Member', icon: Star, color: '#F59E0B' },
  { value: 'partner', label: 'Strategic Partner', icon: Zap, color: '#8B5CF6' },
];

const EmbedBadge = () => {
  const { t, language: currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  
  const [config, setConfig] = useState<BadgeConfig>({
    style: 'standard',
    theme: 'dark',
    memberType: 'member',
    showName: true,
    showYear: true,
    customText: '',
    width: 200,
    language: currentLanguage === 'bg' ? 'bg' : 'en',
  });
  
  // Generate badge SVG
  const generateBadgeSVG = () => {
    const memberInfo = MEMBER_TYPES.find(m => m.value === config.memberType)!;
    const year = new Date().getFullYear();
    const bgColor = config.theme === 'dark' ? '#1a1a2e' : '#ffffff';
    const textColor = config.theme === 'dark' ? '#ffffff' : '#1a1a2e';
    const borderColor = memberInfo.color;
    
    const title = config.language === 'bg' ? 'Член на БАМАС' : 'BAMAS Member';
    const memberLabel = config.language === 'bg' 
      ? (config.memberType === 'member' ? 'Член' 
        : config.memberType === 'certified' ? 'Сертифициран член'
        : config.memberType === 'founding' ? 'Основател'
        : 'Стратегически партньор')
      : memberInfo.label;
    
    const height = config.style === 'compact' ? 36 : config.style === 'minimal' ? 24 : 48;
    const width = config.width;
    
    if (config.style === 'minimal') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}" rx="4"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-family="system-ui, sans-serif" font-size="11" font-weight="500">
    ${config.customText || `${memberLabel} ${config.showYear ? year : ''}`}
  </text>
</svg>`;
    }
    
    if (config.style === 'compact') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:${borderColor};stop-opacity:0.2"/>
      <stop offset="100%" style="stop-color:${borderColor};stop-opacity:0"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="${bgColor}" rx="6" stroke="${borderColor}" stroke-width="1.5"/>
  <rect x="0" y="0" width="36" height="100%" fill="url(#grad)" rx="6"/>
  <circle cx="18" cy="18" r="10" fill="${borderColor}" fill-opacity="0.2"/>
  <text x="16" y="22" fill="${borderColor}" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">B</text>
  <text x="42" y="14" fill="${textColor}" font-family="system-ui, sans-serif" font-size="10" font-weight="600">BAMAS</text>
  <text x="42" y="26" fill="${textColor}" font-family="system-ui, sans-serif" font-size="8" opacity="0.7">${memberLabel}</text>
</svg>`;
    }
    
    if (config.style === 'premium') {
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="premiumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${borderColor};stop-opacity:0.3"/>
      <stop offset="50%" style="stop-color:${bgColor}"/>
      <stop offset="100%" style="stop-color:${borderColor};stop-opacity:0.1"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${borderColor}" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#premiumGrad)" rx="10" filter="url(#shadow)" stroke="${borderColor}" stroke-width="2"/>
  <circle cx="24" cy="24" r="14" fill="${borderColor}" fill-opacity="0.15"/>
  <text x="20" y="30" fill="${borderColor}" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">B</text>
  <text x="50" y="18" fill="${textColor}" font-family="system-ui, sans-serif" font-size="12" font-weight="700">BAMAS</text>
  <text x="50" y="32" fill="${borderColor}" font-family="system-ui, sans-serif" font-size="9" font-weight="600">${memberLabel}</text>
  ${config.showYear ? `<text x="${width - 8}" y="42" text-anchor="end" fill="${textColor}" font-family="system-ui, sans-serif" font-size="8" opacity="0.5">${year}</text>` : ''}
</svg>`;
    }
    
    // Standard style
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${bgColor}" rx="8" stroke="${borderColor}" stroke-width="2"/>
  <circle cx="24" cy="24" r="12" fill="${borderColor}" fill-opacity="0.15"/>
  <text x="20" y="29" fill="${borderColor}" font-family="system-ui, sans-serif" font-size="14" font-weight="bold">B</text>
  <text x="48" y="20" fill="${textColor}" font-family="system-ui, sans-serif" font-size="11" font-weight="600">BAMAS</text>
  <text x="48" y="34" fill="${textColor}" font-family="system-ui, sans-serif" font-size="9" opacity="0.7">${memberLabel}</text>
  ${config.showYear ? `<text x="${width - 8}" y="42" text-anchor="end" fill="${textColor}" font-family="system-ui, sans-serif" font-size="8" opacity="0.5">${year}</text>` : ''}
</svg>`;
  };
  
  // Generate embed code
  const generateEmbedCode = (type: 'html' | 'markdown' | 'image') => {
    const svg = generateBadgeSVG();
    const encodedSvg = encodeURIComponent(svg);
    const dataUrl = `data:image/svg+xml,${encodedSvg}`;
    const linkUrl = 'https://bamas.xyz';
    
    if (type === 'html') {
      return `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" title="BAMAS Member">
  <img src="${dataUrl}" alt="BAMAS Member Badge" style="border: 0;" />
</a>`;
    }
    
    if (type === 'markdown') {
      return `[![BAMAS Member](${dataUrl})](${linkUrl})`;
    }
    
    // Image only
    return dataUrl;
  };
  
  const handleCopy = async (type: 'html' | 'markdown' | 'image') => {
    const code = generateEmbedCode(type);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: t("dashboard.embed.copied") || "Copied!",
        description: t("dashboard.embed.copiedDesc") || "Embed code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: t("dashboard.embed.error") || "Error",
        description: t("dashboard.embed.errorDesc") || "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };
  
  const handleDownloadSVG = () => {
    const svg = generateBadgeSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bamas-badge-${config.style}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.embed.title") || "BAMAS Badge Generator"}</h2>
        </div>
      </div>
      
      <p className="text-muted-foreground">
        {t("dashboard.embed.description") || "Create a customizable BAMAS member badge to display on your website, portfolio, or social media"}
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t("dashboard.embed.customize") || "Customize Badge"}
            </CardTitle>
            <CardDescription>
              {t("dashboard.embed.customizeDesc") || "Adjust style, colors, and content"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Badge Style */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Layout className="h-4 w-4" />
                {t("dashboard.embed.style") || "Badge Style"}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {BADGE_STYLES.map(style => (
                  <Button
                    key={style.value}
                    variant={config.style === style.value ? "default" : "outline"}
                    className="h-auto py-3 px-4 flex flex-col items-start"
                    onClick={() => setConfig(prev => ({ ...prev, style: style.value as BadgeStyle }))}
                  >
                    <span className="font-semibold">{style.label}</span>
                    <span className="text-xs opacity-70">{style.description}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Theme */}
            <div className="space-y-3">
              <Label>{t("dashboard.embed.theme") || "Theme"}</Label>
              <div className="flex gap-2">
                {['dark', 'light'].map(theme => (
                  <Button
                    key={theme}
                    variant={config.theme === theme ? "default" : "outline"}
                    className="flex-1 rounded-full"
                    onClick={() => setConfig(prev => ({ ...prev, theme: theme as BadgeTheme }))}
                  >
                    {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Member Type */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                {t("dashboard.embed.memberType") || "Member Type"}
              </Label>
              <Select
                value={config.memberType}
                onValueChange={(v) => setConfig(prev => ({ ...prev, memberType: v as MemberType }))}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEMBER_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" style={{ color: type.color }} />
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Width */}
            <div className="space-y-3">
              <Label>{t("dashboard.embed.width") || "Width"}: {config.width}px</Label>
              <Slider
                value={[config.width]}
                onValueChange={([v]) => setConfig(prev => ({ ...prev, width: v }))}
                min={120}
                max={320}
                step={10}
                className="py-2"
              />
            </div>
            
            {/* Options */}
            <div className="space-y-3">
              <Label>{t("dashboard.embed.options") || "Options"}</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">{t("dashboard.embed.showYear") || "Show Year"}</span>
                  <Switch
                    checked={config.showYear}
                    onCheckedChange={(v) => setConfig(prev => ({ ...prev, showYear: v }))}
                  />
                </div>
              </div>
            </div>
            
            {/* Language */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                {t("dashboard.embed.language") || "Badge Language"}
              </Label>
              <div className="flex gap-2">
                {[{ value: 'en', label: '🇬🇧 English' }, { value: 'bg', label: '🇧🇬 Български' }].map(lang => (
                  <Button
                    key={lang.value}
                    variant={config.language === lang.value ? "default" : "outline"}
                    className="flex-1 rounded-full"
                    onClick={() => setConfig(prev => ({ ...prev, language: lang.value as 'en' | 'bg' }))}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Preview and Code Panel */}
        <div className="space-y-4">
          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                {t("dashboard.embed.preview") || "Preview"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-8 rounded-lg flex items-center justify-center ${
                config.theme === 'dark' ? 'bg-zinc-900' : 'bg-zinc-100'
              }`}>
                <div 
                  dangerouslySetInnerHTML={{ __html: generateBadgeSVG() }}
                  className="transition-all duration-300"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={handleDownloadSVG}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {t("dashboard.embed.downloadSVG") || "Download SVG"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Embed Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {t("dashboard.embed.code") || "Embed Code"}
              </CardTitle>
              <CardDescription>
                {t("dashboard.embed.codeDesc") || "Copy and paste this code to your website"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html">
                <TabsList className="w-full rounded-full">
                  <TabsTrigger value="html" className="flex-1 rounded-full">HTML</TabsTrigger>
                  <TabsTrigger value="markdown" className="flex-1 rounded-full">Markdown</TabsTrigger>
                  <TabsTrigger value="image" className="flex-1 rounded-full">Image URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="space-y-3">
                  <Textarea
                    readOnly
                    value={generateEmbedCode('html')}
                    className="font-mono text-xs h-32"
                  />
                  <Button
                    onClick={() => handleCopy('html')}
                    className="w-full rounded-full"
                    variant={copied === 'html' ? 'secondary' : 'default'}
                  >
                    {copied === 'html' ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {t("dashboard.embed.copied") || "Copied!"}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("dashboard.embed.copyHTML") || "Copy HTML"}
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                <TabsContent value="markdown" className="space-y-3">
                  <Textarea
                    readOnly
                    value={generateEmbedCode('markdown')}
                    className="font-mono text-xs h-32"
                  />
                  <Button
                    onClick={() => handleCopy('markdown')}
                    className="w-full rounded-full"
                    variant={copied === 'markdown' ? 'secondary' : 'default'}
                  >
                    {copied === 'markdown' ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {t("dashboard.embed.copied") || "Copied!"}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("dashboard.embed.copyMarkdown") || "Copy Markdown"}
                      </>
                    )}
                  </Button>
                </TabsContent>
                
                <TabsContent value="image" className="space-y-3">
                  <Textarea
                    readOnly
                    value={generateEmbedCode('image')}
                    className="font-mono text-xs h-32"
                  />
                  <Button
                    onClick={() => handleCopy('image')}
                    className="w-full rounded-full"
                    variant={copied === 'image' ? 'secondary' : 'default'}
                  >
                    {copied === 'image' ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        {t("dashboard.embed.copied") || "Copied!"}
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        {t("dashboard.embed.copyURL") || "Copy Image URL"}
                      </>
                    )}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          
          {/* Usage Tips */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("dashboard.embed.tips.title") || "Usage Tips"}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• {t("dashboard.embed.tips.footer") || "Place the badge in your website footer"}</p>
              <p>• {t("dashboard.embed.tips.readme") || "Add to your GitHub README files"}</p>
              <p>• {t("dashboard.embed.tips.email") || "Include in your email signature"}</p>
              <p>• {t("dashboard.embed.tips.linkedin") || "Link from your LinkedIn profile"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmbedBadge;
