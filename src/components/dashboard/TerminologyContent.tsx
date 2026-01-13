import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Download, BookOpen, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  loadTerms,
  searchTerms,
  getStatistics,
  loadFavorites,
  loadSuggestions,
  type TerminologyTerm,
  type SearchFilters,
  type LanguageView,
  type TerminologyStats,
} from "@/lib/terminology";
import { TerminologyLanguageToggle } from "./TerminologyLanguageToggle";
import { TerminologyStats as StatsComponent } from "./TerminologyStats";
import { TerminologyFilters } from "./TerminologyFilters";
import { TerminologyCard } from "./TerminologyCard";
import { TerminologyFormDialog } from "./TerminologyFormDialog";
import { TerminologySuggestionDialog } from "./TerminologySuggestionDialog";
import { TerminologyExport } from "./TerminologyExport";
import { TerminologyImportDialog } from "./TerminologyImportDialog";
import { TerminologySuggestionsPanel } from "./TerminologySuggestionsPanel";

const TerminologyContent = () => {
  const { user, isAdmin, isSuperAdmin, isBoardMember } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();

  // #region agent log H3
  fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TerminologyContent.tsx:29',message:'Component mounted',data:{hasUser:!!user,userId:user?.id,userRole:user?.role,isAdmin,isSuperAdmin,isBoardMember},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
  // #endregion

  const [terms, setTerms] = useState<TerminologyTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [languageView, setLanguageView] = useState<LanguageView>("both");
  const [filters, setFilters] = useState<SearchFilters>({
    sort_by: "alphabetical",
    sort_order: "asc",
    language_view: "both",
  });
  const [stats, setStats] = useState<TerminologyStats>({
    total_terms: 0,
    translation_progress: 0,
    terms_by_category: {} as Record<string, number>,
    terms_by_status: {} as Record<string, number>,
    terms_by_difficulty: {} as Record<string, number>,
    expert_verified_count: 0,
    pending_suggestions: 0,
    total_favorites: 0,
    total_views: 0,
  });
  const [userFavoritesCount, setUserFavoritesCount] = useState(0);
  const [pendingSuggestionsCount, setPendingSuggestionsCount] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<TerminologyTerm | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [tablesMissing, setTablesMissing] = useState(false);

  const canManage = isAdmin || isSuperAdmin || isBoardMember;

  const loadData = useCallback(async () => {
    // #region agent log H3,H5
    fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TerminologyContent.tsx:67',message:'loadData called',data:{hasUser:!!user,userId:user?.id,userRole:user?.role,isAdmin,canManage,page,languageView,filters},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3,H5'})}).catch(()=>{});
    // #endregion
    try {
      setLoading(true);
      const [termsData, statsData, favorites, suggestions] = await Promise.all([
        loadTerms({ ...filters, language_view: languageView }, 50, page * 50),
        getStatistics(),
        loadFavorites(),
        canManage ? loadSuggestions("pending") : Promise.resolve([]),
      ]);

      // #region agent log H5
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TerminologyContent.tsx:77',message:'Data loaded successfully',data:{termsCount:termsData?.length,hasStats:!!statsData,favoritesCount:favorites?.length,suggestionsCount:suggestions?.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
      // #endregion

      if (page === 0) {
        setTerms(termsData || []);
      } else {
        setTerms(prev => [...prev, ...(termsData || [])]);
      }
      setStats(statsData || {
        total_terms: 0,
        translation_progress: 0,
        terms_by_category: {} as Record<string, number>,
        terms_by_status: {} as Record<string, number>,
        terms_by_difficulty: {} as Record<string, number>,
        expert_verified_count: 0,
        pending_suggestions: 0,
        total_favorites: 0,
        total_views: 0,
      });
      setUserFavoritesCount(favorites?.length || 0);
      setPendingSuggestionsCount(suggestions?.length || 0);
      setHasMore(termsData?.length === 50);
    } catch (error: any) {
      console.error("Error loading data:", error);
      const errorMessage = error?.message || error?.error?.message || '';
      const errorCode = error?.code || error?.error?.code;
      
      // #region agent log H1,H2,H4
      fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TerminologyContent.tsx:96',message:'Error in loadData',data:{errorCode,errorMessage,errorStack:error?.stack,fullError:JSON.stringify(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H2,H4'})}).catch(()=>{});
      // #endregion
      
      // Check if tables don't exist
      if (errorCode === '42P01' || errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
        setTablesMissing(true);
        toast({
          title: "Database Setup Required",
          description: "Terminology tables not found. Please run migration 016_terminology_dictionary.sql in Supabase.",
          variant: "destructive",
          duration: 10000,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load terminology data",
          variant: "destructive",
        });
      }
      
      // Set default stats on error
      setStats({
        total_terms: 0,
        translation_progress: 0,
        terms_by_category: {} as Record<string, number>,
        terms_by_status: {} as Record<string, number>,
        terms_by_difficulty: {} as Record<string, number>,
        expert_verified_count: 0,
        pending_suggestions: 0,
        total_favorites: 0,
        total_views: 0,
      });
      setTerms([]);
    } finally {
      setLoading(false);
    }
  }, [filters, languageView, page, canManage, toast]);

  useEffect(() => {
    // Only load data if user is available
    if (user) {
      loadData().catch((error) => {
        console.error("Failed to load initial data:", error);
        // Component will still render with empty state
      });
    } else {
      setLoading(false);
    }
  }, [loadData, user]);

  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, query }));
    setPage(0);
  }, []);

  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters((newFilters));
    setPage(0);
  }, []);

  const handleLanguageViewChange = useCallback((view: LanguageView) => {
    setLanguageView(view);
    setFilters((prev) => ({ ...prev, language_view: view }));
    setPage(0);
  }, []);

  const handleTermCreated = useCallback(() => {
    setShowAddDialog(false);
    loadData();
  }, [loadData]);

  const handleSuggestionSubmitted = useCallback(() => {
    setShowSuggestionDialog(false);
    loadData();
  }, [loadData]);

  const handleFavoriteChange = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t("dashboard.terminology.title") || "Terminology Dictionary"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.terminology.description") || "Additive Manufacturing Terminology"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TerminologyLanguageToggle
            value={languageView}
            onChange={handleLanguageViewChange}
          />
        </div>
      </div>

      {/* Database Setup Message */}
      {tablesMissing && (
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Database Setup Required</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  The terminology dictionary tables have not been created yet. To use this feature, please run the database migration.
                </p>
                <div className="bg-muted p-3 rounded text-sm font-mono mb-4">
                  <p className="mb-1">Run this migration in Supabase SQL Editor:</p>
                  <p className="text-muted-foreground">016_terminology_dictionary.sql</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTablesMissing(false);
                    loadData();
                  }}
                >
                  Retry After Migration
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {!tablesMissing && stats.total_terms !== undefined && (
        <StatsComponent
          stats={stats}
          userFavoritesCount={userFavoritesCount}
          pendingSuggestionsCount={pendingSuggestionsCount}
        />
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {canManage && (
          <>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t("dashboard.terminology.addTerm") || "Add New Term"}
            </Button>
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {t("dashboard.terminology.import") || "Import CSV/Excel"}
            </Button>
            {pendingSuggestionsCount > 0 && (
              <Button variant="outline" onClick={() => setShowSuggestionsPanel(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                {t("dashboard.terminology.suggestions") || "Suggestions"} ({pendingSuggestionsCount})
              </Button>
            )}
          </>
        )}
        <Button variant="outline" onClick={() => setShowSuggestionDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("dashboard.terminology.suggest") || "Suggest a Term"}
        </Button>
        <Button variant="outline" onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          {t("dashboard.terminology.export") || "Export"}
        </Button>
      </div>

      {/* Filters */}
      <TerminologyFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
      />

      {/* Terms Grid */}
      {loading && terms.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : terms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">
              {t("dashboard.terminology.noResults") || "No terms found"}
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or search query
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map((term) => (
              <TerminologyCard
                key={term.id}
                term={term}
                languageView={languageView}
                onViewDetails={setSelectedTerm}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      {canManage && (
        <TerminologyFormDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onSuccess={handleTermCreated}
        />
      )}

      <TerminologySuggestionDialog
        open={showSuggestionDialog}
        onOpenChange={setShowSuggestionDialog}
        onSuccess={handleSuggestionSubmitted}
      />

      {canManage && (
        <>
          <TerminologyImportDialog
            open={showImportDialog}
            onOpenChange={setShowImportDialog}
            onSuccess={loadData}
          />

          <TerminologySuggestionsPanel
            open={showSuggestionsPanel}
            onOpenChange={setShowSuggestionsPanel}
            onSuccess={loadData}
          />
        </>
      )}

      <TerminologyExport
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        terms={terms}
        languageView={languageView}
        filters={filters}
      />
    </div>
  );
};

export default TerminologyContent;
