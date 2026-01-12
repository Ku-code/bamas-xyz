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
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { validateImportData, createTerm, type TermCategory } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";

interface TerminologyImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TerminologyImportDialog = ({ open, onOpenChange, onSuccess }: TerminologyImportDialogProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [validation, setValidation] = useState<{ valid: any[]; errors: string[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsedData([]);
    setValidation(null);
    setSelectedRows(new Set());

    try {
      const text = await selectedFile.text();
      const lines = text.split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map((line, index) => {
          const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
          const row: any = {};
          headers.forEach((header, i) => {
            row[header] = values[i] || "";
          });
          return { ...row, _rowIndex: index + 2 };
        });

      setParsedData(data);
      const validationResult = validateImportData(data);
      setValidation(validationResult);
      setSelectedRows(new Set(validationResult.valid.map((_, i) => i)));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to parse file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!validation || validation.valid.length === 0) {
      toast({
        title: "Error",
        description: "No valid rows to import",
        variant: "destructive",
      });
      return;
    }

    const rowsToImport = Array.from(selectedRows)
      .map(i => validation.valid[i])
      .filter(Boolean);

    if (rowsToImport.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one row to import",
        variant: "destructive",
      });
      return;
    }

    setImporting(true);
    setProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < rowsToImport.length; i++) {
        const row = rowsToImport[i];
        try {
          await createTerm({
            term_en: row.term_en,
            term_bg: row.term_bg || undefined,
            latin_script: row.latin_script || undefined,
            description_en: row.description_en,
            description_bg: row.description_bg || undefined,
            acronym: row.acronym || undefined,
            category: (row.category || "General") as TermCategory,
            subcategory: row.subcategory || undefined,
            difficulty_level: row.difficulty_level || "Basic",
            translation_status: row.translation_status || "Draft",
            standard_reference: row.standard_reference || undefined,
          });
          successCount++;
        } catch (error) {
          console.error(`Error importing row ${row._rowIndex}:`, error);
          errorCount++;
        }
        setProgress(((i + 1) / rowsToImport.length) * 100);
      }

      toast({
        title: "Import Complete",
        description: `Successfully imported ${successCount} term${successCount !== 1 ? "s" : ""}${errorCount > 0 ? `. ${errorCount} failed.` : ""}`,
      });

      onSuccess();
      onOpenChange(false);
      setFile(null);
      setParsedData([]);
      setValidation(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import terms",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Terms</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import multiple terms at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <Label>Select File</Label>
            <div className="mt-2 flex items-center gap-4">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </span>
                </Button>
              </Label>
              {file && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">{file.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Expected columns: term_en, term_bg, description_en, description_bg, category, etc.
            </p>
          </div>

          {/* Validation Results */}
          {validation && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {validation.errors.length === 0 ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">All rows are valid</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">
                      {validation.errors.length} error{validation.errors.length !== 1 ? "s" : ""} found
                    </span>
                  </>
                )}
              </div>

              {validation.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto p-2 bg-destructive/10 rounded text-sm">
                  {validation.errors.map((error, i) => (
                    <div key={i} className="text-destructive">{error}</div>
                  ))}
                </div>
              )}

              {validation.valid.length > 0 && (
                <div className="mt-4">
                  <Label className="mb-2 block">
                    Select rows to import ({selectedRows.size} of {validation.valid.length} selected)
                  </Label>
                  <div className="max-h-64 overflow-y-auto border rounded p-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">
                            <input
                              type="checkbox"
                              checked={selectedRows.size === validation.valid.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRows(new Set(validation.valid.map((_, i) => i)));
                                } else {
                                  setSelectedRows(new Set());
                                }
                              }}
                            />
                          </th>
                          <th className="text-left p-2">Term (EN)</th>
                          <th className="text-left p-2">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {validation.valid.map((row, i) => (
                          <tr key={i} className="border-b">
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(i)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedRows);
                                  if (e.target.checked) {
                                    newSet.add(i);
                                  } else {
                                    newSet.delete(i);
                                  }
                                  setSelectedRows(newSet);
                                }}
                              />
                            </td>
                            <td className="p-2">{row.term_en}</td>
                            <td className="p-2">{row.category || "General"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!validation || validation.valid.length === 0 || importing}>
            {importing ? "Importing..." : "Import Selected"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
