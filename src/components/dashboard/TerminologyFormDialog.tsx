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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createTerm, updateTerm, type TerminologyTerm, type TermCategory, type TranslationStatus, type DifficultyLevel } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";

interface TerminologyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  term?: TerminologyTerm;
  onSuccess: () => void;
}

export const TerminologyFormDialog = ({ open, onOpenChange, term, onSuccess }: TerminologyFormDialogProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    term_en: term?.term_en || "",
    term_bg: term?.term_bg || "",
    latin_script: term?.latin_script || "",
    description_en: term?.description_en || "",
    description_bg: term?.description_bg || "",
    acronym: term?.acronym || "",
    category: (term?.category || "General") as TermCategory,
    subcategory: term?.subcategory || "",
    difficulty_level: (term?.difficulty_level || "Basic") as DifficultyLevel,
    translation_status: (term?.translation_status || "Draft") as TranslationStatus,
    is_expert_verified: term?.is_expert_verified || false,
    standard_reference: term?.standard_reference || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (term) {
        await updateTerm(term.id, formData);
        toast({
          title: "Success",
          description: "Term updated successfully",
        });
      } else {
        await createTerm(formData);
        toast({
          title: "Success",
          description: "Term created successfully",
        });
      }
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save term",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {term ? "Edit Term" : "Add New Term"}
          </DialogTitle>
          <DialogDescription>
            {term ? "Update the term information" : "Add a new term to the dictionary"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="term_en">English Term *</Label>
              <Input
                id="term_en"
                value={formData.term_en}
                onChange={(e) => setFormData({ ...formData, term_en: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="term_bg">Bulgarian Term</Label>
              <Input
                id="term_bg"
                value={formData.term_bg}
                onChange={(e) => setFormData({ ...formData, term_bg: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="latin_script">Latin Script</Label>
            <Input
              id="latin_script"
              value={formData.latin_script}
              onChange={(e) => setFormData({ ...formData, latin_script: e.target.value })}
              placeholder="Pronunciation guide for Bulgarian term"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="description_en">English Description *</Label>
              <Textarea
                id="description_en"
                value={formData.description_en}
                onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                required
                rows={4}
              />
            </div>
            <div>
              <Label htmlFor="description_bg">Bulgarian Description</Label>
              <Textarea
                id="description_bg"
                value={formData.description_bg}
                onChange={(e) => setFormData({ ...formData, description_bg: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
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

            <div>
              <Label htmlFor="difficulty_level">Difficulty</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => setFormData({ ...formData, difficulty_level: value as DifficultyLevel })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="translation_status">Status</Label>
              <Select
                value={formData.translation_status}
                onValueChange={(value) => setFormData({ ...formData, translation_status: value as TranslationStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Needs Translation">Needs Translation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="acronym">Acronym</Label>
              <Input
                id="acronym"
                value={formData.acronym}
                onChange={(e) => setFormData({ ...formData, acronym: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="standard_reference">Standard Reference</Label>
              <Input
                id="standard_reference"
                value={formData.standard_reference}
                onChange={(e) => setFormData({ ...formData, standard_reference: e.target.value })}
                placeholder="e.g., ISO/ASTM 52900"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="subcategory">Subcategory</Label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="expert_verified"
              checked={formData.is_expert_verified}
              onCheckedChange={(checked) => setFormData({ ...formData, is_expert_verified: checked as boolean })}
            />
            <Label htmlFor="expert_verified" className="cursor-pointer">
              Expert Verified
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : term ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
