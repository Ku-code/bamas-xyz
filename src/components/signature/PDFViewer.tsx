import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
  documentTitle?: string;
  enableFullscreen?: boolean;
}

export function PDFViewer({ fileUrl, documentTitle, enableFullscreen = true }: PDFViewerProps) {
  const { t } = useLanguage();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(numPages, prev + 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.25));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const renderPDFContent = () => (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2 w-full justify-center">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevPage}
          disabled={pageNumber <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm text-muted-foreground">
          {t('dashboard.signatures.preview.page') || 'Page'} {pageNumber} / {numPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextPage}
          disabled={pageNumber >= numPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={zoomOut} disabled={scale <= 0.5}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={resetZoom}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={zoomIn} disabled={scale >= 3.0}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground ml-2">
          {Math.round(scale * 100)}%
        </span>
        {enableFullscreen && (
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className={`border rounded-lg overflow-auto bg-gray-50 ${isFullscreen ? 'max-h-[calc(100vh-200px)]' : 'max-h-[600px]'}`}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">
                {t('dashboard.signatures.preview.loading') || 'Loading document...'}
              </p>
            </div>
          }
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-destructive mb-2">{error}</p>
            <p className="text-sm text-muted-foreground">
              {t('dashboard.signatures.preview.error') || 'Please try again or contact support'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Fullscreen is handled by parent dialog, so we just render the content

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t('dashboard.signatures.preview.title') || 'Document Preview'}
          {documentTitle && `: ${documentTitle}`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">
              {t('dashboard.signatures.preview.loading') || 'Loading document...'}
            </p>
          </div>
        )}
        {!loading && renderPDFContent()}
      </CardContent>
    </Card>
  );
}

