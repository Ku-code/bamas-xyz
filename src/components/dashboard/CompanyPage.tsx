import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, User } from "@/contexts/AuthContext";
import { type Company } from "@/lib/companies";
import { db } from "@/lib/database";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  User as UserIcon,
  Cpu,
  ExternalLink,
  Edit,
  Trash2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface CompanyPageProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CompanyPage = ({
  company,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: CompanyPageProps) => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Load owner details when company changes
  useEffect(() => {
    if (open && company?.created_by) {
      loadOwnerDetails();
    }
  }, [open, company?.created_by]);

  const loadOwnerDetails = async () => {
    if (!company?.created_by) return;
    
    setLoading(true);
    try {
      const ownerData = await db.fetchOne('users', company.created_by);
      if (ownerData) {
        setOwner({
          id: ownerData.id,
          name: ownerData.name,
          email: ownerData.email,
          image: ownerData.image || undefined,
          role: ownerData.role || 'member',
          status: ownerData.status || 'approved',
        } as User);
      }
    } catch (error) {
      console.error("Error loading owner details:", error);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = user && (isSuperAdmin || company?.created_by === user.id);
  const canDelete = user && (isSuperAdmin || company?.created_by === user.id);

  if (!company) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="pb-4">
              <div className="flex items-start gap-4">
                {/* Company Logo */}
                <div className="shrink-0">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="h-20 w-20 object-contain rounded-xl border bg-white"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl border bg-muted flex items-center justify-center">
                      <Building2 className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-2xl font-bold leading-tight">
                    {company.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1">
                    {company.activity_description || company.description || t("company.page.noDescription") || "Additive Manufacturing Company"}
                  </DialogDescription>
                  
                  {/* Technologies Badges */}
                  {company.technologies && company.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {company.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs rounded-full">
                          <Cpu className="h-3 w-3 mr-1" />
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {(canEdit || canDelete) && (
                  <div className="flex gap-2 shrink-0">
                    {canEdit && onEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onEdit}
                        className="rounded-full"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("company.page.edit") || "Edit"}
                      </Button>
                    )}
                    {canDelete && onDelete && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={onDelete}
                        className="rounded-full"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {t("company.page.delete") || "Delete"}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </DialogHeader>

            <Separator className="my-4" />

            <div className="grid gap-6 md:grid-cols-2">
              {/* Left Column - Contact & Location */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    {t("company.page.contactLocation") || "Contact & Location"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t("company.page.address") || "Address"}
                      </p>
                      <p className="text-sm">{company.headquarters_address}</p>
                      {company.headquarters_latitude && company.headquarters_longitude && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {company.headquarters_latitude.toFixed(4)}, {company.headquarters_longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Website */}
                  {company.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("company.page.website") || "Website"}
                        </p>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1"
                        >
                          {company.website.replace(/^https?:\/\//, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {company.contact_email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("company.page.email") || "Email"}
                        </p>
                        <a
                          href={`mailto:${company.contact_email}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {company.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Phone */}
                  {company.contact_phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("company.page.phone") || "Phone"}
                        </p>
                        <a
                          href={`tel:${company.contact_phone}`}
                          className="text-sm text-primary hover:underline"
                        >
                          {company.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right Column - Owner & Meta */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserIcon className="h-5 w-5 text-primary" />
                    {t("company.page.ownerInfo") || "Owner Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Owner */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={owner?.image || company.created_by_image} alt={owner?.name || company.created_by_name} />
                      <AvatarFallback>
                        {(owner?.name || company.created_by_name || "?")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{owner?.name || company.created_by_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("company.page.owner") || "Company Owner"}
                      </p>
                      {owner?.role && (
                        <Badge variant="outline" className="mt-1 text-xs rounded-full">
                          {owner.role === 'superadmin' ? 'Super Admin' :
                           owner.role === 'admin' ? 'Admin' :
                           owner.role === 'board_member' ? 'Board Member' :
                           owner.role === 'wg_lead' ? 'WG Lead' : 'Member'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Created Date */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        {t("company.page.registered") || "Registered"}
                      </p>
                      <p className="text-sm">
                        {company.created_at
                          ? format(new Date(company.created_at), "PPP")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  {/* Updated Date */}
                  {company.updated_at && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">
                          {t("company.page.lastUpdated") || "Last Updated"}
                        </p>
                        <p className="text-sm">
                          {format(new Date(company.updated_at), "PPP")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Full Description */}
            {company.description && (
              <Card className="mt-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    {t("company.page.about") || "About"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {company.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-full"
              >
                {t("common.close") || "Close"}
              </Button>
              {company.website && (
                <Button
                  asChild
                  className="rounded-full"
                >
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    {t("company.page.visitWebsite") || "Visit Website"}
                  </a>
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyPage;
