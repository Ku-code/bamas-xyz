import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadDocuments,
  loadDocumentSignatures,
  createDocumentSignature,
  updateDocumentSignature,
  type Document,
  type DocumentSignature,
} from "@/lib/documents";
import { getSignerUrl } from "@/lib/docuseal";
import { DocusealForm } from '@docuseal/react';
import { FileText, AlertCircle, CheckCircle2, Loader2, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";

const SignatureCenter = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pendingDocuments, setPendingDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signingDocumentId, setSigningDocumentId] = useState<string | null>(null);
  const [showSigningDialog, setShowSigningDialog] = useState(false);
  const [currentSigningDoc, setCurrentSigningDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadPendingDocuments();
  }, [user]);

  const loadPendingDocuments = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const allDocuments = await loadDocuments();
      
      // Filter documents that require this user's signature
      const pending: Document[] = [];
      
      for (const doc of allDocuments) {
        if (doc.classification !== 'CRITICAL' || doc.signature_status === 'COMPLETED') {
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
          
          if (!userSignature || userSignature.status === 'pending') {
            pending.push(doc);
          }
        }
      }

      setPendingDocuments(pending);
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

  const handleSignDocument = async (document: Document) => {
    if (!user) return;

    try {
      // Check if signature record exists
      const signatures = await loadDocumentSignatures(document.id);
      let signature = signatures.find((s) => s.user_id === user.id);

      if (!signature) {
        // Create signature record
        signature = await createDocumentSignature({
          document_id: document.id,
          user_id: user.id,
          status: 'pending',
        });
      }

      // Get DocuSeal submission URL
      if (document.docuseal_submission_id) {
        // Open embedded signing dialog
        setCurrentSigningDoc(document);
        setShowSigningDialog(true);
        setSigningDocumentId(document.id);
      } else {
        toast({
          title: t("dashboard.signatures.error.noSubmission") || "No Submission Found",
          description: t("dashboard.signatures.error.noSubmissionDesc") || "This document does not have a DocuSeal submission configured. Please contact an administrator.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error initiating signature:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.signatures.error.signFailed") || "Failed to Initiate Signature",
        t("dashboard.signatures.error.signFailedDesc") || "Failed to start the signing process"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleSignatureComplete = async (data: any) => {
    console.log("Signature completed:", data);
    
    if (!currentSigningDoc || !user) return;

    try {
      // Update signature record
      const signatures = await loadDocumentSignatures(currentSigningDoc.id);
      const userSignature = signatures.find((s) => s.user_id === user.id);
      
      if (userSignature) {
        await updateDocumentSignature(userSignature.id, {
          status: 'completed',
          signed_at: new Date().toISOString(),
        });
      }

      toast({
        title: t("dashboard.signatures.success.title") || "Signature Completed",
        description: t("dashboard.signatures.success.description") || "Your signature has been recorded successfully!",
      });

      // Close dialog and reload
      setShowSigningDialog(false);
      setCurrentSigningDoc(null);
      setSigningDocumentId(null);
      await loadPendingDocuments();
    } catch (error: any) {
      console.error("Error updating signature:", error);
      toast({
        title: t("dashboard.signatures.error.updateFailed") || "Update Failed",
        description: "Signature completed but failed to update record. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const getSignatureProgress = async (document: Document): Promise<{ completed: number; total: number }> => {
    try {
      const signatures = await loadDocumentSignatures(document.id);
      const completed = signatures.filter((s) => s.status === 'completed').length;
      const total = signatures.length;
      return { completed, total };
    } catch (error) {
      return { completed: 0, total: 0 };
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
                        onClick={() => handleSignDocument(document)}
                        disabled={signingDocumentId === document.id}
                        className="ml-4"
                      >
                        {signingDocumentId === document.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {t("dashboard.signatures.signing") || "Signing..."}
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4 mr-2" />
                            {t("dashboard.signatures.signNow") || "Sign Now"}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
              {t("dashboard.signatures.info.process") || "Click 'Sign Now' to open the DocuSeal signing interface. After completing the signature, the document will be automatically updated."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* DocuSeal Signing Dialog */}
      <Dialog open={showSigningDialog} onOpenChange={setShowSigningDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {t("dashboard.signatures.dialog.title") || "Sign Document"}: {currentSigningDoc?.title}
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.signatures.dialog.description") || "Please review and sign the document below"}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            {currentSigningDoc?.docuseal_submission_id && user?.email ? (
              <DocusealForm
                src={`https://docuseal.com/s/${currentSigningDoc.docuseal_submission_id}`}
                email={user.email}
                onComplete={handleSignatureComplete}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                  <p>{t("dashboard.signatures.error.noSubmission") || "Signature form not available"}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SignatureCenter;

