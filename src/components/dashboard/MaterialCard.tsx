import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
// Lazy load Recharts to prevent initialization order issues
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { loadCompatibility, type Material, type PrinterSpec } from "@/lib/materials";
import { loadPrinters } from "@/lib/materials";
import { Loader2 } from "lucide-react";

interface MaterialCardProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MaterialCard = ({ material, open, onOpenChange }: MaterialCardProps) => {
  const { t, language } = useLanguage();
  const [compatibility, setCompatibility] = useState<any[]>([]);
  const [printers, setPrinters] = useState<PrinterSpec[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && material.id) {
      loadCompatibilityData();
    }
  }, [open, material.id]);

  const loadCompatibilityData = async () => {
    setLoading(true);
    try {
      const [compData, printersData] = await Promise.all([
        loadCompatibility(material.id),
        loadPrinters(),
      ]);
      setCompatibility(compData);
      setPrinters(printersData);
    } catch (error) {
      console.error("Error loading compatibility:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare spider chart data
  const chartData = useMemo(() => {
    // Normalize values to 0-100 scale for visualization
    const normalize = (value: number, min: number, max: number, inverse: boolean = false): number => {
      if (max === min) return 50;
      const normalized = ((value - min) / (max - min)) * 100;
      return inverse ? 100 - normalized : normalized;
    };

    // Reference ranges for normalization (typical ranges for AM materials)
    const ranges = {
      tensile: { min: 0, max: 2000 },
      yield: { min: 0, max: 1800 },
      elongation: { min: 0, max: 600 },
      hardness: { min: 0, max: 500 },
      cost: { min: 0, max: 200 }, // USD per kg
      printability: { min: 1, max: 10 },
      thermal: { min: 0, max: 120 },
    };

    const data = [
      {
        property: t("materials.properties.tensileStrength") || "Tensile Strength",
        value: material.tensile_strength_mpa
          ? normalize(material.tensile_strength_mpa, ranges.tensile.min, ranges.tensile.max, false)
          : 0,
        fullMark: 100,
      },
      {
        property: t("materials.properties.yieldStrength") || "Yield Strength",
        value: material.yield_strength_mpa
          ? normalize(material.yield_strength_mpa, ranges.yield.min, ranges.yield.max, false)
          : 0,
        fullMark: 100,
      },
      {
        property: t("materials.properties.elongation") || "Elongation",
        value: material.elongation_percent
          ? normalize(material.elongation_percent, ranges.elongation.min, ranges.elongation.max, false)
          : 0,
        fullMark: 100,
      },
      {
        property: t("materials.properties.hardness") || "Hardness",
        value: material.hardness_hb
          ? normalize(material.hardness_hb, ranges.hardness.min, ranges.hardness.max, false)
          : 0,
        fullMark: 100,
      },
      {
        property: t("materials.properties.cost") || "Cost",
        value: material.cost_per_kg_usd
          ? normalize(material.cost_per_kg_usd, ranges.cost.min, ranges.cost.max, true) // Inverse: lower is better
          : 0,
        fullMark: 100,
      },
      {
        property: t("materials.properties.printability") || "Printability",
        value: material.printability_score
          ? normalize(material.printability_score, ranges.printability.min, ranges.printability.max, false) * 10
          : 0,
        fullMark: 100,
      },
      {
        property: t("materials.properties.thermalConductivity") || "Thermal Conductivity",
        value: material.thermal_conductivity_w_mk
          ? normalize(material.thermal_conductivity_w_mk, ranges.thermal.min, ranges.thermal.max, false)
          : 0,
        fullMark: 100,
      },
    ];

    return data;
  }, [material, t]);

  const chartConfig = {
    value: {
      label: t("materials.chart.value") || "Value",
      color: "hsl(var(--chart-1))",
    },
  };

  const compatiblePrinters = useMemo(() => {
    return compatibility
      .map((comp) => {
        const printer = printers.find((p) => p.id === comp.printer_id);
        return printer ? { ...printer, compatibility_score: comp.compatibility_score } : null;
      })
      .filter((p): p is PrinterSpec & { compatibility_score: number } => p !== null)
      .sort((a, b) => b.compatibility_score - a.compatibility_score);
  }, [compatibility, printers]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>
              {language === "bg" && material.name_bg ? material.name_bg : material.name}
            </span>
            <Badge variant={material.category === "Metal" ? "default" : "secondary"}>
              {material.category}
            </Badge>
            {material.subcategory && (
              <Badge variant="outline">{material.subcategory}</Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {language === "bg" && material.description_bg
              ? material.description_bg
              : material.description_en || ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Spider Chart */}
          <Card>
            <CardHeader>
              <CardTitle>{t("materials.card.properties") || "Material Properties"}</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData && chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={chartData}>
                      <PolarGrid />
                      <PolarAngleAxis
                        dataKey="property"
                        tick={{ fontSize: 12 }}
                        className="text-xs"
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar
                        name="value"
                        dataKey="value"
                        stroke="hsl(var(--chart-1))"
                        fill="hsl(var(--chart-1))"
                        fillOpacity={0.6}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  {t("materials.card.noChartData") || "No chart data available"}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Properties Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("materials.card.detailedProperties") || "Detailed Properties"}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {material.tensile_strength_mpa && (
                    <TableRow>
                      <TableHead className="w-[200px]">
                        {t("materials.properties.tensileStrength") || "Tensile Strength"}
                      </TableHead>
                      <TableCell>{material.tensile_strength_mpa} MPa</TableCell>
                    </TableRow>
                  )}
                  {material.yield_strength_mpa && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.yieldStrength") || "Yield Strength"}
                      </TableHead>
                      <TableCell>{material.yield_strength_mpa} MPa</TableCell>
                    </TableRow>
                  )}
                  {material.elongation_percent && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.elongation") || "Elongation"}
                      </TableHead>
                      <TableCell>{material.elongation_percent}%</TableCell>
                    </TableRow>
                  )}
                  {material.hardness_hb && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.hardness") || "Hardness (HB)"}
                      </TableHead>
                      <TableCell>{material.hardness_hb}</TableCell>
                    </TableRow>
                  )}
                  {material.density_g_cm3 && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.density") || "Density"}
                      </TableHead>
                      <TableCell>{material.density_g_cm3} g/cm³</TableCell>
                    </TableRow>
                  )}
                  {material.melting_point_c && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.meltingPoint") || "Melting Point"}
                      </TableHead>
                      <TableCell>{material.melting_point_c}°C</TableCell>
                    </TableRow>
                  )}
                  {material.thermal_conductivity_w_mk && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.thermalConductivity") || "Thermal Conductivity"}
                      </TableHead>
                      <TableCell>{material.thermal_conductivity_w_mk} W/(m·K)</TableCell>
                    </TableRow>
                  )}
                  {material.cost_per_kg_usd && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.cost") || "Cost"}
                      </TableHead>
                      <TableCell>
                        ${material.cost_per_kg_usd}/kg (USD){" "}
                        {material.cost_per_kg_bgn && `| ${material.cost_per_kg_bgn} лв/kg (BGN)`}
                      </TableCell>
                    </TableRow>
                  )}
                  {material.printability_score && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.printability") || "Printability Score"}
                      </TableHead>
                      <TableCell>{material.printability_score}/10</TableCell>
                    </TableRow>
                  )}
                  {material.post_processing_required !== undefined && (
                    <TableRow>
                      <TableHead>
                        {t("materials.properties.postProcessing") || "Post Processing Required"}
                      </TableHead>
                      <TableCell>
                        {material.post_processing_required ? (
                          <Badge variant="default">
                            {t("common.yes") || "Yes"}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            {t("common.no") || "No"}
                          </Badge>
                        )}
                        {material.post_processing_types && material.post_processing_types.length > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({material.post_processing_types.join(", ")})
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Compatible Printers */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("materials.card.compatiblePrinters") || "Compatible Printers"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : compatiblePrinters.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("materials.card.noCompatiblePrinters") || "No compatible printers found"}
                </p>
              ) : (
                <div className="space-y-2">
                  {compatiblePrinters.map((printer) => (
                    <div
                      key={printer.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{printer.printer_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {printer.manufacturer} • {printer.technology}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {printer.compatibility_score}% {t("materials.card.compatible") || "Compatible"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Applications & Tags */}
          {(material.applications && material.applications.length > 0) ||
          (material.tags && material.tags.length > 0) ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("materials.card.applications") || "Applications & Tags"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {material.applications && material.applications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {t("materials.card.applications") || "Applications"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {material.applications.map((app, index) => (
                        <Badge key={index} variant="secondary">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {material.tags && material.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {t("materials.card.tags") || "Tags"}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {material.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Safety Notes */}
          {material.safety_notes && (
            <Card>
              <CardHeader>
                <CardTitle>{t("materials.card.safetyNotes") || "Safety Notes"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{material.safety_notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Standard Reference */}
          {material.standard_reference && (
            <Card>
              <CardHeader>
                <CardTitle>{t("materials.card.standardReference") || "Standard Reference"}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-mono">{material.standard_reference}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
