import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Languages, Star, TrendingUp, Users, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TerminologyStats as StatsType } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";

interface TerminologyStatsProps {
  stats: StatsType;
  userFavoritesCount?: number;
  pendingSuggestionsCount?: number;
}

export const TerminologyStats = ({ 
  stats, 
  userFavoritesCount = 0,
  pendingSuggestionsCount = 0 
}: TerminologyStatsProps) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.terminology.stats.totalTerms") || "Total Terms"}
          </CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_terms}</div>
          <p className="text-xs text-muted-foreground">
            Across all categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.terminology.stats.translationProgress") || "Translation Progress"}
          </CardTitle>
          <Languages className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.translation_progress}%</div>
          <Progress value={stats.translation_progress} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {stats.total_terms - Math.round((stats.translation_progress / 100) * stats.total_terms)} terms need translation
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.terminology.stats.yourFavorites") || "Your Favorites"}
          </CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{userFavoritesCount}</div>
          <p className="text-xs text-muted-foreground">
            Bookmarked terms
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("dashboard.terminology.stats.mostPopular") || "Most Popular"}
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(stats.total_views || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total views
          </p>
        </CardContent>
      </Card>

      {pendingSuggestionsCount > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Pending Suggestions
            </CardTitle>
            <Badge variant="outline">{pendingSuggestionsCount}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {pendingSuggestionsCount} member suggestion{pendingSuggestionsCount !== 1 ? 's' : ''} awaiting review
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
