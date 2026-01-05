import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadWGTasks,
  createWGTask,
  updateWGTask,
  deleteWGTask,
  loadWGProjects,
  loadWGMembers,
  type WGTaskWithAssignee,
  type WGProject,
  type WGMemberWithUser,
} from "@/lib/working-groups";
import { Plus, Edit, Trash2, Calendar, User, Loader2 } from "lucide-react";
import type { WGPermissions } from "@/lib/wg-permissions";

interface KanbanBoardProps {
  workingGroupId: string;
  permissions: WGPermissions;
}

const KanbanBoard = ({ workingGroupId, permissions }: KanbanBoardProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<WGTaskWithAssignee[]>([]);
  const [projects, setProjects] = useState<WGProject[]>([]);
  const [members, setMembers] = useState<WGMemberWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<WGTaskWithAssignee | null>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    status: "todo" as "todo" | "in_progress" | "review" | "done",
    priority: "medium" as "low" | "medium" | "high",
    project_id: "",
    assigned_to: "",
    due_date: "",
  });

  useEffect(() => {
    loadData();
  }, [workingGroupId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [tasksData, projectsData, membersData] = await Promise.all([
        loadWGTasks(workingGroupId),
        loadWGProjects(workingGroupId),
        loadWGMembers(workingGroupId),
      ]);
      setTasks(tasksData);
      setProjects(projectsData);
      setMembers(membersData);
    } catch (error: any) {
      console.error("Error loading tasks:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.tasks.error.title") || "Error Loading Tasks",
        t("dashboard.workinggroups.tasks.error.loadFailed") || "Failed to load tasks"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!user || !taskForm.title.trim()) return;

    try {
      await createWGTask({
        working_group_id: workingGroupId,
        title: taskForm.title,
        description: taskForm.description || null,
        status: taskForm.status,
        priority: taskForm.priority,
        project_id: taskForm.project_id || null,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date || null,
        created_by: user.id,
        position: 0,
      });
      toast({
        title: t("dashboard.workinggroups.tasks.create.success.title") || "Task Created",
        description: t("dashboard.workinggroups.tasks.create.success.description") || "Task has been created successfully.",
      });
      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Error creating task:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.tasks.create.error.title") || "Failed to Create Task",
        t("dashboard.workinggroups.tasks.create.error.description") || "Failed to create task"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<WGTaskWithAssignee>) => {
    try {
      await updateWGTask(taskId, updates);
      await loadData();
    } catch (error: any) {
      console.error("Error updating task:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.tasks.update.error.title") || "Failed to Update Task",
        t("dashboard.workinggroups.tasks.update.error.description") || "Failed to update task"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t("dashboard.workinggroups.tasks.delete.confirm") || "Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await deleteWGTask(taskId);
      toast({
        title: t("dashboard.workinggroups.tasks.delete.success.title") || "Task Deleted",
        description: t("dashboard.workinggroups.tasks.delete.success.description") || "Task has been deleted successfully.",
      });
      await loadData();
    } catch (error: any) {
      console.error("Error deleting task:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.tasks.delete.error.title") || "Failed to Delete Task",
        t("dashboard.workinggroups.tasks.delete.error.description") || "Failed to delete task"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setTaskForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      project_id: "",
      assigned_to: "",
      due_date: "",
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: WGTaskWithAssignee) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      project_id: task.project_id || "",
      assigned_to: task.assigned_to || "",
      due_date: task.due_date || "",
    });
    setIsDialogOpen(true);
  };

  const handleUpdateTaskForm = async () => {
    if (!editingTask || !taskForm.title.trim()) return;

    try {
      await updateWGTask(editingTask.id, {
        title: taskForm.title,
        description: taskForm.description || null,
        status: taskForm.status,
        priority: taskForm.priority,
        project_id: taskForm.project_id || null,
        assigned_to: taskForm.assigned_to || null,
        due_date: taskForm.due_date || null,
      });
      toast({
        title: t("dashboard.workinggroups.tasks.update.success.title") || "Task Updated",
        description: t("dashboard.workinggroups.tasks.update.success.description") || "Task has been updated successfully.",
      });
      setIsDialogOpen(false);
      resetForm();
      await loadData();
    } catch (error: any) {
      console.error("Error updating task:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.tasks.update.error.title") || "Failed to Update Task",
        t("dashboard.workinggroups.tasks.update.error.description") || "Failed to update task"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const columns = [
    { id: "todo", label: t("dashboard.workinggroups.tasks.status.todo") || "To Do" },
    { id: "in_progress", label: t("dashboard.workinggroups.tasks.status.inProgress") || "In Progress" },
    { id: "review", label: t("dashboard.workinggroups.tasks.status.review") || "Review" },
    { id: "done", label: t("dashboard.workinggroups.tasks.status.done") || "Done" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("dashboard.workinggroups.tasks.title") || "Tasks"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.workinggroups.tasks.description") || "Manage and track tasks for this working group"}
          </p>
        </div>
        {permissions.canManageTasks && (
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t("dashboard.workinggroups.tasks.create") || "Create Task"}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          return (
            <Card key={column.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  {column.label} ({columnTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <ScrollArea className="h-[calc(100vh-300px)]">
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => openEditDialog(task)}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            {permissions.canManageTasks && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(task.id);
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            {task.assigned_user && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span>{task.assigned_user.name}</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(task.due_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="text-center text-sm text-muted-foreground py-8">
                        {t("dashboard.workinggroups.tasks.empty") || "No tasks"}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create/Edit Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTask
                ? t("dashboard.workinggroups.tasks.edit.title") || "Edit Task"
                : t("dashboard.workinggroups.tasks.create.title") || "Create Task"}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? t("dashboard.workinggroups.tasks.edit.description") || "Update task details"
                : t("dashboard.workinggroups.tasks.create.description") || "Create a new task for this working group"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">{t("dashboard.workinggroups.tasks.form.title") || "Title"} *</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder={t("dashboard.workinggroups.tasks.form.titlePlaceholder") || "Task title"}
              />
            </div>
            <div>
              <Label htmlFor="description">{t("dashboard.workinggroups.tasks.form.description") || "Description"}</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                placeholder={t("dashboard.workinggroups.tasks.form.descriptionPlaceholder") || "Task description"}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">{t("dashboard.workinggroups.tasks.form.status") || "Status"}</Label>
                <Select
                  value={taskForm.status}
                  onValueChange={(value: any) => setTaskForm({ ...taskForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">{t("dashboard.workinggroups.tasks.status.todo") || "To Do"}</SelectItem>
                    <SelectItem value="in_progress">{t("dashboard.workinggroups.tasks.status.inProgress") || "In Progress"}</SelectItem>
                    <SelectItem value="review">{t("dashboard.workinggroups.tasks.status.review") || "Review"}</SelectItem>
                    <SelectItem value="done">{t("dashboard.workinggroups.tasks.status.done") || "Done"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">{t("dashboard.workinggroups.tasks.form.priority") || "Priority"}</Label>
                <Select
                  value={taskForm.priority}
                  onValueChange={(value: any) => setTaskForm({ ...taskForm, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t("dashboard.workinggroups.tasks.form.priority.low") || "Low"}</SelectItem>
                    <SelectItem value="medium">{t("dashboard.workinggroups.tasks.form.priority.medium") || "Medium"}</SelectItem>
                    <SelectItem value="high">{t("dashboard.workinggroups.tasks.form.priority.high") || "High"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="project">{t("dashboard.workinggroups.tasks.form.project") || "Project"}</Label>
                <Select
                  value={taskForm.project_id}
                  onValueChange={(value) => setTaskForm({ ...taskForm, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.workinggroups.tasks.form.projectPlaceholder") || "Select project (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("dashboard.workinggroups.tasks.form.noProject") || "No Project"}</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="assigned_to">{t("dashboard.workinggroups.tasks.form.assignee") || "Assignee"}</Label>
                <Select
                  value={taskForm.assigned_to}
                  onValueChange={(value) => setTaskForm({ ...taskForm, assigned_to: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("dashboard.workinggroups.tasks.form.assigneePlaceholder") || "Select assignee (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("dashboard.workinggroups.tasks.form.unassigned") || "Unassigned"}</SelectItem>
                    {members.map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.user?.name || "Unknown"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="due_date">{t("dashboard.workinggroups.tasks.form.dueDate") || "Due Date"}</Label>
              <Input
                id="due_date"
                type="date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
              {t("dashboard.workinggroups.tasks.form.cancel") || "Cancel"}
            </Button>
            <Button onClick={editingTask ? handleUpdateTaskForm : handleCreateTask}>
              {editingTask
                ? t("dashboard.workinggroups.tasks.form.update") || "Update"
                : t("dashboard.workinggroups.tasks.form.create") || "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KanbanBoard;

