import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SignaturePad } from './SignaturePad';
import { PDFViewer } from './PDFViewer';
import { getDocumentFileUrl } from '@/lib/documents';
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Document } from '@/lib/documents';

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  document: Document | null;
  step: 'preview' | 'sign';
  onStepChange: (step: 'preview' | 'sign') => void;
  onSignatureSave: (signatureDataUrl: string) => Promise<void>;
  isSaving: boolean;
}

export function SignatureDialog({
  open,
  onClose,
  document,
  step,
  onStepChange,
  onSignatureSave,
  isSaving,
}: SignatureDialogProps) {
  const { t } = useLanguage();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    if (open && document?.file_path && step === 'preview') {
      loadPdfUrl();
    }
  }, [open, document, step]);

  const loadPdfUrl = async () => {
    if (!document?.file_path) return;

    setLoadingPdf(true);
    setPdfError(null);

    try {
      const url = await getDocumentFileUrl(document.file_path);
      setPdfUrl(url);
    } catch (error: any) {
      console.error('Error loading PDF:', error);
      setPdfError(error.message || 'Failed to load PDF');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleContinueToSign = () => {
    onStepChange('sign');
  };

  const handleBackToPreview = () => {
    onStepChange('preview');
  };

  const handleSignatureSave = async (signatureDataUrl: string) => {
    await onSignatureSave(signatureDataUrl);
  };

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'preview'
              ? t('dashboard.signatures.preview.title') || 'Document Preview'
              : t('dashboard.signatures.pad.title') || 'Sign Document'}
          </DialogTitle>
          <DialogDescription>
            {step === 'preview'
              ? t('dashboard.signatures.preview.description') ||
                'Review the document before signing'
              : document.title}
          </DialogDescription>
        </DialogHeader>

        {isSaving ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('dashboard.signatures.saving') || 'Saving your signature...'}
              </p>
            </div>
          </div>
        ) : step === 'preview' ? (
          <div className="space-y-4">
            {loadingPdf ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : pdfError ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-destructive mb-2">{pdfError}</p>
                  <Button variant="outline" onClick={loadPdfUrl}>
                    {t('common.retry') || 'Retry'}
                  </Button>
                </div>
              </div>
            ) : pdfUrl ? (
              <PDFViewer fileUrl={pdfUrl} documentTitle={document.title} />
            ) : null}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                {t('dashboard.signatures.pad.cancel') || t('common.cancel') || 'Cancel'}
              </Button>
              <Button onClick={handleContinueToSign} disabled={!pdfUrl || !!pdfError}>
                {t('dashboard.signatures.preview.continue') || 'Continue to Sign'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <SignaturePad
              signerName={document.title}
              onSave={handleSignatureSave}
              onCancel={handleBackToPreview}
            />
            <div className="flex justify-start">
              <Button variant="outline" onClick={handleBackToPreview}>
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('dashboard.signatures.preview.back') || 'Back to Preview'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

