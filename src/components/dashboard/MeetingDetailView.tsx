import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  loadMeetingById,
  startMeeting,
  completeMeeting,
  type MeetingWithAgenda,
} from "@/lib/meetings";
import { loadAgendaByMeeting, adoptAgenda, lockAgenda, type Agenda } from "@/lib/agendas";
import { loadAgendaItemsWithSubItems, type AgendaItem } from "@/lib/agenda";
import { ArrowLeft, Play, CheckCircle, Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import AgendaBuilder from "./AgendaBuilder";
import MeetingExecution from "./MeetingExecution";
import ProposalSubmission from "./ProposalSubmission";
import ProposalReview from "./ProposalReview";

const MeetingDetailView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const meetingId = searchParams.get("meeting");
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isSuperAdmin, isAdmin, isBoardMember } = useAuth();
  const { toast } = useToast();
  const [meeting, setMeeting] = useState<MeetingWithAgenda | null>(null);
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);

  const canManage = isSuperAdmin || isAdmin || isBoardMember;

  useEffect(() => {
    if (meetingId) {
      loadMeetingData();
    }
  }, [meetingId]);

  const loadMeetingData = async () => {
    if (!meetingId) return;

    try {
      setIsLoading(true);
      const loadedMeeting = await loadMeetingById(meetingId);
      setMeeting(loadedMeeting);

      if (loadedMeeting?.agenda) {
        setAgenda(loadedMeeting.agenda);
        const items = await loadAgendaItemsWithSubItems({
          meeting_id: meetingId,
          agenda_id: loadedMeeting.agenda.id,
        });
        setAgendaItems(items);
      } else {
        // Load agenda if exists
        const loadedAgenda = await loadAgendaByMeeting(meetingId);
        if (loadedAgenda) {
          setAgenda(loadedAgenda);
          const items = await loadAgendaItemsWithSubItems({
            meeting_id: meetingId,
            agenda_id: loadedAgenda.id,
          });
          setAgendaItems(items);
        }
      }
    } catch (error) {
      console.error("Error loading meeting:", error);
      toast({
        title: t("dashboard.meetings.error.title") || "Error",
        description: t("dashboard.meetings.error.loadFailed") || "Failed to load meeting.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdoptAgenda = async () => {
    if (!agenda || !user?.id) return;

    try {
      await adoptAgenda(agenda.id, user.id);
      await lockAgenda(agenda.id);
      toast({
        title: t("dashboard.agenda.adopt.success.title") || "Agenda Adopted",
        description: t("dashboard.agenda.adopt.success.description") || "Agenda has been formally adopted.",
      });
      await loadMeetingData();
    } catch (error) {
      console.error("Error adopting agenda:", error);
      toast({
        title: t("dashboard.agenda.adopt.error.title") || "Error",
        description: t("dashboard.agenda.adopt.error.description") || "Failed to adopt agenda.",
        variant: "destructive",
      });
    }
  };

  const handleStartMeeting = async () => {
    if (!meetingId) return;

    try {
      await startMeeting(meetingId);
      toast({
        title: t("dashboard.meetings.start.success.title") || "Meeting Started",
        description: t("dashboard.meetings.start.success.description") || "Meeting has been started.",
      });
      await loadMeetingData();
    } catch (error) {
      console.error("Error starting meeting:", error);
      toast({
        title: t("dashboard.meetings.start.error.title") || "Error",
        description: t("dashboard.meetings.start.error.description") || "Failed to start meeting.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>{t("dashboard.meetings.loading") || "Loading meeting..."}</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {t("dashboard.meetings.notFound") || "Meeting not found."}
        </p>
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("dashboard.meetings.back") || "Back to Dashboard"}
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      scheduled: "default",
      in_progress: "default",
      completed: "secondary",
      cancelled: "destructive",
    };

    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => {
          setSearchParams({});
          navigate("/dashboard");
        }}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("dashboard.meetings.back") || "Back"}
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{meeting.title}</h2>
          <p className="text-muted-foreground">
            {format(new Date(meeting.scheduled_date), "PPP")} at {meeting.scheduled_time}
          </p>
        </div>
        {getStatusBadge(meeting.status)}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t("dashboard.meetings.tabs.overview") || "Overview"}</TabsTrigger>
          <TabsTrigger value="agenda">{t("dashboard.meetings.tabs.agenda") || "Agenda"}</TabsTrigger>
          {meeting.status === "in_progress" && (
            <TabsTrigger value="execution">{t("dashboard.meetings.tabs.execution") || "Meeting"}</TabsTrigger>
          )}
          <TabsTrigger value="proposals">{t("dashboard.meetings.tabs.proposals") || "Proposals"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.meetings.details.title") || "Meeting Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(meeting.scheduled_date), "PPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{meeting.scheduled_time}</span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{meeting.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {meeting.type === "general_assembly"
                      ? t("dashboard.meetings.type.general_assembly") || "General Assembly"
                      : t("dashboard.meetings.type.board_meeting") || "Board Meeting"}
                  </span>
                </div>
              </div>

              {agenda && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {t("dashboard.agenda.title") || "Agenda"} (v{agenda.version})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Status: {agenda.status}
                      </p>
                    </div>
                    {canManage && agenda.status === "proposed" && (
                      <Button onClick={handleAdoptAgenda}>
                        {t("dashboard.agenda.adopt.button") || "Adopt Agenda"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {canManage && meeting.status === "scheduled" && (
                <div className="pt-4 border-t">
                  <Button onClick={handleStartMeeting}>
                    <Play className="h-4 w-4 mr-2" />
                    {t("dashboard.meetings.actions.start") || "Start Meeting"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agenda">
          {agenda ? (
            <AgendaBuilder
              meetingId={meeting.id}
              agendaId={agenda.id}
              agendaItems={agendaItems}
              onAgendaUpdated={loadMeetingData}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {t("dashboard.agenda.empty") || "No agenda created yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {meeting.status === "in_progress" && (
          <TabsContent value="execution">
            {agenda && meetingId ? (
              <MeetingExecution
                meetingId={meetingId}
                agendaId={agenda.id}
                agendaItems={agendaItems}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    {t("dashboard.meetings.execution.noAgenda") || "Agenda required to start meeting execution."}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        <TabsContent value="proposals">
          {meetingId && (
            <div className="space-y-4">
              {canManage ? (
                <ProposalReview meetingId={meetingId} />
              ) : (
                <ProposalSubmission meetingId={meetingId} />
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeetingDetailView;

