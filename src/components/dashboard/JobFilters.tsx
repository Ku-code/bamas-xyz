import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { JobFilters as JobFiltersType, ProfileFilters, EmploymentType, ExperienceLevel } from "@/lib/jobs";

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

interface JobFiltersProps {
  type: "job" | "profile";
  filters: JobFiltersType | ProfileFilters;
  onFiltersChange: (filters: JobFiltersType | ProfileFilters) => void;
}

export const JobFilters = ({ type, filters, onFiltersChange }: JobFiltersProps) => {
  const { t, language } = useLanguage();

  const getLabel = (item: { label: { en: string; bg: string } }) => {
    return language === "bg" ? item.label.bg : item.label.en;
  };

  const handleCategoryToggle = (category: string) => {
    const currentCategories = (filters.category || []) as string[];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter(c => c !== category)
      : [...currentCategories, category];
    onFiltersChange({ ...filters, category: newCategories });
  };

  const handleEmploymentTypeToggle = (type: EmploymentType) => {
    const currentTypes = (filters.employment_type || []) as EmploymentType[];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    onFiltersChange({ ...filters, employment_type: newTypes });
  };

  const handleExperienceLevelToggle = (level: ExperienceLevel) => {
    const currentLevels = (filters.experience_level || []) as ExperienceLevel[];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter(l => l !== level)
      : [...currentLevels, level];
    onFiltersChange({ ...filters, experience_level: newLevels });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = () => {
    if (type === "job") {
      const jobFilters = filters as JobFiltersType;
      return !!(
        (jobFilters.category && jobFilters.category.length > 0) ||
        (jobFilters.employment_type && jobFilters.employment_type.length > 0) ||
        (jobFilters.experience_level && jobFilters.experience_level.length > 0) ||
        jobFilters.is_remote !== undefined ||
        jobFilters.is_hybrid !== undefined ||
        (jobFilters.location && jobFilters.location.length > 0) ||
        jobFilters.posted_date ||
        jobFilters.salary_min ||
        jobFilters.salary_max
      );
    } else {
      const profileFilters = filters as ProfileFilters;
      return !!(
        (profileFilters.category && profileFilters.category.length > 0) ||
        (profileFilters.experience_level && profileFilters.experience_level.length > 0) ||
        profileFilters.open_to_remote !== undefined ||
        profileFilters.open_to_hybrid !== undefined ||
        (profileFilters.location && profileFilters.location.length > 0) ||
        profileFilters.has_portfolio
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{t("jobboard.filters.title") || "Filters"}</h3>
        {hasActiveFilters() && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            {t("jobboard.filters.clear") || "Clear All"}
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>{t("jobboard.filters.category") || "Category"}</Label>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {JOB_CATEGORIES.map((cat) => (
            <div key={cat.value} className="flex items-center space-x-2">
              <Checkbox
                id={`category-${cat.value}`}
                checked={(filters.category || []).includes(cat.value)}
                onCheckedChange={() => handleCategoryToggle(cat.value)}
              />
              <Label htmlFor={`category-${cat.value}`} className="font-normal cursor-pointer text-sm">
                {getLabel(cat)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Employment Type (Jobs only) */}
      {type === "job" && (
        <div className="space-y-2">
          <Label>{t("jobboard.filters.employmentType") || "Employment Type"}</Label>
          <div className="space-y-2">
            {EMPLOYMENT_TYPES.map((empType) => (
              <div key={empType.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`emp-type-${empType.value}`}
                  checked={((filters as JobFiltersType).employment_type || []).includes(empType.value)}
                  onCheckedChange={() => handleEmploymentTypeToggle(empType.value)}
                />
                <Label htmlFor={`emp-type-${empType.value}`} className="font-normal cursor-pointer text-sm">
                  {getLabel(empType)}
                </Label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Experience Level */}
      <div className="space-y-2">
        <Label>{t("jobboard.filters.experienceLevel") || "Experience Level"}</Label>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((level) => (
            <div key={level.value} className="flex items-center space-x-2">
              <Checkbox
                id={`exp-level-${level.value}`}
                checked={(filters.experience_level || []).includes(level.value)}
                onCheckedChange={() => handleExperienceLevelToggle(level.value)}
              />
              <Label htmlFor={`exp-level-${level.value}`} className="font-normal cursor-pointer text-sm">
                {getLabel(level)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label>{t("jobboard.filters.location") || "Location"}</Label>
        <Input
          placeholder={t("jobboard.filters.locationPlaceholder") || "City name..."}
          value={(filters.location && Array.isArray(filters.location) ? filters.location[0] : "") || ""}
          onChange={(e) => {
            const value = e.target.value;
            onFiltersChange({
              ...filters,
              location: value ? [value] : undefined,
            });
          }}
        />
      </div>

      {/* Remote/Hybrid Options */}
      {type === "job" ? (
        <>
          <div className="space-y-2">
            <Label>{t("jobboard.filters.workArrangement") || "Work Arrangement"}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-remote"
                  checked={(filters as JobFiltersType).is_remote === true}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...filters,
                      is_remote: checked ? true : undefined,
                    });
                  }}
                />
                <Label htmlFor="filter-remote" className="font-normal cursor-pointer text-sm">
                  {t("jobboard.remote") || "Remote"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-hybrid"
                  checked={(filters as JobFiltersType).is_hybrid === true}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...filters,
                      is_hybrid: checked ? true : undefined,
                    });
                  }}
                />
                <Label htmlFor="filter-hybrid" className="font-normal cursor-pointer text-sm">
                  {t("jobboard.hybrid") || "Hybrid"}
                </Label>
              </div>
            </div>
          </div>

          {/* Posted Date Filter */}
          <div className="space-y-2">
            <Label>{t("jobboard.filters.postedDate") || "Posted Date"}</Label>
            <Select
              value={(filters as JobFiltersType).posted_date || "all"}
              onValueChange={(value) => {
                onFiltersChange({
                  ...filters,
                  posted_date: value === "all" ? undefined : (value as "24h" | "7d" | "30d"),
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("jobboard.filters.allTime") || "All Time"}</SelectItem>
                <SelectItem value="24h">{t("jobboard.filters.last24h") || "Last 24 Hours"}</SelectItem>
                <SelectItem value="7d">{t("jobboard.filters.last7d") || "Last 7 Days"}</SelectItem>
                <SelectItem value="30d">{t("jobboard.filters.last30d") || "Last 30 Days"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Salary Range */}
          <div className="space-y-2">
            <Label>{t("jobboard.filters.salaryRange") || "Salary Range"}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder={t("jobboard.filters.min") || "Min"}
                value={(filters as JobFiltersType).salary_min || ""}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    salary_min: e.target.value ? parseFloat(e.target.value) : undefined,
                  });
                }}
              />
              <Input
                type="number"
                placeholder={t("jobboard.filters.max") || "Max"}
                value={(filters as JobFiltersType).salary_max || ""}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    salary_max: e.target.value ? parseFloat(e.target.value) : undefined,
                  });
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>{t("jobboard.filters.workPreferences") || "Work Preferences"}</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-open-remote"
                  checked={(filters as ProfileFilters).open_to_remote === true}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...filters,
                      open_to_remote: checked ? true : undefined,
                    });
                  }}
                />
                <Label htmlFor="filter-open-remote" className="font-normal cursor-pointer text-sm">
                  {t("jobboard.openToRemote") || "Open to Remote"}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filter-open-hybrid"
                  checked={(filters as ProfileFilters).open_to_hybrid === true}
                  onCheckedChange={(checked) => {
                    onFiltersChange({
                      ...filters,
                      open_to_hybrid: checked ? true : undefined,
                    });
                  }}
                />
                <Label htmlFor="filter-open-hybrid" className="font-normal cursor-pointer text-sm">
                  {t("jobboard.openToHybrid") || "Open to Hybrid"}
                </Label>
              </div>
            </div>
          </div>

          {/* Has Portfolio */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="filter-has-portfolio"
                checked={(filters as ProfileFilters).has_portfolio === true}
                onCheckedChange={(checked) => {
                  onFiltersChange({
                    ...filters,
                    has_portfolio: checked ? true : undefined,
                  });
                }}
              />
              <Label htmlFor="filter-has-portfolio" className="font-normal cursor-pointer text-sm">
                {t("jobboard.filters.hasPortfolio") || "Has Portfolio"}
              </Label>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
