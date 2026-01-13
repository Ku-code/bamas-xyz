import { useState, useEffect } from "react";
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
import { X, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  createJobPosting,
  updateJobPosting,
  type JobPosting,
  type EmploymentType,
  type ExperienceLevel,
} from "@/lib/jobs";
import { loadCompanies, type Company } from "@/lib/companies";
import { format } from "date-fns";

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

const EMPLOYMENT_TYPES: { value: EmploymentType; label: { en: string; bg: string } }[] = [
  { value: "full_time", label: { en: "Full-time", bg: "Пълно работно време" } },
  { value: "part_time", label: { en: "Part-time", bg: "Непълно работно време" } },
  { value: "contract", label: { en: "Contract", bg: "Договор" } },
  { value: "internship", label: { en: "Internship", bg: "Стаж" } },
  { value: "freelance", label: { en: "Freelance", bg: "Фрийланс" } },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: { en: string; bg: string } }[] = [
  { value: "entry", label: { en: "Entry", bg: "Начално ниво" } },
  { value: "junior", label: { en: "Junior", bg: "Младши" } },
  { value: "mid", label: { en: "Mid", bg: "Средно ниво" } },
  { value: "senior", label: { en: "Senior", bg: "Старши" } },
  { value: "lead", label: { en: "Lead", bg: "Ръководител" } },
  { value: "executive", label: { en: "Executive", bg: "Изпълнително ниво" } },
];

const SCHEDULE_TYPES = [
  { value: "full_time_hours", label: { en: "Full-time Hours", bg: "Пълно работно време" } },
  { value: "part_time_hours", label: { en: "Part-time Hours", bg: "Непълно работно време" } },
  { value: "shift_work", label: { en: "Shift Work", bg: "Сменен график" } },
  { value: "flexible", label: { en: "Flexible", bg: "Гъвкав график" } },
];

const SALARY_PERIODS = [
  { value: "per_hour", label: { en: "Per Hour", bg: "На час" } },
  { value: "per_month", label: { en: "Per Month", bg: "На месец" } },
  { value: "per_year", label: { en: "Per Year", bg: "На година" } },
];

const CURRENCIES = ["BGN", "EUR", "USD", "GBP"];

interface JobPostingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: JobPosting | null;
  onSaved: () => void;
}

export const JobPostingForm = ({ open, onOpenChange, job, onSaved }: JobPostingFormProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const [formData, setFormData] = useState({
    title: job?.title || "",
    description: job?.description || "",
    category: job?.category || "",
    employment_type: (job?.employment_type || "full_time") as EmploymentType,
    experience_level: (job?.experience_level || "mid") as ExperienceLevel,
    location: job?.location || "",
    city: job?.city || "",
    country: job?.country || "Bulgaria",
    is_remote: job?.is_remote || false,
    is_hybrid: job?.is_hybrid || false,
    work_hours: job?.work_hours || "",
    schedule_type: job?.schedule_type || "",
    show_salary: job?.show_salary !== undefined ? job.show_salary : true,
    salary_min: job?.salary_min || undefined,
    salary_max: job?.salary_max || undefined,
    salary_currency: job?.salary_currency || "BGN",
    salary_period: job?.salary_period || "per_month",
    required_skills: job?.required_skills || [] as string[],
    benefits: job?.benefits || [] as string[],
    application_deadline: job?.application_deadline
      ? format(new Date(job.application_deadline), "yyyy-MM-dd")
      : "",
    company_id: job?.company_id || "",
    post_as_company: !!job?.company_id,
  });

  const [skillInput, setSkillInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  // Load companies on mount
  useEffect(() => {
    if (open && user) {
      loadUserCompanies();
    }
  }, [open, user]);

  const loadUserCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const allCompanies = await loadCompanies();
      // Filter to user's companies
      const userCompanies = allCompanies.filter(c => c.created_by === user?.id);
      setCompanies(userCompanies);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim()) {
      e.preventDefault();
      const skill = skillInput.trim();
      if (!formData.required_skills.includes(skill)) {
        setFormData({
          ...formData,
          required_skills: [...formData.required_skills, skill],
        });
      }
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      required_skills: formData.required_skills.filter(s => s !== skill),
    });
  };

  const handleAddBenefit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && benefitInput.trim()) {
      e.preventDefault();
      const benefit = benefitInput.trim();
      if (!formData.benefits.includes(benefit)) {
        setFormData({
          ...formData,
          benefits: [...formData.benefits, benefit],
        });
      }
      setBenefitInput("");
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setFormData({
      ...formData,
      benefits: formData.benefits.filter(b => b !== benefit),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        employment_type: formData.employment_type,
        experience_level: formData.experience_level,
        location: formData.location || undefined,
        city: formData.city || undefined,
        country: formData.country,
        is_remote: formData.is_remote,
        is_hybrid: formData.is_hybrid,
        work_hours: formData.work_hours || undefined,
        schedule_type: formData.schedule_type || undefined,
        show_salary: formData.show_salary,
        salary_min: formData.show_salary && formData.salary_min ? formData.salary_min : undefined,
        salary_max: formData.show_salary && formData.salary_max ? formData.salary_max : undefined,
        salary_currency: formData.show_salary ? formData.salary_currency : undefined,
        salary_period: formData.show_salary ? formData.salary_period : undefined,
        required_skills: formData.required_skills,
        benefits: formData.benefits,
        application_deadline: formData.application_deadline
          ? new Date(formData.application_deadline).toISOString()
          : undefined,
        company_id: formData.post_as_company && formData.company_id ? formData.company_id : undefined,
      };

      if (job) {
        await updateJobPosting(job.id, data);
        toast({
          title: t("jobboard.form.success.update") || "Success",
          description: t("jobboard.form.success.updateDesc") || "Job posting updated successfully",
        });
      } else {
        await createJobPosting(data);
        toast({
          title: t("jobboard.form.success.create") || "Success",
          description: t("jobboard.form.success.createDesc") || "Job posting created successfully",
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: t("jobboard.form.error.title") || "Error",
        description: error.message || t("jobboard.form.error.description") || "Failed to save job posting",
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
            {job ? t("jobboard.form.editTitle") || "Edit Job Posting" : t("jobboard.form.createTitle") || "Create Job Posting"}
          </DialogTitle>
          <DialogDescription>
            {job
              ? t("jobboard.form.editDesc") || "Update the job posting information"
              : t("jobboard.form.createDesc") || "Post a new job opening"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Post As Selection */}
          <div className="space-y-2">
            <Label>{t("jobboard.form.postAs") || "Post as"}</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="post_as_company"
                checked={formData.post_as_company}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, post_as_company: checked as boolean, company_id: checked ? formData.company_id : "" })
                }
              />
              <Label htmlFor="post_as_company" className="font-normal cursor-pointer">
                {t("jobboard.form.postAsCompany") || "Post from a company"}
              </Label>
            </div>
            {formData.post_as_company && (
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData({ ...formData, company_id: value })}
                disabled={loadingCompanies}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("jobboard.form.selectCompany") || "Select company"} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                  {companies.length === 0 && (
                    <SelectItem value="" disabled>
                      {t("jobboard.form.noCompanies") || "No companies found"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <Label htmlFor="title">{t("jobboard.form.title") || "Job Title"} *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder={t("jobboard.form.titlePlaceholder") || "e.g., Senior 3D Printing Engineer"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("jobboard.form.description") || "Description"} *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={6}
              placeholder={t("jobboard.form.descriptionPlaceholder") || "Describe the role, responsibilities, and requirements..."}
            />
          </div>

          {/* Category, Employment Type, Experience */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="employment_type">{t("jobboard.form.employmentType") || "Employment Type"} *</Label>
              <Select
                value={formData.employment_type}
                onValueChange={(value) => setFormData({ ...formData, employment_type: value as EmploymentType })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMPLOYMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {getLabel(type)}
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
                id="is_remote"
                checked={formData.is_remote}
                onCheckedChange={(checked) => setFormData({ ...formData, is_remote: checked as boolean })}
              />
              <Label htmlFor="is_remote" className="font-normal cursor-pointer">
                {t("jobboard.form.remote") || "Fully Remote"}
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_hybrid"
                checked={formData.is_hybrid}
                onCheckedChange={(checked) => setFormData({ ...formData, is_hybrid: checked as boolean })}
              />
              <Label htmlFor="is_hybrid" className="font-normal cursor-pointer">
                {t("jobboard.form.hybrid") || "Hybrid Work"}
              </Label>
            </div>
          </div>

          {/* Work Hours & Schedule */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="work_hours">{t("jobboard.form.workHours") || "Work Hours"}</Label>
              <Input
                id="work_hours"
                value={formData.work_hours}
                onChange={(e) => setFormData({ ...formData, work_hours: e.target.value })}
                placeholder={t("jobboard.form.workHoursPlaceholder") || "e.g., 9:00-18:00 or Flexible"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schedule_type">{t("jobboard.form.scheduleType") || "Schedule Type"}</Label>
              <Select
                value={formData.schedule_type}
                onValueChange={(value) => setFormData({ ...formData, schedule_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("jobboard.form.selectSchedule") || "Select schedule type"} />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {getLabel(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary Section */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="show_salary"
                checked={formData.show_salary}
                onCheckedChange={(checked) => setFormData({ ...formData, show_salary: checked as boolean })}
              />
              <Label htmlFor="show_salary" className="font-normal cursor-pointer">
                {t("jobboard.form.showSalary") || "Show salary in listing"}
              </Label>
            </div>

            {formData.show_salary && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary_min">{t("jobboard.form.salaryMin") || "Min Salary"}</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    value={formData.salary_min || ""}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_max">{t("jobboard.form.salaryMax") || "Max Salary"}</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    value={formData.salary_max || ""}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary_currency">{t("jobboard.form.currency") || "Currency"}</Label>
                  <Select
                    value={formData.salary_currency}
                    onValueChange={(value) => setFormData({ ...formData, salary_currency: value })}
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
                <div className="space-y-2">
                  <Label htmlFor="salary_period">{t("jobboard.form.salaryPeriod") || "Period"}</Label>
                  <Select
                    value={formData.salary_period}
                    onValueChange={(value) => setFormData({ ...formData, salary_period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_PERIODS.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {getLabel(period)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Required Skills */}
          <div className="space-y-2">
            <Label htmlFor="skills">{t("jobboard.form.requiredSkills") || "Required Skills"}</Label>
            <Input
              id="skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder={t("jobboard.form.skillsPlaceholder") || "Type a skill and press Enter"}
            />
            {formData.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.required_skills.map((skill) => (
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

          {/* Benefits */}
          <div className="space-y-2">
            <Label htmlFor="benefits">{t("jobboard.form.benefits") || "Benefits"}</Label>
            <Input
              id="benefits"
              value={benefitInput}
              onChange={(e) => setBenefitInput(e.target.value)}
              onKeyDown={handleAddBenefit}
              placeholder={t("jobboard.form.benefitsPlaceholder") || "Type a benefit and press Enter"}
            />
            {formData.benefits.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.benefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary" className="rounded-full">
                    {benefit}
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(benefit)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Application Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline">{t("jobboard.form.deadline") || "Application Deadline"}</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.application_deadline}
              onChange={(e) => setFormData({ ...formData, application_deadline: e.target.value })}
              min={format(new Date(), "yyyy-MM-dd")}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? t("common.loading") || "Loading..."
                : job
                ? t("common.update") || "Update"
                : t("common.create") || "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
