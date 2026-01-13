import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Clock,
  Star,
  FileText,
  MapPin,
  Calendar
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  loadJobPostings,
  loadJobSeekerProfiles,
  loadRecentJobs,
  searchJobs,
  getMyApplications,
  getFavorites,
  type JobPosting,
  type JobSeekerProfile,
  type JobApplication,
  type JobFilters,
  type ProfileFilters,
} from "@/lib/jobs";
import { JobPostingCard } from "./JobPostingCard";
import { JobSeekerCard } from "./JobSeekerCard";
import { JobPostingForm } from "./JobPostingForm";
import { JobSeekerForm } from "./JobSeekerForm";
import { JobFilters as FiltersPanel } from "./JobFilters";
import { formatDistanceToNow } from "date-fns";

type ViewMode = "grid" | "list";
type ActiveTab = "all" | "talent" | "my-posts" | "my-applications" | "saved";

export const JobBoardContent = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  // State
  const [activeTab, setActiveTab] = useState<ActiveTab>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tablesMissing, setTablesMissing] = useState(false);

  // Data
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [profiles, setProfiles] = useState<JobSeekerProfile[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobPosting[]>([]);
  const [myApplications, setMyApplications] = useState<JobApplication[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [myJobIds, setMyJobIds] = useState<string[]>([]);

  // Filters
  const [jobFilters, setJobFilters] = useState<JobFilters>({});
  const [profileFilters, setProfileFilters] = useState<ProfileFilters>({});

  // Dialogs
  const [showJobForm, setShowJobForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [editingProfile, setEditingProfile] = useState<JobSeekerProfile | null>(null);

  // Load data based on active tab
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setTablesMissing(false); // Reset on each load attempt

      switch (activeTab) {
        case "all":
          try {
            const [allJobs, recent] = await Promise.all([
              searchQuery 
                ? searchJobs(searchQuery, jobFilters)
                : loadJobPostings(jobFilters),
              loadRecentJobs(10),
            ]);
            setJobs(allJobs || []);
            setRecentJobs(recent || []);
            
            // Check if tables might be missing (only check once)
            if ((!allJobs || allJobs.length === 0) && (!recent || recent.length === 0)) {
              const hasCheckedTables = sessionStorage.getItem('jobboard_tables_checked');
              if (!hasCheckedTables && user) {
                // Test if table exists
                const { error: testError } = await supabase
                  .from('job_postings')
                  .select('id')
                  .limit(1);
                if (testError?.code === '42P01') {
                  setTablesMissing(true);
                  sessionStorage.setItem('jobboard_tables_checked', 'true');
                } else {
                  sessionStorage.setItem('jobboard_tables_checked', 'true');
                }
              }
            }
          } catch (err: any) {
            console.error("Error loading jobs:", err);
            setJobs([]);
            setRecentJobs([]);
            if (err?.code === '42P01') {
              setTablesMissing(true);
            }
          }
          break;

        case "talent":
          try {
            const talentProfiles = searchQuery
              ? await loadJobSeekerProfiles({ ...profileFilters, search: searchQuery })
              : await loadJobSeekerProfiles(profileFilters);
            setProfiles(talentProfiles || []);
          } catch (err: any) {
            console.error("Error loading profiles:", err);
            setProfiles([]);
            if (err?.code === '42P01') {
              setTablesMissing(true);
            }
          }
          break;

        case "my-posts":
          try {
            const myJobs = await loadJobPostings({});
            const myPostedJobs = myJobs.filter(j => j.posted_by === user?.id);
            setJobs(myPostedJobs);
            setMyJobIds(myPostedJobs.map(j => j.id));
          } catch (err: any) {
            console.error("Error loading my posts:", err);
            setJobs([]);
            if (err?.code === '42P01') {
              setTablesMissing(true);
            }
          }
          break;

        case "my-applications":
          try {
            const applications = await getMyApplications();
            setMyApplications(applications || []);
            // Load job details for applications
            const jobIds = applications.map(a => a.job_id);
            if (jobIds.length > 0) {
              const appliedJobs = await Promise.all(
                jobIds.map(id => loadJobPostings({}))
              ).then(jobs => 
                jobs.flat().filter(j => jobIds.includes(j.id))
              );
              setJobs(appliedJobs);
            }
          } catch (err: any) {
            console.error("Error loading applications:", err);
            setMyApplications([]);
            setJobs([]);
            if (err?.code === '42P01') {
              setTablesMissing(true);
            }
          }
          break;

        case "saved":
          try {
            const [savedIds, savedProfileIds] = await Promise.all([
              getFavorites("job"),
              getFavorites("profile"),
            ]);
            setFavorites([...savedIds, ...savedProfileIds]);
            
            if (savedIds.length > 0) {
              const savedJobs = await loadJobPostings({});
              setJobs(savedJobs.filter(j => savedIds.includes(j.id)));
            }
            if (savedProfileIds.length > 0) {
              const savedProfiles = await loadJobSeekerProfiles({});
              setProfiles(savedProfiles.filter(p => savedProfileIds.includes(p.id)));
            }
          } catch (err: any) {
            console.error("Error loading saved items:", err);
            setJobs([]);
            setProfiles([]);
            if (err?.code === '42P01') {
              setTablesMissing(true);
            }
          }
          break;
      }
    } catch (error: any) {
      console.error("Error loading job board data:", error);
      // Set empty states to ensure UI renders
      setJobs([]);
      setProfiles([]);
      setRecentJobs([]);
      setMyApplications([]);
      
      // Check if it's a missing table error
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        setTablesMissing(true);
      } else {
        // Only show toast for unexpected errors
        toast({
          title: t("jobboard.error.loadFailed") || "Error",
          description: error?.message || t("jobboard.error.loadFailedDesc") || "Failed to load data",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, jobFilters, profileFilters, user, toast, t]);

  useEffect(() => {
    // Only load data if user is available
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [loadData, user]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setShowJobForm(true);
  };

  const handleCreateProfile = () => {
    setEditingProfile(null);
    setShowProfileForm(true);
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleEditProfile = (profile: JobSeekerProfile) => {
    setEditingProfile(profile);
    setShowProfileForm(true);
  };

  const handleJobSaved = () => {
    loadData();
    setShowJobForm(false);
    setEditingJob(null);
  };

  const handleProfileSaved = () => {
    loadData();
    setShowProfileForm(false);
    setEditingProfile(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("jobboard.title") || "Job Board"}</h2>
          <p className="text-muted-foreground">
            {t("jobboard.description") || "Find opportunities or post job openings"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {t("jobboard.filters") || "Filters"}
          </Button>
          {activeTab === "all" && (
            <Button size="sm" onClick={handleCreateJob}>
              <Plus className="h-4 w-4 mr-2" />
              {t("jobboard.postJob") || "Post Job"}
            </Button>
          )}
          {activeTab === "talent" && (
            <Button size="sm" onClick={handleCreateProfile}>
              <Plus className="h-4 w-4 mr-2" />
              {t("jobboard.createProfile") || "Create Profile"}
            </Button>
          )}
        </div>
      </div>

      {/* Database Setup Message */}
      {tablesMissing && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  {t("jobboard.error.tablesMissing") || "Database Setup Required"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("jobboard.error.tablesMissingDesc") || "Job board tables not found. Please run migration 020_job_board.sql in Supabase SQL Editor."}
                </p>
                <div className="text-sm space-y-2">
                  <p className="font-medium">Steps to fix:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open Supabase Dashboard → SQL Editor</li>
                    <li>Copy the contents of <code className="bg-muted px-1 rounded">supabase/migrations/020_job_board.sql</code></li>
                    <li>Paste and run the migration</li>
                    <li>Create the storage bucket <code className="bg-muted px-1 rounded">job-files</code> (Private, no size limit)</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTablesMissing(false);
                  loadData();
                }}
              >
                {t("common.retry") || "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("jobboard.search.placeholder") || "Search jobs, companies, skills..."}
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 rounded-full"
          disabled={tablesMissing}
        />
      </div>

      {/* Recent Jobs Sidebar & Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Jobs Sidebar */}
        {activeTab === "all" && recentJobs.length > 0 && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t("jobboard.recent.title") || "Recently Posted"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentJobs.slice(0, 5).map((job) => (
                <div
                  key={job.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => {
                    // Scroll to job in main list or open detail view
                    document.getElementById(`job-${job.id}`)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{job.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {job.employment_type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {job.city && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {job.city}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className={activeTab === "all" && recentJobs.length > 0 ? "lg:col-span-3" : "lg:col-span-4"}>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">
                <Briefcase className="h-4 w-4 mr-2" />
                {t("jobboard.tabs.all") || "All Jobs"}
              </TabsTrigger>
              <TabsTrigger value="talent">
                <Users className="h-4 w-4 mr-2" />
                {t("jobboard.tabs.talent") || "Talent Pool"}
              </TabsTrigger>
              <TabsTrigger value="my-posts">
                <FileText className="h-4 w-4 mr-2" />
                {t("jobboard.tabs.myPosts") || "My Posts"}
              </TabsTrigger>
              <TabsTrigger value="my-applications">
                <Calendar className="h-4 w-4 mr-2" />
                {t("jobboard.tabs.myApplications") || "Applications"}
              </TabsTrigger>
              <TabsTrigger value="saved">
                <Star className="h-4 w-4 mr-2" />
                {t("jobboard.tabs.saved") || "Saved"}
              </TabsTrigger>
            </TabsList>

            {/* View Mode Toggle */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                {activeTab === "all" || activeTab === "my-posts" || activeTab === "saved"
                  ? `${jobs.length} ${t("jobboard.jobsFound") || "jobs found"}`
                  : activeTab === "talent"
                  ? `${profiles.length} ${t("jobboard.profilesFound") || "profiles found"}`
                  : `${myApplications.length} ${t("jobboard.applicationsFound") || "applications"}`}
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <FiltersPanel
                    type={activeTab === "talent" ? "profile" : "job"}
                    filters={activeTab === "talent" ? profileFilters : jobFilters}
                    onFiltersChange={(f) => {
                      if (activeTab === "talent") {
                        setProfileFilters(f as ProfileFilters);
                      } else {
                        setJobFilters(f as JobFilters);
                      }
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tab Content */}
            <TabsContent value="all" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t("jobboard.noJobs") || "No jobs found. Be the first to post one!"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
                }>
                  {jobs.map((job) => (
                    <JobPostingCard
                      key={job.id}
                      job={job}
                      viewMode={viewMode}
                      isFavorited={favorites.includes(job.id)}
                      onEdit={user?.id === job.posted_by ? () => handleEditJob(job) : undefined}
                      onFavoriteChange={() => loadData()}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="talent" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : profiles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t("jobboard.noProfiles") || "No profiles found. Create your profile to get started!"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
                }>
                  {profiles.map((profile) => (
                    <JobSeekerCard
                      key={profile.id}
                      profile={profile}
                      viewMode={viewMode}
                      isFavorited={favorites.includes(profile.id)}
                      onEdit={user?.id === profile.user_id ? () => handleEditProfile(profile) : undefined}
                      onFavoriteChange={() => loadData()}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-posts" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : jobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {t("jobboard.noMyPosts") || "You haven't posted any jobs yet."}
                    </p>
                    <Button onClick={handleCreateJob}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("jobboard.postJob") || "Post Your First Job"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
                }>
                  {jobs.map((job) => (
                    <JobPostingCard
                      key={job.id}
                      job={job}
                      viewMode={viewMode}
                      isFavorited={favorites.includes(job.id)}
                      onEdit={() => handleEditJob(job)}
                      onFavoriteChange={() => loadData()}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my-applications" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : myApplications.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t("jobboard.noApplications") || "You haven't applied to any jobs yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myApplications.map((application) => {
                    const job = jobs.find(j => j.id === application.job_id);
                    return job ? (
                      <JobPostingCard
                        key={application.id}
                        job={job}
                        viewMode="list"
                        application={application}
                        isFavorited={favorites.includes(job.id)}
                        onFavoriteChange={() => loadData()}
                      />
                    ) : null;
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-6">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : jobs.length === 0 && profiles.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      {t("jobboard.noSaved") || "You haven't saved any jobs or profiles yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {jobs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        {t("jobboard.savedJobs") || "Saved Jobs"}
                      </h3>
                      <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "space-y-4"
                      }>
                        {jobs.map((job) => (
                          <JobPostingCard
                            key={job.id}
                            job={job}
                            viewMode={viewMode}
                            isFavorited={true}
                            onFavoriteChange={() => loadData()}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {profiles.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">
                        {t("jobboard.savedProfiles") || "Saved Profiles"}
                      </h3>
                      <div className={viewMode === "grid" 
                        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "space-y-4"
                      }>
                        {profiles.map((profile) => (
                          <JobSeekerCard
                            key={profile.id}
                            profile={profile}
                            viewMode={viewMode}
                            isFavorited={true}
                            onFavoriteChange={() => loadData()}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      {showJobForm && (
        <JobPostingForm
          open={showJobForm}
          onOpenChange={setShowJobForm}
          job={editingJob}
          onSaved={handleJobSaved}
        />
      )}

      {showProfileForm && (
        <JobSeekerForm
          open={showProfileForm}
          onOpenChange={setShowProfileForm}
          profile={editingProfile}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  );
};
