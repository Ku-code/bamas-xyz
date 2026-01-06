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

const SIGNATURE_COLORS = [
  { name: 'black', value: '#000000', label: 'Black' },
  { name: 'blue', value: '#2563eb', label: 'Blue' },
  { name: 'red', value: '#dc2626', label: 'Red' },
  { name: 'green', value: '#16a34a', label: 'Green' },
] as const;

export function SignaturePad({ onSave, onCancel, signerName }: SignaturePadProps) {
  const { t } = useLanguage();
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [penColor, setPenColor] = useState<string>('#000000');

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

  // Update pen color when it changes
  React.useEffect(() => {
    if (sigPadRef.current) {
      sigPadRef.current.penColor = penColor;
    }
  }, [penColor]);

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
        <div className="space-y-4">
          {/* Color Selection */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {t('dashboard.signatures.pad.color') || 'Color:'}
            </span>
            <div className="flex gap-2">
              {SIGNATURE_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => {
                    setPenColor(color.value);
                    if (sigPadRef.current) {
                      sigPadRef.current.penColor = color.value;
                    }
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    penColor === color.value
                      ? 'border-primary scale-110'
                      : 'border-muted hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={t(`dashboard.signatures.pad.color.${color.name}`) || color.label}
                  aria-label={color.label}
                />
              ))}
            </div>
          </div>

          <div className="border-2 border-dashed border-muted rounded-lg bg-white p-2">
            <SignatureCanvas
              ref={sigPadRef}
              canvasProps={{
                className: 'w-full h-64 cursor-crosshair touch-none',
              }}
              onEnd={handleEnd}
              backgroundColor="white"
              penColor={penColor}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          <Button variant="outline" onClick={onCancel} className="flex items-center gap-2">
            <X className="h-4 w-4" />
            {t('dashboard.signatures.pad.cancel') || t('common.cancel') || 'Cancel'}
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

