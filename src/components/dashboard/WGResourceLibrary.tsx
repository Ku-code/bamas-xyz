import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadWGResources,
  createWGResource,
  updateWGResource,
  deleteWGResource,
  approveWGResource,
  type WGResource,
} from "@/lib/working-groups";
import { supabase } from "@/lib/supabase";
import { Plus, Download, Trash2, Check, X, Loader2, Upload } from "lucide-react";
import type { WGPermissions } from "@/lib/wg-permissions";

interface WGResourceLibraryProps {
  workingGroupId: string;
  permissions: WGPermissions;
}

const WGResourceLibrary = ({ workingGroupId, permissions }: WGResourceLibraryProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<WGResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "Other" as "CAD" | "PDF" | "Research" | "Other",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadResources();
  }, [workingGroupId]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const resourcesData = await loadWGResources(workingGroupId);
      setResources(resourcesData);
    } catch (error: any) {
      console.error("Error loading resources:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.resources.error.title") || "Error Loading Resources",
        t("dashboard.workinggroups.resources.error.loadFailed") || "Failed to load resources"
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!resourceForm.title) {
        setResourceForm({ ...resourceForm, title: file.name });
      }
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile || !resourceForm.title.trim()) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${workingGroupId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `wg-resources/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('wg-resources')
        .upload(filePath, selectedFile);

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket "wg-resources" not found. Please create it in Supabase Storage settings.');
        }
        throw uploadError;
      }

      // Create resource record
      const isAutoApproved = permissions.canApproveResources;
      await createWGResource({
        working_group_id: workingGroupId,
        title: resourceForm.title,
        description: resourceForm.description || null,
        file_path: filePath,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        category: resourceForm.category,
        uploaded_by: user.id,
        approved_by: isAutoApproved ? user.id : null,
        is_approved: isAutoApproved,
      });

      toast({
        title: t("dashboard.workinggroups.resources.upload.success.title") || "Resource Uploaded",
        description: isAutoApproved
          ? t("dashboard.workinggroups.resources.upload.success.approved") || "Resource has been uploaded and approved."
          : t("dashboard.workinggroups.resources.upload.success.pending") || "Resource has been uploaded and is pending approval.",
      });

      setIsDialogOpen(false);
      resetForm();
      await loadResources();
    } catch (error: any) {
      console.error("Error uploading resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.resources.upload.error.title") || "Failed to Upload Resource",
        t("dashboard.workinggroups.resources.upload.error.description") || "Failed to upload resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleApprove = async (resourceId: string) => {
    if (!user) return;

    try {
      await approveWGResource(resourceId, user.id);
      toast({
        title: t("dashboard.workinggroups.resources.approve.success.title") || "Resource Approved",
        description: t("dashboard.workinggroups.resources.approve.success.description") || "Resource has been approved.",
      });
      await loadResources();
    } catch (error: any) {
      console.error("Error approving resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.resources.approve.error.title") || "Failed to Approve Resource",
        t("dashboard.workinggroups.resources.approve.error.description") || "Failed to approve resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (resourceId: string, filePath: string | null) => {
    if (!confirm(t("dashboard.workinggroups.resources.delete.confirm") || "Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      // Delete file from storage if exists
      if (filePath) {
        await supabase.storage.from('wg-resources').remove([filePath]);
      }

      await deleteWGResource(resourceId);
      toast({
        title: t("dashboard.workinggroups.resources.delete.success.title") || "Resource Deleted",
        description: t("dashboard.workinggroups.resources.delete.success.description") || "Resource has been deleted successfully.",
      });
      await loadResources();
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.resources.delete.error.title") || "Failed to Delete Resource",
        t("dashboard.workinggroups.resources.delete.error.description") || "Failed to delete resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (resource: WGResource) => {
    if (!resource.file_path) return;

    try {
      const { data, error } = await supabase.storage
        .from('wg-resources')
        .download(resource.file_path);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.file_name || 'download';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error("Error downloading resource:", error);
      toast({
        title: t("dashboard.workinggroups.resources.download.error.title") || "Failed to Download",
        description: t("dashboard.workinggroups.resources.download.error.description") || "Failed to download resource",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setResourceForm({
      title: "",
      description: "",
      category: "Other",
    });
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("dashboard.workinggroups.resources.title") || "Resources"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.workinggroups.resources.description") || "Share CAD files, PDFs, research documents, and other resources"}
          </p>
        </div>
        {permissions.canPost && (
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.workinggroups.resources.upload") || "Upload Resource"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {resources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("dashboard.workinggroups.resources.empty") || "No resources yet. Upload the first one!"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("dashboard.workinggroups.resources.table.title") || "Title"}</TableHead>
                  <TableHead>{t("dashboard.workinggroups.resources.table.category") || "Category"}</TableHead>
                  <TableHead>{t("dashboard.workinggroups.resources.table.size") || "Size"}</TableHead>
                  <TableHead>{t("dashboard.workinggroups.resources.table.status") || "Status"}</TableHead>
                  <TableHead className="text-right">{t("dashboard.workinggroups.resources.table.actions") || "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{resource.category}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(resource.file_size)}</TableCell>
                    <TableCell>
                      {resource.is_approved ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          {t("dashboard.workinggroups.resources.status.approved") || "Approved"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {t("dashboard.workinggroups.resources.status.pending") || "Pending"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {resource.is_approved && resource.file_path && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(resource)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {permissions.canApproveResources && !resource.is_approved && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(resource.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        {(permissions.canManageMembers || resource.uploaded_by === user?.id) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(resource.id, resource.file_path || null)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.workinggroups.resources.upload.title") || "Upload Resource"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.workinggroups.resources.upload.description") || "Upload a file to share with the working group"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">{t("dashboard.workinggroups.resources.upload.file") || "File"} *</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="title">{t("dashboard.workinggroups.resources.upload.titleField") || "Title"} *</Label>
              <Input
                id="title"
                value={resourceForm.title}
                onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                placeholder={t("dashboard.workinggroups.resources.upload.titlePlaceholder") || "Resource title"}
              />
            </div>
            <div>
              <Label htmlFor="description">{t("dashboard.workinggroups.resources.upload.description") || "Description"}</Label>
              <Input
                id="description"
                value={resourceForm.description}
                onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                placeholder={t("dashboard.workinggroups.resources.upload.descriptionPlaceholder") || "Optional description"}
              />
            </div>
            <div>
              <Label htmlFor="category">{t("dashboard.workinggroups.resources.upload.category") || "Category"}</Label>
              <Select
                value={resourceForm.category}
                onValueChange={(value: any) => setResourceForm({ ...resourceForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              {t("dashboard.workinggroups.resources.upload.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || !resourceForm.title.trim()}>
              <Upload className="h-4 w-4 mr-2" />
              {t("dashboard.workinggroups.resources.upload.submit") || "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WGResourceLibrary;

