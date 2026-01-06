import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { loadDocumentSignatures } from '@/lib/documents';
import { CheckCircle2, Clock } from 'lucide-react';

interface SignatureProgressBadgeProps {
  documentId: string;
}

export function SignatureProgressBadge({ documentId }: SignatureProgressBadgeProps) {
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, [documentId]);

  const loadProgress = async () => {
    try {
      const signatures = await loadDocumentSignatures(documentId);
      const completed = signatures.filter((s) => s.status === 'completed').length;
      const total = signatures.length;
      setProgress({ completed, total });
    } catch (error) {
      console.error('Error loading signature progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !progress) {
    return (
      <Badge variant="outline" className="rounded-full">
        <Clock className="h-3 w-3 mr-1" />
        Loading...
      </Badge>
    );
  }

  if (progress.total === 0) {
    return null;
  }

  if (progress.completed === progress.total) {
    return (
      <Badge variant="default" className="rounded-full bg-green-500">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Completed
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="rounded-full border-yellow-500 text-yellow-600">
      <Clock className="h-3 w-3 mr-1" />
      {progress.completed}/{progress.total} Signed
    </Badge>
  );
}

