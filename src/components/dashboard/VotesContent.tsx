import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logHistory } from "@/lib/history";
import { loadPolls, createPoll, updatePoll, deletePoll, submitVotes, getUserVotes, Poll, PollOption } from "@/lib/polls";
import { linkPollToAgendaItem, loadLinkedAgendaItems, unlinkPoll, isPollLinked } from "@/lib/poll-agenda-links";
import { loadAgendaItems } from "@/lib/agenda";
import { CheckSquare, Plus, Vote, BarChart3, Users, X, Edit, Trash2, MoreVertical, Link as LinkIcon, Unlink } from "lucide-react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const VotesContent = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [deletePollId, setDeletePollId] = useState<string | null>(null);
  const [selectedVotes, setSelectedVotes] = useState<{ [pollId: string]: string[] }>({});
  const [showResults, setShowResults] = useState<{ [pollId: string]: boolean }>({});
  const [linkingPollId, setLinkingPollId] = useState<string | null>(null);
  const [availableAgendaItems, setAvailableAgendaItems] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedAgendaItemId, setSelectedAgendaItemId] = useState<string>("");
  const [linkedAgendaItems, setLinkedAgendaItems] = useState<Record<string, Array<{ id: string; title: string }>>>({});
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    type: "single" as "single" | "multiple",
    options: [""],
    endDate: "",
  });

  // Load polls from Supabase
  useEffect(() => {
    loadPollsFromDatabase();
  }, []);

  useEffect(() => {
    if (polls.length > 0) {
      loadAgendaItemsForLinking();
    }
  }, [polls]);

  const loadAgendaItemsForLinking = async () => {
    try {
      const items = await loadAgendaItems();
      setAvailableAgendaItems(items.map(item => ({ id: item.id, title: item.title })));
      
      // Load linked items for all polls
      const linkedMap: Record<string, Array<{ id: string; title: string }>> = {};
      for (const poll of polls) {
        const linked = await loadLinkedAgendaItems(poll.id);
        if (linked.length > 0) {
          linkedMap[poll.id] = linked;
        }
      }
      setLinkedAgendaItems(linkedMap);
    } catch (error) {
      console.error("Error loading agenda items:", error);
    }
  };

  const loadPollsFromDatabase = async () => {
    try {
      const loadedPolls = await loadPolls();
      // Convert to component format
      const convertedPolls: Poll[] = loadedPolls.map((p) => ({
        ...p,
        createdBy: p.created_by,
        createdByName: p.created_by_name,
        createdByImage: p.created_by_image,
        createdAt: p.created_at,
        endDate: p.end_date,
      }));
      setPolls(convertedPolls);

      // Load user votes for all polls
      if (user?.id) {
        const votesMap: { [pollId: string]: string[] } = {};
        for (const poll of loadedPolls) {
          const userVotes = await getUserVotes(poll.id, user.id);
          votesMap[poll.id] = userVotes;
        }
        setSelectedVotes(votesMap);
        // Show results for polls user has voted on
        const showResultsMap: { [pollId: string]: boolean } = {};
        Object.keys(votesMap).forEach((pollId) => {
          if (votesMap[pollId].length > 0) {
            showResultsMap[pollId] = true;
          }
        });
        setShowResults(showResultsMap);
      }
    } catch (error) {
      console.error("Error loading polls:", error);
      toast({
        title: t("dashboard.votes.error.title") || "Error",
        description: t("dashboard.votes.error.loadFailed") || "Failed to load polls. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddOption = () => {
    setNewPoll({ ...newPoll, options: [...newPoll.options, ""] });
  };

  const handleRemoveOption = (index: number) => {
    if (newPoll.options.length > 1) {
      const updatedOptions = newPoll.options.filter((_, i) => i !== index);
      setNewPoll({ ...newPoll, options: updatedOptions });
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newPoll.options];
    updatedOptions[index] = value;
    setNewPoll({ ...newPoll, options: updatedOptions });
  };

  const handleCreatePoll = async () => {
    if (!newPoll.title.trim()) {
      toast({
        title: t("dashboard.votes.create.error.title") || "Validation Error",
        description: t("dashboard.votes.create.error.titleRequired") || "Please enter a poll title.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = newPoll.options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: t("dashboard.votes.create.error.title") || "Validation Error",
        description: t("dashboard.votes.create.error.optionsRequired") || "Please add at least 2 options.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.votes.create.error.title") || "Error",
        description: t("dashboard.votes.create.error.notLoggedIn") || "You must be logged in to create a poll.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newPollItem = await createPoll(
        {
          title: newPoll.title.trim(),
          description: newPoll.description.trim() || undefined,
          type: newPoll.type,
          end_date: newPoll.endDate || undefined,
          created_by: user.id,
          created_by_name: user.name,
          created_by_image: user.image,
        },
        validOptions.map((opt) => opt.trim())
      );

      // Log history
      if (user) {
        await logHistory("vote_created", user, newPollItem.id, newPollItem.title);
      }

      toast({
        title: t("dashboard.votes.create.success.title") || "Poll Created",
        description: t("dashboard.votes.create.success.description") || "Your poll has been created successfully!",
      });

      // Reset form
      setNewPoll({
        title: "",
        description: "",
        type: "single",
        options: [""],
        endDate: "",
      });
      setIsCreateDialogOpen(false);

      // Reload polls
      await loadPollsFromDatabase();
    } catch (error: any) {
      console.error("Error creating poll:", error);
      toast({
        title: t("dashboard.votes.create.error.title") || "Error",
        description: error.message || t("dashboard.votes.create.error.description") || "Failed to create poll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditPoll = (poll: Poll) => {
    setEditingPoll(poll);
    // Format datetime-local input (YYYY-MM-DDTHH:mm)
    let formattedEndDate = "";
    const endDate = (poll as any).endDate || (poll as any).end_date;
    if (endDate) {
      const date = new Date(endDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      formattedEndDate = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    setNewPoll({
      title: poll.title,
      description: poll.description || "",
      type: poll.type,
      options: poll.options.map((opt) => opt.text),
      endDate: formattedEndDate,
    });
    setIsEditDialogOpen(poll.id);
  };

  const handleUpdatePoll = async () => {
    if (!editingPoll || !newPoll.title.trim()) {
      toast({
        title: t("dashboard.votes.create.error.title") || "Validation Error",
        description: t("dashboard.votes.create.error.titleRequired") || "Please enter a poll title.",
        variant: "destructive",
      });
      return;
    }

    const validOptions = newPoll.options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: t("dashboard.votes.create.error.title") || "Validation Error",
        description: t("dashboard.votes.create.error.optionsRequired") || "Please add at least 2 options.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format end date
      let endDate: string | undefined = undefined;
      if (newPoll.endDate) {
        endDate = new Date(newPoll.endDate).toISOString();
      }

      await updatePoll(
        editingPoll.id,
        {
          title: newPoll.title.trim(),
          description: newPoll.description.trim() || undefined,
          type: newPoll.type,
          end_date: endDate,
        },
        validOptions.map((opt) => opt.trim())
      );

      // Log history
      if (user) {
        await logHistory("vote_updated", user, editingPoll.id, editingPoll.title);
      }

      toast({
        title: t("dashboard.votes.update.success.title") || "Poll Updated",
        description: t("dashboard.votes.update.success.description") || "Your poll has been updated successfully!",
      });

      // Reset form
      setNewPoll({
        title: "",
        description: "",
        type: "single",
        options: [""],
        endDate: "",
      });
      setIsEditDialogOpen(null);
      setEditingPoll(null);

      // Reload polls
      await loadPollsFromDatabase();
    } catch (error: any) {
      console.error("Error updating poll:", error);
      toast({
        title: t("dashboard.votes.update.error.title") || "Error",
        description: error.message || t("dashboard.votes.update.error.description") || "Failed to update poll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    const pollToDelete = polls.find((p) => p.id === pollId);
    if (!pollToDelete) return;

    try {
      await deletePoll(pollId);
      setDeletePollId(null);

      // Log history
      if (user && pollToDelete) {
        await logHistory("vote_deleted", user, pollId, pollToDelete.title);
      }

      toast({
        title: t("dashboard.votes.delete.success.title") || "Poll Deleted",
        description: t("dashboard.votes.delete.success.description") || "Poll has been deleted successfully!",
      });

      // Reload polls
      await loadPollsFromDatabase();
    } catch (error: any) {
      console.error("Error deleting poll:", error);
      toast({
        title: t("dashboard.votes.delete.error.title") || "Error",
        description: error.message || t("dashboard.votes.delete.error.description") || "Failed to delete poll. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isPollCreator = (poll: Poll): boolean => {
    const createdBy = (poll as any).createdBy || (poll as any).created_by;
    return user?.id === createdBy;
  };

  const handleVote = async (pollId: string, optionIds: string[]) => {
    if (!user?.id) {
      toast({
        title: t("dashboard.votes.vote.error.title") || "Error",
        description: t("dashboard.votes.vote.error.notLoggedIn") || "You must be logged in to vote.",
        variant: "destructive",
      });
      return;
    }

    if (!optionIds || optionIds.length === 0) {
      toast({
        title: t("dashboard.votes.vote.error.title") || "Error",
        description: t("dashboard.votes.vote.error.noSelection") || "Please select at least one option.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== VOTE HANDLER START ===');
      console.log('User from context:', user);
      console.log('User ID:', user?.id);
      console.log('Poll ID:', pollId);
      console.log('Option IDs:', optionIds);
      
      if (!user?.id) {
        throw new Error('User ID is missing from context');
      }
      
      console.log('Calling submitVotes with:', { pollId, optionIds, userId: user.id });
      await submitVotes(pollId, optionIds, user.id);
      console.log('✅ Vote submitted successfully');

      // Log history
      const poll = polls.find((p) => p.id === pollId);
      if (poll && user) {
        try {
          await logHistory("vote_submitted", user, pollId, poll.title);
        } catch (historyError) {
          console.warn('Failed to log history:', historyError);
          // Don't fail the vote if history logging fails
        }
      }

      setSelectedVotes({ ...selectedVotes, [pollId]: optionIds });
      setShowResults({ ...showResults, [pollId]: true });

      toast({
        title: t("dashboard.votes.vote.success.title") || "Vote Submitted",
        description: t("dashboard.votes.vote.success.description") || "Your vote has been recorded!",
      });

      // Reload polls to get updated vote counts
      await loadPollsFromDatabase();
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        pollId,
        optionIds,
        userId: user.id
      });
      
      let errorMessage = error.message || t("dashboard.votes.vote.error.description") || "Failed to submit vote. Please try again.";
      
      // Provide more specific error messages
      if (error.code === '42501') {
        errorMessage = "Permission denied. Please ensure you are logged in and have permission to vote.";
      } else if (error.code === '23505') {
        errorMessage = "You have already voted on this poll. Your vote has been updated.";
      } else if (error.message?.includes('Poll not found')) {
        errorMessage = "This poll no longer exists.";
      } else if (error.message?.includes('Invalid')) {
        errorMessage = error.message;
      }
      
      toast({
        title: t("dashboard.votes.vote.error.title") || "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleLinkToAgendaItem = async (pollId: string) => {
    if (!selectedAgendaItemId) {
      toast({
        title: t("dashboard.votes.link.error.title") || "Error",
        description: t("dashboard.votes.link.error.noItem") || "Please select an agenda item.",
        variant: "destructive",
      });
      return;
    }

    try {
      await linkPollToAgendaItem(pollId, selectedAgendaItemId);
      toast({
        title: t("dashboard.votes.link.success.title") || "Poll Linked",
        description: t("dashboard.votes.link.success.description") || "Poll has been linked to agenda item.",
      });
      setLinkingPollId(null);
      setSelectedAgendaItemId("");
      await loadAgendaItemsForLinking();
    } catch (error) {
      console.error("Error linking poll:", error);
      toast({
        title: t("dashboard.votes.link.error.title") || "Error",
        description: t("dashboard.votes.link.error.description") || "Failed to link poll.",
        variant: "destructive",
      });
    }
  };

  const handleUnlinkFromAgendaItem = async (pollId: string, agendaItemId: string) => {
    try {
      await unlinkPoll(pollId, agendaItemId);
      toast({
        title: t("dashboard.votes.unlink.success.title") || "Poll Unlinked",
        description: t("dashboard.votes.unlink.success.description") || "Poll has been unlinked from agenda item.",
      });
      await loadAgendaItemsForLinking();
    } catch (error) {
      console.error("Error unlinking poll:", error);
      toast({
        title: t("dashboard.votes.unlink.error.title") || "Error",
        description: t("dashboard.votes.unlink.error.description") || "Failed to unlink poll.",
        variant: "destructive",
      });
    }
  };

  const getTotalVotes = (poll: Poll): number => {
    return poll.options.reduce((total, option) => total + (option.votes?.length || 0), 0);
  };

  const hasUserVoted = (poll: Poll): boolean => {
    if (!user?.id) return false;
    const userVotes = selectedVotes[poll.id] || [];
    return userVotes.length > 0;
  };

  const getUserVotesForPoll = (poll: Poll): string[] => {
    return selectedVotes[poll.id] || [];
  };

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.votes.title") || "Votes & Polls"}</h2>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.votes.create.button") || "Create Poll"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t("dashboard.votes.create.title") || "Create New Poll"}</DialogTitle>
              <DialogDescription>
                {t("dashboard.votes.create.description") || "Create a new poll for association members to vote on"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="poll-title">
                  {t("dashboard.votes.create.form.title") || "Poll Title"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="poll-title"
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                  placeholder={t("dashboard.votes.create.form.title.placeholder") || "Enter poll title"}
                  className="rounded-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="poll-description">{t("dashboard.votes.create.form.description") || "Description"}</Label>
                <Textarea
                  id="poll-description"
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                  placeholder={t("dashboard.votes.create.form.description.placeholder") || "Poll description (optional)"}
                  className="min-h-[80px] rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.votes.create.form.type") || "Poll Type"}</Label>
                <RadioGroup
                  value={newPoll.type}
                  onValueChange={(value) => setNewPoll({ ...newPoll, type: value as "single" | "multiple" })}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="single" id="type-single" />
                    <Label htmlFor="type-single" className="cursor-pointer">
                      {t("dashboard.votes.create.form.type.single") || "Single Choice"}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="multiple" id="type-multiple" />
                    <Label htmlFor="type-multiple" className="cursor-pointer">
                      {t("dashboard.votes.create.form.type.multiple") || "Multiple Choice"}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>{t("dashboard.votes.create.form.options") || "Options"} <span className="text-destructive">*</span></Label>
                <div className="space-y-2">
                  {newPoll.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`${t("dashboard.votes.create.form.options.placeholder") || "Option"} ${index + 1}`}
                        className="rounded-full"
                      />
                      {newPoll.options.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveOption(index)}
                          className="rounded-full"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddOption}
                    className="rounded-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t("dashboard.votes.create.form.options.add") || "Add Option"}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="poll-end-date">{t("dashboard.votes.create.form.endDate") || "End Date (Optional)"}</Label>
                <Input
                  id="poll-end-date"
                  type="datetime-local"
                  value={newPoll.endDate}
                  onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                  className="rounded-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-full">
                {t("dashboard.votes.create.cancel") || "Cancel"}
              </Button>
              <Button onClick={handleCreatePoll} className="rounded-full">
                {t("dashboard.votes.create.submit") || "Create Poll"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Poll Dialog */}
      <Dialog open={isEditDialogOpen !== null} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(null);
          setEditingPoll(null);
          setNewPoll({
            title: "",
            description: "",
            type: "single",
            options: [""],
            endDate: "",
          });
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("dashboard.votes.edit.title") || "Edit Poll"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.votes.edit.description") || "Update your poll details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-poll-title">
                {t("dashboard.votes.create.form.title") || "Poll Title"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-poll-title"
                value={newPoll.title}
                onChange={(e) => setNewPoll({ ...newPoll, title: e.target.value })}
                placeholder={t("dashboard.votes.create.form.title.placeholder") || "Enter poll title"}
                className="rounded-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-poll-description">{t("dashboard.votes.create.form.description") || "Description"}</Label>
              <Textarea
                id="edit-poll-description"
                value={newPoll.description}
                onChange={(e) => setNewPoll({ ...newPoll, description: e.target.value })}
                placeholder={t("dashboard.votes.create.form.description.placeholder") || "Poll description (optional)"}
                className="min-h-[80px] rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.votes.create.form.type") || "Poll Type"}</Label>
              <RadioGroup
                value={newPoll.type}
                onValueChange={(value) => setNewPoll({ ...newPoll, type: value as "single" | "multiple" })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="edit-type-single" />
                  <Label htmlFor="edit-type-single" className="cursor-pointer">
                    {t("dashboard.votes.create.form.type.single") || "Single Choice"}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="multiple" id="edit-type-multiple" />
                  <Label htmlFor="edit-type-multiple" className="cursor-pointer">
                    {t("dashboard.votes.create.form.type.multiple") || "Multiple Choice"}
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label>{t("dashboard.votes.create.form.options") || "Options"} <span className="text-destructive">*</span></Label>
              <div className="space-y-2">
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`${t("dashboard.votes.create.form.options.placeholder") || "Option"} ${index + 1}`}
                      className="rounded-full"
                    />
                    {newPoll.options.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(index)}
                        className="rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="rounded-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t("dashboard.votes.create.form.options.add") || "Add Option"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-poll-end-date">{t("dashboard.votes.create.form.endDate") || "End Date (Optional)"}</Label>
              <Input
                id="edit-poll-end-date"
                type="datetime-local"
                value={newPoll.endDate}
                onChange={(e) => setNewPoll({ ...newPoll, endDate: e.target.value })}
                className="rounded-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(null);
                setEditingPoll(null);
                setNewPoll({
                  title: "",
                  description: "",
                  type: "single",
                  options: [""],
                  endDate: "",
                });
              }}
              className="rounded-full"
            >
              {t("dashboard.votes.create.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleUpdatePoll} className="rounded-full">
              {t("dashboard.votes.update.button") || "Update Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePollId !== null} onOpenChange={(open) => !open && setDeletePollId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.votes.delete.confirm.title") || "Delete Poll?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.votes.delete.confirm.description") || "Are you sure you want to delete this poll? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("dashboard.votes.delete.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePollId && handleDeletePoll(deletePollId)}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.votes.delete.confirm.button") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Link to Agenda Item Dialog */}
      <Dialog open={linkingPollId !== null} onOpenChange={(open) => {
        if (!open) {
          setLinkingPollId(null);
          setSelectedAgendaItemId("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("dashboard.votes.link.dialog.title") || "Link Poll to Agenda Item"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.votes.link.dialog.description") || "Connect this poll to a specific agenda item for meeting voting."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dashboard.votes.link.dialog.selectItem") || "Select Agenda Item"}</Label>
              <Select value={selectedAgendaItemId} onValueChange={setSelectedAgendaItemId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("dashboard.votes.link.dialog.selectPlaceholder") || "Choose an agenda item..."} />
                </SelectTrigger>
                <SelectContent>
                  {availableAgendaItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setLinkingPollId(null);
              setSelectedAgendaItemId("");
            }}>
              {t("dashboard.votes.link.cancel") || "Cancel"}
            </Button>
            <Button onClick={() => linkingPollId && handleLinkToAgendaItem(linkingPollId)}>
              {t("dashboard.votes.link.submit") || "Link Poll"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {polls.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.votes.active") || "Active Polls"}</CardTitle>
            <CardDescription>
              {t("dashboard.votes.description") || "Participate in association votes and polls"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("dashboard.votes.empty") || "No active polls at the moment."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = getTotalVotes(poll);
            const userVoted = hasUserVoted(poll);
            const userSelectedVotes = selectedVotes[poll.id] || (userVoted ? getUserVotesForPoll(poll) : []);
            const showPollResults = showResults[poll.id] || userVoted;

            return (
              <Card key={poll.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{poll.title}</CardTitle>
                      {poll.description && (
                        <CardDescription className="mt-2">{poll.description}</CardDescription>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>{totalVotes} {t("dashboard.votes.votes") || "votes"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Vote className="h-4 w-4" />
                          <span>
                            {poll.type === "single"
                              ? t("dashboard.votes.type.single") || "Single Choice"
                              : t("dashboard.votes.type.multiple") || "Multiple Choice"}
                          </span>
                        </div>
                        {((poll as any).endDate || (poll as any).end_date) && (
                          <div className="flex items-center gap-1">
                            <CheckSquare className="h-4 w-4" />
                            <span>
                              {t("dashboard.votes.ends") || "Ends"}: {format(new Date((poll as any).endDate || (poll as any).end_date), "PPp")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={(poll as any).createdByImage || (poll as any).created_by_image} alt={(poll as any).createdByName || (poll as any).created_by_name} />
                        <AvatarFallback className="text-xs">
                          {((poll as any).createdByName || (poll as any).created_by_name || "U")
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{(poll as any).createdByName || (poll as any).created_by_name}</span>
                      {isPollCreator(poll) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditPoll(poll)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t("dashboard.votes.edit.button") || "Edit Poll"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeletePollId(poll.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t("dashboard.votes.delete.button") || "Delete Poll"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {!showPollResults ? (
                    <div className="space-y-4">
                      {poll.type === "single" ? (
                        <RadioGroup
                          value={userSelectedVotes[0] || ""}
                          onValueChange={(value) => setSelectedVotes({ ...selectedVotes, [poll.id]: [value] })}
                        >
                          {poll.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.id} id={option.id} />
                              <Label htmlFor={option.id} className="cursor-pointer flex-1">
                                {option.text}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-3">
                          {poll.options.map((option) => (
                            <div key={option.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={option.id}
                                checked={userSelectedVotes.includes(option.id)}
                                onCheckedChange={(checked) => {
                                  const updated = checked
                                    ? [...userSelectedVotes, option.id]
                                    : userSelectedVotes.filter((id) => id !== option.id);
                                  setSelectedVotes({ ...selectedVotes, [poll.id]: updated });
                                }}
                              />
                              <Label htmlFor={option.id} className="cursor-pointer flex-1">
                                {option.text}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                      <Button
                        onClick={() => {
                          if (userSelectedVotes.length === 0) {
                            toast({
                              title: t("dashboard.votes.vote.error.title") || "No Selection",
                              description: t("dashboard.votes.vote.error.description") || "Please select at least one option.",
                              variant: "destructive",
                            });
                            return;
                          }
                          handleVote(poll.id, userSelectedVotes);
                        }}
                        className="rounded-full"
                      >
                        <Vote className="mr-2 h-4 w-4" />
                        {t("dashboard.votes.vote.button") || "Submit Vote"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-3">
                        {poll.options.map((option) => {
                          const voteCount = option.votes.length;
                          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
                          const isUserVote = option.votes.includes(user?.id || "");

                          return (
                            <div key={option.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{option.text}</span>
                                  {isUserVote && (
                                    <span className="text-xs text-primary font-medium">
                                      ({t("dashboard.votes.yourVote") || "Your vote"})
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {voteCount} ({percentage.toFixed(1)}%)
                                </span>
                              </div>
                              <Progress value={percentage} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BarChart3 className="h-4 w-4" />
                          <span>
                            {totalVotes} {totalVotes === 1 ? t("dashboard.votes.vote") || "vote" : t("dashboard.votes.votes") || "votes"}
                          </span>
                        </div>
                        {!userVoted && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowResults({ ...showResults, [poll.id]: false })}
                            className="rounded-full"
                          >
                            {t("dashboard.votes.changeVote") || "Change Vote"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VotesContent;
