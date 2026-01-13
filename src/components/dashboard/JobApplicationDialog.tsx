import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyToJob,
  uploadResume,
  uploadCoverLetter,
  uploadPortfolioFiles,
  type JobPosting,
} from "@/lib/jobs";

interface JobApplicationDialogProps {
  job: JobPosting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplied: () => void;
}

export const JobApplicationDialog = ({
  job,
  open,
  onOpenChange,
  onApplied,
}: JobApplicationDialogProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    message: "",
    resume_path: "",
    cover_letter_path: "",
    portfolio_paths: [] as string[],
  });

  const [resumeFileName, setResumeFileName] = useState("");
  const [coverLetterFileName, setCoverLetterFileName] = useState("");
  const [portfolioFileNames, setPortfolioFileNames] = useState<string[]>([]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t("jobboard.form.error.invalidFile") || "Invalid File",
        description: t("jobboard.form.error.resumeFormat") || "Please upload a PDF or DOCX file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingResume(true);
      const result = await uploadResume(file);
      setFormData({ ...formData, resume_path: result.path });
      setResumeFileName(file.name);
      toast({
        title: t("jobboard.form.success.resumeUploaded") || "Success",
        description: t("jobboard.form.success.resumeUploadedDesc") || "Resume uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: t("jobboard.form.error.uploadFailed") || "Upload Failed",
        description: error.message || t("jobboard.form.error.uploadFailedDesc") || "Failed to upload resume",
        variant: "destructive",
      });
    } finally {
      setUploadingResume(false);
    }
  };

  const handleCoverLetterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t("jobboard.form.error.invalidFile") || "Invalid File",
        description: t("jobboard.form.error.coverLetterFormat") || "Please upload a PDF or DOCX file",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingCoverLetter(true);
      const result = await uploadCoverLetter(file);
      setFormData({ ...formData, cover_letter_path: result.path });
      setCoverLetterFileName(file.name);
      toast({
        title: t("jobboard.form.success.coverLetterUploaded") || "Success",
        description: t("jobboard.form.success.coverLetterUploadedDesc") || "Cover letter uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: t("jobboard.form.error.uploadFailed") || "Upload Failed",
        description: error.message || t("jobboard.form.error.uploadFailedDesc") || "Failed to upload cover letter",
        variant: "destructive",
      });
    } finally {
      setUploadingCoverLetter(false);
    }
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed',
    ];
    const invalidFiles = files.filter(f => !allowedTypes.includes(f.type));
    if (invalidFiles.length > 0) {
      toast({
        title: t("jobboard.form.error.invalidFile") || "Invalid File",
        description: t("jobboard.form.error.portfolioFormat") || "Please upload PDF, images, or ZIP files",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingPortfolio(true);
      const results = await uploadPortfolioFiles(files);
      const newPaths = results.map(r => r.path);
      setFormData({
        ...formData,
        portfolio_paths: [...formData.portfolio_paths, ...newPaths],
      });
      setPortfolioFileNames([...portfolioFileNames, ...results.map(r => r.fileName)]);
      toast({
        title: t("jobboard.form.success.portfolioUploaded") || "Success",
        description: t("jobboard.form.success.portfolioUploadedDesc") || `${files.length} file(s) uploaded successfully`,
      });
    } catch (error: any) {
      toast({
        title: t("jobboard.form.error.uploadFailed") || "Upload Failed",
        description: error.message || t("jobboard.form.error.uploadFailedDesc") || "Failed to upload portfolio files",
        variant: "destructive",
      });
    } finally {
      setUploadingPortfolio(false);
    }
  };

  const handleRemovePortfolioFile = (index: number) => {
    const newPaths = [...formData.portfolio_paths];
    const newNames = [...portfolioFileNames];
    newPaths.splice(index, 1);
    newNames.splice(index, 1);
    setFormData({ ...formData, portfolio_paths: newPaths });
    setPortfolioFileNames(newNames);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await applyToJob(job.id, {
        message: formData.message || undefined,
        resume_path: formData.resume_path || undefined,
        cover_letter_path: formData.cover_letter_path || undefined,
        portfolio_paths: formData.portfolio_paths.length > 0 ? formData.portfolio_paths : undefined,
      });

      toast({
        title: t("jobboard.application.success") || "Success",
        description: t("jobboard.application.successDesc") || "Your application has been submitted successfully",
      });

      onApplied();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        message: "",
        resume_path: "",
        cover_letter_path: "",
        portfolio_paths: [],
      });
      setResumeFileName("");
      setCoverLetterFileName("");
      setPortfolioFileNames([]);
    } catch (error: any) {
      toast({
        title: t("jobboard.application.error") || "Error",
        description: error.message || t("jobboard.application.errorDesc") || "Failed to submit application",
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
            {t("jobboard.application.title") || "Apply to"} {job.title}
          </DialogTitle>
          <DialogDescription>
            {t("jobboard.application.description") || "Submit your application for this position"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">
              {t("jobboard.application.message") || "Message"} ({t("common.optional") || "Optional"})
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              placeholder={t("jobboard.application.messagePlaceholder") || "Tell us why you're interested in this position..."}
            />
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>{t("jobboard.application.resume") || "Resume"} (PDF, DOCX) - {t("common.optional") || "Optional"}</Label>
            <div className="flex items-center gap-2">
              <input
                ref={resumeInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingResume
                  ? t("common.uploading") || "Uploading..."
                  : resumeFileName
                  ? t("jobboard.application.changeResume") || "Change Resume"
                  : t("jobboard.application.uploadResume") || "Upload Resume"}
              </Button>
              {resumeFileName && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {resumeFileName}
                </span>
              )}
            </div>
          </div>

          {/* Cover Letter Upload */}
          <div className="space-y-2">
            <Label>{t("jobboard.application.coverLetter") || "Cover Letter"} (PDF, DOCX) - {t("common.optional") || "Optional"}</Label>
            <div className="flex items-center gap-2">
              <input
                ref={coverLetterInputRef}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleCoverLetterUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => coverLetterInputRef.current?.click()}
                disabled={uploadingCoverLetter}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingCoverLetter
                  ? t("common.uploading") || "Uploading..."
                  : coverLetterFileName
                  ? t("jobboard.application.changeCoverLetter") || "Change Cover Letter"
                  : t("jobboard.application.uploadCoverLetter") || "Upload Cover Letter"}
              </Button>
              {coverLetterFileName && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {coverLetterFileName}
                </span>
              )}
            </div>
          </div>

          {/* Portfolio Upload */}
          <div className="space-y-2">
            <Label>{t("jobboard.application.portfolio") || "Portfolio Files"} (PDF, Images, ZIP) - {t("common.optional") || "Optional"}</Label>
            <div className="flex items-center gap-2">
              <input
                ref={portfolioInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,.zip"
                multiple
                onChange={handlePortfolioUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => portfolioInputRef.current?.click()}
                disabled={uploadingPortfolio}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploadingPortfolio
                  ? t("common.uploading") || "Uploading..."
                  : t("jobboard.application.uploadPortfolio") || "Upload Portfolio Files"}
              </Button>
            </div>
            {portfolioFileNames.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {portfolioFileNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="rounded-full">
                    <FileText className="h-3 w-3 mr-1" />
                    {name}
                    <button
                      type="button"
                      onClick={() => handleRemovePortfolioFile(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? t("common.loading") || "Loading..."
                : t("jobboard.application.submit") || "Submit Application"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
