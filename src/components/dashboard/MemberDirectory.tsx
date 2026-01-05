import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail, Phone, Globe, User, Search } from "lucide-react";
import type { WGMemberWithUser } from "@/lib/working-groups";
import type { WGPermissions } from "@/lib/wg-permissions";

interface MemberDirectoryProps {
  workingGroupId: string;
  members: WGMemberWithUser[];
  permissions: WGPermissions;
  onMembersUpdated: () => void;
}

const MemberDirectory = ({ members, permissions }: MemberDirectoryProps) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.user?.name?.toLowerCase().includes(query) ||
      member.user?.email?.toLowerCase().includes(query) ||
      member.specialization?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t("dashboard.workinggroups.members.title") || "Members"}</h3>
          <p className="text-sm text-muted-foreground">
            {t("dashboard.workinggroups.members.description") || "View and connect with working group members"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("dashboard.workinggroups.members.search") || "Search members by name, email, or specialization..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery
                  ? t("dashboard.workinggroups.members.noResults") || "No members found matching your search."
                  : t("dashboard.workinggroups.members.empty") || "No members yet."}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredMembers.map((member) => (
            <Card key={member.id}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.user?.image || undefined} />
                        <AvatarFallback>
                          {member.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{member.user?.email || ""}</p>
                      </div>
                    </div>
                    <Badge variant={member.role === 'lead' ? 'default' : 'secondary'}>
                      {member.role === 'lead'
                        ? t("dashboard.workinggroups.role.lead") || "Lead"
                        : t("dashboard.workinggroups.role.member") || "Member"}
                    </Badge>
                  </div>

                  {member.specialization && (
                    <div>
                      <p className="text-sm font-medium mb-1">
                        {t("dashboard.workinggroups.members.specialization") || "Specialization"}
                      </p>
                      <Badge variant="outline">{member.specialization}</Badge>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>
                      {t("dashboard.workinggroups.members.joined") || "Joined"}{" "}
                      {new Date(member.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MemberDirectory;

