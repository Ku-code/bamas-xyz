import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import type { TerminologyTerm, LanguageView } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface TerminologyExportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  terms: TerminologyTerm[];
  languageView: LanguageView;
  filters?: any;
}

export const TerminologyExport = ({ open, onOpenChange, terms, languageView, filters }: TerminologyExportProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [exportLanguage, setExportLanguage] = useState<LanguageView>(languageView);
  const [format, setFormat] = useState<"pdf" | "csv" | "json" | "txt" | "flashcards">("pdf");
  const [options, setOptions] = useState({
    includeImages: false,
    includeExamples: false,
    includeComments: false,
    includeMetadata: true,
  });

  const filteredTerms = terms.filter(term => {
    if (exportLanguage === "bulgarian" && !term.term_bg) return false;
    return true;
  });

  const handleExport = () => {
    let content = "";
    let filename = "";
    let mimeType = "";

    switch (format) {
      case "json":
        content = JSON.stringify(filteredTerms, null, 2);
        filename = `terminology-${exportLanguage}-${Date.now()}.json`;
        mimeType = "application/json";
        break;

      case "csv":
        const csvHeaders = exportLanguage === "both" 
          ? ["Term (EN)", "Term (BG)", "Latin Script", "Description (EN)", "Description (BG)", "Category", "Status"]
          : exportLanguage === "english"
          ? ["Term (EN)", "Description (EN)", "Category", "Status"]
          : ["Term (BG)", "Latin Script", "Description (BG)", "Category", "Status"];

        const csvRows = filteredTerms.map(term => {
          if (exportLanguage === "both") {
            return [
              term.term_en,
              term.term_bg || "",
              term.latin_script || "",
              term.description_en,
              term.description_bg || "",
              term.category,
              term.translation_status,
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
          } else if (exportLanguage === "english") {
            return [
              term.term_en,
              term.description_en,
              term.category,
              term.translation_status,
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
          } else {
            return [
              term.term_bg || "",
              term.latin_script || "",
              term.description_bg || "",
              term.category,
              term.translation_status,
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
          }
        });

        content = [csvHeaders.join(","), ...csvRows].join("\n");
        filename = `terminology-${exportLanguage}-${Date.now()}.csv`;
        mimeType = "text/csv";
        break;

      case "txt":
        content = filteredTerms.map(term => {
          let text = "";
          if (exportLanguage === "both" || exportLanguage === "english") {
            text += `TERM (EN): ${term.term_en}\n`;
            text += `DESCRIPTION (EN): ${term.description_en}\n`;
          }
          if (exportLanguage === "both" || exportLanguage === "bulgarian") {
            if (term.term_bg) {
              text += `TERM (BG): ${term.term_bg}\n`;
              if (term.latin_script) text += `LATIN: ${term.latin_script}\n`;
              if (term.description_bg) text += `DESCRIPTION (BG): ${term.description_bg}\n`;
            }
          }
          text += `CATEGORY: ${term.category}\n`;
          text += `STATUS: ${term.translation_status}\n`;
          if (options.includeMetadata) {
            if (term.acronym) text += `ACRONYM: ${term.acronym}\n`;
            if (term.standard_reference) text += `STANDARD: ${term.standard_reference}\n`;
          }
          text += "---\n";
          return text;
        }).join("\n");
        filename = `terminology-${exportLanguage}-${Date.now()}.txt`;
        mimeType = "text/plain";
        break;

      case "flashcards":
        // Anki-compatible format
        const flashcards = filteredTerms.map(term => {
          const front = term.term_en;
          const back = `${term.term_bg || ""}\n\n${term.description_en}`;
          return [front, back].map(field => field.replace(/\t/g, " ").replace(/\n/g, "<br>")).join("\t");
        });
        content = flashcards.join("\n");
        filename = `terminology-flashcards-${Date.now()}.txt`;
        mimeType = "text/plain";
        break;

      case "pdf":
        // For PDF, we'd need jsPDF - for now, export as text with PDF extension
        // In production, implement proper PDF generation
        toast({
          title: "PDF Export",
          description: "PDF export will be implemented with jsPDF library",
        });
        onOpenChange(false);
        return;
    }

    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.terminology.export") || "Export Terms"}
          </DialogTitle>
          <DialogDescription>
            Export {filteredTerms.length} term{filteredTerms.length !== 1 ? "s" : ""} in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <Label>Export Language</Label>
            <RadioGroup value={exportLanguage} onValueChange={(v) => setExportLanguage(v as LanguageView)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="both" id="lang-both" />
                <Label htmlFor="lang-both" className="cursor-pointer">Both Languages</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="english" id="lang-en" />
                <Label htmlFor="lang-en" className="cursor-pointer">English Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bulgarian" id="lang-bg" />
                <Label htmlFor="lang-bg" className="cursor-pointer">Bulgarian Only</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground mt-2">
              {filteredTerms.length} term{filteredTerms.length !== 1 ? "s" : ""} will be exported
            </p>
          </div>

          {/* Format Selection */}
          <div>
            <Label>Export Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF Document</SelectItem>
                <SelectItem value="csv">CSV Spreadsheet</SelectItem>
                <SelectItem value="json">JSON Data</SelectItem>
                <SelectItem value="txt">Plain Text</SelectItem>
                <SelectItem value="flashcards">Flashcards (Anki)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Options */}
          {format !== "flashcards" && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={options.includeMetadata}
                  onCheckedChange={(checked) => setOptions({ ...options, includeMetadata: checked as boolean })}
                />
                <Label htmlFor="include-metadata" className="cursor-pointer">Include Metadata</Label>
              </div>
              {format === "txt" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-examples"
                    checked={options.includeExamples}
                    onCheckedChange={(checked) => setOptions({ ...options, includeExamples: checked as boolean })}
                  />
                  <Label htmlFor="include-examples" className="cursor-pointer">Include Examples</Label>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
