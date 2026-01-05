import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  uploadCompanyLogo,
  geocodeAddress,
  type Company,
} from "@/lib/companies";
import { Map } from "@/components/ui/map";
import { MapPin, Plus, Edit, Trash2, Globe, Mail, Phone, Building2, X, Loader2, Maximize2, Minimize2, ChevronRight, ChevronLeft } from "lucide-react";

const TECHNOLOGY_OPTIONS = [
  "FDM (Fused Deposition Modeling)",
  "SLA (Stereolithography)",
  "SLS (Selective Laser Sintering)",
  "SLM (Selective Laser Melting)",
  "EBM (Electron Beam Melting)",
  "MJF (Multi Jet Fusion)",
  "PolyJet",
  "DED (Direct Energy Deposition)",
  "Binder Jetting",
  "Material Jetting",
  "Other",
];

const AdditiveMapContent = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const [companyForm, setCompanyForm] = useState({
    name: "",
    description: "",
    website: "",
    activity_description: "",
    technologies: [] as string[],
    headquarters_address: "",
    contact_email: "",
    contact_phone: "",
    latitude: "",
    longitude: "",
  });

  // Load companies on mount
  useEffect(() => {
    loadCompaniesFromDatabase();
  }, []);

  const loadCompaniesFromDatabase = async () => {
    setIsLoading(true);
    try {
      const loadedCompanies = await loadCompanies();
      setCompanies(loadedCompanies);
    } catch (error: any) {
      console.error("Error loading companies:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.additivemap.error.title") || "Error Loading Companies",
        t("dashboard.additivemap.error.loadFailed") || "Failed to load companies"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
      // Set empty array on error to prevent crashes
      setCompanies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleCreateCompany = async () => {
    if (!user) return;

    if (!companyForm.name.trim() || !companyForm.headquarters_address.trim()) {
      toast({
        title: t("dashboard.additivemap.create.error.title") || "Validation Error",
        description: t("dashboard.additivemap.create.error.required") || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsGeocoding(true);

    try {
      // Geocode address
      let latitude: number | undefined;
      let longitude: number | undefined;

      try {
        const geocodeResult = await geocodeAddress(companyForm.headquarters_address);
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
      } catch (geocodeError: any) {
        console.warn("Geocoding failed:", geocodeError);
        toast({
          title: t("dashboard.additivemap.create.warning.geocode") || "Geocoding Warning",
          description: geocodeError.message || "Could not geocode address. Company will be created without map location.",
          variant: "default",
        });
      }

      setIsGeocoding(false);

      // Upload logo if provided
      let logoPath: string | undefined;
      let logoUrl: string | undefined;

      if (logoFile) {
        const uploadResult = await uploadCompanyLogo(logoFile, user.id);
        logoPath = uploadResult.path;
        logoUrl = uploadResult.url;
      }

      // Create company
      await createCompany({
        name: companyForm.name.trim(),
        description: companyForm.description.trim() || undefined,
        website: companyForm.website.trim() || undefined,
        activity_description: companyForm.activity_description.trim() || undefined,
        technologies: companyForm.technologies.length > 0 ? companyForm.technologies : undefined,
        headquarters_address: companyForm.headquarters_address.trim(),
        headquarters_latitude: latitude,
        headquarters_longitude: longitude,
        contact_email: companyForm.contact_email.trim() || undefined,
        contact_phone: companyForm.contact_phone.trim() || undefined,
        logo_path: logoPath,
        logo_url: logoUrl,
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image || undefined,
      });

      toast({
        title: t("dashboard.additivemap.create.success.title") || "Company Created",
        description: t("dashboard.additivemap.create.success.description") || "Company has been added to the map successfully!",
      });

      // Reset form
      resetForm();
      setIsCreateDialogOpen(false);
      await loadCompaniesFromDatabase();
    } catch (error: any) {
      setIsGeocoding(false);
      console.error("Error creating company:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.additivemap.create.error.title") || "Failed to Create Company",
        t("dashboard.additivemap.create.error.description") || "Failed to create company"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCompany = async () => {
    if (!selectedCompany || !user) return;

    setIsLoading(true);
    setIsGeocoding(true);

    try {
      // Geocode address if it changed
      let latitude = selectedCompany.headquarters_latitude;
      let longitude = selectedCompany.headquarters_longitude;

      if (companyForm.headquarters_address !== selectedCompany.headquarters_address) {
        try {
          const geocodeResult = await geocodeAddress(companyForm.headquarters_address);
          latitude = geocodeResult.latitude;
          longitude = geocodeResult.longitude;
        } catch (geocodeError: any) {
          console.warn("Geocoding failed:", geocodeError);
          toast({
            title: t("dashboard.additivemap.edit.warning.geocode") || "Geocoding Warning",
            description: geocodeError.message || "Could not geocode address. Company will be updated without map location change.",
            variant: "default",
          });
        }
      }

      setIsGeocoding(false);

      // Upload new logo if provided
      let logoPath = selectedCompany.logo_path;
      let logoUrl = selectedCompany.logo_url;

      if (logoFile) {
        const uploadResult = await uploadCompanyLogo(logoFile, user.id);
        logoPath = uploadResult.path;
        logoUrl = uploadResult.url;
      }

      // Update company
      await updateCompany(selectedCompany.id, {
        name: companyForm.name.trim(),
        description: companyForm.description.trim() || undefined,
        website: companyForm.website.trim() || undefined,
        activity_description: companyForm.activity_description.trim() || undefined,
        technologies: companyForm.technologies.length > 0 ? companyForm.technologies : undefined,
        headquarters_address: companyForm.headquarters_address.trim(),
        headquarters_latitude: latitude,
        headquarters_longitude: longitude,
        contact_email: companyForm.contact_email.trim() || undefined,
        contact_phone: companyForm.contact_phone.trim() || undefined,
        logo_path: logoPath,
        logo_url: logoUrl,
      });

      toast({
        title: t("dashboard.additivemap.edit.success.title") || "Company Updated",
        description: t("dashboard.additivemap.edit.success.description") || "Company information has been updated successfully!",
      });

      resetForm();
      setIsEditDialogOpen(false);
      setSelectedCompany(null);
      await loadCompaniesFromDatabase();
    } catch (error: any) {
      setIsGeocoding(false);
      console.error("Error updating company:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.additivemap.edit.error.title") || "Failed to Update Company",
        t("dashboard.additivemap.edit.error.description") || "Failed to update company"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCompany = async () => {
    if (!selectedCompany) return;

    setIsLoading(true);
    try {
      await deleteCompany(selectedCompany.id, selectedCompany.logo_path);
      toast({
        title: t("dashboard.additivemap.delete.success.title") || "Company Deleted",
        description: t("dashboard.additivemap.delete.success.description") || "Company has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCompany(null);
      await loadCompaniesFromDatabase();
    } catch (error: any) {
      console.error("Error deleting company:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.additivemap.delete.error.title") || "Failed to Delete Company",
        t("dashboard.additivemap.delete.error.description") || "Failed to delete company"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCompanyForm({
      name: "",
      description: "",
      website: "",
      activity_description: "",
      technologies: [],
      headquarters_address: "",
      contact_email: "",
      contact_phone: "",
      latitude: "",
      longitude: "",
    });
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openEditDialog = () => {
    if (!selectedCompany) return;
    setCompanyForm({
      name: selectedCompany.name,
      description: selectedCompany.description || "",
      website: selectedCompany.website || "",
      activity_description: selectedCompany.activity_description || "",
      technologies: selectedCompany.technologies || [],
      headquarters_address: selectedCompany.headquarters_address,
      contact_email: selectedCompany.contact_email || "",
      contact_phone: selectedCompany.contact_phone || "",
      latitude: selectedCompany.headquarters_latitude?.toString() || "",
      longitude: selectedCompany.headquarters_longitude?.toString() || "",
    });
    setLogoPreview(selectedCompany.logo_url || null);
    setIsEditDialogOpen(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const canEditCompany = (company: Company) => {
    if (!user) return false;
    return isSuperAdmin || company.created_by === user.id;
  };

  const canDeleteCompany = (company: Company) => {
    if (!user) return false;
    return isSuperAdmin || company.created_by === user.id;
  };

  return (
    <div className="space-y-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.additivemap.title") || "Additive Manufacturing Map"}</h2>
        </div>
        {user && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.additivemap.register.button") || "Register Company"}
          </Button>
        )}
      </div>

      <div 
        className={`grid gap-4 transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''} ${isPanelOpen ? 'grid-cols-1 lg:grid-cols-[1fr_400px]' : 'grid-cols-1'}`}
        style={{ minHeight: isFullscreen ? '100vh' : '600px' }}
      >
        {/* Map */}
        <Card className="overflow-hidden relative">
          <CardContent className="p-0" style={{ height: isFullscreen ? 'calc(100vh - 2rem)' : '100%', minHeight: '500px' }}>
            {isLoading && companies.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: '100%', minHeight: '500px' }}>
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', minHeight: '500px' }}>
                <Map
                  companies={companies}
                  onCompanyClick={handleCompanyClick}
                  selectedCompanyId={selectedCompany?.id || null}
                  className="h-full"
                  isFullscreen={isFullscreen}
                  isPanelOpen={isPanelOpen}
                />
              </div>
            )}
            
            {/* Fullscreen and Panel Toggle Buttons */}
            <div className="absolute top-4 left-4 z-10 flex gap-2">
              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                variant="outline"
                size="sm"
                className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
                title={isFullscreen ? (t("dashboard.additivemap.map.exitFullscreen") || "Exit Fullscreen") : (t("dashboard.additivemap.map.fullscreen") || "Fullscreen")}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                variant="outline"
                size="sm"
                className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background shadow-lg"
                title={isPanelOpen ? (t("dashboard.additivemap.panel.close") || "Close Panel") : (t("dashboard.additivemap.panel.open") || "Open Panel")}
              >
                {isPanelOpen ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Panel */}
        {isPanelOpen && (
          <Card className={`transition-all duration-300 ${isFullscreen ? '' : ''}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle>{t("dashboard.additivemap.panel.title") || "Company Information"}</CardTitle>
                <CardDescription>
                  {selectedCompany
                    ? t("dashboard.additivemap.panel.description") || "Click on a company marker to view details"
                    : t("dashboard.additivemap.panel.noSelection") || "No company selected"}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPanelOpen(false)}
                className="h-8 w-8 p-0 rounded-full"
                title={t("dashboard.additivemap.panel.close") || "Close Panel"}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {selectedCompany ? (
              <ScrollArea className={isFullscreen ? "h-[calc(100vh-200px)]" : "h-[calc(100vh-300px)]"}>
                <div className="space-y-4">
                  {/* Logo */}
                  {selectedCompany.logo_url && (
                    <div className="flex justify-center">
                      <img
                        src={selectedCompany.logo_url}
                        alt={selectedCompany.name}
                        className="h-24 w-24 object-contain rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <h3 className="text-xl font-bold">{selectedCompany.name}</h3>
                  </div>

                  {/* Description */}
                  {selectedCompany.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">{selectedCompany.description}</p>
                    </div>
                  )}

                  <Separator />

                  {/* Activity */}
                  {selectedCompany.activity_description && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t("dashboard.additivemap.panel.activity") || "Activity"}
                      </Label>
                      <p className="text-sm">{selectedCompany.activity_description}</p>
                    </div>
                  )}

                  {/* Technologies */}
                  {selectedCompany.technologies && selectedCompany.technologies.length > 0 && (
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t("dashboard.additivemap.panel.technologies") || "Technologies"}
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedCompany.technologies.map((tech, index) => (
                          <Badge key={index} variant="secondary">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Address */}
                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {t("dashboard.additivemap.panel.address") || "Address"}
                    </Label>
                    <p className="text-sm">{selectedCompany.headquarters_address}</p>
                  </div>

                  {/* Website */}
                  {selectedCompany.website && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {t("dashboard.additivemap.panel.website") || "Website"}
                      </Label>
                      <a
                        href={selectedCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedCompany.website}
                      </a>
                    </div>
                  )}

                  {/* Contact Email */}
                  {selectedCompany.contact_email && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {t("dashboard.additivemap.panel.email") || "Email"}
                      </Label>
                      <a
                        href={`mailto:${selectedCompany.contact_email}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedCompany.contact_email}
                      </a>
                    </div>
                  )}

                  {/* Contact Phone */}
                  {selectedCompany.contact_phone && (
                    <div>
                      <Label className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {t("dashboard.additivemap.panel.phone") || "Phone"}
                      </Label>
                      <a
                        href={`tel:${selectedCompany.contact_phone}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {selectedCompany.contact_phone}
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  {(canEditCompany(selectedCompany) || canDeleteCompany(selectedCompany)) && (
                    <>
                      <Separator />
                      <div className="flex gap-2">
                        {canEditCompany(selectedCompany) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={openEditDialog}
                            className="flex-1 rounded-full"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            {t("dashboard.additivemap.panel.edit") || "Edit"}
                          </Button>
                        )}
                        {canDeleteCompany(selectedCompany) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setIsDeleteDialogOpen(true)}
                            className="flex-1 rounded-full"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("dashboard.additivemap.panel.delete") || "Delete"}
                          </Button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className={`flex items-center justify-center text-muted-foreground ${isFullscreen ? "h-[calc(100vh-200px)]" : "h-[calc(100vh-300px)]"}`}>
                <div className="text-center">
                  <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>{t("dashboard.additivemap.panel.selectCompany") || "Select a company from the map to view details"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>

      {/* Create Company Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.additivemap.create.title") || "Register Company"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.additivemap.create.description") || "Add your company to the additive manufacturing map"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("dashboard.additivemap.create.form.name") || "Company Name"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                placeholder={t("dashboard.additivemap.create.form.name.placeholder") || "Enter company name"}
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("dashboard.additivemap.create.form.description") || "Description"}</Label>
              <Textarea
                id="description"
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                placeholder={t("dashboard.additivemap.create.form.description.placeholder") || "Company description"}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">{t("dashboard.additivemap.create.form.website") || "Website"}</Label>
              <Input
                id="website"
                type="url"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                placeholder="https://example.com"
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">{t("dashboard.additivemap.create.form.activity") || "Product/Service"}</Label>
              <Textarea
                id="activity"
                value={companyForm.activity_description}
                onChange={(e) => setCompanyForm({ ...companyForm, activity_description: e.target.value })}
                placeholder={t("dashboard.additivemap.create.form.activity.placeholder") || "Describe your products or services"}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="technologies">{t("dashboard.additivemap.create.form.technologies") || "Technologies"}</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!companyForm.technologies.includes(value)) {
                    setCompanyForm({
                      ...companyForm,
                      technologies: [...companyForm.technologies, value],
                    });
                  }
                }}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder={t("dashboard.additivemap.create.form.technologies.placeholder") || "Select technology"} />
                </SelectTrigger>
                <SelectContent>
                  {TECHNOLOGY_OPTIONS.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companyForm.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyForm.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="rounded-full">
                      {tech}
                      <button
                        onClick={() => {
                          setCompanyForm({
                            ...companyForm,
                            technologies: companyForm.technologies.filter((t) => t !== tech),
                          });
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">
                {t("dashboard.additivemap.create.form.address") || "Headquarters Address"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="address"
                value={companyForm.headquarters_address}
                onChange={(e) => setCompanyForm({ ...companyForm, headquarters_address: e.target.value })}
                placeholder={t("dashboard.additivemap.create.form.address.placeholder") || "Enter full address"}
                className="rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("dashboard.additivemap.create.form.email") || "Contact Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  value={companyForm.contact_email}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                  placeholder="contact@example.com"
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("dashboard.additivemap.create.form.phone") || "Contact Phone"}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={companyForm.contact_phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })}
                  placeholder="+359..."
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">{t("dashboard.additivemap.create.form.logo") || "Company Logo"}</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="rounded-full"
              />
              {logoPreview && (
                <div className="mt-2">
                  <img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain rounded-lg border" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsCreateDialogOpen(false); }} className="rounded-full">
              {t("dashboard.additivemap.create.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleCreateCompany}
              disabled={isLoading || isGeocoding}
              className="rounded-full"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.additivemap.create.geocoding") || "Geocoding..."}
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.additivemap.create.creating") || "Creating..."}
                </>
              ) : (
                t("dashboard.additivemap.create.submit") || "Create Company"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.additivemap.edit.title") || "Edit Company"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.additivemap.edit.description") || "Update company information"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Same form fields as create dialog */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">
                {t("dashboard.additivemap.create.form.name") || "Company Name"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("dashboard.additivemap.create.form.description") || "Description"}</Label>
              <Textarea
                id="edit-description"
                value={companyForm.description}
                onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-website">{t("dashboard.additivemap.create.form.website") || "Website"}</Label>
              <Input
                id="edit-website"
                type="url"
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                className="rounded-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-activity">{t("dashboard.additivemap.create.form.activity") || "Product/Service"}</Label>
              <Textarea
                id="edit-activity"
                value={companyForm.activity_description}
                onChange={(e) => setCompanyForm({ ...companyForm, activity_description: e.target.value })}
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-technologies">{t("dashboard.additivemap.create.form.technologies") || "Technologies"}</Label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (!companyForm.technologies.includes(value)) {
                    setCompanyForm({
                      ...companyForm,
                      technologies: [...companyForm.technologies, value],
                    });
                  }
                }}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue placeholder={t("dashboard.additivemap.create.form.technologies.placeholder") || "Select technology"} />
                </SelectTrigger>
                <SelectContent>
                  {TECHNOLOGY_OPTIONS.map((tech) => (
                    <SelectItem key={tech} value={tech}>
                      {tech}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {companyForm.technologies.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {companyForm.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="rounded-full">
                      {tech}
                      <button
                        onClick={() => {
                          setCompanyForm({
                            ...companyForm,
                            technologies: companyForm.technologies.filter((t) => t !== tech),
                          });
                        }}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">
                {t("dashboard.additivemap.create.form.address") || "Headquarters Address"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-address"
                value={companyForm.headquarters_address}
                onChange={(e) => setCompanyForm({ ...companyForm, headquarters_address: e.target.value })}
                className="rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t("dashboard.additivemap.create.form.email") || "Contact Email"}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={companyForm.contact_email}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                  className="rounded-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t("dashboard.additivemap.create.form.phone") || "Contact Phone"}</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={companyForm.contact_phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact_phone: e.target.value })}
                  className="rounded-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-logo">{t("dashboard.additivemap.create.form.logo") || "Company Logo"}</Label>
              <Input
                id="edit-logo"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="rounded-full"
              />
              {logoPreview && (
                <div className="mt-2">
                  <img src={logoPreview} alt="Logo preview" className="h-24 w-24 object-contain rounded-lg border" />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setIsEditDialogOpen(false); }} className="rounded-full">
              {t("dashboard.additivemap.edit.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleEditCompany}
              disabled={isLoading || isGeocoding}
              className="rounded-full"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.additivemap.edit.geocoding") || "Geocoding..."}
                </>
              ) : isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.additivemap.edit.updating") || "Updating..."}
                </>
              ) : (
                t("dashboard.additivemap.edit.submit") || "Update Company"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.additivemap.delete.title") || "Delete Company?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.additivemap.delete.description") || "This action cannot be undone. This will permanently delete the company from the map."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("dashboard.additivemap.delete.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCompany}
              disabled={isLoading}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.additivemap.delete.deleting") || "Deleting..."}
                </>
              ) : (
                t("dashboard.additivemap.delete.confirm") || "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdditiveMapContent;

