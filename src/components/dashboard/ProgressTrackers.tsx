import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { loadWGProjects, loadWGTasks, type WGProject, type WGTask } from "@/lib/working-groups";
import { Loader2 } from "lucide-react";

interface ProgressTrackersProps {
  workingGroupId: string;
}

const ProgressTrackers = ({ workingGroupId }: ProgressTrackersProps) => {
  const { t } = useLanguage();
  const [projects, setProjects] = useState<WGProject[]>([]);
  const [tasks, setTasks] = useState<WGTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [workingGroupId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projectsData, tasksData] = await Promise.all([
        loadWGProjects(workingGroupId),
        loadWGTasks(workingGroupId),
      ]);
      setProjects(projectsData);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const completedProjects = projects.filter((p) => p.status === 'completed').length;
  const totalProjects = projects.length;
  const projectProgress = totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0;

  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const taskProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length;
  const planningProjects = projects.filter((p) => p.status === 'planning').length;
  const onHoldProjects = projects.filter((p) => p.status === 'on_hold').length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projects Progress */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.workinggroups.progress.projects") || "Projects"}</CardTitle>
            <CardDescription>
              {completedProjects} / {totalProjects} {t("dashboard.workinggroups.progress.completed") || "completed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={projectProgress} className="mb-4" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.inProgress") || "In Progress"}:</span>
                <span className="ml-2 font-medium">{inProgressProjects}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.planning") || "Planning"}:</span>
                <span className="ml-2 font-medium">{planningProjects}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.completed") || "Completed"}:</span>
                <span className="ml-2 font-medium">{completedProjects}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.onHold") || "On Hold"}:</span>
                <span className="ml-2 font-medium">{onHoldProjects}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Progress */}
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.workinggroups.progress.tasks") || "Tasks"}</CardTitle>
            <CardDescription>
              {completedTasks} / {totalTasks} {t("dashboard.workinggroups.progress.completed") || "completed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={taskProgress} className="mb-4" />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.todo") || "To Do"}:</span>
                <span className="ml-2 font-medium">{tasks.filter((t) => t.status === 'todo').length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.inProgress") || "In Progress"}:</span>
                <span className="ml-2 font-medium">{tasks.filter((t) => t.status === 'in_progress').length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.review") || "Review"}:</span>
                <span className="ml-2 font-medium">{tasks.filter((t) => t.status === 'review').length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">{t("dashboard.workinggroups.progress.done") || "Done"}:</span>
                <span className="ml-2 font-medium">{completedTasks}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.workinggroups.progress.recentProjects") || "Recent Projects"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <div key={project.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      project.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      project.status === 'on_hold' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProgressTrackers;

