import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Users, Briefcase } from "lucide-react";
import { loadWGMembers, type WGMemberWithUser, type WorkingGroup } from "@/lib/working-groups";
import { useWorkingGroupPermissions } from "@/lib/wg-permissions";
import ProgressTrackers from "./ProgressTrackers";
import KanbanBoard from "./KanbanBoard";
import CollaborationFeed from "./CollaborationFeed";
import WGResourceLibrary from "./WGResourceLibrary";
import MemberDirectory from "./MemberDirectory";

interface WorkingGroupViewProps {
  workingGroup: WorkingGroup;
  isMember: boolean;
  onBack: () => void;
  onJoin: () => void;
}

const WorkingGroupView = ({ workingGroup, isMember, onBack, onJoin }: WorkingGroupViewProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [members, setMembers] = useState<WGMemberWithUser[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const permissions = useWorkingGroupPermissions(workingGroup.id, workingGroup.lead_user_id);

  useEffect(() => {
    loadMembers();
  }, [workingGroup.id]);

  const loadMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const membersData = await loadWGMembers(workingGroup.id);
      setMembers(membersData);
    } catch (error) {
      console.error("Error loading members:", error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const leadMember = members.find((m) => m.user_id === workingGroup.lead_user_id || m.role === 'lead');
  const memberCount = members.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("dashboard.workinggroups.back") || "Back"}
          </Button>
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{workingGroup.name}</h2>
          </div>
        </div>
        {!isMember && user && (
          <Button onClick={onJoin}>
            {t("dashboard.workinggroups.join") || "Join Working Group"}
          </Button>
        )}
      </div>

      {/* Mission Statement Card */}
      {workingGroup.mission_statement && (
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.workinggroups.mission.title") || "Mission Statement"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{workingGroup.mission_statement}</p>
          </CardContent>
        </Card>
      )}

      {/* WG Info Bar */}
      <div className="flex items-center gap-4 text-sm">
        {leadMember && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{t("dashboard.workinggroups.lead") || "Lead"}:</span>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={leadMember.user?.image || undefined} />
                <AvatarFallback className="text-xs">
                  {leadMember.user?.name?.charAt(0) || "L"}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{leadMember.user?.name || "Unknown"}</span>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {memberCount} {t("dashboard.workinggroups.members") || "members"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      {isMember || permissions.isAdmin ? (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              {t("dashboard.workinggroups.tabs.overview") || "Overview"}
            </TabsTrigger>
            <TabsTrigger value="projects">
              {t("dashboard.workinggroups.tabs.projects") || "Projects"}
            </TabsTrigger>
            <TabsTrigger value="feed">
              {t("dashboard.workinggroups.tabs.feed") || "Feed"}
            </TabsTrigger>
            <TabsTrigger value="resources">
              {t("dashboard.workinggroups.tabs.resources") || "Resources"}
            </TabsTrigger>
            <TabsTrigger value="members">
              {t("dashboard.workinggroups.tabs.members") || "Members"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            <ProgressTrackers workingGroupId={workingGroup.id} />
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <KanbanBoard workingGroupId={workingGroup.id} permissions={permissions} />
          </TabsContent>

          <TabsContent value="feed" className="mt-4">
            <CollaborationFeed workingGroupId={workingGroup.id} permissions={permissions} />
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            <WGResourceLibrary workingGroupId={workingGroup.id} permissions={permissions} />
          </TabsContent>

          <TabsContent value="members" className="mt-4">
            <MemberDirectory workingGroupId={workingGroup.id} members={members} permissions={permissions} onMembersUpdated={loadMembers} />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                {t("dashboard.workinggroups.joinRequired") || "You must join this working group to access its content."}
              </p>
              <Button onClick={onJoin}>
                {t("dashboard.workinggroups.join") || "Join Working Group"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkingGroupView;

