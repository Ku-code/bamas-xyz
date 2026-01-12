import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { X, Search, Filter, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SearchFilters, TermCategory, TranslationStatus, DifficultyLevel } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";

interface TerminologyFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  onSearch: (query: string) => void;
}

const CATEGORIES: TermCategory[] = [
  'Materials',
  'Processes',
  'Equipment',
  'Software',
  'Quality_Control',
  'Post_Processing',
  'Design',
  'Standards',
  'General'
];

const STATUSES: TranslationStatus[] = [
  'Draft',
  'Under Review',
  'Approved',
  'Needs Translation'
];

const DIFFICULTIES: DifficultyLevel[] = [
  'Basic',
  'Intermediate',
  'Advanced',
  'Expert'
];

export const TerminologyFilters = ({ filters, onFiltersChange, onSearch }: TerminologyFiltersProps) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState(filters.query || "");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== filters.query) {
        onSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleCategoryToggle = (category: TermCategory) => {
    const current = filters.category || [];
    const newCategories = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    onFiltersChange({ ...filters, category: newCategories.length > 0 ? newCategories : undefined });
  };

  const handleDifficultyToggle = (difficulty: DifficultyLevel) => {
    const current = filters.difficulty_level || [];
    const newDifficulties = current.includes(difficulty)
      ? current.filter(d => d !== difficulty)
      : [...current, difficulty];
    onFiltersChange({ ...filters, difficulty_level: newDifficulties.length > 0 ? newDifficulties : undefined });
  };

  const clearFilters = () => {
    setSearchQuery("");
    onFiltersChange({
      sort_by: 'alphabetical',
      sort_order: 'asc',
    });
  };

  const hasActiveFilters = 
    (filters.category && filters.category.length > 0) ||
    (filters.translation_status && filters.translation_status.length > 0) ||
    (filters.difficulty_level && filters.difficulty_level.length > 0) ||
    filters.is_expert_verified !== undefined ||
    filters.favorites_only ||
    filters.has_bg_translation ||
    filters.has_examples ||
    filters.has_images;

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("dashboard.terminology.search") || "Search terms..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => {
              setSearchQuery("");
              onSearch("");
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={showAdvanced ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>

        {filters.favorites_only && (
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            Favorites Only
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => onFiltersChange({ ...filters, favorites_only: false })}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {filters.category && filters.category.length > 0 && (
          <Badge variant="secondary" className="gap-1">
            {filters.category.length} Categor{filters.category.length === 1 ? 'y' : 'ies'}
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0 ml-1"
              onClick={() => onFiltersChange({ ...filters, category: undefined })}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 border rounded-lg space-y-4 bg-muted/50">
          {/* Categories */}
          <div>
            <Label className="mb-2 block">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <Badge
                  key={cat}
                  variant={filters.category?.includes(cat) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleCategoryToggle(cat)}
                >
                  {cat.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Translation Status */}
          <div>
            <Label>Translation Status</Label>
            <Select
              value={filters.translation_status?.[0] || "all"}
              onValueChange={(value) => {
                if (value === "all") {
                  onFiltersChange({ ...filters, translation_status: undefined });
                } else {
                  onFiltersChange({ ...filters, translation_status: [value as TranslationStatus] });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Levels */}
          <div>
            <Label className="mb-2 block">Difficulty Level</Label>
            <div className="flex flex-wrap gap-2">
              {DIFFICULTIES.map((diff) => (
                <Badge
                  key={diff}
                  variant={filters.difficulty_level?.includes(diff) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleDifficultyToggle(diff)}
                >
                  {diff}
                </Badge>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="expert-verified">Expert Verified Only</Label>
              <Switch
                id="expert-verified"
                checked={filters.is_expert_verified || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, is_expert_verified: checked || undefined })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="has-bg">Has Bulgarian Translation</Label>
              <Switch
                id="has-bg"
                checked={filters.has_bg_translation || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, has_bg_translation: checked || undefined })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="has-examples">Has Examples</Label>
              <Switch
                id="has-examples"
                checked={filters.has_examples || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, has_examples: checked || undefined })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="has-images">Has Images</Label>
              <Switch
                id="has-images"
                checked={filters.has_images || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, has_images: checked || undefined })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="favorites-only">My Favorites Only</Label>
              <Switch
                id="favorites-only"
                checked={filters.favorites_only || false}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, favorites_only: checked || undefined })
                }
              />
            </div>
          </div>

          {/* Sort Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sort By</Label>
              <Select
                value={filters.sort_by || "alphabetical"}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, sort_by: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                  <SelectItem value="favorites">Most Favorited</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Order</Label>
              <Select
                value={filters.sort_order || "asc"}
                onValueChange={(value) =>
                  onFiltersChange({ ...filters, sort_order: value as "asc" | "desc" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
