import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { submitProposal } from "@/lib/agenda-proposals";
import { Plus } from "lucide-react";

interface ProposalSubmissionProps {
  meetingId: string;
}

const ProposalSubmission = ({ meetingId }: ProposalSubmissionProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [proposal, setProposal] = useState({
    title: "",
    description: "",
    justification: "",
    parent_item_id: "",
  });

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: t("dashboard.proposals.submit.error.title") || "Error",
        description: t("dashboard.proposals.submit.error.notLoggedIn") || "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    if (!proposal.title || !proposal.description) {
      toast({
        title: t("dashboard.proposals.submit.error.title") || "Error",
        description: t("dashboard.proposals.submit.error.required") || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitProposal({
        meeting_id: meetingId,
        parent_item_id: proposal.parent_item_id || undefined,
        title: proposal.title,
        description: proposal.description,
        justification: proposal.justification || undefined,
        proposed_by: user.id,
      });

      toast({
        title: t("dashboard.proposals.submit.success.title") || "Proposal Submitted",
        description: t("dashboard.proposals.submit.success.description") || "Your proposal has been submitted for review.",
      });

      setIsOpen(false);
      setProposal({
        title: "",
        description: "",
        justification: "",
        parent_item_id: "",
      });
    } catch (error) {
      console.error("Error submitting proposal:", error);
      toast({
        title: t("dashboard.proposals.submit.error.title") || "Error",
        description: t("dashboard.proposals.submit.error.description") || "Failed to submit proposal.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("dashboard.proposals.submit.title") || "Submit Proposal"}</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("dashboard.proposals.submit.button") || "New Proposal"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("dashboard.proposals.submit.dialog.title") || "Submit Agenda Proposal"}</DialogTitle>
                <DialogDescription>
                  {t("dashboard.proposals.submit.dialog.description") || "Propose a new agenda item or sub-item for this meeting."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("dashboard.proposals.submit.form.title") || "Title *"}</Label>
                  <Input
                    value={proposal.title}
                    onChange={(e) => setProposal({ ...proposal, title: e.target.value })}
                    placeholder={t("dashboard.proposals.submit.form.titlePlaceholder") || "Enter proposal title"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("dashboard.proposals.submit.form.description") || "Description *"}</Label>
                  <Textarea
                    value={proposal.description}
                    onChange={(e) => setProposal({ ...proposal, description: e.target.value })}
                    placeholder={t("dashboard.proposals.submit.form.descriptionPlaceholder") || "Describe the agenda item"}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("dashboard.proposals.submit.form.justification") || "Justification (Optional)"}</Label>
                  <Textarea
                    value={proposal.justification}
                    onChange={(e) => setProposal({ ...proposal, justification: e.target.value })}
                    placeholder={t("dashboard.proposals.submit.form.justificationPlaceholder") || "Explain why this item should be on the agenda"}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t("dashboard.proposals.submit.cancel") || "Cancel"}
                </Button>
                <Button onClick={handleSubmit}>
                  {t("dashboard.proposals.submit.submit") || "Submit Proposal"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {t("dashboard.proposals.submit.info") || "Submit proposals for agenda items before the meeting. Proposals will be reviewed by administrators."}
        </p>
      </CardContent>
    </Card>
  );
};

export default ProposalSubmission;

