import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  createMinutes,
  updateMinutes,
  approveMinutes,
  loadMinutesByAgendaItem,
  type MeetingMinutes,
  type Decision,
  type ActionItem,
  type AssignedResponsibility,
} from "@/lib/meeting-minutes";
import { Plus, Trash2, CheckCircle } from "lucide-react";

interface MinutesEditorProps {
  meetingId: string;
  agendaItemId: string;
}

const MinutesEditor = ({ meetingId, agendaItemId }: MinutesEditorProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [discussionSummary, setDiscussionSummary] = useState("");
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [responsibilities, setResponsibilities] = useState<AssignedResponsibility[]>([]);
  const [newDecision, setNewDecision] = useState("");
  const [newActionItem, setNewActionItem] = useState("");

  useEffect(() => {
    loadExistingMinutes();
  }, [agendaItemId]);

  const loadExistingMinutes = async () => {
    try {
      const existingMinutes = await loadMinutesByAgendaItem(agendaItemId);
      if (existingMinutes) {
        setMinutes(existingMinutes);
        setDiscussionSummary(existingMinutes.discussion_summary || "");
        setDecisions(existingMinutes.decisions || []);
        setActionItems(existingMinutes.action_items || []);
        setResponsibilities(existingMinutes.assigned_responsibilities || []);
      }
    } catch (error) {
      console.error("Error loading minutes:", error);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast({
        title: t("dashboard.minutes.save.error.title") || "Error",
        description: t("dashboard.minutes.save.error.notLoggedIn") || "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (minutes) {
        await updateMinutes(minutes.id, {
          discussion_summary: discussionSummary,
          decisions: decisions.length > 0 ? decisions : undefined,
          action_items: actionItems.length > 0 ? actionItems : undefined,
          assigned_responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
        });
      } else {
        await createMinutes({
          meeting_id: meetingId,
          agenda_item_id: agendaItemId,
          discussion_summary: discussionSummary,
          decisions: decisions.length > 0 ? decisions : undefined,
          action_items: actionItems.length > 0 ? actionItems : undefined,
          assigned_responsibilities: responsibilities.length > 0 ? responsibilities : undefined,
          created_by: user.id,
        });
      }

      toast({
        title: t("dashboard.minutes.save.success.title") || "Minutes Saved",
        description: t("dashboard.minutes.save.success.description") || "Minutes have been saved.",
      });

      await loadExistingMinutes();
    } catch (error) {
      console.error("Error saving minutes:", error);
      toast({
        title: t("dashboard.minutes.save.error.title") || "Error",
        description: t("dashboard.minutes.save.error.description") || "Failed to save minutes.",
        variant: "destructive",
      });
    }
  };

  const handleApprove = async () => {
    if (!minutes || !user?.id) return;

    try {
      await approveMinutes(minutes.id, user.id);
      toast({
        title: t("dashboard.minutes.approve.success.title") || "Minutes Approved",
        description: t("dashboard.minutes.approve.success.description") || "Minutes have been approved.",
      });
      await loadExistingMinutes();
    } catch (error) {
      console.error("Error approving minutes:", error);
      toast({
        title: t("dashboard.minutes.approve.error.title") || "Error",
        description: t("dashboard.minutes.approve.error.description") || "Failed to approve minutes.",
        variant: "destructive",
      });
    }
  };

  const addDecision = () => {
    if (newDecision.trim()) {
      setDecisions([
        ...decisions,
        {
          id: Date.now().toString(),
          description: newDecision,
        },
      ]);
      setNewDecision("");
    }
  };

  const removeDecision = (id: string) => {
    setDecisions(decisions.filter((d) => d.id !== id));
  };

  const addActionItem = () => {
    if (newActionItem.trim()) {
      setActionItems([
        ...actionItems,
        {
          id: Date.now().toString(),
          description: newActionItem,
          status: "pending",
        },
      ]);
      setNewActionItem("");
    }
  };

  const removeActionItem = (id: string) => {
    setActionItems(actionItems.filter((a) => a.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.minutes.title") || "Meeting Minutes"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t("dashboard.minutes.discussion") || "Discussion Summary"}</Label>
          <Textarea
            value={discussionSummary}
            onChange={(e) => setDiscussionSummary(e.target.value)}
            placeholder={t("dashboard.minutes.discussionPlaceholder") || "Summarize the discussion..."}
            rows={6}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("dashboard.minutes.decisions") || "Decisions"}</Label>
          <div className="space-y-2">
            {decisions.map((decision) => (
              <div key={decision.id} className="flex items-start gap-2 p-2 border rounded">
                <div className="flex-1">{decision.description}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeDecision(decision.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newDecision}
                onChange={(e) => setNewDecision(e.target.value)}
                placeholder={t("dashboard.minutes.decisionPlaceholder") || "Add a decision..."}
                onKeyPress={(e) => e.key === "Enter" && addDecision()}
              />
              <Button onClick={addDecision}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("dashboard.minutes.actionItems") || "Action Items"}</Label>
          <div className="space-y-2">
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-2 p-2 border rounded">
                <div className="flex-1">{item.description}</div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeActionItem(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={newActionItem}
                onChange={(e) => setNewActionItem(e.target.value)}
                placeholder={t("dashboard.minutes.actionItemPlaceholder") || "Add an action item..."}
                onKeyPress={(e) => e.key === "Enter" && addActionItem()}
              />
              <Button onClick={addActionItem}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleSave}>
            {t("dashboard.minutes.save.button") || "Save Minutes"}
          </Button>
          {minutes && !minutes.approved_by && (
            <Button onClick={handleApprove} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t("dashboard.minutes.approve.button") || "Approve"}
            </Button>
          )}
          {minutes?.approved_by && (
            <Badge variant="secondary">
              {t("dashboard.minutes.approved") || "Approved"}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MinutesEditor;

