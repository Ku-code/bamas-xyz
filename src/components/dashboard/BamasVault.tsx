import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  verifyVaultPassword,
  setVaultPassword,
  getVaultPasswordHint,
  loadVaultDocuments,
  createVaultDocument,
  deleteVaultDocument,
  uploadVaultFile,
  getVaultFileUrl,
  logVaultAccess,
  getVaultAccessLogs,
  checkVaultTablesExist,
  type VaultDocument,
  type VaultAccessLog,
} from "@/lib/vault";
import {
  Lock,
  Unlock,
  Shield,
  File,
  Upload,
  Download,
  Trash2,
  Eye,
  Key,
  History,
  AlertTriangle,
  Loader2,
  FolderLock,
  X,
  Settings,
  Users,
} from "lucide-react";
import { format } from "date-fns";

const VAULT_CATEGORIES = [
  "General",
  "Financial",
  "Legal",
  "Board Minutes",
  "Contracts",
  "Strategic Plans",
  "Sensitive Data",
  "Other",
];

const BamasVault = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  // State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordHint, setPasswordHint] = useState<string | null>(null);
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [accessLogs, setAccessLogs] = useState<VaultAccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tablesExist, setTablesExist] = useState(true);
  
  // Dialogs
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<VaultDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Upload form
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    category: "General",
    accessLevel: "board" as "superadmin" | "board" | "custom",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Password change form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPasswordHint, setNewPasswordHint] = useState("");
  
  // Check if tables exist on mount
  useEffect(() => {
    const checkTables = async () => {
      const exists = await checkVaultTablesExist();
      setTablesExist(exists);
      
      if (exists) {
        // Load password hint
        const hint = await getVaultPasswordHint();
        setPasswordHint(hint);
      }
    };
    checkTables();
  }, []);
  
  // Load documents when unlocked
  useEffect(() => {
    if (isUnlocked) {
      loadDocuments();
      if (isSuperAdmin) {
        loadLogs();
      }
    }
  }, [isUnlocked, isSuperAdmin]);
  
  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const docs = await loadVaultDocuments();
      setDocuments(docs);
    } catch (error: any) {
      console.error("Error loading vault documents:", error);
      toast({
        title: t("dashboard.vault.error.loadFailed") || "Load Failed",
        description: error.message || "Failed to load vault documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadLogs = async () => {
    try {
      const logs = await getVaultAccessLogs(100);
      setAccessLogs(logs);
    } catch (error) {
      console.error("Error loading access logs:", error);
    }
  };
  
  const handleUnlock = async () => {
    if (!password.trim()) {
      toast({
        title: t("dashboard.vault.error.passwordRequired") || "Password Required",
        description: t("dashboard.vault.error.enterPassword") || "Please enter the vault password",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying(true);
    try {
      const isValid = await verifyVaultPassword(password);
      
      if (isValid) {
        setIsUnlocked(true);
        setPassword("");
        
        // Log access
        if (user) {
          await logVaultAccess(user.id, user.name, "access_granted");
        }
        
        toast({
          title: t("dashboard.vault.success.unlocked") || "Vault Unlocked",
          description: t("dashboard.vault.success.unlockedDesc") || "You now have access to secure documents",
        });
      } else {
        toast({
          title: t("dashboard.vault.error.invalidPassword") || "Invalid Password",
          description: t("dashboard.vault.error.tryAgain") || "Please check the password and try again",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: t("dashboard.vault.error.verifyFailed") || "Verification Failed",
        description: error.message || "Could not verify password",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleLock = () => {
    setIsUnlocked(false);
    setDocuments([]);
    setAccessLogs([]);
    toast({
      title: t("dashboard.vault.success.locked") || "Vault Locked",
      description: t("dashboard.vault.success.lockedDesc") || "The vault has been secured",
    });
  };
  
  const handleUpload = async () => {
    if (!user) return;
    
    if (!uploadForm.title.trim()) {
      toast({
        title: t("dashboard.vault.error.titleRequired") || "Title Required",
        description: t("dashboard.vault.error.enterTitle") || "Please enter a document title",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedFile) {
      toast({
        title: t("dashboard.vault.error.fileRequired") || "File Required",
        description: t("dashboard.vault.error.selectFile") || "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Upload file
      const uploadResult = await uploadVaultFile(selectedFile, user.id);
      
      // Create document record
      await createVaultDocument({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim() || undefined,
        file_path: uploadResult.path,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        category: uploadForm.category,
        access_level: uploadForm.accessLevel,
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image || undefined,
      });
      
      // Log action
      await logVaultAccess(user.id, user.name, "document_uploaded", undefined, uploadForm.title);
      
      toast({
        title: t("dashboard.vault.success.uploaded") || "Document Uploaded",
        description: t("dashboard.vault.success.uploadedDesc") || "Document has been securely stored",
      });
      
      // Reset form
      setUploadForm({
        title: "",
        description: "",
        category: "General",
        accessLevel: "board",
      });
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      
      // Reload documents
      await loadDocuments();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast({
        title: t("dashboard.vault.error.uploadFailed") || "Upload Failed",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (!selectedDocument || !user) return;
    
    setIsLoading(true);
    try {
      await deleteVaultDocument(selectedDocument.id, selectedDocument.file_path);
      
      // Log action
      await logVaultAccess(user.id, user.name, "document_deleted", selectedDocument.id, selectedDocument.title);
      
      toast({
        title: t("dashboard.vault.success.deleted") || "Document Deleted",
        description: t("dashboard.vault.success.deletedDesc") || "Document has been permanently removed",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedDocument(null);
      
      await loadDocuments();
    } catch (error: any) {
      toast({
        title: t("dashboard.vault.error.deleteFailed") || "Delete Failed",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownload = async (doc: VaultDocument) => {
    if (!doc.file_path || !user) return;
    
    try {
      const url = await getVaultFileUrl(doc.file_path);
      
      // Log action
      await logVaultAccess(user.id, user.name, "document_viewed", doc.id, doc.title);
      
      // Open in new tab or download
      window.open(url, "_blank");
    } catch (error: any) {
      toast({
        title: t("dashboard.vault.error.downloadFailed") || "Download Failed",
        description: error.message || "Failed to download document",
        variant: "destructive",
      });
    }
  };
  
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({
        title: t("dashboard.vault.error.passwordRequired") || "Password Required",
        description: t("dashboard.vault.error.enterNewPassword") || "Please enter a new password",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t("dashboard.vault.error.passwordMismatch") || "Password Mismatch",
        description: t("dashboard.vault.error.passwordsDontMatch") || "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: t("dashboard.vault.error.passwordTooShort") || "Password Too Short",
        description: t("dashboard.vault.error.minLength") || "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await setVaultPassword(newPassword, newPasswordHint.trim() || undefined);
      
      toast({
        title: t("dashboard.vault.success.passwordChanged") || "Password Changed",
        description: t("dashboard.vault.success.passwordChangedDesc") || "Vault password has been updated",
      });
      
      setNewPassword("");
      setConfirmPassword("");
      setNewPasswordHint("");
      setIsPasswordDialogOpen(false);
      
      // Update hint
      setPasswordHint(newPasswordHint.trim() || null);
    } catch (error: any) {
      toast({
        title: t("dashboard.vault.error.changePasswordFailed") || "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return "Unknown";
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };
  
  // Tables don't exist message
  if (!tablesExist) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderLock className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.vault.title") || "BAMAS Vault"}</h2>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t("dashboard.vault.setup.required") || "Setup Required"}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t("dashboard.vault.setup.description") || 
                "The BAMAS Vault requires database setup. Please run the vault migration in Supabase."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Locked state - password prompt
  if (!isUnlocked) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FolderLock className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.vault.title") || "BAMAS Vault"}</h2>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
              <Lock className="h-12 w-12 text-primary" />
            </div>
            <CardTitle>{t("dashboard.vault.locked.title") || "Vault Locked"}</CardTitle>
            <CardDescription>
              {t("dashboard.vault.locked.description") || 
                "Enter the vault password to access secure documents. This area is restricted to board members."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vault-password">
                {t("dashboard.vault.password.label") || "Vault Password"}
              </Label>
              <Input
                id="vault-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder={t("dashboard.vault.password.placeholder") || "Enter password"}
                className="rounded-full"
              />
              {passwordHint && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{t("dashboard.vault.password.hint") || "Hint"}:</span> {passwordHint}
                </p>
              )}
            </div>
            <Button
              onClick={handleUnlock}
              disabled={isVerifying}
              className="w-full rounded-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.vault.verifying") || "Verifying..."}
                </>
              ) : (
                <>
                  <Unlock className="mr-2 h-4 w-4" />
                  {t("dashboard.vault.unlock") || "Unlock Vault"}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Unlocked state - show documents
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderLock className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.vault.title") || "BAMAS Vault"}</h2>
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <Unlock className="mr-1 h-3 w-3" />
            {t("dashboard.vault.unlocked") || "Unlocked"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogsDialogOpen(true)}
                className="rounded-full"
              >
                <History className="mr-2 h-4 w-4" />
                {t("dashboard.vault.accessLogs") || "Access Logs"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPasswordDialogOpen(true)}
                className="rounded-full"
              >
                <Key className="mr-2 h-4 w-4" />
                {t("dashboard.vault.changePassword") || "Change Password"}
              </Button>
            </>
          )}
          {isSuperAdmin && (
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              className="rounded-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {t("dashboard.vault.upload") || "Upload Document"}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLock}
            className="rounded-full"
          >
            <Lock className="mr-2 h-4 w-4" />
            {t("dashboard.vault.lock") || "Lock Vault"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t("dashboard.vault.secureDocuments") || "Secure Documents"}
          </CardTitle>
          <CardDescription>
            {t("dashboard.vault.secureDocumentsDesc") || 
              "These documents are password-protected and accessible only to authorized board members."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <File className="h-12 w-12 mb-4 opacity-50" />
              <p>{t("dashboard.vault.noDocuments") || "No documents in the vault"}</p>
              {isSuperAdmin && (
                <Button
                  variant="link"
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="mt-2"
                >
                  {t("dashboard.vault.uploadFirst") || "Upload the first document"}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          <File className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{doc.title}</h4>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="rounded-full">
                              {doc.category}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className={`rounded-full ${
                                doc.access_level === 'superadmin' 
                                  ? 'bg-red-500/10 text-red-600 border-red-500/30' 
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                              }`}
                            >
                              {doc.access_level === 'superadmin' ? (
                                <>
                                  <Shield className="mr-1 h-3 w-3" />
                                  Superadmin Only
                                </>
                              ) : (
                                <>
                                  <Users className="mr-1 h-3 w-3" />
                                  Board Access
                                </>
                              )}
                            </Badge>
                            {doc.file_size && (
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.file_size)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Avatar className="h-4 w-4">
                              <AvatarImage src={doc.created_by_image} alt={doc.created_by_name} />
                              <AvatarFallback className="text-[8px]">
                                {doc.created_by_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{doc.created_by_name}</span>
                            <span>•</span>
                            <span>{format(new Date(doc.created_at), "PP")}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.file_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(doc)}
                            className="rounded-full"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            {t("dashboard.vault.download") || "Download"}
                          </Button>
                        )}
                        {isSuperAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="rounded-full text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("dashboard.vault.upload.title") || "Upload to Vault"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.vault.upload.description") || 
                "Upload a secure document to the BAMAS Vault. Only authorized members can access it."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="upload-title">
                {t("dashboard.vault.upload.titleLabel") || "Document Title"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="upload-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder={t("dashboard.vault.upload.titlePlaceholder") || "Enter document title"}
                className="rounded-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-description">
                {t("dashboard.vault.upload.descriptionLabel") || "Description"}
              </Label>
              <Textarea
                id="upload-description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder={t("dashboard.vault.upload.descriptionPlaceholder") || "Optional description"}
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-category">
                {t("dashboard.vault.upload.categoryLabel") || "Category"}
              </Label>
              <Select
                value={uploadForm.category}
                onValueChange={(value) => setUploadForm({ ...uploadForm, category: value })}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="upload-access">
                {t("dashboard.vault.upload.accessLabel") || "Access Level"}
              </Label>
              <Select
                value={uploadForm.accessLevel}
                onValueChange={(value: "superadmin" | "board") => setUploadForm({ ...uploadForm, accessLevel: value })}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="board">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {t("dashboard.vault.access.board") || "Board Members"}
                    </span>
                  </SelectItem>
                  <SelectItem value="superadmin">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      {t("dashboard.vault.access.superadmin") || "Superadmin Only"}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {t("dashboard.vault.upload.fileLabel") || "File"} <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {selectedFile ? t("dashboard.vault.upload.changeFile") || "Change File" : t("dashboard.vault.upload.selectFile") || "Select File"}
                </Button>
                {selectedFile && (
                  <div className="flex items-center gap-2 text-sm">
                    <File className="h-4 w-4" />
                    <span className="truncate max-w-[200px]">{selectedFile.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(selectedFile.size)})</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedFile(null)}
                      className="h-6 w-6 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    if (!uploadForm.title) {
                      setUploadForm({ ...uploadForm, title: file.name.replace(/\.[^/.]+$/, "") });
                    }
                  }
                }}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setUploadForm({
                  title: "",
                  description: "",
                  category: "General",
                  accessLevel: "board",
                });
                setSelectedFile(null);
              }}
              className="rounded-full"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isLoading}
              className="rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.vault.uploading") || "Uploading..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {t("dashboard.vault.upload.submit") || "Upload"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.vault.delete.title") || "Delete Document?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.vault.delete.description") || 
                "This action cannot be undone. This will permanently delete the document from the vault."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("common.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.vault.deleting") || "Deleting..."}
                </>
              ) : (
                t("common.delete") || "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Change Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("dashboard.vault.password.change.title") || "Change Vault Password"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.vault.password.change.description") || 
                "Set a new password for the vault. Share it securely with board members."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">
                {t("dashboard.vault.password.new") || "New Password"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("dashboard.vault.password.newPlaceholder") || "Enter new password"}
                className="rounded-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">
                {t("dashboard.vault.password.confirm") || "Confirm Password"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("dashboard.vault.password.confirmPlaceholder") || "Confirm new password"}
                className="rounded-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-hint">
                {t("dashboard.vault.password.hintLabel") || "Password Hint (Optional)"}
              </Label>
              <Input
                id="password-hint"
                value={newPasswordHint}
                onChange={(e) => setNewPasswordHint(e.target.value)}
                placeholder={t("dashboard.vault.password.hintPlaceholder") || "Hint for board members"}
                className="rounded-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsPasswordDialogOpen(false);
                setNewPassword("");
                setConfirmPassword("");
                setNewPasswordHint("");
              }}
              className="rounded-full"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isLoading}
              className="rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("dashboard.vault.saving") || "Saving..."}
                </>
              ) : (
                <>
                  <Key className="mr-2 h-4 w-4" />
                  {t("dashboard.vault.password.update") || "Update Password"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Access Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              {t("dashboard.vault.logs.title") || "Vault Access Logs"}
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.vault.logs.description") || 
                "View who accessed the vault and when. Audit trail for security."}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            {accessLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-50" />
                <p>{t("dashboard.vault.logs.empty") || "No access logs yet"}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("dashboard.vault.logs.user") || "User"}</TableHead>
                    <TableHead>{t("dashboard.vault.logs.action") || "Action"}</TableHead>
                    <TableHead>{t("dashboard.vault.logs.document") || "Document"}</TableHead>
                    <TableHead>{t("dashboard.vault.logs.time") || "Time"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.user_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.document_title || "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), "PPp")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsLogsDialogOpen(false)}
              className="rounded-full"
            >
              {t("common.close") || "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BamasVault;
