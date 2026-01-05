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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { logHistory } from "@/lib/history";
import { loadDocuments, createDocument, updateDocument, deleteDocument, uploadDocumentFile, getDocumentFileUrl, convertBase64ToFileAndUpload, Document as SupabaseDocument } from "@/lib/documents";
import { createDocuSealTemplate, createDocuSealSubmission } from "@/lib/docuseal";
import { supabase } from "@/lib/supabase";
import { FileText, Plus, ExternalLink, Search, Filter, X, File, Calendar, Edit, Save, Trash2, Grid3x3, Type, Upload, Download, HardDrive, Minus, LayoutGrid, List, Grid } from "lucide-react";
import { format } from "date-fns";

interface TableData {
  rows: number;
  cols: number;
  headers: string[];
  data: string[][];
}

interface Document {
  id: string;
  title: string;
  description?: string;
  type: "googleDrive" | "text" | "table" | "uploaded";
  googleDriveLink?: string;
  content?: string; // For text documents
  tableData?: TableData; // For table documents
  fileData?: string; // Base64 encoded file data for uploaded files (legacy - use filePath instead)
  fileName?: string; // Original file name
  fileSize?: number; // File size in bytes
  mimeType?: string; // MIME type of uploaded file
  category: string;
  classification?: "GENERAL" | "PROCEDURAL" | "CRITICAL";
  signatureStatus?: "NONE" | "PENDING" | "COMPLETED";
  requiredSigners?: string[];
  createdBy: string;
  createdByName: string;
  createdByImage?: string;
  createdAt: string;
  updatedAt?: string;
  fileType?: string;
  filePath?: string; // Supabase Storage path
}
const CATEGORIES = ["General", "Meeting Minutes", "Reports", "Policies", "Forms", "Presentations", "Notes", "Other"];

const DocumentsContent = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);
  const [createType, setCreateType] = useState<"googleDrive" | "text" | "table" | "uploaded">("googleDrive");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "icons">("grid");
  const [newDocument, setNewDocument] = useState({
    title: "",
    description: "",
    googleDriveLink: "",
    content: "",
    category: "General",
    classification: "GENERAL" as "GENERAL" | "PROCEDURAL" | "CRITICAL",
    requiredSigners: [] as string[],
    tableRows: 3,
    tableCols: 3,
    tableHeaders: [""],
    tableData: [] as string[][],
  });
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<"googleDrive" | "computer">("googleDrive");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDocument, setImportDocument] = useState({
    title: "",
    description: "",
    googleDriveLink: "",
    category: "General",
  });
  const [isDragging, setIsDragging] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Load documents from Supabase
  useEffect(() => {
    loadDocumentsFromDatabase();
  }, []);

  const loadDocumentsFromDatabase = async () => {
    try {
      const loadedDocs = await loadDocuments();
      // Convert to component format
      const convertedDocs: Document[] = loadedDocs.map((doc: SupabaseDocument) => ({
        id: doc.id,
        title: doc.title,
        description: doc.description || undefined,
        type: doc.type,
        googleDriveLink: doc.google_drive_link || undefined,
        content: doc.content || undefined,
        tableData: doc.table_data || undefined,
        fileData: undefined, // Don't load base64 - use file_path instead
        fileName: doc.file_name || undefined,
        fileSize: doc.file_size || undefined,
        mimeType: doc.mime_type || undefined,
        category: doc.category,
        classification: (doc as any).classification || undefined,
        signatureStatus: (doc as any).signature_status || undefined,
        requiredSigners: (doc as any).required_signers || undefined,
        createdBy: doc.created_by,
        createdByName: doc.created_by_name,
        createdByImage: doc.created_by_image || undefined,
        createdAt: doc.created_at,
        updatedAt: doc.updated_at || undefined,
        fileType: doc.mime_type || undefined,
        filePath: doc.file_path, // Store file path for later use
      }));
      setDocuments(convertedDocs);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast({
        title: t("dashboard.documents.error.title") || "Error",
        description: t("dashboard.documents.error.loadFailed") || "Failed to load documents. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Extract Google Drive file ID from URL
  const extractDriveFileId = (url: string): string | null => {
    const patterns = [
      /\/d\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  // Convert Google Drive link to embeddable format
  const getEmbedUrl = (url: string): string | null => {
    const fileId = extractDriveFileId(url);
    if (fileId) {
      return `https://drive.google.com/file/d/${fileId}/preview`;
    }
    return null;
  };

  // Detect file type from Google Drive link
  const detectFileType = (url: string): string => {
    const fileId = extractDriveFileId(url);
    if (!fileId) return "unknown";
    
    if (url.includes(".pdf")) return "PDF";
    if (url.includes(".doc") || url.includes(".docx")) return "Word";
    if (url.includes(".xls") || url.includes(".xlsx")) return "Excel";
    if (url.includes(".ppt") || url.includes(".pptx")) return "PowerPoint";
    if (url.includes(".sheet")) return "Google Sheets";
    if (url.includes(".document")) return "Google Docs";
    if (url.includes(".presentation")) return "Google Slides";
    
    return "Document";
  };

  const initializeTableData = (rows: number, cols: number) => {
    const headers = Array(cols).fill("");
    const data = Array(rows).fill(null).map(() => Array(cols).fill(""));
    return { headers, data };
  };

  const handleCreateDocument = async () => {
    if (!newDocument.title.trim()) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Validation Error",
        description: t("dashboard.documents.create.error.titleRequired") || "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Error",
        description: t("dashboard.documents.create.error.notLoggedIn") || "You must be logged in to create a document.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Validate Critical document requirements
      if (newDocument.classification === 'CRITICAL') {
        if (!isSuperAdmin) {
          toast({
            title: t("dashboard.documents.create.error.title") || "Permission Denied",
            description: t("dashboard.documents.create.error.criticalPermission") || "Only superadmin can create Critical documents.",
            variant: "destructive",
          });
          return;
        }
        if (newDocument.requiredSigners.length === 0) {
          toast({
            title: t("dashboard.documents.create.error.title") || "Validation Error",
            description: t("dashboard.documents.create.error.requiredSigners") || "Please select at least one required signer for Critical documents.",
            variant: "destructive",
          });
          return;
        }
      }

      let documentData: any = {
        title: newDocument.title.trim(),
        description: newDocument.description.trim() || undefined,
        category: newDocument.category,
        classification: newDocument.classification,
        signature_status: newDocument.classification === 'CRITICAL' ? 'PENDING' : 'NONE',
        required_signers: newDocument.classification === 'CRITICAL' ? newDocument.requiredSigners : [],
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image,
      };

      if (createType === "googleDrive") {
        if (!newDocument.googleDriveLink.trim()) {
          toast({
            title: t("dashboard.documents.create.error.title") || "Validation Error",
            description: t("dashboard.documents.create.error.linkRequired") || "Please enter a Google Drive link.",
            variant: "destructive",
          });
          return;
        }

        const fileId = extractDriveFileId(newDocument.googleDriveLink);
        if (!fileId) {
          toast({
            title: t("dashboard.documents.create.error.title") || "Validation Error",
            description: t("dashboard.documents.create.error.invalidLink") || "Please enter a valid Google Drive link.",
            variant: "destructive",
          });
          return;
        }

        documentData = {
          ...documentData,
          type: "googleDrive",
          google_drive_link: newDocument.googleDriveLink.trim(),
        };
      } else if (createType === "text") {
        documentData = {
          ...documentData,
          type: "text",
          content: newDocument.content.trim() || "",
        };
      } else {
        // Table type
        const tableData: TableData = {
          rows: newDocument.tableRows,
          cols: newDocument.tableCols,
          headers: newDocument.tableHeaders,
          data: newDocument.tableData,
        };

        documentData = {
          ...documentData,
          type: "table",
          table_data: tableData,
        };
      }

      const createdDoc = await createDocument(documentData);

      // Log history
      if (user) {
        await logHistory("document_created", user, createdDoc.id, createdDoc.title);
      }

      // If Critical document, set up DocuSeal workflow
      if (newDocument.classification === 'CRITICAL' && newDocument.requiredSigners.length > 0) {
        try {
          // Get all users who need to sign
          const signers: Array<{ email: string; name: string; role: string }> = [];
          
          for (const signerId of newDocument.requiredSigners) {
            if (signerId === 'all_board_members') {
              const { data: boardMembers } = await supabase
                .from('users')
                .select('email, name')
                .eq('role', 'board_member')
                .eq('approved', true);
              
              boardMembers?.forEach(member => {
                if (member.email && !signers.find(s => s.email === member.email)) {
                  signers.push({
                    email: member.email,
                    name: member.name || member.email,
                    role: 'signer'
                  });
                }
              });
            } else if (signerId === 'all_wg_leads') {
              const { data: wgLeads } = await supabase
                .from('users')
                .select('email, name')
                .eq('role', 'wg_lead')
                .eq('approved', true);
              
              wgLeads?.forEach(lead => {
                if (lead.email && !signers.find(s => s.email === lead.email)) {
                  signers.push({
                    email: lead.email,
                    name: lead.name || lead.email,
                    role: 'signer'
                  });
                }
              });
            } else {
              // Individual user ID
              const { data: userData } = await supabase
                .from('users')
                .select('email, name')
                .eq('id', signerId)
                .single();
              
              if (userData?.email && !signers.find(s => s.email === userData.email)) {
                signers.push({
                  email: userData.email,
                  name: userData.name || userData.email,
                  role: 'signer'
                });
              }
            }
          }

          if (signers.length > 0) {
            // For now, we'll create a placeholder submission
            // In production, you would upload the document file and create a template
            toast({
              title: t("dashboard.documents.docuseal.pending") || "Signature Setup Pending",
              description: `Document created. ${signers.length} signer(s) will be notified once the template is configured.`,
            });
          }
        } catch (docusealError: any) {
          console.error("Error setting up DocuSeal:", docusealError);
          // Don't fail the whole operation if DocuSeal setup fails
          toast({
            title: t("dashboard.documents.docuseal.warning") || "Signature Setup Warning",
            description: "Document created but signature workflow needs manual setup.",
            variant: "default",
          });
        }
      }

      toast({
        title: t("dashboard.documents.create.success.title") || "Document Created",
        description: t("dashboard.documents.create.success.description") || "Your document has been created successfully!",
      });

      // Reset form
      setNewDocument({
        title: "",
        description: "",
        googleDriveLink: "",
        content: "",
        category: "General",
        classification: "GENERAL",
        requiredSigners: [],
        tableRows: 3,
        tableCols: 3,
        tableHeaders: [""],
        tableData: [],
      });
      setCreateType("googleDrive");
      setIsCreateDialogOpen(false);

      // Reload documents
      await loadDocumentsFromDatabase();
    } catch (error: any) {
      console.error("Error creating document:", error);
      toast({
        title: t("dashboard.documents.create.error.title") || "Error",
        description: error.message || t("dashboard.documents.create.error.description") || "Failed to create document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc);
    setNewDocument({
      title: doc.title,
      description: doc.description || "",
      googleDriveLink: doc.googleDriveLink || "",
      content: doc.content || "",
      category: doc.category,
      classification: doc.classification || "GENERAL",
      requiredSigners: doc.requiredSigners || [],
      tableRows: doc.tableData?.rows || 3,
      tableCols: doc.tableData?.cols || 3,
      tableHeaders: doc.tableData?.headers || [""],
      tableData: doc.tableData?.data || [],
    });
    setCreateType(doc.type);
    setIsEditDialogOpen(doc.id);
  };

  const handleUpdateDocument = async () => {
    if (!editingDocument || !newDocument.title.trim()) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Validation Error",
        description: t("dashboard.documents.create.error.titleRequired") || "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }

    try {
      const updates: any = {
        title: newDocument.title.trim(),
        description: newDocument.description.trim() || null,
        category: newDocument.category,
      };

      if (editingDocument.type === "text") {
        updates.content = newDocument.content.trim() || null;
      } else if (editingDocument.type === "table") {
        updates.table_data = {
          rows: newDocument.tableRows,
          cols: newDocument.tableCols,
          headers: newDocument.tableHeaders,
          data: newDocument.tableData,
        };
      } else if (editingDocument.type === "googleDrive" && newDocument.googleDriveLink) {
        const fileId = extractDriveFileId(newDocument.googleDriveLink);
        if (fileId) {
          updates.google_drive_link = newDocument.googleDriveLink.trim();
        }
      }

      await updateDocument(editingDocument.id, updates);

      // Log history
      if (user) {
        await logHistory("document_updated", user, editingDocument.id, editingDocument.title);
      }

      toast({
        title: t("dashboard.documents.update.success.title") || "Document Updated",
        description: t("dashboard.documents.update.success.description") || "Your document has been updated successfully!",
      });

      setIsEditDialogOpen(null);
      setEditingDocument(null);

      // Reload documents
      await loadDocumentsFromDatabase();
    } catch (error: any) {
      console.error("Error updating document:", error);
      toast({
        title: t("dashboard.documents.update.error.title") || "Error",
        description: error.message || t("dashboard.documents.update.error.description") || "Failed to update document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    const docToDelete = documents.find((doc) => doc.id === documentId);
    if (!docToDelete) return;

    try {
      await deleteDocument(documentId, docToDelete.filePath);

      // Log history
      if (user && docToDelete) {
        await logHistory("document_deleted", user, documentId, docToDelete.title);
      }

      toast({
        title: t("dashboard.documents.delete.success.title") || "Document Deleted",
        description: t("dashboard.documents.delete.success.description") || "Document has been removed.",
      });

      // Reload documents
      await loadDocumentsFromDatabase();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: t("dashboard.documents.delete.error.title") || "Error",
        description: error.message || t("dashboard.documents.delete.error.description") || "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTableHeaderChange = (index: number, value: string) => {
    const updatedHeaders = [...newDocument.tableHeaders];
    updatedHeaders[index] = value;
    setNewDocument({ ...newDocument, tableHeaders: updatedHeaders });
  };

  const handleTableDataChange = (rowIndex: number, colIndex: number, value: string) => {
    const updatedData = newDocument.tableData.map((row, rIdx) => {
      if (rIdx === rowIndex) {
        return row.map((cell, cIdx) => (cIdx === colIndex ? value : cell));
      }
      return row;
    });
    setNewDocument({ ...newDocument, tableData: updatedData });
  };

  const handleTableSizeChange = (rows: number, cols: number) => {
    const currentHeaders = newDocument.tableHeaders || [];
    const currentData = newDocument.tableData || [];
    
    // Adjust headers
    const headers = Array(cols).fill("").map((_, i) => currentHeaders[i] || "");
    
    // Adjust data
    const data = Array(rows).fill(null).map((_, rIdx) =>
      Array(cols).fill("").map((_, cIdx) => 
        currentData[rIdx]?.[cIdx] || ""
      )
    );

    setNewDocument({
      ...newDocument,
      tableRows: rows,
      tableCols: cols,
      tableHeaders: headers,
      tableData: data,
    });
  };

  const handleAddRow = () => {
    const newRow = Array(newDocument.tableCols).fill("");
    const updatedData = [...newDocument.tableData, newRow];
    setNewDocument({
      ...newDocument,
      tableRows: newDocument.tableRows + 1,
      tableData: updatedData,
    });
  };

  const handleRemoveRow = (rowIndex: number) => {
    if (newDocument.tableRows <= 1) return;
    const updatedData = newDocument.tableData.filter((_, idx) => idx !== rowIndex);
    setNewDocument({
      ...newDocument,
      tableRows: newDocument.tableRows - 1,
      tableData: updatedData,
    });
  };

  const handleAddColumn = () => {
    if (newDocument.tableCols >= 10) {
      toast({
        title: t("dashboard.documents.create.form.table.maxCols") || "Maximum Columns",
        description: t("dashboard.documents.create.form.table.maxColsDesc") || "Maximum 10 columns allowed.",
        variant: "destructive",
      });
      return;
    }
    const updatedHeaders = [...newDocument.tableHeaders, ""];
    const updatedData = newDocument.tableData.map((row) => [...row, ""]);
    setNewDocument({
      ...newDocument,
      tableCols: newDocument.tableCols + 1,
      tableHeaders: updatedHeaders,
      tableData: updatedData,
    });
  };

  const handleRemoveColumn = (colIndex: number) => {
    if (newDocument.tableCols <= 1) return;
    const updatedHeaders = newDocument.tableHeaders.filter((_, idx) => idx !== colIndex);
    const updatedData = newDocument.tableData.map((row) => row.filter((_, idx) => idx !== colIndex));
    setNewDocument({
      ...newDocument,
      tableCols: newDocument.tableCols - 1,
      tableHeaders: updatedHeaders,
      tableData: updatedData,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportFromGoogleDrive = async () => {
    if (!importDocument.title.trim()) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Validation Error",
        description: t("dashboard.documents.create.error.titleRequired") || "Please enter a document title.",
        variant: "destructive",
      });
      return;
    }

    if (!importDocument.googleDriveLink.trim()) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Validation Error",
        description: t("dashboard.documents.create.error.linkRequired") || "Please enter a Google Drive link.",
        variant: "destructive",
      });
      return;
    }

    const fileId = extractDriveFileId(importDocument.googleDriveLink);
    if (!fileId) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Validation Error",
        description: t("dashboard.documents.create.error.invalidLink") || "Please enter a valid Google Drive link.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.documents.create.error.title") || "Error",
        description: t("dashboard.documents.create.error.notLoggedIn") || "You must be logged in to import documents.",
        variant: "destructive",
      });
      return;
    }

    try {
      const createdDoc = await createDocument({
        title: importDocument.title.trim(),
        description: importDocument.description.trim() || undefined,
        type: "googleDrive",
        google_drive_link: importDocument.googleDriveLink.trim(),
        category: importDocument.category,
        classification: importDocument.classification,
        signature_status: importDocument.classification === 'CRITICAL' ? 'PENDING' : 'NONE',
        required_signers: importDocument.classification === 'CRITICAL' ? importDocument.requiredSigners : [],
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image,
      });

      // Log history
      if (user) {
        await logHistory("document_imported_drive", user, createdDoc.id, createdDoc.title);
      }

      toast({
        title: t("dashboard.documents.import.success.title") || "Document Imported",
        description: t("dashboard.documents.import.success.description") || "Your document has been imported successfully!",
      });

      // Reset form
      setImportDocument({
        title: "",
        description: "",
        googleDriveLink: "",
        category: "General",
        classification: "GENERAL",
        requiredSigners: [],
      });
      setIsImportDialogOpen(false);

      // Reload documents
      await loadDocumentsFromDatabase();
    } catch (error: any) {
      console.error("Error importing from Google Drive:", error);
      toast({
        title: t("dashboard.documents.import.error.title") || "Error",
        description: error.message || t("dashboard.documents.import.error.description") || "Failed to import document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (doc: Document) => {
    if (!doc.fileName) return;

    try {
      let fileUrl: string;

      if (doc.filePath) {
        // Get signed URL from Supabase Storage
        fileUrl = await getDocumentFileUrl(doc.filePath);
      } else if (doc.fileData) {
        // Legacy: Convert base64 to blob (for old documents)
        const byteCharacters = atob(doc.fileData.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: doc.mimeType || "application/octet-stream" });
        fileUrl = URL.createObjectURL(blob);
      } else {
        toast({
          title: t("dashboard.documents.download.error.title") || "Error",
          description: t("dashboard.documents.download.error.noFile") || "File not available for download.",
          variant: "destructive",
        });
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up object URL if it was created from base64
      if (doc.fileData && !doc.filePath) {
        URL.revokeObjectURL(fileUrl);
      }
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast({
        title: t("dashboard.documents.download.error.title") || "Error",
        description: error.message || t("dashboard.documents.download.error.description") || "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const processFile = async (file: File) => {
    if (!user?.id) {
      toast({
        title: t("dashboard.documents.import.error.title") || "Error",
        description: t("dashboard.documents.import.error.notLoggedIn") || "You must be logged in to upload files.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: t("dashboard.documents.import.error.title") || "File Too Large",
        description: t("dashboard.documents.import.error.size") || "File size must be less than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const uploadResult = await uploadDocumentFile(file, user.id);
      
      const mimeType = file.type || "application/octet-stream";
      
      // Extract file extension and determine file type
      const fileName = file.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || "";
      let fileType = "Document";
      
      if (fileExtension === "pdf") fileType = "PDF";
      else if (["doc", "docx"].includes(fileExtension)) fileType = "Word";
      else if (["xls", "xlsx"].includes(fileExtension)) fileType = "Excel";
      else if (["ppt", "pptx"].includes(fileExtension)) fileType = "PowerPoint";
      else if (["txt", "md"].includes(fileExtension)) fileType = "Text";
      else if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) fileType = "Image";
      else if (["zip", "rar"].includes(fileExtension)) fileType = "Archive";

      // Use file name as title (without extension)
      const titleWithoutExt = fileName.replace(/\.[^/.]+$/, "");

      const createdDoc = await createDocument({
        title: titleWithoutExt,
        description: `${t("dashboard.documents.import.uploaded") || "Uploaded"}: ${fileName}`,
        type: "uploaded",
        file_path: uploadResult.path,
        file_name: uploadResult.fileName,
        file_size: uploadResult.fileSize,
        mime_type: uploadResult.mimeType,
        category: "General",
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image,
      });

      // Log history
      if (user) {
        await logHistory("document_imported_computer", user, createdDoc.id, createdDoc.title);
      }

      toast({
        title: t("dashboard.documents.import.success.title") || "File Imported",
        description: t("dashboard.documents.import.success.description") || "Your file has been imported successfully!",
      });

      // Reload documents
      await loadDocumentsFromDatabase();
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: t("dashboard.documents.import.error.title") || "Error",
        description: error.message || t("dashboard.documents.import.error.description") || "Failed to upload file. Please try again.",
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
    setIsDragging(false);
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
    
    if (files.length === 0) return;

    // Process each dropped file
    for (const file of files) {
      await processFile(file);
    }
  };

  // Add drag and drop event listeners
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;

    const handleDragEnterGlobal = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeaveGlobal = (e: DragEvent) => {
      e.preventDefault();
      if (!dropZone.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
      }
    };

    const handleDragOverGlobal = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDropGlobal = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    // Add global listeners for better drag and drop experience
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

  // Filter documents based on search and category
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.type === "text" && doc.content?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const renderCreateDialog = () => {
    const isEdit = editingDocument !== null;
    const dialogTitle = isEdit
      ? t("dashboard.documents.edit.title") || "Edit Document"
      : createType === "googleDrive"
      ? t("dashboard.documents.create.title") || "Add Document from Google Drive"
      : createType === "text"
      ? t("dashboard.documents.create.text.title") || "Create Text Document"
      : t("dashboard.documents.create.table.title") || "Create Table";

    return (
      <Dialog
        open={isEdit ? isEditDialogOpen === editingDocument?.id : isCreateDialogOpen}
        onOpenChange={(open) => {
          if (isEdit) {
            setIsEditDialogOpen(open ? editingDocument?.id || null : null);
            if (!open) {
              setEditingDocument(null);
            }
          } else {
            setIsCreateDialogOpen(open);
            if (!open) {
              setCreateType("googleDrive");
              setNewDocument({
                title: "",
                description: "",
                googleDriveLink: "",
                content: "",
                category: "General",
                classification: "GENERAL",
                requiredSigners: [],
                tableRows: 3,
                tableCols: 3,
                tableHeaders: [""],
                tableData: [],
              });
            }
          }
        }}
      >
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? t("dashboard.documents.edit.description") || "Update your document"
                : createType === "googleDrive"
                ? t("dashboard.documents.create.description") || "Add a document by providing its Google Drive link"
                : createType === "text"
                ? t("dashboard.documents.create.text.description") || "Create a new text document or note"
                : t("dashboard.documents.create.table.description") || "Create a new table document"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!isEdit && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={createType === "googleDrive" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCreateType("googleDrive")}
                  className="rounded-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t("dashboard.documents.create.type.googleDrive") || "Google Drive"}
                </Button>
                <Button
                  type="button"
                  variant={createType === "text" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCreateType("text")}
                  className="rounded-full"
                >
                  <Type className="mr-2 h-4 w-4" />
                  {t("dashboard.documents.create.type.text") || "Text Note"}
                </Button>
                <Button
                  type="button"
                  variant={createType === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setCreateType("table");
                    if (newDocument.tableData.length === 0) {
                      const { headers, data } = initializeTableData(3, 3);
                      setNewDocument({ ...newDocument, tableHeaders: headers, tableData: data });
                    }
                  }}
                  className="rounded-full"
                >
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  {t("dashboard.documents.create.type.table") || "Table"}
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="doc-title">
                {t("dashboard.documents.create.form.title") || "Document Title"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="doc-title"
                value={newDocument.title}
                onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                placeholder={t("dashboard.documents.create.form.title.placeholder") || "Enter document title"}
                className="rounded-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="doc-description">{t("dashboard.documents.create.form.description") || "Description"}</Label>
              <Textarea
                id="doc-description"
                value={newDocument.description}
                onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                placeholder={t("dashboard.documents.create.form.description.placeholder") || "Document description (optional)"}
                className="min-h-[80px] rounded-lg"
              />
            </div>

            {createType === "googleDrive" && (
              <div className="space-y-2">
                <Label htmlFor="doc-link">
                  {t("dashboard.documents.create.form.link") || "Google Drive Link"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="doc-link"
                  type="url"
                  value={newDocument.googleDriveLink}
                  onChange={(e) => setNewDocument({ ...newDocument, googleDriveLink: e.target.value })}
                  placeholder={t("dashboard.documents.create.form.link.placeholder") || "https://drive.google.com/file/d/..."}
                  className="rounded-full"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.documents.create.form.link.help") || "Paste the Google Drive share link here"}
                </p>
              </div>
            )}

            {createType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="doc-content">
                  {t("dashboard.documents.create.form.content") || "Content"}
                </Label>
                <Textarea
                  id="doc-content"
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  placeholder={t("dashboard.documents.create.form.content.placeholder") || "Write your notes here..."}
                  className="min-h-[300px] rounded-lg font-mono text-sm"
                />
              </div>
            )}

            {createType === "table" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="whitespace-nowrap">{t("dashboard.documents.create.form.table.rows") || "Rows"}:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (newDocument.tableRows > 1) {
                            handleTableSizeChange(newDocument.tableRows - 1, newDocument.tableCols);
                          }
                        }}
                        disabled={newDocument.tableRows <= 1}
                        className="rounded-full h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={newDocument.tableRows}
                        onChange={(e) => {
                          const rows = parseInt(e.target.value) || 1;
                          if (rows >= 1 && rows <= 20) {
                            handleTableSizeChange(rows, newDocument.tableCols);
                          }
                        }}
                        className="w-20 text-center rounded-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (newDocument.tableRows < 20) {
                            handleTableSizeChange(newDocument.tableRows + 1, newDocument.tableCols);
                          }
                        }}
                        disabled={newDocument.tableRows >= 20}
                        className="rounded-full h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="whitespace-nowrap">{t("dashboard.documents.create.form.table.cols") || "Columns"}:</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (newDocument.tableCols > 1) {
                            handleTableSizeChange(newDocument.tableRows, newDocument.tableCols - 1);
                          }
                        }}
                        disabled={newDocument.tableCols <= 1}
                        className="rounded-full h-8 w-8"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={newDocument.tableCols}
                        onChange={(e) => {
                          const cols = parseInt(e.target.value) || 1;
                          if (cols >= 1 && cols <= 10) {
                            handleTableSizeChange(newDocument.tableRows, cols);
                          }
                        }}
                        className="w-20 text-center rounded-full"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          if (newDocument.tableCols < 10) {
                            handleTableSizeChange(newDocument.tableRows, newDocument.tableCols + 1);
                          }
                        }}
                        disabled={newDocument.tableCols >= 10}
                        className="rounded-full h-8 w-8"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 overflow-x-auto relative">
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddRow}
                      disabled={newDocument.tableRows >= 20}
                      className="rounded-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t("dashboard.documents.create.form.table.addRow") || "Add Row"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddColumn}
                      disabled={newDocument.tableCols >= 10}
                      className="rounded-full text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {t("dashboard.documents.create.form.table.addCol") || "Add Column"}
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Array(newDocument.tableCols).fill(0).map((_, colIndex) => (
                          <TableHead key={colIndex} className="p-2 relative group">
                            <Input
                              value={newDocument.tableHeaders[colIndex] || ""}
                              onChange={(e) => handleTableHeaderChange(colIndex, e.target.value)}
                              placeholder={`Header ${colIndex + 1}`}
                              className="h-8 text-xs pr-8"
                            />
                            {newDocument.tableCols > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveColumn(colIndex)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </TableHead>
                        ))}
                        {newDocument.tableRows > 1 && (
                          <TableHead className="p-2 w-10"></TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array(newDocument.tableRows).fill(0).map((_, rowIndex) => (
                        <TableRow key={rowIndex} className="group/row">
                          {Array(newDocument.tableCols).fill(0).map((_, colIndex) => (
                            <TableCell key={colIndex} className="p-2">
                              <Input
                                value={newDocument.tableData[rowIndex]?.[colIndex] || ""}
                                onChange={(e) => handleTableDataChange(rowIndex, colIndex, e.target.value)}
                                placeholder={`Row ${rowIndex + 1}, Col ${colIndex + 1}`}
                                className="h-8 text-xs"
                              />
                            </TableCell>
                          ))}
                          {newDocument.tableRows > 1 && (
                            <TableCell className="p-2 w-10">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveRow(rowIndex)}
                                className="h-6 w-6 opacity-0 group-hover/row:opacity-100 transition-opacity rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="doc-category">{t("dashboard.documents.create.form.category") || "Category"}</Label>
              <Select value={newDocument.category} onValueChange={(value) => setNewDocument({ ...newDocument, category: value })}>
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

            <div className="space-y-2">
              <Label htmlFor="doc-classification">{t("dashboard.documents.create.form.classification") || "Classification Level"}</Label>
              <Select 
                value={newDocument.classification} 
                onValueChange={(value: "GENERAL" | "PROCEDURAL" | "CRITICAL") => {
                  setNewDocument({ 
                    ...newDocument, 
                    classification: value,
                    requiredSigners: value !== 'CRITICAL' ? [] : newDocument.requiredSigners
                  });
                }}
                disabled={!isSuperAdmin && newDocument.classification === 'CRITICAL'}
              >
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">{t("dashboard.documents.classification.general") || "General"}</SelectItem>
                  <SelectItem value="PROCEDURAL">{t("dashboard.documents.classification.procedural") || "Procedural"}</SelectItem>
                  {isSuperAdmin && (
                    <SelectItem value="CRITICAL">{t("dashboard.documents.classification.critical") || "Critical"}</SelectItem>
                  )}
                </SelectContent>
              </Select>
              {!isSuperAdmin && newDocument.classification === 'CRITICAL' && (
                <p className="text-xs text-muted-foreground">
                  {t("dashboard.documents.classification.superadminOnly") || "Only superadmin can create Critical documents"}
                </p>
              )}
            </div>

            {newDocument.classification === 'CRITICAL' && isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="doc-required-signers">
                  {t("dashboard.documents.create.form.requiredSigners") || "Required Signers"} <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="all-board-members"
                      checked={newDocument.requiredSigners.includes('all_board_members')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewDocument({
                            ...newDocument,
                            requiredSigners: [...newDocument.requiredSigners.filter(s => s !== 'all_board_members'), 'all_board_members']
                          });
                        } else {
                          setNewDocument({
                            ...newDocument,
                            requiredSigners: newDocument.requiredSigners.filter(s => s !== 'all_board_members')
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="all-board-members" className="font-normal cursor-pointer">
                      {t("dashboard.documents.create.form.allBoardMembers") || "All Board Members"}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="all-wg-leads"
                      checked={newDocument.requiredSigners.includes('all_wg_leads')}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewDocument({
                            ...newDocument,
                            requiredSigners: [...newDocument.requiredSigners.filter(s => s !== 'all_wg_leads'), 'all_wg_leads']
                          });
                        } else {
                          setNewDocument({
                            ...newDocument,
                            requiredSigners: newDocument.requiredSigners.filter(s => s !== 'all_wg_leads')
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor="all-wg-leads" className="font-normal cursor-pointer">
                      {t("dashboard.documents.create.form.allWGLeads") || "All WG Leads"}
                    </Label>
                  </div>
                </div>
                {newDocument.requiredSigners.length === 0 && (
                  <p className="text-xs text-destructive">
                    {t("dashboard.documents.create.form.requiredSignersError") || "Please select at least one required signer"}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (isEdit) {
                  setIsEditDialogOpen(null);
                  setEditingDocument(null);
                } else {
                  setIsCreateDialogOpen(false);
                }
              }}
              className="rounded-full"
            >
              {t("dashboard.documents.create.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={isEdit ? handleUpdateDocument : handleCreateDocument}
              className="rounded-full"
            >
              {isEdit
                ? t("dashboard.documents.update.button") || "Update"
                : t("dashboard.documents.create.submit") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-4">
      {/* Drag and Drop Zone */}
      {isDragging && (
        <div
          ref={dropZoneRef}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm flex items-center justify-center border-4 border-dashed border-primary rounded-lg"
        >
          <div className="bg-background border-2 border-primary rounded-lg p-8 text-center max-w-md">
            <Upload className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">
              {t("dashboard.documents.dragDrop.title") || "Drop files here"}
            </h3>
            <p className="text-muted-foreground">
              {t("dashboard.documents.dragDrop.description") || "Release to import your documents"}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.documents.title") || "Documents"}</h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.documents.create.button") || "Create Document"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setCreateType("googleDrive");
              setIsCreateDialogOpen(true);
            }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              {t("dashboard.documents.create.type.googleDrive") || "Add from Google Drive"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setCreateType("text");
              setIsCreateDialogOpen(true);
            }}>
              <Type className="mr-2 h-4 w-4" />
              {t("dashboard.documents.create.type.text") || "Create Text Note"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setCreateType("table");
              const { headers, data } = initializeTableData(3, 3);
              setNewDocument({ ...newDocument, tableHeaders: headers, tableData: data });
              setIsCreateDialogOpen(true);
            }}>
              <Grid3x3 className="mr-2 h-4 w-4" />
              {t("dashboard.documents.create.type.table") || "Create Table"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {renderCreateDialog()}
      </div>

      {/* Search and Filter */}
      {documents.length > 0 && (
        <div className="flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("dashboard.documents.search.placeholder") || "Search documents..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] rounded-full">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder={t("dashboard.documents.filter.category") || "All Categories"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.documents.filter.all") || "All Categories"}</SelectItem>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      )}

      {filteredDocuments.length === 0 ? (
        <Card
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`transition-all ${isDragging ? "border-primary border-2 border-dashed bg-primary/5" : ""}`}
        >
          <CardHeader>
            <CardTitle>{t("dashboard.documents.library") || "Document Library"}</CardTitle>
            <CardDescription>
              {t("dashboard.documents.description") || "Access association documents and resources"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-6 rounded-full bg-muted">
                    <Upload className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-2">
                      {t("dashboard.documents.empty") || "No documents available."}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {t("dashboard.documents.dragDrop.hint") || "Drag and drop files here to import, or use the Import button above"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {t("dashboard.documents.noResults") || "No documents match your search."}
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : viewMode === "list"
              ? "space-y-2"
              : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
          }
        >
          {filteredDocuments.map((doc) => {
            const embedUrl = doc.googleDriveLink ? getEmbedUrl(doc.googleDriveLink) : null;
            const canEmbed = embedUrl !== null;

            // Icons view - compact icon-based layout
            if (viewMode === "icons") {
              return (
                <Card key={doc.id} className="flex flex-col items-center justify-center p-4 hover:shadow-md transition-shadow cursor-pointer group">
                  <div className="flex flex-col items-center gap-3 w-full">
                    <div className="p-4 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                      {doc.type === "text" ? (
                        <Type className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      ) : doc.type === "table" ? (
                        <Grid3x3 className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      ) : doc.type === "uploaded" ? (
                        <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      ) : (
                        <File className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      )}
                    </div>
                    <div className="text-center w-full">
                      <p className="text-sm font-medium line-clamp-2">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{doc.category}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {doc.createdBy === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditDocument(doc);
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
                              handleDeleteDocument(doc.id);
                            }}
                            className="h-6 w-6 rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            // List view - table-like horizontal layout
            if (viewMode === "list") {
              return (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-shrink-0">
                      {doc.type === "text" ? (
                        <Type className="h-6 w-6 text-muted-foreground" />
                      ) : doc.type === "table" ? (
                        <Grid3x3 className="h-6 w-6 text-muted-foreground" />
                      ) : doc.type === "uploaded" ? (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <File className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{doc.title}</h3>
                        <Badge variant="secondary" className="rounded-full text-xs">
                          {doc.category}
                        </Badge>
                        <Badge variant="outline" className="rounded-full text-xs">
                          {doc.fileType || (doc.type === "text" ? "Note" : doc.type === "table" ? "Table" : "Document")}
                        </Badge>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{doc.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={doc.createdByImage} alt={doc.createdByName} />
                            <AvatarFallback className="text-[8px]">
                              {doc.createdByName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{doc.createdByName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(doc.updatedAt || doc.createdAt), "PP")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.type === "googleDrive" && doc.googleDriveLink && (
                        <Button asChild variant="outline" size="sm" className="rounded-full">
                          <a href={doc.googleDriveLink} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {doc.createdBy === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDocument(doc)}
                            className="rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            }

            // Grid view - default card layout
            return (
              <Card key={doc.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {doc.type === "text" ? (
                          <Type className="h-5 w-5 text-muted-foreground" />
                        ) : doc.type === "table" ? (
                          <Grid3x3 className="h-5 w-5 text-muted-foreground" />
                        ) : doc.type === "uploaded" ? (
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <File className="h-5 w-5 text-muted-foreground" />
                        )}
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                      </div>
                      {doc.description && (
                        <CardDescription className="mt-2 line-clamp-2">{doc.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {doc.createdBy === user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditDocument(doc)}
                            className="rounded-full"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="rounded-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge variant="secondary" className="rounded-full">
                      {doc.category}
                    </Badge>
                    <Badge variant="outline" className="rounded-full">
                      {doc.fileType || (doc.type === "text" ? "Note" : doc.type === "table" ? "Table" : "Document")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {doc.type === "googleDrive" && canEmbed && (
                    <div className="mb-4 rounded-lg overflow-hidden border">
                      <iframe
                        src={embedUrl || undefined}
                        className="w-full h-[300px]"
                        title={doc.title}
                        allow="autoplay"
                      />
                    </div>
                  )}

                  {doc.type === "uploaded" && doc.fileData && (
                    <div className="mb-4 p-4 bg-muted rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <File className="h-5 w-5 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.fileName}</span>
                        </div>
                        {doc.fileSize && (
                          <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
                        )}
                      </div>
                      {doc.mimeType?.startsWith("image/") && (
                        <div className="mt-2 rounded overflow-hidden">
                          <img
                            src={doc.fileData}
                            alt={doc.title}
                            className="w-full h-auto max-h-[300px] object-contain"
                          />
                        </div>
                      )}
                      {doc.mimeType === "application/pdf" && (
                        <div className="mt-2 rounded overflow-hidden border">
                          <iframe
                            src={doc.fileData}
                            className="w-full h-[400px]"
                            title={doc.title}
                          />
                        </div>
                      )}
                      {doc.mimeType === "text/plain" && doc.fileData && (
                        <div className="mt-2 p-2 bg-background rounded border max-h-[300px] overflow-auto">
                          <pre className="whitespace-pre-wrap text-xs font-mono">
                            {atob(doc.fileData.split(',')[1])}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {doc.type === "text" && doc.content && (
                    <div className="mb-4 p-4 bg-muted rounded-lg">
                      <pre className="whitespace-pre-wrap text-sm font-mono">{doc.content}</pre>
                    </div>
                  )}

                  {doc.type === "table" && doc.tableData && (
                    <div className="mb-4 border rounded-lg overflow-x-auto">
                      <Table>
                        {doc.tableData.headers.some((h) => h.trim() !== "") && (
                          <TableHeader>
                            <TableRow>
                              {doc.tableData.headers.map((header, idx) => (
                                <TableHead key={idx} className="p-2">
                                  {header || `Column ${idx + 1}`}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                        )}
                        <TableBody>
                          {doc.tableData.data.map((row, rowIdx) => (
                            <TableRow key={rowIdx}>
                              {row.map((cell, colIdx) => (
                                <TableCell key={colIdx} className="p-2">
                                  {cell}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={doc.createdByImage} alt={doc.createdByName} />
                          <AvatarFallback className="text-xs">
                            {doc.createdByName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{doc.createdByName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{format(new Date(doc.updatedAt || doc.createdAt), "PP")}</span>
                      </div>
                    </div>
                    {doc.type === "googleDrive" && doc.googleDriveLink && (
                      <Button
                        asChild
                        variant="outline"
                        className="w-full rounded-full"
                      >
                        <a
                          href={doc.googleDriveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          {t("dashboard.documents.open") || "Open in Google Drive"}
                        </a>
                      </Button>
                    )}
                    {doc.type === "uploaded" && doc.fileData && (
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => handleDownloadFile(doc)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        {t("dashboard.documents.download") || "Download File"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentsContent;
