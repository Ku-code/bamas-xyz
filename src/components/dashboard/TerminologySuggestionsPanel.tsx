import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadSuggestions, approveSuggestion, rejectSuggestion, type TerminologySuggestion } from "@/lib/terminology";
import { useLanguage } from "@/contexts/LanguageContext";

interface TerminologySuggestionsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const TerminologySuggestionsPanel = ({ open, onOpenChange, onSuccess }: TerminologySuggestionsPanelProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<TerminologySuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TerminologySuggestion | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await loadSuggestions("pending");
      setSuggestions(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (suggestion: TerminologySuggestion) => {
    try {
      await approveSuggestion(suggestion.id);
      toast({
        title: "Success",
        description: "Suggestion approved and term created",
      });
      loadData();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve suggestion",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (suggestion: TerminologySuggestion) => {
    if (!rejectNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      await rejectSuggestion(suggestion.id, rejectNotes);
      toast({
        title: "Success",
        description: "Suggestion rejected",
      });
      setSelectedSuggestion(null);
      setRejectNotes("");
      loadData();
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject suggestion",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Suggestions</DialogTitle>
          <DialogDescription>
            Review and approve or reject member-submitted terminology suggestions
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No pending suggestions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{suggestion.term_en}</CardTitle>
                      {suggestion.term_bg && (
                        <p className="text-muted-foreground mt-1">{suggestion.term_bg}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{suggestion.category}</Badge>
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(suggestion.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">English Description</Label>
                      <p className="text-sm mt-1">{suggestion.description_en}</p>
                    </div>
                    {suggestion.description_bg && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Bulgarian Description</Label>
                        <p className="text-sm mt-1">{suggestion.description_bg}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">Suggested by</Label>
                      <p className="text-sm mt-1">{suggestion.suggested_by_name}</p>
                    </div>

                    {selectedSuggestion?.id === suggestion.id ? (
                      <div className="space-y-2 pt-3 border-t">
                        <Label>Rejection Reason</Label>
                        <Textarea
                          value={rejectNotes}
                          onChange={(e) => setRejectNotes(e.target.value)}
                          placeholder="Explain why this suggestion is being rejected..."
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(suggestion)}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSuggestion(null);
                              setRejectNotes("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-3 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(suggestion)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setSelectedSuggestion(suggestion)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
