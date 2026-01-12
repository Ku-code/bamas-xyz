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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitSuggestion, type TermCategory } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";

interface TerminologySuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TerminologySuggestionDialog = ({ open, onOpenChange, onSuccess }: TerminologySuggestionDialogProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    term_en: "",
    term_bg: "",
    description_en: "",
    description_bg: "",
    category: "General" as TermCategory,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await submitSuggestion(formData);
      toast({
        title: "Success",
        description: "Your suggestion has been submitted and will be reviewed by an admin",
      });
      onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({
        term_en: "",
        term_bg: "",
        description_en: "",
        description_bg: "",
        category: "General",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit suggestion",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.terminology.suggest") || "Suggest a Term"}
          </DialogTitle>
          <DialogDescription>
            Submit a new term for review. An admin will review and approve your suggestion.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="suggest_term_en">English Term *</Label>
              <Input
                id="suggest_term_en"
                value={formData.term_en}
                onChange={(e) => setFormData({ ...formData, term_en: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="suggest_term_bg">Bulgarian Term</Label>
              <Input
                id="suggest_term_bg"
                value={formData.term_bg}
                onChange={(e) => setFormData({ ...formData, term_bg: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="suggest_description_en">English Description *</Label>
              <Textarea
                id="suggest_description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                required
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="suggest_description_bg">Bulgarian Description</Label>
              <Textarea
                id="suggest_description_bg"
                value={formData.description_bg}
                onChange={(e) => setFormData({ ...formData, description_bg: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="suggest_category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as TermCategory })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Materials">Materials</SelectItem>
                <SelectItem value="Processes">Processes</SelectItem>
                <SelectItem value="Equipment">Equipment</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Quality_Control">Quality Control</SelectItem>
                <SelectItem value="Post_Processing">Post Processing</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Standards">Standards</SelectItem>
                <SelectItem value="General">General</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Suggestion"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
