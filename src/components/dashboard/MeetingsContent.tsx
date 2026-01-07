import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  createMeeting,
  loadMeetings,
  updateMeeting,
  deleteMeeting,
  startMeeting,
  completeMeeting,
  type Meeting,
  type MeetingType,
  type MeetingStatus,
} from "@/lib/meetings";
import { Calendar, Plus, Users, Clock, MapPin, Edit, Trash2, Play, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MeetingsContent = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin, isAdmin, isBoardMember } = useAuth();
  const { toast } = useToast();
  const translate = (key: string, fallback: string) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);
  const [deleteMeetingId, setDeleteMeetingId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(searchParams.get("meeting"));
  const [filterType, setFilterType] = useState<MeetingType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<MeetingStatus | "all">("all");
  const [newMeeting, setNewMeeting] = useState({
    type: "general_assembly" as MeetingType,
    title: "",
    scheduled_date: "",
    scheduled_time: "",
    location: "",
    chairperson_id: "",
  });

  const canManageMeetings = isSuperAdmin || isAdmin || isBoardMember;

  useEffect(() => {
    loadMeetingsFromDatabase();
  }, []);

  const loadMeetingsFromDatabase = async () => {
    try {
      const filters: any = {};
      if (filterType !== "all") filters.type = filterType;
      if (filterStatus !== "all") filters.status = filterStatus;

      const loadedMeetings = await loadMeetings(filters);
      setMeetings(loadedMeetings || []);
    } catch (error) {
      console.error("Error loading meetings:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: translate("dashboard.meetings.error.title", "Something went wrong"),
        description: translate("dashboard.meetings.error.loadFailed", "We couldn't load meetings. Please refresh the page or try again shortly.") + ` (${errorMessage})`,
        variant: "destructive",
      });
      // Set empty array on error to prevent UI issues
      setMeetings([]);
    }
  };

  useEffect(() => {
    loadMeetingsFromDatabase();
  }, [filterType, filterStatus]);

  const handleCreateMeeting = async () => {
    if (!user?.id) {
      toast({
        title: t("dashboard.meetings.error.title") || "Error",
        description: t("dashboard.meetings.error.notLoggedIn") || "You must be logged in to create a meeting.",
        variant: "destructive",
      });
      return;
    }

    if (!newMeeting.title || !newMeeting.scheduled_date || !newMeeting.scheduled_time) {
      toast({
        title: t("dashboard.meetings.error.title") || "Error",
        description: t("dashboard.meetings.error.required") || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const meeting = await createMeeting({
        type: newMeeting.type,
        title: newMeeting.title,
        scheduled_date: newMeeting.scheduled_date,
        scheduled_time: newMeeting.scheduled_time,
        location: newMeeting.location || undefined,
        chairperson_id: newMeeting.chairperson_id || undefined,
        created_by: user.id,
      });

      toast({
        title: t("dashboard.meetings.create.success.title") || "Meeting Created",
        description: t("dashboard.meetings.create.success.description") || "Meeting has been created successfully!",
      });

      setIsCreateDialogOpen(false);
      setNewMeeting({
        type: "general_assembly",
        title: "",
        scheduled_date: "",
        scheduled_time: "",
        location: "",
        chairperson_id: "",
      });
      await loadMeetingsFromDatabase();
    } catch (error) {
      console.error("Error creating meeting:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.meetings.create.error.title") || "Error Creating Meeting",
        t("dashboard.meetings.create.error.description") || "Failed to create meeting. Please try again."
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleStartMeeting = async (meetingId: string) => {
    try {
      await startMeeting(meetingId);
      toast({
        title: t("dashboard.meetings.start.success.title") || "Meeting Started",
        description: t("dashboard.meetings.start.success.description") || "Meeting has been started.",
      });
      await loadMeetingsFromDatabase();
    } catch (error) {
      console.error("Error starting meeting:", error);
      toast({
        title: t("dashboard.meetings.start.error.title") || "Error",
        description: t("dashboard.meetings.start.error.description") || "Failed to start meeting.",
        variant: "destructive",
      });
    }
  };

  const handleCompleteMeeting = async (meetingId: string) => {
    try {
      await completeMeeting(meetingId);
      toast({
        title: t("dashboard.meetings.complete.success.title") || "Meeting Completed",
        description: t("dashboard.meetings.complete.success.description") || "Meeting has been completed.",
      });
      await loadMeetingsFromDatabase();
    } catch (error) {
      console.error("Error completing meeting:", error);
      toast({
        title: t("dashboard.meetings.complete.error.title") || "Error",
        description: t("dashboard.meetings.complete.error.description") || "Failed to complete meeting.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMeeting = async () => {
    if (!deleteMeetingId) return;

    try {
      await deleteMeeting(deleteMeetingId);
      toast({
        title: t("dashboard.meetings.delete.success.title") || "Meeting Deleted",
        description: t("dashboard.meetings.delete.success.description") || "Meeting has been deleted.",
      });
      setDeleteMeetingId(null);
      await loadMeetingsFromDatabase();
    } catch (error) {
      console.error("Error deleting meeting:", error);
      toast({
        title: t("dashboard.meetings.delete.error.title") || "Error",
        description: t("dashboard.meetings.delete.error.description") || "Failed to delete meeting.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: MeetingStatus) => {
    const variants: Record<MeetingStatus, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      scheduled: "default",
      in_progress: "default",
      completed: "secondary",
      cancelled: "destructive",
    };

    const labels: Record<MeetingStatus, string> = {
      draft: t("dashboard.meetings.status.draft") || "Draft",
      scheduled: t("dashboard.meetings.status.scheduled") || "Scheduled",
      in_progress: t("dashboard.meetings.status.in_progress") || "In Progress",
      completed: t("dashboard.meetings.status.completed") || "Completed",
      cancelled: t("dashboard.meetings.status.cancelled") || "Cancelled",
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const getTypeLabel = (type: MeetingType) => {
    return type === "general_assembly"
      ? t("dashboard.meetings.type.general_assembly") || "General Assembly"
      : t("dashboard.meetings.type.board_meeting") || "Board Meeting";
  };

  // If a meeting is selected, show detail view
  if (selectedMeetingId) {
    return <MeetingDetailView />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t("dashboard.meetings.title") || "Meetings"}</h2>
          <p className="text-muted-foreground">
            {t("dashboard.meetings.description") || "Manage association meetings and agendas"}
          </p>
        </div>
        {canManageMeetings && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t("dashboard.meetings.create.button") || "Create Meeting"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t("dashboard.meetings.create.title") || "Create New Meeting"}</DialogTitle>
                <DialogDescription>
                  {t("dashboard.meetings.create.description") || "Create a new General Assembly or Board Meeting"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("dashboard.meetings.create.form.type") || "Meeting Type"}</Label>
                  <Select
                    value={newMeeting.type}
                    onValueChange={(value) => setNewMeeting({ ...newMeeting, type: value as MeetingType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_assembly">
                        {t("dashboard.meetings.type.general_assembly") || "General Assembly"}
                      </SelectItem>
                      <SelectItem value="board_meeting">
                        {t("dashboard.meetings.type.board_meeting") || "Board Meeting"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("dashboard.meetings.create.form.title") || "Title"}</Label>
                  <Input
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                    placeholder={t("dashboard.meetings.create.form.titlePlaceholder") || "Enter meeting title"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("dashboard.meetings.create.form.date") || "Date"}</Label>
                    <Input
                      type="date"
                      value={newMeeting.scheduled_date}
                      onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("dashboard.meetings.create.form.time") || "Time"}</Label>
                    <Input
                      type="time"
                      value={newMeeting.scheduled_time}
                      onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("dashboard.meetings.create.form.location") || "Location (Optional)"}</Label>
                  <Input
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                    placeholder={t("dashboard.meetings.create.form.locationPlaceholder") || "Enter location"}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t("dashboard.meetings.create.cancel") || "Cancel"}
                </Button>
                <Button onClick={handleCreateMeeting}>
                  {t("dashboard.meetings.create.submit") || "Create Meeting"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={filterType} onValueChange={(value) => setFilterType(value as MeetingType | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {filterType === "all"
                ? t("dashboard.meetings.filter.allTypes") || "All meeting types"
                : filterType === "general_assembly"
                ? t("dashboard.meetings.type.general_assembly") || "General Assembly"
                : t("dashboard.meetings.type.board_meeting") || "Board Meeting"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.meetings.filter.allTypes") || "All meeting types"}</SelectItem>
            <SelectItem value="general_assembly">
              {t("dashboard.meetings.type.general_assembly") || "General Assembly"}
            </SelectItem>
            <SelectItem value="board_meeting">
              {t("dashboard.meetings.type.board_meeting") || "Board Meeting"}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as MeetingStatus | "all")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue>
              {filterStatus === "all"
                ? t("dashboard.meetings.filter.allStatuses") || "All statuses"
                : filterStatus === "draft"
                ? t("dashboard.meetings.status.draft") || "Draft"
                : filterStatus === "scheduled"
                ? t("dashboard.meetings.status.scheduled") || "Scheduled"
                : filterStatus === "in_progress"
                ? t("dashboard.meetings.status.in_progress") || "In Progress"
                : filterStatus === "completed"
                ? t("dashboard.meetings.status.completed") || "Completed"
                : t("dashboard.meetings.status.cancelled") || "Cancelled"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.meetings.filter.allStatuses") || "All statuses"}</SelectItem>
            <SelectItem value="draft">{t("dashboard.meetings.status.draft") || "Draft"}</SelectItem>
            <SelectItem value="scheduled">{t("dashboard.meetings.status.scheduled") || "Scheduled"}</SelectItem>
            <SelectItem value="in_progress">{t("dashboard.meetings.status.in_progress") || "In Progress"}</SelectItem>
            <SelectItem value="completed">{t("dashboard.meetings.status.completed") || "Completed"}</SelectItem>
            <SelectItem value="cancelled">{t("dashboard.meetings.status.cancelled") || "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {t("dashboard.meetings.empty") || "No meetings found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <Card key={meeting.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {getTypeLabel(meeting.type)}
                      {getStatusBadge(meeting.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">{meeting.title}</CardDescription>
                  </div>
                  {canManageMeetings && (
                    <div className="flex gap-2">
                      {meeting.status === "scheduled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartMeeting(meeting.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {t("dashboard.meetings.actions.start") || "Start"}
                        </Button>
                      )}
                      {meeting.status === "in_progress" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCompleteMeeting(meeting.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("dashboard.meetings.actions.complete") || "Complete"}
                        </Button>
                      )}
                      {isSuperAdmin && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteMeetingId(meeting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                    <span>{getTypeLabel(meeting.type)}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMeetingId(meeting.id);
                      setSearchParams({ meeting: meeting.id });
                    }}
                  >
                    {t("dashboard.meetings.actions.view") || "View Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteMeetingId} onOpenChange={(open) => !open && setDeleteMeetingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.meetings.delete.confirm.title") || "Delete Meeting?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.meetings.delete.confirm.description") || "This action cannot be undone. This will permanently delete the meeting and all associated data."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dashboard.meetings.delete.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteMeeting}>
              {t("dashboard.meetings.delete.confirm.button") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MeetingsContent;

