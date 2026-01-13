import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Star,
  Eye,
  Edit,
  FileText,
  Link as LinkIcon,
  Github,
  Briefcase,
  DollarSign,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { JobSeekerProfile } from "@/lib/jobs";
import { toggleFavorite, incrementProfileViewCount } from "@/lib/jobs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { JobDetailView } from "./JobDetailView";
import { useState } from "react";

interface JobSeekerCardProps {
  profile: JobSeekerProfile;
  viewMode: "grid" | "list";
  isFavorited?: boolean;
  onEdit?: () => void;
  onFavoriteChange?: () => void;
}

export const JobSeekerCard = ({
  profile,
  viewMode,
  isFavorited = false,
  onEdit,
  onFavoriteChange,
}: JobSeekerCardProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showDetail, setShowDetail] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newState = await toggleFavorite(profile.id, "profile");
      setFavorited(newState);
      onFavoriteChange?.();
      toast({
        title: newState
          ? t("jobboard.favorited") || "Added to favorites"
          : t("jobboard.unfavorited") || "Removed from favorites",
      });
    } catch (error) {
      toast({
        title: t("jobboard.error.favoriteFailed") || "Error",
        description: t("jobboard.error.favoriteFailedDesc") || "Failed to update favorite",
        variant: "destructive",
      });
    }
  };

  const handleView = () => {
    incrementProfileViewCount(profile.id);
    setShowDetail(true);
  };

  const formatSalaryExpectation = () => {
    if (!profile.show_salary_expectation || !profile.desired_salary_min) {
      return t("jobboard.salaryNegotiable") || "Negotiable";
    }
    const min = profile.desired_salary_min.toLocaleString();
    const max = profile.desired_salary_max ? profile.desired_salary_max.toLocaleString() : null;
    const currency = profile.desired_salary_currency || "BGN";
    return max ? `${min}-${max} ${currency}/mo` : `${min} ${currency}/mo`;
  };

  if (viewMode === "list") {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleView}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={profile.user_image} alt={profile.user_name} />
                <AvatarFallback>
                  {profile.user_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{profile.user_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{profile.title}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {profile.city && (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>{profile.city}</span>
                        </>
                      )}
                      {profile.open_to_remote && (
                        <Badge variant="secondary" className="text-xs">
                          {t("jobboard.remote") || "Remote"}
                        </Badge>
                      )}
                      {profile.open_to_hybrid && (
                        <Badge variant="secondary" className="text-xs">
                          {t("jobboard.hybrid") || "Hybrid"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {profile.summary}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">{profile.category}</Badge>
                      <Badge variant="outline">
                        {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
                      </Badge>
                      {profile.skills.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {profile.resume_path && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {t("jobboard.resumeAvailable") || "Resume"}
                        </span>
                      )}
                      {profile.portfolio_paths.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {profile.portfolio_paths.length} {t("jobboard.portfolioItems") || "portfolio items"}
                        </span>
                      )}
                      {profile.linkedin_url && (
                        <LinkIcon className="h-3 w-3" />
                      )}
                      {profile.github_url && (
                        <Github className="h-3 w-3" />
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {profile.view_count} {t("jobboard.views") || "views"}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleFavorite}
                    >
                      <Star className={cn("h-4 w-4", favorited && "fill-yellow-400 text-yellow-400")} />
                    </Button>
                    <Button size="sm" onClick={(e) => {
                      e.stopPropagation();
                      handleView();
                    }}>
                      {t("jobboard.viewProfile") || "View Profile"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showDetail && (
          <JobDetailView
            profile={profile}
            open={showDetail}
            onOpenChange={setShowDetail}
          />
        )}
      </>
    );
  }

  // Grid view
  return (
    <>
      <Card
        className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col"
        onClick={handleView}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile.user_image} alt={profile.user_name} />
              <AvatarFallback>
                {profile.user_name?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={handleFavorite}
              >
                <Star className={cn("h-3 w-3", favorited && "fill-yellow-400 text-yellow-400")} />
              </Button>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-1">{profile.user_name}</h3>
          <p className="text-sm text-muted-foreground mb-2">{profile.title}</p>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            {profile.city && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{profile.city}</span>
              </>
            )}
            {profile.open_to_remote && (
              <Badge variant="secondary" className="text-xs">
                {t("jobboard.remote") || "Remote"}
              </Badge>
            )}
            {profile.open_to_hybrid && (
              <Badge variant="secondary" className="text-xs">
                {t("jobboard.hybrid") || "Hybrid"}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" className="text-xs">
              {profile.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {profile.summary}
          </p>

          {profile.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {profile.skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {profile.skills.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{profile.skills.length - 4}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-2 mb-4 text-sm">
            {profile.resume_path && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{t("jobboard.resumeAvailable") || "Resume Available"}</span>
              </div>
            )}
            {profile.portfolio_paths.length > 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>
                  {profile.portfolio_paths.length} {t("jobboard.portfolioItems") || "portfolio items"}
                </span>
              </div>
            )}
            {profile.availability && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {t(`jobboard.availability.${profile.availability}`) || profile.availability.replace("_", " ")}
                </span>
              </div>
            )}
            {profile.show_salary_expectation && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{formatSalaryExpectation()}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {profile.view_count}
              </span>
              <span>{formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
            </div>
            <div className="flex items-center gap-2">
              {profile.linkedin_url && (
                <LinkIcon className="h-3 w-3" />
              )}
              {profile.github_url && (
                <Github className="h-3 w-3" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showDetail && (
        <JobDetailView
          profile={profile}
          open={showDetail}
          onOpenChange={setShowDetail}
        />
      )}
    </>
  );
};
