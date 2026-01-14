import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import {
  rankMaterials,
  type MaterialRequirements,
  type ScoringWeights,
  type MaterialMatch,
} from "@/lib/materials";
import { MaterialCard } from "./MaterialCard";

interface MaterialWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type WizardStep = 1 | 2 | 3;

export const MaterialWizard = ({ open, onOpenChange }: MaterialWizardProps) => {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Requirements
  const [requirements, setRequirements] = useState<MaterialRequirements>({
    category: undefined,
    min_tensile_strength: undefined,
    min_yield_strength: undefined,
    max_cost_per_kg: undefined,
    max_density: undefined,
    min_melting_point: undefined,
    must_be_printable: false,
  });

  // Step 2: Scoring Weights
  const [weights, setWeights] = useState<ScoringWeights>({
    cost: 25,
    strength: 25,
    printability: 25,
    durability: 25,
  });

  // Step 3: Results
  const [results, setResults] = useState<MaterialMatch[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialMatch | null>(null);

  const handleStep1Next = () => {
    setCurrentStep(2);
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep2Calculate = async () => {
    setLoading(true);
    try {
      const matches = await rankMaterials(requirements, weights);
      setResults(matches);
      setCurrentStep(3);
    } catch (error: any) {
      console.error("Error ranking materials:", error);
      toast({
        title: t("materials.wizard.error.title") || "Error",
        description: t("materials.wizard.error.calculation") || "Failed to calculate material matches.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleStartOver = () => {
    setCurrentStep(1);
    setRequirements({
      category: undefined,
      min_tensile_strength: undefined,
      min_yield_strength: undefined,
      max_cost_per_kg: undefined,
      max_density: undefined,
      min_melting_point: undefined,
      must_be_printable: false,
    });
    setWeights({
      cost: 25,
      strength: 25,
      printability: 25,
      durability: 25,
    });
    setResults([]);
    setSelectedMaterial(null);
  };

  const handleClose = () => {
    handleStartOver();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t("materials.wizard.title") || "Material Compatibility Wizard"}
          </DialogTitle>
          <DialogDescription>
            {t("materials.wizard.description") || "Find the perfect material for your application"}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              1
            </div>
            <span className="text-sm font-medium">
              {t("materials.wizard.step1.title") || "Requirements"}
            </span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              2
            </div>
            <span className="text-sm font-medium">
              {t("materials.wizard.step2.title") || "Scoring"}
            </span>
          </div>
          <div className="w-12 h-0.5 bg-border" />
          <div className={`flex items-center gap-2 ${currentStep >= 3 ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              3
            </div>
            <span className="text-sm font-medium">
              {t("materials.wizard.step3.title") || "Results"}
            </span>
          </div>
        </div>

        {/* Step 1: Requirements */}
        {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("materials.wizard.step1.title") || "Material Requirements"}</CardTitle>
              <CardDescription>
                {t("materials.wizard.step1.description") || "Specify your physical and thermal requirements"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div className="space-y-2">
                  <Label>{t("materials.wizard.step1.category") || "Category"}</Label>
                  <Select
                    value={requirements.category || "any"}
                    onValueChange={(value) =>
                      setRequirements({
                        ...requirements,
                        category: value === "any" ? undefined : (value as "Metal" | "Polymer"),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">
                        {t("materials.wizard.step1.categoryAny") || "Any"}
                      </SelectItem>
                      <SelectItem value="Metal">
                        {t("materials.category.metal") || "Metal"}
                      </SelectItem>
                      <SelectItem value="Polymer">
                        {t("materials.category.polymer") || "Polymer"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Min Tensile Strength */}
                <div className="space-y-2">
                  <Label>
                    {t("materials.wizard.step1.minTensileStrength") || "Min Tensile Strength (MPa)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 500"
                    value={requirements.min_tensile_strength || ""}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        min_tensile_strength: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                {/* Min Yield Strength */}
                <div className="space-y-2">
                  <Label>
                    {t("materials.wizard.step1.minYieldStrength") || "Min Yield Strength (MPa)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 400"
                    value={requirements.min_yield_strength || ""}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        min_yield_strength: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                {/* Max Cost */}
                <div className="space-y-2">
                  <Label>
                    {t("materials.wizard.step1.maxCost") || "Max Cost per kg (USD)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 100"
                    value={requirements.max_cost_per_kg || ""}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        max_cost_per_kg: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                {/* Max Density */}
                <div className="space-y-2">
                  <Label>
                    {t("materials.wizard.step1.maxDensity") || "Max Density (g/cm³)"}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5.0"
                    value={requirements.max_density || ""}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        max_density: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>

                {/* Min Melting Point */}
                <div className="space-y-2">
                  <Label>
                    {t("materials.wizard.step1.minMeltingPoint") || "Min Melting Point (°C)"}
                  </Label>
                  <Input
                    type="number"
                    placeholder="e.g. 200"
                    value={requirements.min_melting_point || ""}
                    onChange={(e) =>
                      setRequirements({
                        ...requirements,
                        min_melting_point: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>

              {/* Printability Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="printable"
                  checked={requirements.must_be_printable || false}
                  onCheckedChange={(checked) =>
                    setRequirements({
                      ...requirements,
                      must_be_printable: checked === true,
                    })
                  }
                />
                <Label htmlFor="printable" className="cursor-pointer">
                  {t("materials.wizard.step1.mustBePrintable") || "Must be printable (printability score ≥ 5)"}
                </Label>
              </div>
            </CardContent>
            <DialogFooter>
              <Button onClick={handleStep1Next}>
                {t("materials.wizard.next") || "Next"}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </Card>
        )}

        {/* Step 2: Scoring Weights */}
        {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>{t("materials.wizard.step2.title") || "Scoring Weights"}</CardTitle>
              <CardDescription>
                {t("materials.wizard.step2.description") || "Adjust the importance of each factor (0-100%)"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cost Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {t("materials.wizard.step2.cost") || "Cost Priority"}
                  </Label>
                  <span className="text-sm font-medium">{weights.cost}%</span>
                </div>
                <Slider
                  value={[weights.cost]}
                  onValueChange={([value]) =>
                    setWeights({ ...weights, cost: value })
                  }
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("materials.wizard.step2.costDescription") || "Lower cost is better"}
                </p>
              </div>

              {/* Strength Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {t("materials.wizard.step2.strength") || "Strength Priority"}
                  </Label>
                  <span className="text-sm font-medium">{weights.strength}%</span>
                </div>
                <Slider
                  value={[weights.strength]}
                  onValueChange={([value]) =>
                    setWeights({ ...weights, strength: value })
                  }
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("materials.wizard.step2.strengthDescription") || "Higher tensile strength is better"}
                </p>
              </div>

              {/* Printability Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {t("materials.wizard.step2.printability") || "Printability Priority"}
                  </Label>
                  <span className="text-sm font-medium">{weights.printability}%</span>
                </div>
                <Slider
                  value={[weights.printability]}
                  onValueChange={([value]) =>
                    setWeights({ ...weights, printability: value })
                  }
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("materials.wizard.step2.printabilityDescription") || "Easier to print is better"}
                </p>
              </div>

              {/* Durability Weight */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>
                    {t("materials.wizard.step2.durability") || "Durability Priority"}
                  </Label>
                  <span className="text-sm font-medium">{weights.durability}%</span>
                </div>
                <Slider
                  value={[weights.durability]}
                  onValueChange={([value]) =>
                    setWeights({ ...weights, durability: value })
                  }
                  max={100}
                  step={1}
                />
                <p className="text-xs text-muted-foreground">
                  {t("materials.wizard.step2.durabilityDescription") || "Hardness, elongation, and thermal properties"}
                </p>
              </div>

              {/* Total Weight Indicator */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {t("materials.wizard.step2.totalWeight") || "Total Weight"}
                  </Label>
                  <span className={`text-sm font-bold ${
                    weights.cost + weights.strength + weights.printability + weights.durability === 100
                      ? "text-green-600"
                      : "text-amber-600"
                  }`}>
                    {weights.cost + weights.strength + weights.printability + weights.durability}%
                  </span>
                </div>
                {weights.cost + weights.strength + weights.printability + weights.durability !== 100 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {t("materials.wizard.step2.totalWeightWarning") || "Total should equal 100% for best results"}
                  </p>
                )}
              </div>
            </CardContent>
            <DialogFooter>
              <Button variant="outline" onClick={handleStep2Back}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("materials.wizard.back") || "Back"}
              </Button>
              <Button onClick={handleStep2Calculate} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t("materials.wizard.calculating") || "Calculating..."}
                  </>
                ) : (
                  <>
                    {t("materials.wizard.calculate") || "Calculate Matches"}
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </Card>
        )}

        {/* Step 3: Results */}
        {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("materials.wizard.step3.title") || "Compatibility Results"}
              </CardTitle>
              <CardDescription>
                {t("materials.wizard.step3.description") || `${results.length} materials found`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t("materials.wizard.step3.noResults") || "No materials match your requirements"}
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {results.map((match, index) => (
                    <div
                      key={match.material.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedMaterial(match)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                              {language === "bg" && match.material.name_bg
                                ? match.material.name_bg
                                : match.material.name}
                            </h3>
                            <Badge variant={match.material.category === "Metal" ? "default" : "secondary"}>
                              {match.material.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {match.material.tensile_strength_mpa && (
                              <span>
                                {t("materials.properties.tensileStrength") || "Tensile"}:{" "}
                                {match.material.tensile_strength_mpa} MPa
                              </span>
                            )}
                            {match.material.cost_per_kg_usd && (
                              <span>
                                {t("materials.properties.cost") || "Cost"}: $
                                {match.material.cost_per_kg_usd}/kg
                              </span>
                            )}
                            {match.material.printability_score && (
                              <span>
                                {t("materials.properties.printability") || "Printability"}:{" "}
                                {match.material.printability_score}/10
                              </span>
                            )}
                          </div>
                          {match.matched_requirements.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {match.matched_requirements.map((req) => (
                                <Badge key={req} variant="outline" className="text-xs">
                                  ✓ {req.replace("_", " ")}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-3xl font-bold text-primary">
                            {match.match_percentage}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t("materials.wizard.step3.match") || "Match"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <DialogFooter>
              <Button variant="outline" onClick={handleStep3Back}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t("materials.wizard.back") || "Back"}
              </Button>
              <Button variant="outline" onClick={handleStartOver}>
                {t("materials.wizard.startOver") || "Start Over"}
              </Button>
            </DialogFooter>
          </Card>
        )}

        {/* Material Detail Dialog */}
        {selectedMaterial && (
          <MaterialCard
            material={selectedMaterial.material}
            open={!!selectedMaterial}
            onOpenChange={(open) => !open && setSelectedMaterial(null)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
