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
import { Badge } from "@/components/ui/badge";
import { X, Hash, Upload, FileText, Link as LinkIcon, Github } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createJobSeekerProfile,
  updateJobSeekerProfile,
  uploadResume,
  uploadCoverLetter,
  uploadPortfolioFiles,
  type JobSeekerProfile,
  type ExperienceLevel,
} from "@/lib/jobs";

const JOB_CATEGORIES = [
  { value: "3d_modeling", label: { en: "3D Modeling", bg: "3D Моделиране" } },
  { value: "3d_printing_am", label: { en: "3D Printing/AM", bg: "3D Принтиране/АП" } },
  { value: "software_development", label: { en: "Software Development", bg: "Софтуерна Разработка" } },
  { value: "hardware_engineering", label: { en: "Hardware Engineering", bg: "Хардуерно Инженерство" } },
  { value: "maintenance_repair", label: { en: "Maintenance & Repair", bg: "Поддръжка и Ремонт" } },
  { value: "project_collaboration", label: { en: "Project Collaboration", bg: "Проектно Сътрудничество" } },
  { value: "marketing_sales", label: { en: "Marketing & Sales", bg: "Маркетинг и Продажби" } },
  { value: "finance_accounting", label: { en: "Finance & Accounting", bg: "Финанси и Счетоводство" } },
  { value: "supply_chain", label: { en: "Supply Chain", bg: "Вериги на Доставки" } },
  { value: "purchasing", label: { en: "Purchasing", bg: "Закупуване" } },
  { value: "research_development", label: { en: "Research & Development", bg: "Научно-Развойна Дейност" } },
  { value: "quality_assurance", label: { en: "Quality Assurance", bg: "Контрол на Качеството" } },
  { value: "production_operations", label: { en: "Production/Operations", bg: "Производство/Операции" } },
  { value: "education_training", label: { en: "Education & Training", bg: "Образование и Обучение" } },
  { value: "management", label: { en: "Management", bg: "Управление" } },
  { value: "other", label: { en: "Other", bg: "Друго" } },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: { en: string; bg: string } }[] = [
  { value: "entry", label: { en: "Entry", bg: "Начално ниво" } },
  { value: "junior", label: { en: "Junior", bg: "Младши" } },
  { value: "mid", label: { en: "Mid", bg: "Средно ниво" } },
  { value: "senior", label: { en: "Senior", bg: "Старши" } },
  { value: "lead", label: { en: "Lead", bg: "Ръководител" } },
  { value: "executive", label: { en: "Executive", bg: "Изпълнително ниво" } },
];

const AVAILABILITY_OPTIONS = [
  { value: "immediately", label: { en: "Immediately", bg: "Веднага" } },
  { value: "2_weeks", label: { en: "2 Weeks", bg: "2 седмици" } },
  { value: "1_month", label: { en: "1 Month", bg: "1 месец" } },
  { value: "3_months", label: { en: "3 Months", bg: "3 месеца" } },
  { value: "currently_employed", label: { en: "Currently Employed (Open to Offers)", bg: "В момента работя (отворен за предложения)" } },
];

const CURRENCIES = ["BGN", "EUR", "USD", "GBP"];

interface JobSeekerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile?: JobSeekerProfile | null;
  onSaved: () => void;
}

export const JobSeekerForm = ({ open, onOpenChange, profile, onSaved }: JobSeekerFormProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingCoverLetter, setUploadingCoverLetter] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const coverLetterInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: profile?.title || "",
    summary: profile?.summary || "",
    category: profile?.category || "",
    experience_level: (profile?.experience_level || "mid") as ExperienceLevel,
    skills: profile?.skills || [] as string[],
    location: profile?.location || "",
    city: profile?.city || "",
    country: profile?.country || "Bulgaria",
    open_to_remote: profile?.open_to_remote || false,
    open_to_hybrid: profile?.open_to_hybrid || false,
    resume_path: profile?.resume_path || "",
    cover_letter_path: profile?.cover_letter_path || "",
    portfolio_paths: profile?.portfolio_paths || [] as string[],
    portfolio_url: profile?.portfolio_url || "",
    linkedin_url: profile?.linkedin_url || "",
    github_url: profile?.github_url || "",
    availability: profile?.availability || "",
    desired_salary_min: profile?.desired_salary_min || undefined,
    desired_salary_max: profile?.desired_salary_max || undefined,
    desired_salary_currency: profile?.desired_salary_currency || "BGN",
    show_salary_expectation: profile?.show_salary_expectation || false,
  });

  const [skillInput, setSkillInput] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");
  const [coverLetterFileName, setCoverLetterFileName] = useState("");
  const [portfolioFileNames, setPortfolioFileNames] = useState<string[]>([]);

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (!formData.skills.includes(skill)) {
        setFormData({
          ...formData,
          skills: [...formData.skills, skill],
        });
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill),
    });
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
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

    // Validate file types
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
      const data = {
        title: formData.title,
        summary: formData.summary,
        category: formData.category,
        experience_level: formData.experience_level,
        skills: formData.skills,
        location: formData.location || undefined,
        city: formData.city || undefined,
        country: formData.country,
        open_to_remote: formData.open_to_remote,
        open_to_hybrid: formData.open_to_hybrid,
        resume_path: formData.resume_path || undefined,
        cover_letter_path: formData.cover_letter_path || undefined,
        portfolio_paths: formData.portfolio_paths,
        portfolio_url: formData.portfolio_url || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        github_url: formData.github_url || undefined,
        availability: formData.availability || undefined,
        desired_salary_min: formData.show_salary_expectation && formData.desired_salary_min ? formData.desired_salary_min : undefined,
        desired_salary_max: formData.show_salary_expectation && formData.desired_salary_max ? formData.desired_salary_max : undefined,
        desired_salary_currency: formData.show_salary_expectation ? formData.desired_salary_currency : undefined,
        show_salary_expectation: formData.show_salary_expectation,
      };

      if (profile) {
        await updateJobSeekerProfile(profile.id, data);
        toast({
          title: t("jobboard.form.success.update") || "Success",
          description: t("jobboard.form.success.updateProfileDesc") || "Profile updated successfully",
        });
      } else {
        await createJobSeekerProfile(data);
        toast({
          title: t("jobboard.form.success.create") || "Success",
          description: t("jobboard.form.success.createProfileDesc") || "Profile created successfully",
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("jobboard.form.error.title") || "Error",
        description: error.message || t("jobboard.form.error.description") || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getLabel = (item: { label: { en: string; bg: string } }) => {
    return language === "bg" ? item.label.bg : item.label.en;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {profile
              ? t("jobboard.form.editProfileTitle") || "Edit Profile"
              : t("jobboard.form.createProfileTitle") || "Create Job Seeker Profile"}
          </DialogTitle>
          <DialogDescription>
            {profile
              ? t("jobboard.form.editProfileDesc") || "Update your professional profile"
              : t("jobboard.form.createProfileDesc") || "Create your profile to showcase your skills and experience"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Summary */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("jobboard.form.professionalTitle") || "Professional Title"} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t("jobboard.form.titlePlaceholder") || "e.g., 3D Printing Specialist"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">{t("jobboard.form.summary") || "Summary"} *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              required
              rows={6}
              placeholder={t("jobboard.form.summaryPlaceholder") || "Describe your experience, skills, and what you're looking for..."}
            />
          </div>

          {/* Category & Experience */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">{t("jobboard.form.category") || "Category"} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("jobboard.form.selectCategory") || "Select category"} />
                </SelectTrigger>
                <SelectContent>
                  {JOB_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {getLabel(cat)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_level">{t("jobboard.form.experienceLevel") || "Experience Level"} *</Label>
              <Select
                value={formData.experience_level}
                onValueChange={(value) => setFormData({ ...formData, experience_level: value as ExperienceLevel })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {getLabel(level)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">{t("jobboard.form.skills") || "Skills"}</Label>
            <Input
              id="skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder={t("jobboard.form.skillsPlaceholder") || "Type a skill and press Enter"}
            />
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="secondary" className="rounded-full">
                    <Hash className="h-3 w-3 mr-1" />
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">{t("jobboard.form.city") || "City"}</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder={t("jobboard.form.cityPlaceholder") || "e.g., Sofia"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">{t("jobboard.form.country") || "Country"}</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t("jobboard.form.fullLocation") || "Full Location"}</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder={t("jobboard.form.locationPlaceholder") || "e.g., Sofia, Bulgaria"}
              />
            </div>
          </div>

          {/* Remote/Hybrid Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open_to_remote"
                checked={formData.open_to_remote}
                onCheckedChange={(checked) => setFormData({ ...formData, open_to_remote: checked as boolean })}
              />
              <Label htmlFor="open_to_remote" className="font-normal cursor-pointer">
                {t("jobboard.form.openToRemote") || "Open to Remote Work"}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open_to_hybrid"
                checked={formData.open_to_hybrid}
                onCheckedChange={(checked) => setFormData({ ...formData, open_to_hybrid: checked as boolean })}
              />
              <Label htmlFor="open_to_hybrid" className="font-normal cursor-pointer">
                {t("jobboard.form.openToHybrid") || "Open to Hybrid Work"}
              </Label>
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-2">
            <Label>{t("jobboard.form.resume") || "Resume"} (PDF, DOCX)</Label>
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
                  : resumeFileName || formData.resume_path
                  ? t("jobboard.form.changeResume") || "Change Resume"
                  : t("jobboard.form.uploadResume") || "Upload Resume"}
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
            <Label>{t("jobboard.form.coverLetter") || "Cover Letter"} (PDF, DOCX) - {t("common.optional") || "Optional"}</Label>
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
                  : coverLetterFileName || formData.cover_letter_path
                  ? t("jobboard.form.changeCoverLetter") || "Change Cover Letter"
                  : t("jobboard.form.uploadCoverLetter") || "Upload Cover Letter"}
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
            <Label>{t("jobboard.form.portfolio") || "Portfolio Files"} (PDF, Images, ZIP) - {t("common.optional") || "Optional"}</Label>
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
                  : t("jobboard.form.uploadPortfolio") || "Upload Portfolio Files"}
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

          {/* External Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">
                <LinkIcon className="inline h-4 w-4 mr-1" />
                {t("jobboard.form.portfolioUrl") || "Portfolio URL"}
              </Label>
              <Input
                id="portfolio_url"
                type="url"
                value={formData.portfolio_url}
                onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                placeholder="https://yourportfolio.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">
                <LinkIcon className="inline h-4 w-4 mr-1" />
                LinkedIn
              </Label>
              <Input
                id="linkedin_url"
                type="url"
                value={formData.linkedin_url}
                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github_url">
                <Github className="inline h-4 w-4 mr-1" />
                GitHub/GitLab
              </Label>
              <Input
                id="github_url"
                type="url"
                value={formData.github_url}
                onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                placeholder="https://github.com/yourusername"
              />
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-2">
            <Label htmlFor="availability">{t("jobboard.form.availability") || "Availability"}</Label>
            <Select
              value={formData.availability}
              onValueChange={(value) => setFormData({ ...formData, availability: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("jobboard.form.selectAvailability") || "Select availability"} />
              </SelectTrigger>
              <SelectContent>
                {AVAILABILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {getLabel(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Salary Expectations */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_salary_expectation"
                checked={formData.show_salary_expectation}
                onCheckedChange={(checked) => setFormData({ ...formData, show_salary_expectation: checked as boolean })}
              />
              <Label htmlFor="show_salary_expectation" className="font-normal cursor-pointer">
                {t("jobboard.form.showSalaryExpectation") || "Show salary expectation"}
              </Label>
            </div>

            {formData.show_salary_expectation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="desired_salary_min">{t("jobboard.form.salaryMin") || "Min Salary"}</Label>
                  <Input
                    id="desired_salary_min"
                    type="number"
                    value={formData.desired_salary_min || ""}
                    onChange={(e) => setFormData({ ...formData, desired_salary_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desired_salary_max">{t("jobboard.form.salaryMax") || "Max Salary"}</Label>
                  <Input
                    id="desired_salary_max"
                    type="number"
                    value={formData.desired_salary_max || ""}
                    onChange={(e) => setFormData({ ...formData, desired_salary_max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desired_salary_currency">{t("jobboard.form.currency") || "Currency"}</Label>
                  <Select
                    value={formData.desired_salary_currency}
                    onValueChange={(value) => setFormData({ ...formData, desired_salary_currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((curr) => (
                        <SelectItem key={curr} value={curr}>
                          {curr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                : profile
                ? t("common.update") || "Update"
                : t("common.create") || "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
