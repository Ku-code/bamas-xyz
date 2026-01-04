import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import { logHistory } from "@/lib/history";
import { loadResources, createResource, updateResource, deleteResource, uploadResourceFile, getResourceFileUrl, Resource as SupabaseResource } from "@/lib/resources";
import { FileText, Plus, Search, Filter, X, File, Calendar, Edit, Save, Trash2, Upload, Download, LayoutGrid, List, Grid, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";

interface Resource {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  createdBy: string;
  createdByName: string;
  createdByImage?: string;
  createdAt: string;
  updatedAt?: string;
  fileType?: string;
  filePath?: string;
}

const CATEGORIES = ["Logos", "Branding", "Templates", "Media", "Documents", "Other"];

const ResourcesContent = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "icons">("grid");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size" | "category">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isLoading, setIsLoading] = useState(false);
  const [newResource, setNewResource] = useState({
    title: "",
    description: "",
    category: "Logos",
  });
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load resources from Supabase
  useEffect(() => {
    loadResourcesFromDatabase();
  }, []);

  const loadResourcesFromDatabase = async () => {
    setIsLoading(true);
    try {
      const loadedResources = await loadResources();
      const convertedResources: Resource[] = loadedResources.map((resource: SupabaseResource) => ({
        id: resource.id,
        title: resource.title,
        description: resource.description || undefined,
        fileName: resource.file_name || undefined,
        fileSize: resource.file_size || undefined,
        mimeType: resource.mime_type || undefined,
        category: resource.category,
        createdBy: resource.created_by,
        createdByName: resource.created_by_name,
        createdByImage: resource.created_by_image || undefined,
        createdAt: resource.created_at,
        updatedAt: resource.updated_at || undefined,
        fileType: resource.mime_type || undefined,
        filePath: resource.file_path,
      }));
      setResources(convertedResources);
    } catch (error: any) {
      console.error("Error loading resources:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.resources.error.title") || "Error Loading Resources",
        t("dashboard.resources.error.loadFailed") || "Failed to load resources"
      );
      
      // Add specific messages for common resource loading errors
      let description = errorInfo.description;
      const errorMessage = error?.message || error?.error?.message || error?.code || "";
      
      if (errorMessage.includes("relation") || errorMessage.includes("does not exist") || error?.code === "42P01") {
        description = "Resources table not found. Please run the database migration (002_resources_table.sql) in Supabase SQL Editor.";
      } else if (errorMessage.includes("permission") || errorMessage.includes("policy") || error?.code === "42501") {
        description = "You don't have permission to access resources. Please ensure your account is approved and RLS policies are set up correctly.";
      }
      
      toast({
        title: errorInfo.title,
        description: description,
        variant: "destructive",
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processFile = async (file: File, customTitle?: string, customDescription?: string, customCategory?: string) => {
    if (!user?.id) {
      toast({
        title: t("dashboard.resources.error.title") || "Error",
        description: t("dashboard.resources.error.notLoggedIn") || "You must be logged in to upload resources.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast({
        title: t("dashboard.resources.upload.error.title") || "Upload Failed",
        description: `File is too large. Maximum size is 50MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const uploadResult = await uploadResourceFile(file, user.id);
      
      const mimeType = file.type || "application/octet-stream";
      
      // Extract file extension and determine file type
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || "";
      let fileType = "File";
      
      if (fileExtension === "pdf") fileType = "PDF";
      else if (["doc", "docx"].includes(fileExtension)) fileType = "Word";
      else if (["xls", "xlsx"].includes(fileExtension)) fileType = "Excel";
      else if (["ppt", "pptx"].includes(fileExtension)) fileType = "PowerPoint";
      else if (["txt", "md"].includes(fileExtension)) fileType = "Text";
      else if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileExtension)) fileType = "Image";
      else if (["zip", "rar"].includes(fileExtension)) fileType = "Archive";
      else if (["ai", "eps", "psd"].includes(fileExtension)) fileType = "Design";

      // Use custom title if provided, otherwise use form title, otherwise use file name (without extension)
      const titleWithoutExt = customTitle || newResource.title.trim() || fileName.replace(/\.[^/.]+$/, "");
      const description = customDescription || newResource.description.trim() || `${t("dashboard.resources.uploaded") || "Uploaded"}: ${fileName}`;
      const category = customCategory || newResource.category || "Logos";

      const createdResource = await createResource({
        title: titleWithoutExt,
        description: description,
        file_path: uploadResult.path,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        category: category,
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image,
      });

      // Log history
      if (user) {
        await logHistory("resource_uploaded", user, createdResource.id, createdResource.title);
      }

      toast({
        title: t("dashboard.resources.upload.success.title") || "File Uploaded",
        description: t("dashboard.resources.upload.success.description") || "Your resource has been uploaded successfully!",
      });

      // Reload resources
      await loadResourcesFromDatabase();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.resources.upload.error.title") || "Upload Failed",
        t("dashboard.resources.upload.error.description") || "Failed to upload resource"
      );
      
      // Add specific messages for common resource upload errors
      let description = errorInfo.description;
      const errorMessage = error?.message || error?.error?.message || error?.code || "";
      
      if (errorMessage.includes("bucket") || errorMessage.includes("not found") || error?.code === "404") {
        description = "Storage bucket 'resources' not found. Please create it in Supabase Storage settings. See RESOURCES_SETUP.md for instructions.";
      } else if (errorMessage.includes("permission") || errorMessage.includes("policy") || error?.code === "42501") {
        description = "You don't have permission to upload resources. Please ensure your account is approved and storage policies are configured.";
      } else if (errorMessage.includes("size") || errorMessage.includes("too large") || error?.code === "413") {
        description = "File is too large. Maximum size is 50MB. Please upload a smaller file.";
      } else if (errorMessage.includes("duplicate") || errorMessage.includes("already exists")) {
        description = "A file with this name already exists. Please rename your file and try again.";
      }
      
      toast({
        title: errorInfo.title,
        description: description,
        variant: "destructive",
        duration: 8000,
      });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      await processFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateResource = async () => {
    if (!newResource.title.trim()) {
      toast({
        title: t("dashboard.resources.create.error.title") || "Validation Error",
        description: t("dashboard.resources.create.error.titleRequired") || "Please enter a resource title.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.resources.create.error.title") || "Error",
        description: t("dashboard.resources.create.error.notLoggedIn") || "You must be logged in to create a resource.",
        variant: "destructive",
      });
      return;
    }

    // If no file is selected, show error
    if (!fileInputRef.current?.files || fileInputRef.current.files.length === 0) {
      toast({
        title: t("dashboard.resources.create.error.title") || "Validation Error",
        description: t("dashboard.resources.create.error.fileRequired") || "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      const file = fileInputRef.current.files[0];
      // processFile will use newResource.title and newResource.description
      await processFile(file);

      setIsCreateDialogOpen(false);
      setNewResource({
        title: "",
        description: "",
        category: "Logos",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      console.error("Error creating resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.resources.create.error.title") || "Failed to Create Resource",
        t("dashboard.resources.create.error.description") || "Failed to create resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleUpdateResource = async () => {
    if (!editingResource) return;

    if (!newResource.title.trim()) {
      toast({
        title: t("dashboard.resources.update.error.title") || "Validation Error",
        description: t("dashboard.resources.update.error.titleRequired") || "Please enter a resource title.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateResource(editingResource.id, {
        title: newResource.title.trim(),
        description: newResource.description.trim() || undefined,
        category: newResource.category,
      });

      if (user) {
        await logHistory("resource_updated", user, editingResource.id, newResource.title.trim());
      }

      toast({
        title: t("dashboard.resources.update.success.title") || "Resource Updated",
        description: t("dashboard.resources.update.success.description") || "Resource has been updated successfully!",
      });

      setIsEditDialogOpen(null);
      setEditingResource(null);
      setNewResource({
        title: "",
        description: "",
        category: "Logos",
      });
      await loadResourcesFromDatabase();
    } catch (error: any) {
      console.error("Error updating resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.resources.update.error.title") || "Failed to Update Resource",
        t("dashboard.resources.update.error.description") || "Failed to update resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    const resource = resources.find((r) => r.id === resourceId);
    if (!resource) return;

    if (!confirm(t("dashboard.resources.delete.confirm") || "Are you sure you want to delete this resource?")) {
      return;
    }

    try {
      await deleteResource(resourceId, resource.filePath);

      if (user) {
        await logHistory("resource_deleted", user, resourceId, resource.title);
      }

      toast({
        title: t("dashboard.resources.delete.success.title") || "Resource Deleted",
        description: t("dashboard.resources.delete.success.description") || "Resource has been deleted successfully!",
      });

      await loadResourcesFromDatabase();
    } catch (error: any) {
      console.error("Error deleting resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.resources.delete.error.title") || "Failed to Delete Resource",
        t("dashboard.resources.delete.error.description") || "Failed to delete resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setNewResource({
      title: resource.title,
      description: resource.description || "",
      category: resource.category,
    });
    setIsEditDialogOpen(resource.id);
  };

  const handleDownloadResource = async (resource: Resource) => {
    if (!resource.filePath) {
      toast({
        title: t("dashboard.resources.download.error.title") || "Error",
        description: t("dashboard.resources.download.error.noFile") || "File not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const url = await getResourceFileUrl(resource.filePath);
      const link = document.createElement("a");
      link.href = url;
      link.download = resource.fileName || resource.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (user) {
        await logHistory("resource_downloaded", user, resource.id, resource.title);
      }
    } catch (error: any) {
      console.error("Error downloading resource:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.resources.download.error.title") || "Download Failed",
        t("dashboard.resources.download.error.description") || "Failed to download resource"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only hide drag state if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    
    if (files.length === 0) {
      toast({
        title: t("dashboard.resources.upload.error.title") || "Upload Failed",
        description: "No files detected. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Process each dropped file sequentially
    for (const file of files) {
      try {
        await processFile(file);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue processing other files even if one fails
      }
    }
  };

  useEffect(() => {
    const handleDragEnterGlobal = (e: DragEvent) => {
      // Only show drag overlay if dragging files
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        setIsDragging(true);
      }
    };

    const handleDragLeaveGlobal = (e: DragEvent) => {
      // Only hide if we're leaving the window entirely
      if (!e.relatedTarget || (e.relatedTarget as Node).nodeName === 'HTML') {
        e.preventDefault();
        setIsDragging(false);
      }
    };

    const handleDragOverGlobal = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleDropGlobal = (e: DragEvent) => {
      // Prevent default browser behavior (opening file)
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
      }
    };

    document.addEventListener('dragenter', handleDragEnterGlobal);
    document.addEventListener('dragleave', handleDragLeaveGlobal);
    document.addEventListener('dragover', handleDragOverGlobal);
    document.addEventListener('drop', handleDropGlobal);

    return () => {
      document.removeEventListener('dragenter', handleDragEnterGlobal);
      document.removeEventListener('dragleave', handleDragLeaveGlobal);
      document.removeEventListener('dragover', handleDragOverGlobal);
      document.removeEventListener('drop', handleDropGlobal);
    };
  }, []);

  // Filter and sort resources
  const filteredAndSortedResources = resources
    .filter((resource) => {
      const matchesSearch =
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.title.localeCompare(b.title);
          break;
        case "date":
          const dateA = new Date(a.updatedAt || a.createdAt).getTime();
          const dateB = new Date(b.updatedAt || b.createdAt).getTime();
          comparison = dateA - dateB;
          break;
        case "size":
          const sizeA = a.fileSize || 0;
          const sizeB = b.fileSize || 0;
          comparison = sizeA - sizeB;
          break;
        case "category":
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone Overlay */}
      {isDragging && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary rounded-lg"
          style={{ pointerEvents: 'auto' }}
        >
          <div className="bg-background border-2 border-primary rounded-lg p-8 text-center max-w-md pointer-events-none">
            <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">
              {t("dashboard.resources.dragDrop.title") || "Drop files here"}
            </h3>
            <p className="text-muted-foreground">
              {t("dashboard.resources.dragDrop.description") || "Release to upload your resources"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.resources.title") || "Resources"}</h2>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("dashboard.resources.upload.button") || "Upload Resource"}
        </Button>
      </div>

      {/* Search, Filter, Sort, and View Controls */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("dashboard.resources.search.placeholder") || "Search resources..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px] rounded-full">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("dashboard.resources.filter.category") || "All Categories"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.resources.filter.all") || "All Categories"}</SelectItem>
            {CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
          <SelectTrigger className="w-[150px] rounded-full">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">{t("dashboard.resources.sort.date") || "Date"}</SelectItem>
            <SelectItem value="name">{t("dashboard.resources.sort.name") || "Name"}</SelectItem>
            <SelectItem value="size">{t("dashboard.resources.sort.size") || "Size"}</SelectItem>
            <SelectItem value="category">{t("dashboard.resources.sort.category") || "Category"}</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          className="rounded-full"
          aria-label="Toggle sort order"
        >
          {sortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )}
        </Button>
        {/* View Toggle Buttons */}
        <div className="flex items-center gap-1 border rounded-full p-1 bg-muted/50">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="rounded-full h-8 w-8 p-0"
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="rounded-full h-8 w-8 p-0"
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "icons" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("icons")}
            className="rounded-full h-8 w-8 p-0"
            aria-label="Icons view"
          >
            <Grid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              {t("dashboard.resources.loading") || "Loading resources..."}
            </div>
          </CardContent>
        </Card>
      ) : filteredAndSortedResources.length === 0 ? (
        <Card
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`transition-all cursor-pointer min-h-[300px] flex flex-col justify-center ${isDragging ? "border-primary border-2 border-dashed bg-primary/10" : "border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50"}`}
        >
          <CardHeader>
            <CardTitle>{t("dashboard.resources.library") || "Resource Library"}</CardTitle>
            <CardDescription>
              {t("dashboard.resources.description") || "Access organization resources and files"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center">
            {resources.length === 0 ? (
              <div className="text-center py-8 w-full">
                <div className="flex flex-col items-center gap-4">
                  <div className={`p-6 rounded-full transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
                    <Upload className={`h-12 w-12 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2 text-lg font-medium">
                      {isDragging 
                        ? (t("dashboard.resources.dragDrop.title") || "Drop files here")
                        : (t("dashboard.resources.empty") || "No resources available.")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.resources.dragDrop.hint") || "Drag and drop files here to upload, or use the Upload button above"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {t("dashboard.resources.noResults") || "No resources match your search."}
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-lg bg-muted border-2 border-dashed border-border">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.resources.dragDrop.hint") || "Drag and drop files here to upload, or use the Upload button above"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`relative ${
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : viewMode === "list"
              ? "space-y-2"
              : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          } ${isDragging ? "opacity-50" : ""}`}
        >
          {/* Drop indicator overlay when dragging */}
          {isDragging && (
            <div className="absolute inset-0 z-10 border-4 border-dashed border-primary bg-primary/5 rounded-lg flex items-center justify-center pointer-events-none">
              <div className="bg-background border-2 border-primary rounded-lg p-6 text-center">
                <Upload className="h-12 w-12 mx-auto mb-3 text-primary" />
                <p className="text-lg font-semibold text-primary">
                  {t("dashboard.resources.dragDrop.title") || "Drop files here"}
                </p>
              </div>
            </div>
          )}
          {filteredAndSortedResources.map((resource) => {
            // Icons view - compact icon-based layout
            if (viewMode === "icons") {
              return (
                <Card key={resource.id} className="flex flex-col items-center justify-center p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="p-4 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      <File className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="text-center w-full">
                      <p className="text-sm font-medium line-clamp-2">{resource.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{resource.category}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {resource.createdBy === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditResource(resource);
                            }}
                            className="h-6 w-6 rounded-full"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteResource(resource.id);
                            }}
                            className="h-6 w-6 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadResource(resource);
                        }}
                        className="h-6 w-6 rounded-full"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            }

            // List view - table-like horizontal layout
            if (viewMode === "list") {
              return (
                <Card key={resource.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-shrink-0">
                      <File className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{resource.title}</h3>
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {resource.category}
                        </Badge>
                        <Badge variant="outline" className="rounded-full text-xs">
                          {resource.fileType || "File"}
                        </Badge>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{resource.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={resource.createdByImage} alt={resource.createdByName} />
                            <AvatarFallback className="text-[8px]">
                              {resource.createdByName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{resource.createdByName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(resource.updatedAt || resource.createdAt), "PP")}</span>
                        </div>
                        {resource.fileSize && (
                          <span>{formatFileSize(resource.fileSize)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {resource.createdBy === user?.id && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditResource(resource)}
                            className="rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteResource(resource.id)}
                            className="rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadResource(resource)}
                        className="rounded-full"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            }

            // Grid view - card-based layout
            return (
              <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {resource.description || t("dashboard.resources.noDescription") || "No description"}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1 ml-2">
                      {resource.createdBy === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditResource(resource)}
                            className="h-8 w-8 rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteResource(resource.id)}
                            className="h-8 w-8 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="rounded-full">
                        {resource.category}
                      </Badge>
                      <Badge variant="outline" className="rounded-full">
                        {resource.fileType || "File"}
                      </Badge>
                      {resource.fileSize && (
                        <Badge variant="outline" className="rounded-full">
                          {formatFileSize(resource.fileSize)}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={resource.createdByImage} alt={resource.createdByName} />
                        <AvatarFallback className="text-[8px]">
                          {resource.createdByName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{resource.createdByName}</span>
                      <span>•</span>
                      <span>{format(new Date(resource.updatedAt || resource.createdAt), "PP")}</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full rounded-full"
                      onClick={() => handleDownloadResource(resource)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t("dashboard.resources.download") || "Download"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateDialogOpen || isEditDialogOpen !== null}
        onOpenChange={(open) => {
          if (editingResource) {
            setIsEditDialogOpen(open ? editingResource.id : null);
            if (!open) {
              setEditingResource(null);
              setNewResource({
                title: "",
                description: "",
                category: "Logos",
              });
            }
          } else {
            setIsCreateDialogOpen(open);
            if (!open) {
              setNewResource({
                title: "",
                description: "",
                category: "Logos",
              });
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingResource
                ? t("dashboard.resources.edit.title") || "Edit Resource"
                : t("dashboard.resources.upload.title") || "Upload Resource"}
            </DialogTitle>
            <DialogDescription>
              {editingResource
                ? t("dashboard.resources.edit.description") || "Update resource information"
                : t("dashboard.resources.upload.description") || "Upload a new resource file for the organization"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingResource && (
              <div className="space-y-2">
                <Label htmlFor="resource-file">
                  {t("dashboard.resources.upload.file") || "File"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="resource-file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="rounded-full"
                  accept="*/*"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resource-title">
                {t("dashboard.resources.title") || "Title"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="resource-title"
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                placeholder={t("dashboard.resources.title.placeholder") || "Enter resource title"}
                className="rounded-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-description">
                {t("dashboard.resources.description") || "Description"}
              </Label>
              <Textarea
                id="resource-description"
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                placeholder={t("dashboard.resources.description.placeholder") || "Enter resource description (optional)"}
                className="rounded-lg"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-category">
                {t("dashboard.resources.category") || "Category"}
              </Label>
              <Select
                value={newResource.category}
                onValueChange={(value) => setNewResource({ ...newResource, category: value })}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(null);
                setEditingResource(null);
                setNewResource({
                  title: "",
                  description: "",
                  category: "Logos",
                });
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="rounded-full"
            >
              {t("dashboard.resources.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={editingResource ? handleUpdateResource : handleCreateResource}
              className="rounded-full"
            >
              {editingResource
                ? t("dashboard.resources.update.button") || "Update"
                : t("dashboard.resources.upload.submit") || "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesContent;

