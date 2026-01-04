import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logHistory } from "@/lib/history";
import { loadAgendaItems, createAgendaItem, updateAgendaItem, deleteAgendaItem, addComment, AgendaItem, Comment } from "@/lib/agenda";
import { formatErrorForToast } from "@/lib/error-messages";
import { Calendar, Plus, MessageSquare, Clock, User, Send, Edit, Trash2 } from "lucide-react";
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

const AgendaContent = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<string | null>(null);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState<string | null>(null);
  const [deleteAgendaId, setDeleteAgendaId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [newAgenda, setNewAgenda] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });
  const [editingAgenda, setEditingAgenda] = useState({
    id: "",
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
  });

  // Load agenda items from Supabase
  useEffect(() => {
    loadAgendaItemsFromDatabase();
  }, []);

  const loadAgendaItemsFromDatabase = async () => {
    try {
      const items = await loadAgendaItems();
      // Convert to component format
      const convertedItems: AgendaItem[] = items.map((item) => ({
        ...item,
        createdBy: item.created_by,
        createdByName: item.created_by_name,
        createdByImage: item.created_by_image,
        createdAt: item.created_at,
        comments: item.comments.map((c) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.user_name,
          userImage: c.user_image,
          text: c.text,
          createdAt: c.created_at,
        })),
      }));
      setAgendaItems(convertedItems);
    } catch (error) {
      console.error("Error loading agenda items:", error);
      toast({
        title: t("dashboard.agenda.error.title") || "Error",
        description: t("dashboard.agenda.error.loadFailed") || "Failed to load agenda items. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateAgenda = async () => {
    if (!newAgenda.title || !newAgenda.date || !newAgenda.time) {
      toast({
        title: t("dashboard.agenda.create.error.title") || "Validation Error",
        description: t("dashboard.agenda.create.error.description") || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.agenda.create.error.title") || "Error",
        description: t("dashboard.agenda.create.error.notLoggedIn") || "You must be logged in to create an agenda item.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newItem = await createAgendaItem({
        title: newAgenda.title,
        description: newAgenda.description,
        date: newAgenda.date,
        time: newAgenda.time,
        location: newAgenda.location || undefined,
        created_by: user.id,
        created_by_name: user.name,
        created_by_image: user.image,
      });

      // Log history
      if (user) {
        await logHistory("agenda_created", user, newItem.id, newItem.title);
      }

      toast({
        title: t("dashboard.agenda.create.success.title") || "Agenda Created",
        description: t("dashboard.agenda.create.success.description") || "Your agenda item has been created successfully!",
      });

      // Reset form
      setNewAgenda({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });
      setIsCreateDialogOpen(false);

      // Reload agenda items
      await loadAgendaItemsFromDatabase();
    } catch (error: any) {
      console.error("Error creating agenda item:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.agenda.create.error.title") || "Failed to Create Agenda",
        t("dashboard.agenda.create.error.description") || "Failed to create agenda item"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleEditAgenda = (item: AgendaItem) => {
    setEditingAgenda({
      id: item.id,
      title: item.title,
      description: item.description || "",
      date: item.date,
      time: item.time,
      location: item.location || "",
    });
    setIsEditDialogOpen(item.id);
  };

  const handleUpdateAgenda = async () => {
    if (!editingAgenda.title || !editingAgenda.date || !editingAgenda.time) {
      toast({
        title: t("dashboard.agenda.edit.error.title") || "Validation Error",
        description: t("dashboard.agenda.edit.error.description") || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.agenda.edit.error.title") || "Error",
        description: t("dashboard.agenda.edit.error.notLoggedIn") || "You must be logged in to edit an agenda item.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateAgendaItem(editingAgenda.id, {
        title: editingAgenda.title,
        description: editingAgenda.description,
        date: editingAgenda.date,
        time: editingAgenda.time,
        location: editingAgenda.location || undefined,
      });

      // Log history
      if (user) {
        await logHistory("agenda_updated", user, editingAgenda.id, editingAgenda.title);
      }

      toast({
        title: t("dashboard.agenda.edit.success.title") || "Agenda Updated",
        description: t("dashboard.agenda.edit.success.description") || "Your agenda item has been updated successfully!",
      });

      setIsEditDialogOpen(null);
      setEditingAgenda({
        id: "",
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
      });

      // Reload agenda items
      await loadAgendaItemsFromDatabase();
    } catch (error: any) {
      console.error("Error updating agenda item:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.agenda.edit.error.title") || "Failed to Update Agenda",
        t("dashboard.agenda.edit.error.description") || "Failed to update agenda item"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAgenda = async () => {
    if (!deleteAgendaId || !user) return;

    try {
      const agendaItem = agendaItems.find((item) => item.id === deleteAgendaId);
      if (!agendaItem) return;

      await deleteAgendaItem(deleteAgendaId);

      // Log history
      if (user) {
        await logHistory("agenda_deleted", user, deleteAgendaId, agendaItem.title);
      }

      toast({
        title: t("dashboard.agenda.delete.success.title") || "Agenda Deleted",
        description: t("dashboard.agenda.delete.success.description") || "Agenda item has been deleted successfully.",
      });

      setDeleteAgendaId(null);
      await loadAgendaItemsFromDatabase();
    } catch (error: any) {
      console.error("Error deleting agenda item:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.agenda.delete.error.title") || "Failed to Delete Agenda",
        t("dashboard.agenda.delete.error.description") || "Failed to delete agenda item"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleAddComment = async (agendaId: string) => {
    if (!commentText.trim()) {
      toast({
        title: t("dashboard.agenda.comment.error.title") || "Empty Comment",
        description: t("dashboard.agenda.comment.error.description") || "Please enter a comment.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: t("dashboard.agenda.comment.error.title") || "Error",
        description: t("dashboard.agenda.comment.error.notLoggedIn") || "You must be logged in to add a comment.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addComment(agendaId, {
        user_id: user.id,
        user_name: user.name,
        user_image: user.image,
        text: commentText.trim(),
      });

      // Log history
      const agendaItem = agendaItems.find((item) => item.id === agendaId);
      if (agendaItem && user) {
        await logHistory("agenda_commented", user, agendaId, agendaItem.title);
      }

      setCommentText("");
      setIsCommentDialogOpen(null);
      toast({
        title: t("dashboard.agenda.comment.success.title") || "Comment Added",
        description: t("dashboard.agenda.comment.success.description") || "Your comment has been added!",
      });

      // Reload agenda items
      await loadAgendaItemsFromDatabase();
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: t("dashboard.agenda.comment.error.title") || "Error",
        description: error.message || t("dashboard.agenda.comment.error.description") || "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    }
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
          <Calendar className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.agenda.title") || "Agenda & Meetings"}</h2>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.agenda.create.button") || "Create Agenda"}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t("dashboard.agenda.create.title") || "Create New Agenda Item"}</DialogTitle>
              <DialogDescription>
                {t("dashboard.agenda.create.description") || "Add a new agenda item or meeting to the schedule"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t("dashboard.agenda.create.form.title") || "Title"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={newAgenda.title}
                  onChange={(e) => setNewAgenda({ ...newAgenda, title: e.target.value })}
                  placeholder={t("dashboard.agenda.create.form.title.placeholder") || "Meeting title"}
                  className="rounded-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t("dashboard.agenda.create.form.description") || "Description"}</Label>
                <Textarea
                  id="description"
                  value={newAgenda.description}
                  onChange={(e) => setNewAgenda({ ...newAgenda, description: e.target.value })}
                  placeholder={t("dashboard.agenda.create.form.description.placeholder") || "Agenda description..."}
                  className="min-h-[100px] rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    {t("dashboard.agenda.create.form.date") || "Date"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={newAgenda.date}
                    onChange={(e) => setNewAgenda({ ...newAgenda, date: e.target.value })}
                    className="rounded-full"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">
                    {t("dashboard.agenda.create.form.time") || "Time"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={newAgenda.time}
                    onChange={(e) => setNewAgenda({ ...newAgenda, time: e.target.value })}
                    className="rounded-full"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t("dashboard.agenda.create.form.location") || "Location"}</Label>
                <Input
                  id="location"
                  value={newAgenda.location}
                  onChange={(e) => setNewAgenda({ ...newAgenda, location: e.target.value })}
                  placeholder={t("dashboard.agenda.create.form.location.placeholder") || "Meeting location"}
                  className="rounded-full"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="rounded-full">
                {t("dashboard.agenda.create.cancel") || "Cancel"}
              </Button>
              <Button onClick={handleCreateAgenda} className="rounded-full">
                {t("dashboard.agenda.create.submit") || "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {agendaItems.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.agenda.upcoming") || "Upcoming Meetings"}</CardTitle>
            <CardDescription>
              {t("dashboard.agenda.description") || "View and manage your meeting schedule"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t("dashboard.agenda.empty") || "No upcoming meetings scheduled."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agendaItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(item.date), "PPP")} at {item.time}
                          </span>
                        </div>
                        {item.location && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{item.location}</span>
                          </div>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.createdByImage} alt={item.createdByName} />
                      <AvatarFallback className="text-xs">
                        {item.createdByName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{item.createdByName}</span>
                  </div>
                  {(user?.id === item.created_by || isSuperAdmin) && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAgenda(item)}
                        className="rounded-full"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteAgendaId(item.id)}
                        className="rounded-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {item.description && (
                  <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                )}
                
                {item.comments.length > 0 && (
                  <div className="space-y-3 mb-4">
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">
                        {t("dashboard.agenda.comments") || "Comments"} ({item.comments.length})
                      </h4>
                      {item.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={comment.userImage} alt={comment.userName} />
                            <AvatarFallback className="text-xs">
                              {comment.userName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{comment.userName}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(comment.createdAt), "PPp")}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Dialog open={isCommentDialogOpen === item.id} onOpenChange={(open) => setIsCommentDialogOpen(open ? item.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {t("dashboard.agenda.comment.button") || "Add Comment"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("dashboard.agenda.comment.title") || "Add Comment"}</DialogTitle>
                      <DialogDescription>
                        {t("dashboard.agenda.comment.description") || "Share your thoughts about this agenda item"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="comment">{t("dashboard.agenda.comment.form.text") || "Comment"}</Label>
                        <Textarea
                          id="comment"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          placeholder={t("dashboard.agenda.comment.form.text.placeholder") || "Write your comment..."}
                          className="min-h-[100px] rounded-lg"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCommentDialogOpen(null)} className="rounded-full">
                        {t("dashboard.agenda.comment.cancel") || "Cancel"}
                      </Button>
                      <Button onClick={() => handleAddComment(item.id)} className="rounded-full">
                        <Send className="mr-2 h-4 w-4" />
                        {t("dashboard.agenda.comment.submit") || "Post Comment"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen !== null} onOpenChange={(open) => setIsEditDialogOpen(open ? editingAgenda.id : null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("dashboard.agenda.edit.title") || "Edit Agenda Item"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.agenda.edit.description") || "Update the agenda item details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">
                {t("dashboard.agenda.create.form.title") || "Title"} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit-title"
                value={editingAgenda.title}
                onChange={(e) => setEditingAgenda({ ...editingAgenda, title: e.target.value })}
                placeholder={t("dashboard.agenda.create.form.title.placeholder") || "Meeting title"}
                className="rounded-full"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">{t("dashboard.agenda.create.form.description") || "Description"}</Label>
              <Textarea
                id="edit-description"
                value={editingAgenda.description}
                onChange={(e) => setEditingAgenda({ ...editingAgenda, description: e.target.value })}
                placeholder={t("dashboard.agenda.create.form.description.placeholder") || "Agenda description..."}
                className="min-h-[100px] rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">
                  {t("dashboard.agenda.create.form.date") || "Date"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editingAgenda.date}
                  onChange={(e) => setEditingAgenda({ ...editingAgenda, date: e.target.value })}
                  className="rounded-full"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-time">
                  {t("dashboard.agenda.create.form.time") || "Time"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={editingAgenda.time}
                  onChange={(e) => setEditingAgenda({ ...editingAgenda, time: e.target.value })}
                  className="rounded-full"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">{t("dashboard.agenda.create.form.location") || "Location"}</Label>
              <Input
                id="edit-location"
                value={editingAgenda.location}
                onChange={(e) => setEditingAgenda({ ...editingAgenda, location: e.target.value })}
                placeholder={t("dashboard.agenda.create.form.location.placeholder") || "Meeting location"}
                className="rounded-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(null)} className="rounded-full">
              {t("dashboard.agenda.create.cancel") || "Cancel"}
            </Button>
            <Button onClick={handleUpdateAgenda} className="rounded-full">
              {t("dashboard.agenda.edit.submit") || "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAgendaId !== null} onOpenChange={(open) => !open && setDeleteAgendaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.agenda.delete.confirm.title") || "Delete Agenda Item?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.agenda.delete.confirm.description") || "This action cannot be undone. This will permanently delete the agenda item and all its comments."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t("dashboard.agenda.delete.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAgenda} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("dashboard.agenda.delete.confirm.button") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgendaContent;
