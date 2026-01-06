import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { X, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onCancel: () => void;
  signerName: string;
}

export function SignaturePad({ onSave, onCancel, signerName }: SignaturePadProps) {
  const { t } = useLanguage();
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setIsEmpty(true);
  };

  const handleSave = () => {
    if (sigPadRef.current && !sigPadRef.current.isEmpty()) {
      const dataUrl = sigPadRef.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleEnd = () => {
    setIsEmpty(sigPadRef.current?.isEmpty() || false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {t('dashboard.signatures.pad.title') || 'Draw Your Signature'}
        </CardTitle>
        <CardDescription className="text-center">
          {t('dashboard.signatures.pad.description') || 'Draw your signature in the box below'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border-2 border-dashed border-muted rounded-lg bg-white p-2">
          <SignatureCanvas
            ref={sigPadRef}
            canvasProps={{
              className: 'w-full h-64 cursor-crosshair touch-none',
            }}
            onEnd={handleEnd}
            backgroundColor="white"
          />
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            {t('common.cancel') || 'Cancel'}
          </Button>

          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {t('dashboard.signatures.pad.clear') || 'Clear'}
          </Button>

          <Button
            onClick={handleSave}
            disabled={isEmpty}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            {t('dashboard.signatures.pad.save') || 'Sign Document'}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4 text-center">
          {t('dashboard.signatures.pad.legal') ||
            'By signing, you agree that this is a legally binding digital signature'}
        </p>
      </CardContent>
    </Card>
  );
}

