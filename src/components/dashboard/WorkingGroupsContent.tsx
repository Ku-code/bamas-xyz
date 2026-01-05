import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatErrorForToast } from "@/lib/error-messages";
import {
  loadWorkingGroups,
  getUserWGMemberships,
  joinWorkingGroup,
  type WorkingGroup,
  type WGMember,
} from "@/lib/working-groups";
import { Briefcase, Users, UserPlus, Loader2 } from "lucide-react";
import WorkingGroupView from "./WorkingGroupView";

const WorkingGroupsContent = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [workingGroups, setWorkingGroups] = useState<WorkingGroup[]>([]);
  const [userMemberships, setUserMemberships] = useState<WGMember[]>([]);
  const [selectedWG, setSelectedWG] = useState<WorkingGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groups, memberships] = await Promise.all([
        loadWorkingGroups(),
        user ? getUserWGMemberships(user.id) : Promise.resolve([]),
      ]);
      setWorkingGroups(groups);
      setUserMemberships(memberships);
    } catch (error: any) {
      console.error("Error loading working groups:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.error.title") || "Error Loading Working Groups",
        t("dashboard.workinggroups.error.loadFailed") || "Failed to load working groups"
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

  const handleJoinWG = async (workingGroupId: string) => {
    if (!user) return;

    try {
      await joinWorkingGroup(workingGroupId, user.id);
      toast({
        title: t("dashboard.workinggroups.join.success.title") || "Joined Working Group",
        description: t("dashboard.workinggroups.join.success.description") || "You have successfully joined this working group.",
      });
      await loadData();
    } catch (error: any) {
      console.error("Error joining working group:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.workinggroups.join.error.title") || "Failed to Join",
        t("dashboard.workinggroups.join.error.description") || "Failed to join working group"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const isMember = (workingGroupId: string): boolean => {
    return userMemberships.some((m) => m.working_group_id === workingGroupId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (selectedWG) {
    return (
      <WorkingGroupView
        workingGroup={selectedWG}
        isMember={isMember(selectedWG.id)}
        onBack={() => setSelectedWG(null)}
        onJoin={() => handleJoinWG(selectedWG.id)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.workinggroups.title") || "Working Groups"}</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.workinggroups.overview.title") || "Available Working Groups"}</CardTitle>
          <CardDescription>
            {t("dashboard.workinggroups.overview.description") || "Select a working group to view its workspace and collaborate with members."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workingGroups.map((wg) => {
              const member = userMemberships.find((m) => m.working_group_id === wg.id);
              return (
                <Card key={wg.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedWG(wg)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{wg.name}</CardTitle>
                      {member && (
                        <Badge variant="secondary">
                          {member.role === 'lead' 
                            ? (t("dashboard.workinggroups.role.lead") || "Lead")
                            : (t("dashboard.workinggroups.role.member") || "Member")}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-3 mb-4">
                      {wg.description || wg.mission_statement || t("dashboard.workinggroups.noDescription") || "No description available."}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{t("dashboard.workinggroups.members") || "Members"}</span>
                      </div>
                      {!member && user && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinWG(wg.id);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t("dashboard.workinggroups.join") || "Join"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkingGroupsContent;

