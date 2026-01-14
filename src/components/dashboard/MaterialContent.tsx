import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Sparkles, Grid, List } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  loadMaterials,
  type Material,
  type MaterialFilters,
} from "@/lib/materials";
import { MaterialWizard } from "./MaterialWizard";
import { MaterialCard } from "./MaterialCard";

type ViewMode = "grid" | "list";

export const MaterialContent = () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/50346ba1-6398-4d3a-b7ae-e83d28e057d9',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MaterialContent.tsx:20',message:'MaterialContent component initializing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Metal" | "Polymer">("all");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [tablesMissing, setTablesMissing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setTablesMissing(false);

      const filters: MaterialFilters = {
        search: searchQuery || undefined,
        category: selectedCategory !== "all" ? selectedCategory : undefined,
      };

      const data = await loadMaterials(filters);
      setMaterials(data || []);

      // Check if tables might be missing
      if ((!data || data.length === 0) && !searchQuery) {
        const hasCheckedTables = sessionStorage.getItem("materials_tables_checked");
        if (!hasCheckedTables) {
          // Test if table exists
          const { error: testError } = await (await import("@/lib/supabase")).supabase
            .from("materials")
            .select("id")
            .limit(1);
          if (testError?.code === "42P01") {
            setTablesMissing(true);
            sessionStorage.setItem("materials_tables_checked", "true");
          } else {
            sessionStorage.setItem("materials_tables_checked", "true");
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading materials:", err);
      setMaterials([]);
      if (err?.code === "42P01") {
        setTablesMissing(true);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleMaterialClick = (material: Material) => {
    setSelectedMaterial(material);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("materials.title") || "Material Database"}
          </h2>
          <p className="text-muted-foreground">
            {t("materials.description") || "Browse and search additive manufacturing materials"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <>
                <List className="h-4 w-4 mr-2" />
                {t("common.list") || "List"}
              </>
            ) : (
              <>
                <Grid className="h-4 w-4 mr-2" />
                {t("common.grid") || "Grid"}
              </>
            )}
          </Button>
          <Button size="sm" onClick={() => setWizardOpen(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            {t("materials.findCompatible") || "Find Compatible Material"}
          </Button>
        </div>
      </div>

      {/* Database Setup Message */}
      {tablesMissing && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">
                  {t("materials.error.tablesMissing") || "Database Setup Required"}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t("materials.error.tablesMissingDesc") ||
                    "Material database tables not found. Please run migration 021_material_database.sql in Supabase SQL Editor."}
                </p>
                <div className="text-sm space-y-2">
                  <p className="font-medium">Steps to fix:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Open Supabase Dashboard → SQL Editor</li>
                    <li>
                      Copy the contents of{" "}
                      <code className="bg-muted px-1 rounded">
                        supabase/migrations/021_material_database.sql
                      </code>
                    </li>
                    <li>Paste and run the migration</li>
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

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("materials.search.placeholder") || "Search materials..."}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
            disabled={tablesMissing}
          />
        </div>
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}>
          <TabsList>
            <TabsTrigger value="all">{t("common.all") || "All"}</TabsTrigger>
            <TabsTrigger value="Metal">{t("materials.category.metal") || "Metal"}</TabsTrigger>
            <TabsTrigger value="Polymer">{t("materials.category.polymer") || "Polymer"}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Materials Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              {t("materials.loading") || "Loading materials..."}
            </p>
          </div>
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {t("materials.noMaterials") || "No materials found"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-4"
          }
        >
          {materials.map((material) => (
            <Card
              key={material.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleMaterialClick(material)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {language === "bg" && material.name_bg
                        ? material.name_bg
                        : material.name}
                    </CardTitle>
                    {material.subcategory && (
                      <CardDescription className="mt-1">
                        {material.subcategory}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant={material.category === "Metal" ? "default" : "secondary"}>
                    {material.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {material.tensile_strength_mpa && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("materials.properties.tensileStrength") || "Tensile Strength"}:
                      </span>
                      <span className="font-medium">{material.tensile_strength_mpa} MPa</span>
                    </div>
                  )}
                  {material.cost_per_kg_usd && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("materials.properties.cost") || "Cost"}:
                      </span>
                      <span className="font-medium">${material.cost_per_kg_usd}/kg</span>
                    </div>
                  )}
                  {material.printability_score && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t("materials.properties.printability") || "Printability"}:
                      </span>
                      <span className="font-medium">{material.printability_score}/10</span>
                    </div>
                  )}
                </div>
                {material.tags && material.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1">
                    {material.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {material.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{material.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Material Wizard */}
      <MaterialWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {/* Material Detail Dialog */}
      {selectedMaterial && (
        <MaterialCard
          material={selectedMaterial}
          open={!!selectedMaterial}
          onOpenChange={(open) => !open && setSelectedMaterial(null)}
        />
      )}
    </div>
  );
};

export default MaterialContent;
