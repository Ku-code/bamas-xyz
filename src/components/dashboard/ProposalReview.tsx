import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { loadProposalsByMeeting, approveProposal, rejectProposal, type AgendaProposal } from "@/lib/agenda-proposals";
import { loadAgendaByMeeting } from "@/lib/agendas";
import { Check, X } from "lucide-react";
import { format } from "date-fns";

interface ProposalReviewProps {
  meetingId: string;
}

const ProposalReview = ({ meetingId }: ProposalReviewProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposals, setProposals] = useState<AgendaProposal[]>([]);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    loadProposals();
  }, [meetingId]);

  const loadProposals = async () => {
    try {
      const loadedProposals = await loadProposalsByMeeting(meetingId);
      setProposals(loadedProposals);
    } catch (error) {
      console.error("Error loading proposals:", error);
      toast({
        title: t("dashboard.proposals.review.error.title") || "Error",
        description: t("dashboard.proposals.review.error.loadFailed") || "Failed to load proposals.",
        variant: "destructive",
      });
    }
  };

  const handleReview = async (proposalId: string, action: "approve" | "reject") => {
    if (!user?.id) {
      toast({
        title: t("dashboard.proposals.review.error.title") || "Error",
        description: t("dashboard.proposals.review.error.notLoggedIn") || "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (action === "approve") {
        const agenda = await loadAgendaByMeeting(meetingId);
        if (!agenda) {
          toast({
            title: t("dashboard.proposals.review.error.title") || "Error",
            description: t("dashboard.proposals.review.error.noAgenda") || "Agenda must be created first.",
            variant: "destructive",
          });
          return;
        }

        await approveProposal(proposalId, {
          reviewed_by: user.id,
          review_notes: reviewNotes,
          add_to_agenda: true,
          agenda_id: agenda.id,
        });
      } else {
        await rejectProposal(proposalId, {
          reviewed_by: user.id,
          review_notes: reviewNotes,
        });
      }

      toast({
        title: t("dashboard.proposals.review.success.title") || "Proposal Reviewed",
        description: t("dashboard.proposals.review.success.description") || `Proposal has been ${action}d.`,
      });

      setReviewingId(null);
      setReviewNotes("");
      setAction(null);
      await loadProposals();
    } catch (error) {
      console.error("Error reviewing proposal:", error);
      toast({
        title: t("dashboard.proposals.review.error.title") || "Error",
        description: t("dashboard.proposals.review.error.description") || "Failed to review proposal.",
        variant: "destructive",
      });
    }
  };

  const pendingProposals = proposals.filter(p => p.status === "pending");
  const reviewedProposals = proposals.filter(p => p.status !== "pending");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            {t("dashboard.proposals.review.title") || "Review Proposals"} ({pendingProposals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingProposals.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t("dashboard.proposals.review.empty") || "No pending proposals."}
            </p>
          ) : (
            <div className="space-y-4">
              {pendingProposals.map((proposal) => (
                <Card key={proposal.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{proposal.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(proposal.proposed_at), "PPP 'at' p")}
                        </p>
                      </div>
                      <Badge variant="outline">{proposal.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="font-semibold mb-1">{t("dashboard.proposals.review.description") || "Description"}</p>
                      <p className="text-sm">{proposal.description}</p>
                    </div>
                    {proposal.justification && (
                      <div>
                        <p className="font-semibold mb-1">{t("dashboard.proposals.review.justification") || "Justification"}</p>
                        <p className="text-sm">{proposal.justification}</p>
                      </div>
                    )}

                    {reviewingId === proposal.id ? (
                      <div className="space-y-2 pt-2 border-t">
                        <Label>{t("dashboard.proposals.review.notes") || "Review Notes"}</Label>
                        <Textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder={t("dashboard.proposals.review.notesPlaceholder") || "Add review notes..."}
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReview(proposal.id, "approve")}
                            disabled={action === "approve"}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            {t("dashboard.proposals.review.approve") || "Approve"}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReview(proposal.id, "reject")}
                            disabled={action === "reject"}
                          >
                            <X className="h-4 w-4 mr-2" />
                            {t("dashboard.proposals.review.reject") || "Reject"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReviewingId(null);
                              setReviewNotes("");
                              setAction(null);
                            }}
                          >
                            {t("dashboard.proposals.review.cancel") || "Cancel"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewingId(proposal.id);
                            setAction("approve");
                          }}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {t("dashboard.proposals.review.approve") || "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setReviewingId(proposal.id);
                            setAction("reject");
                          }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          {t("dashboard.proposals.review.reject") || "Reject"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {reviewedProposals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.proposals.review.reviewed") || "Reviewed Proposals"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reviewedProposals.map((proposal) => (
                <div key={proposal.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">{proposal.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(proposal.proposed_at), "PPP")}
                    </p>
                  </div>
                  <Badge variant={proposal.status === "approved" ? "default" : "destructive"}>
                    {proposal.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProposalReview;

