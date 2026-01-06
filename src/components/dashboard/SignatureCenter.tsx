import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadDocuments,
  loadDocumentSignatures,
  type Document,
} from "@/lib/documents";
import { saveSignature } from "@/lib/pdf-signatures";
import { SignatureDialog } from "@/components/signature/SignatureDialog";
import { FileText, CheckCircle2, Loader2, Download } from "lucide-react";
import { format } from "date-fns";
import { downloadSignedPDF } from "@/lib/pdf-signatures";

const SignatureCenter = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [completedDocuments, setCompletedDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSigningDialog, setShowSigningDialog] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [signatureStep, setSignatureStep] = useState<'preview' | 'sign'>('preview');
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    if (user) {
      loadPendingDocuments();
    }
  }, [user]);

  const loadPendingDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const allDocuments = await loadDocuments();
      
      // Filter documents that require this user's signature
      const pending: Document[] = [];
      const completed: Document[] = [];
      
      for (const doc of allDocuments) {
        if (doc.classification !== 'CRITICAL') {
          continue;
        }

        // Check if user is in required_signers
        const requiredSigners = doc.required_signers || [];
        const userInSigners = requiredSigners.includes(user.id);
        
        // Check if user has a required role
        const userHasRole = requiredSigners.some((signer) => {
          if (signer === 'board_member' && user.role === 'board_member') return true;
          if (signer === 'wg_lead' && user.role === 'wg_lead') return true;
          if (signer === 'all_board_members' && user.role === 'board_member') return true;
          if (signer === 'all_wg_leads' && user.role === 'wg_lead') return true;
          return false;
        });

        if (userInSigners || userHasRole) {
          // Check if user hasn't signed yet
          const signatures = await loadDocumentSignatures(doc.id);
          const userSignature = signatures.find((s) => s.user_id === user.id);
          
          if (doc.signature_status === 'COMPLETED') {
            completed.push(doc);
          } else if (!userSignature || userSignature.status === 'pending') {
            pending.push(doc);
          }
        }
      }

      setPendingDocuments(pending);
      setCompletedDocuments(completed);
    } catch (error: any) {
      console.error("Error loading pending documents:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.signatures.error.title") || "Error Loading Documents",
        t("dashboard.signatures.error.loadFailed") || "Failed to load pending signatures"
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

  const handleSignClick = (doc: Document) => {
    setCurrentDocument(doc);
    setSignatureStep('preview');
    setShowSigningDialog(true);
  };

  const handleSignatureSave = async (signatureDataUrl: string) => {
    if (!currentDocument || !user) return;
    
    setIsSigning(true);
    
    try {
      const result = await saveSignature(
        currentDocument.id,
        user.id,
        signatureDataUrl
      );
      
      if (result.success) {
        toast({
          title: t("dashboard.signatures.success.title") || "Signature Recorded",
          description: t("dashboard.signatures.success.description") || "Your signature has been saved. The document will be finalized when all signers complete.",
        });
        
        setShowSigningDialog(false);
        setCurrentDocument(null);
        setSignatureStep('preview');
        await loadPendingDocuments();
      } else {
        throw new Error(result.error || 'Failed to save signature');
      }
    } catch (error: any) {
      console.error("Error saving signature:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.signatures.error.signFailed") || "Signature Failed",
        t("dashboard.signatures.error.signFailedDesc") || "Failed to save your signature"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const handleDownloadSignedPDF = async (doc: Document) => {
    if (!user) return;

    try {
      const result = await downloadSignedPDF(doc.id, user.id);
      
      if (result.success && result.url) {
        // Open in new tab
        window.open(result.url, '_blank');
      } else {
        throw new Error(result.error || 'Failed to download PDF');
      }
    } catch (error: any) {
      toast({
        title: t("dashboard.signatures.error.downloadFailed") || "Download Failed",
        description: error.message || "Could not download the signed PDF",
        variant: "destructive",
      });
    }
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
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.signatures.title") || "Signature Center"}</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.signatures.pending.title") || "Documents Requiring Your Signature"}</CardTitle>
          <CardDescription>
            {t("dashboard.signatures.pending.description") || "Critical documents that require your digital signature"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDocuments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>{t("dashboard.signatures.empty") || "No documents require your signature at this time."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingDocuments.map((document) => (
                <Card key={document.id} className="border-l-4 border-l-red-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{document.title}</h3>
                          <Badge variant="destructive" className="rounded-full">
                            {t("dashboard.documents.classification.critical") || "CRITICAL"}
                          </Badge>
                        </div>
                        {document.description && (
                          <p className="text-sm text-muted-foreground">{document.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {t("dashboard.signatures.created") || "Created"}: {format(new Date(document.created_at), "PPp")}
                          </span>
                          <span>
                            {t("dashboard.signatures.category") || "Category"}: {document.category}
                          </span>
                        </div>
                        {document.required_signers && document.required_signers.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">{t("dashboard.signatures.requiredSigners") || "Required Signers"}:</span>
                            <span className="ml-2 text-muted-foreground">
                              {document.required_signers.map((s) => {
                                if (s === 'all_board_members') return t("dashboard.signatures.allBoardMembers") || "All Board Members";
                                if (s === 'all_wg_leads') return t("dashboard.signatures.allWGLeads") || "All WG Leads";
                                return s;
                              }).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleSignClick(document)}
                        disabled={isSigning}
                        className="ml-4"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {t("dashboard.signatures.signNow") || "Sign Now"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {completedDocuments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.signatures.completed.title") || "Completed Documents"}</CardTitle>
            <CardDescription>
              {t("dashboard.signatures.completed.description") || "Documents you have signed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedDocuments.map((document) => (
                <Card key={document.id} className="border-l-4 border-l-green-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{document.title}</h3>
                          <Badge variant="default" className="rounded-full bg-green-500">
                            {t("dashboard.signatures.completed.badge") || "COMPLETED"}
                          </Badge>
                        </div>
                        {document.description && (
                          <p className="text-sm text-muted-foreground">{document.description}</p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => handleDownloadSignedPDF(document)}
                        className="ml-4"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {t("dashboard.signatures.download.signed") || "Download Signed PDF"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.signatures.info.title") || "About Digital Signatures"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {t("dashboard.signatures.info.description") || "Critical documents require legally binding digital signatures from authorized members."}
            </p>
            <p>
              {t("dashboard.signatures.info.process") || "Click 'Sign Now' to preview the document, then draw your signature. The document will be finalized when all required signers complete."}
            </p>
          </div>
        </CardContent>
      </Card>

      <SignatureDialog
        open={showSigningDialog}
        onClose={() => {
          setShowSigningDialog(false);
          setCurrentDocument(null);
          setSignatureStep('preview');
        }}
        document={currentDocument}
        step={signatureStep}
        onStepChange={setSignatureStep}
        onSignatureSave={handleSignatureSave}
        isSaving={isSigning}
      />
    </div>
  );
};

export default SignatureCenter;
