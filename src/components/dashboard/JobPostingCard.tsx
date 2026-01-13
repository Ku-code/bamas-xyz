import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Eye,
  Edit,
  Calendar,
  Briefcase,
  Building2,
  Globe,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import type { JobPosting, JobApplication } from "@/lib/jobs";
import { toggleFavorite, incrementJobViewCount } from "@/lib/jobs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { JobDetailView } from "./JobDetailView";
import { useState } from "react";

interface JobPostingCardProps {
  job: JobPosting;
  viewMode: "grid" | "list";
  isFavorited?: boolean;
  application?: JobApplication;
  onEdit?: () => void;
  onFavoriteChange?: () => void;
}

export const JobPostingCard = ({
  job,
  viewMode,
  isFavorited = false,
  application,
  onEdit,
  onFavoriteChange,
}: JobPostingCardProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showDetail, setShowDetail] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newState = await toggleFavorite(job.id, "job");
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
    incrementJobViewCount(job.id);
    setShowDetail(true);
  };

  const formatSalary = () => {
    if (!job.show_salary || !job.salary_min) {
      return t("jobboard.salaryNotDisclosed") || "Salary not disclosed";
    }
    const min = job.salary_min.toLocaleString();
    const max = job.salary_max ? job.salary_max.toLocaleString() : null;
    const currency = job.salary_currency || "BGN";
    const period = job.salary_period === "per_hour" ? "/hr" : job.salary_period === "per_year" ? "/yr" : "/mo";
    return max ? `${min}-${max} ${currency}${period}` : `${min} ${currency}${period}`;
  };

  const formatEmploymentType = (type: string) => {
    return type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (viewMode === "list") {
    return (
      <>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={handleView}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Company Logo */}
              <Avatar className="h-12 w-12">
                <AvatarImage src={job.company_logo_url} alt={job.company_name || job.posted_by_name} />
                <AvatarFallback>
                  {job.company_name?.[0] || job.posted_by_name?.[0] || "J"}
                </AvatarFallback>
              </Avatar>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{job.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      {job.company_name && (
                        <>
                          <Building2 className="h-3 w-3" />
                          <span>{job.company_name}</span>
                        </>
                      )}
                      {job.city && (
                        <>
                          <MapPin className="h-3 w-3 ml-2" />
                          <span>{job.city}</span>
                        </>
                      )}
                      {job.is_remote && (
                        <Badge variant="secondary" className="text-xs">
                          {t("jobboard.remote") || "Remote"}
                        </Badge>
                      )}
                      {job.is_hybrid && (
                        <Badge variant="secondary" className="text-xs">
                          {t("jobboard.hybrid") || "Hybrid"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {job.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline">{formatEmploymentType(job.employment_type)}</Badge>
                      <Badge variant="outline">{job.category}</Badge>
                      <Badge variant="outline">
                        {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                      </Badge>
                      {job.required_skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatSalary()}
                      </span>
                      {job.work_hours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.work_hours}
                        </span>
                      )}
                      {job.application_deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(job.application_deadline), "MMM dd, yyyy")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {job.view_count} {t("jobboard.views") || "views"}
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {application && (
                      <Badge
                        variant={
                          application.status === "accepted"
                            ? "default"
                            : application.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {application.status}
                      </Badge>
                    )}
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
                      {t("jobboard.view") || "View"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {showDetail && (
          <JobDetailView
            job={job}
            open={showDetail}
            onOpenChange={setShowDetail}
            application={application}
          />
        )}
      </>
    );
  }

  // Grid view
  return (
    <>
      <Card
        id={`job-${job.id}`}
        className="hover:shadow-lg transition-all cursor-pointer h-full flex flex-col"
        onClick={handleView}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={job.company_logo_url} alt={job.company_name || job.posted_by_name} />
              <AvatarFallback>
                {job.company_name?.[0] || job.posted_by_name?.[0] || "J"}
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

          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{job.title}</h3>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            {job.company_name && (
              <>
                <Building2 className="h-3 w-3" />
                <span className="truncate">{job.company_name}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            {job.city && (
              <>
                <MapPin className="h-3 w-3" />
                <span>{job.city}</span>
              </>
            )}
            {job.is_remote && (
              <Badge variant="secondary" className="text-xs">
                {t("jobboard.remote") || "Remote"}
              </Badge>
            )}
            {job.is_hybrid && (
              <Badge variant="secondary" className="text-xs">
                {t("jobboard.hybrid") || "Hybrid"}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mb-3">
            <Badge variant="outline" className="text-xs">
              {formatEmploymentType(job.employment_type)}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {job.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
            {job.description}
          </p>

          {job.required_skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {job.required_skills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.required_skills.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{job.required_skills.length - 4}
                </Badge>
              )}
            </div>
          )}

          <div className="space-y-2 mb-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="font-medium">{formatSalary()}</span>
            </div>
            {job.work_hours && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{job.work_hours}</span>
              </div>
            )}
            {job.application_deadline && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  {t("jobboard.deadline") || "Deadline"}: {format(new Date(job.application_deadline), "MMM dd, yyyy")}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {job.view_count}
              </span>
              <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
            </div>
            {application && (
              <Badge
                variant={
                  application.status === "accepted"
                    ? "default"
                    : application.status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
                className="text-xs"
              >
                {application.status}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {showDetail && (
        <JobDetailView
          job={job}
          open={showDetail}
          onOpenChange={setShowDetail}
          application={application}
        />
      )}
    </>
  );
};
