import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Building2,
  Globe,
  Eye,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock as ClockIcon,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import type { JobPosting, JobSeekerProfile, JobApplication } from "@/lib/jobs";
import { JobApplicationDialog } from "./JobApplicationDialog";
import { useState, useEffect } from "react";
import { getFileUrl } from "@/lib/jobs";
import { FileText } from "lucide-react";

interface JobDetailViewProps {
  job?: JobPosting;
  profile?: JobSeekerProfile;
  application?: JobApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JobDetailView = ({
  job,
  profile,
  application,
  open,
  onOpenChange,
}: JobDetailViewProps) => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [coverLetterUrl, setCoverLetterUrl] = useState<string | null>(null);
  const [portfolioUrls, setPortfolioUrls] = useState<Record<number, string>>({});

  // Load file URLs for profile
  useEffect(() => {
    if (profile && open) {
      if (profile.resume_path) {
        getFileUrl(profile.resume_path).then(setResumeUrl).catch(console.error);
      }
      if (profile.cover_letter_path) {
        getFileUrl(profile.cover_letter_path).then(setCoverLetterUrl).catch(console.error);
      }
      if (profile.portfolio_paths.length > 0) {
        Promise.all(
          profile.portfolio_paths.map((path, index) =>
            getFileUrl(path).then(url => ({ index, url }))
          )
        ).then(results => {
          const urls: Record<number, string> = {};
          results.forEach(({ index, url }) => {
            urls[index] = url;
          });
          setPortfolioUrls(urls);
        }).catch(console.error);
      }
    }
  }, [profile, open]);

  if (job) {
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

    const canApply = user && user.id !== job.posted_by && !application;
    const isPoster = user?.id === job.posted_by;

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl mb-2">{job.title}</DialogTitle>
                  <DialogDescription className="flex items-center gap-4 flex-wrap">
                    {job.company_name && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span>{job.company_name}</span>
                      </div>
                    )}
                    {job.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{job.city}, {job.country}</span>
                      </div>
                    )}
                    {job.is_remote && (
                      <Badge variant="secondary">{t("jobboard.remote") || "Remote"}</Badge>
                    )}
                    {job.is_hybrid && (
                      <Badge variant="secondary">{t("jobboard.hybrid") || "Hybrid"}</Badge>
                    )}
                  </DialogDescription>
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={job.company_logo_url} alt={job.company_name || job.posted_by_name} />
                  <AvatarFallback>
                    {job.company_name?.[0] || job.posted_by_name?.[0] || "J"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </DialogHeader>

            <div className="space-y-6">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge>{formatEmploymentType(job.employment_type)}</Badge>
                <Badge>{job.category}</Badge>
                <Badge>
                  {job.experience_level.charAt(0).toUpperCase() + job.experience_level.slice(1)}
                </Badge>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-semibold mb-2">{t("jobboard.detail.description") || "Description"}</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>

              <Separator />

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {job.work_hours && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t("jobboard.detail.workHours") || "Work Hours"}</p>
                      <p className="text-sm text-muted-foreground">{job.work_hours}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("jobboard.detail.salary") || "Salary"}</p>
                    <p className="text-sm text-muted-foreground">{formatSalary()}</p>
                  </div>
                </div>
                {job.application_deadline && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{t("jobboard.detail.deadline") || "Application Deadline"}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(job.application_deadline), "MMM dd, yyyy")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("jobboard.detail.views") || "Views"}</p>
                    <p className="text-sm text-muted-foreground">{job.view_count}</p>
                  </div>
                </div>
              </div>

              {/* Required Skills */}
              {job.required_skills.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">{t("jobboard.detail.requiredSkills") || "Required Skills"}</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Benefits */}
              {job.benefits.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2">{t("jobboard.detail.benefits") || "Benefits"}</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.benefits.map((benefit) => (
                        <Badge key={benefit} variant="outline">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Application Status */}
              {application && (
                <>
                  <Separator />
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">{t("jobboard.detail.applicationStatus") || "Your Application Status"}</h3>
                    <div className="flex items-center gap-2">
                      {application.status === "accepted" && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {application.status === "rejected" && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      {(application.status === "pending" || application.status === "viewed" || application.status === "shortlisted" || application.status === "interview") && (
                        <ClockIcon className="h-5 w-5 text-yellow-600" />
                      )}
                      <Badge
                        variant={
                          application.status === "accepted"
                            ? "default"
                            : application.status === "rejected"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {t("jobboard.detail.appliedOn") || "Applied on"} {format(new Date(application.created_at), "MMM dd, yyyy")}
                      </span>
                    </div>
                    {application.reviewer_notes && (
                      <p className="text-sm text-muted-foreground mt-2">{application.reviewer_notes}</p>
                    )}
                  </div>
                </>
              )}

              {/* Posted Info */}
              <Separator />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>{t("jobboard.detail.postedBy") || "Posted by"}: {job.posted_by_name}</span>
                  <span>•</span>
                  <span>{formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4">
                {canApply && (
                  <Button onClick={() => setShowApplicationDialog(true)}>
                    {t("jobboard.apply") || "Apply Now"}
                  </Button>
                )}
                {isPoster && (
                  <Button variant="outline" onClick={() => {
                    // Trigger edit in parent
                    onOpenChange(false);
                  }}>
                    {t("common.edit") || "Edit"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  {t("common.close") || "Close"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {showApplicationDialog && (
          <JobApplicationDialog
            job={job}
            open={showApplicationDialog}
            onOpenChange={setShowApplicationDialog}
            onApplied={() => {
              setShowApplicationDialog(false);
              onOpenChange(false);
            }}
          />
        )}
      </>
    );
  }

  if (profile) {
    const formatSalaryExpectation = () => {
      if (!profile.show_salary_expectation || !profile.desired_salary_min) {
        return t("jobboard.salaryNegotiable") || "Negotiable";
      }
      const min = profile.desired_salary_min.toLocaleString();
      const max = profile.desired_salary_max ? profile.desired_salary_max.toLocaleString() : null;
      const currency = profile.desired_salary_currency || "BGN";
      return max ? `${min}-${max} ${currency}/mo` : `${min} ${currency}/mo`;
    };

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-2">{profile.user_name}</DialogTitle>
                <DialogDescription className="text-lg">{profile.title}</DialogDescription>
              </div>
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.user_image} alt={profile.user_name} />
                <AvatarFallback>
                  {profile.user_name?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge>{profile.category}</Badge>
              <Badge>
                {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
              </Badge>
              {profile.open_to_remote && (
                <Badge variant="secondary">{t("jobboard.remote") || "Remote"}</Badge>
              )}
              {profile.open_to_hybrid && (
                <Badge variant="secondary">{t("jobboard.hybrid") || "Hybrid"}</Badge>
              )}
            </div>

            {/* Summary */}
            <div>
              <h3 className="font-semibold mb-2">{t("jobboard.detail.summary") || "Summary"}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{profile.summary}</p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.city && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("jobboard.detail.location") || "Location"}</p>
                    <p className="text-sm text-muted-foreground">{profile.city}, {profile.country}</p>
                  </div>
                </div>
              )}
              {profile.availability && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("jobboard.detail.availability") || "Availability"}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(`jobboard.availability.${profile.availability}`) || profile.availability.replace("_", " ")}
                    </p>
                  </div>
                </div>
              )}
              {profile.show_salary_expectation && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t("jobboard.detail.salaryExpectation") || "Salary Expectation"}</p>
                    <p className="text-sm text-muted-foreground">{formatSalaryExpectation()}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t("jobboard.detail.views") || "Views"}</p>
                  <p className="text-sm text-muted-foreground">{profile.view_count}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            {profile.skills.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">{t("jobboard.detail.skills") || "Skills"}</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Documents & Links */}
            {(profile.resume_path || profile.cover_letter_path || profile.portfolio_paths.length > 0 || profile.portfolio_url || profile.linkedin_url || profile.github_url) && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">{t("jobboard.detail.documentsLinks") || "Documents & Links"}</h3>
                  <div className="space-y-2">
                    {profile.resume_path && resumeUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          {t("jobboard.detail.viewResume") || "View Resume"}
                        </a>
                      </Button>
                    )}
                    {profile.cover_letter_path && coverLetterUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={coverLetterUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          {t("jobboard.detail.viewCoverLetter") || "View Cover Letter"}
                        </a>
                      </Button>
                    )}
                    {profile.portfolio_paths.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{t("jobboard.detail.portfolioFiles") || "Portfolio Files"}</p>
                        {profile.portfolio_paths.map((path, index) => (
                          portfolioUrls[index] && (
                            <Button key={index} variant="outline" size="sm" asChild className="mr-2">
                              <a href={portfolioUrls[index]} target="_blank" rel="noopener noreferrer">
                                <Briefcase className="h-4 w-4 mr-2" />
                                {t("jobboard.detail.portfolioFile") || "Portfolio File"} {index + 1}
                              </a>
                            </Button>
                          )
                        ))}
                      </div>
                    )}
                    {profile.portfolio_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          {t("jobboard.detail.portfolioWebsite") || "Portfolio Website"}
                        </a>
                      </Button>
                    )}
                    {profile.linkedin_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {profile.github_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={profile.github_url} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4 mr-2" />
                          GitHub/GitLab
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Contact */}
            {profile.user_email && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">{t("jobboard.detail.contact") || "Contact"}</h3>
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${profile.user_email}`}>
                      {profile.user_email}
                    </a>
                  </Button>
                </div>
              </>
            )}

            {/* Posted Info */}
            <Separator />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.close") || "Close"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};
