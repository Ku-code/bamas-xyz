import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, User, UserRole } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { logHistory } from "@/lib/history";
import { db } from "@/lib/database";
import { suspendMember, restoreMember, banMember, deleteMember } from "@/lib/members";
import { formatErrorForToast } from "@/lib/error-messages";
import { Users, Plus, Check, X, Mail, Phone, MapPin, Globe, UserCheck, UserX, Clock, Ban, Trash2, RotateCcw, Network, List, Box, Building2 } from "lucide-react";
import { format } from "date-fns";
import { loadCompanies, type Company } from "@/lib/companies";
import { NetworkGraph } from "./NetworkGraph";
import { NetworkGraph3D } from "./NetworkGraph3D";
import { detectDeviceCapability } from "./networkTypes";
import { Network3DErrorBoundary } from "./network3d/ErrorBoundary";

const NetworkContent = () => {
  const { t } = useLanguage();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [rejectMemberId, setRejectMemberId] = useState<string | null>(null);
  const [suspendMemberId, setSuspendMemberId] = useState<string | null>(null);
  const [banMemberId, setBanMemberId] = useState<string | null>(null);
  const [deleteMemberId, setDeleteMemberId] = useState<string | null>(null);
  const [restoreMemberId, setRestoreMemberId] = useState<string | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [activeTab, setActiveTab] = useState<"graph" | "3d" | "list">("graph");
  const [deviceCapability] = useState(() => detectDeviceCapability());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);

  // Available technology filters
  const TECHNOLOGY_FILTERS = [
    "FDM", "SLA", "SLS", "SLM", "EBM", "MJF", "PolyJet", "DED", "Binder Jetting", "Material Jetting", "Metal"
  ];

  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    role: "member" as UserRole,
  });

  // Load members and companies from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadMembers(), loadCompaniesData()]);
  };

  const loadMembers = async () => {
    try {
      const dbUsers = await db.fetchAll('users');
      // Convert database users to our User type
      const convertedUsers: User[] = dbUsers.map((dbUser: any) => ({
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.image || undefined,
        provider: dbUser.provider || undefined,
        bio: dbUser.bio || undefined,
        hashtags: dbUser.hashtags || undefined,
        location: dbUser.location || undefined,
        website: dbUser.website || undefined,
        phone: dbUser.phone || undefined,
        role: dbUser.role || 'member',
        status: dbUser.status || 'pending',
        createdAt: dbUser.created_at,
        approvedAt: dbUser.approved_at || undefined,
        approvedBy: dbUser.approved_by || undefined,
        // Filter out soft-deleted members (deleted_at is not null)
        // We'll show them in a separate view if needed later
      })).filter((u: User) => !(dbUsers.find((db: any) => db.id === u.id)?.deleted_at));
      setMembers(convertedUsers);
    } catch (error) {
      console.error("Error loading members:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.error.title") || "Error Loading Members",
        t("dashboard.network.error.loadFailed") || "Failed to load members"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const loadCompaniesData = async () => {
    try {
      const companiesData = await loadCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error loading companies:", error);
      // Don't show error toast for companies - it's not critical
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name.trim() || !newMember.email.trim()) {
      toast({
        title: t("dashboard.network.add.error.title") || "Validation Error",
        description: t("dashboard.network.add.error.required") || "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if email already exists
    const emailExists = members.some(m => m.email.toLowerCase() === newMember.email.toLowerCase());
    if (emailExists) {
      toast({
        title: t("dashboard.network.add.error.title") || "Validation Error",
        description: t("dashboard.network.add.error.emailExists") || "A member with this email already exists.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a temporary ID for the new user
      // Note: In a real app, you might want to create a Supabase Auth user first
      const tempId = `member_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const newUser = await db.insert('users', {
        id: tempId,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        phone: newMember.phone.trim() || null,
        role: newMember.role,
        status: 'approved',
        provider: null,
        bio: null,
        hashtags: null,
        location: null,
        website: null,
        image: null,
        approved_at: new Date().toISOString(),
        approved_by: user?.id || null,
      });

      // Log history
      if (user) {
        await logHistory(
          "member_added",
          user,
          newUser.id,
          newUser.name,
          { role: newUser.role }
        );
      }

      toast({
        title: t("dashboard.network.add.success.title") || "Member Added",
        description: t("dashboard.network.add.success.description") || "Member has been added successfully!",
      });

      // Reload members
      await loadMembers();

      // Reset form
      setNewMember({
        name: "",
        email: "",
        phone: "",
        role: "member",
      });
      setIsAddDialogOpen(false);
    } catch (error: any) {
      console.error("Error adding member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.add.error.title") || "Failed to Add Member",
        t("dashboard.network.add.error.description") || "Failed to add member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleApproveMember = async (memberId: string) => {
    try {
      const approvedMember = members.find(m => m.id === memberId);
      if (!approvedMember) return;

      await db.update('users', memberId, {
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user?.id || null,
      });

      if (user) {
        await logHistory(
          "member_approved",
          user,
          memberId,
          approvedMember.name
        );
      }

      toast({
        title: t("dashboard.network.approve.success.title") || "Member Approved",
        description: t("dashboard.network.approve.success.description") || "Member has been approved successfully!",
      });

      await loadMembers();
    } catch (error: any) {
      console.error("Error approving member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.approve.error.title") || "Approval Failed",
        t("dashboard.network.approve.error.description") || "Failed to approve member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleRejectMember = async (memberId: string) => {
    try {
      const rejectedMember = members.find(m => m.id === memberId);
      if (!rejectedMember) return;

      await db.update('users', memberId, {
        status: 'rejected',
      });

      setRejectMemberId(null);

      if (user) {
        await logHistory(
          "member_rejected",
          user,
          memberId,
          rejectedMember.name
        );
      }

      toast({
        title: t("dashboard.network.reject.success.title") || "Member Rejected",
        description: t("dashboard.network.reject.success.description") || "Member request has been rejected.",
      });

      await loadMembers();
    } catch (error: any) {
      console.error("Error rejecting member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.reject.error.title") || "Rejection Failed",
        t("dashboard.network.reject.error.description") || "Failed to reject member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: UserRole) => {
    // Prevent changing superadmin role
    const member = members.find(m => m.id === memberId);
    if (member?.role === 'superadmin' && !isSuperAdmin) {
      toast({
        title: t("dashboard.network.role.error.title") || "Permission Denied",
        description: t("dashboard.network.role.error.superadmin") || "You cannot change superadmin role.",
        variant: "destructive",
      });
      return;
    }

    try {
      await db.update('users', memberId, {
        role: newRole,
      });

      const updatedMember = members.find(m => m.id === memberId);
      if (updatedMember && user) {
        await logHistory(
          "member_role_changed",
          user,
          memberId,
          updatedMember.name,
          { oldRole: updatedMember.role, newRole }
        );
      }

      toast({
        title: t("dashboard.network.role.success.title") || "Role Updated",
        description: t("dashboard.network.role.success.description") || "Member role has been updated successfully!",
      });

      await loadMembers();
    } catch (error: any) {
      console.error("Error updating member role:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.role.error.title") || "Role Update Failed",
        t("dashboard.network.role.error.description") || "Failed to update role"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  // Filter members by search query and selected technologies
  const filterMembersBySearch = (membersList: User[]) => {
    return membersList.filter(member => {
      // Get companies for this member
      const userCompanies = companies.filter(c => c.created_by === member.id);

      // Technology filter
      if (selectedTechnologies.length > 0) {
        const memberHasTech = userCompanies.some(company =>
          company.technologies?.some(tech =>
            selectedTechnologies.some(filter =>
              tech.toLowerCase().includes(filter.toLowerCase())
            )
          )
        );
        if (!memberHasTech) return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();

      // Search by member name
      const nameMatch = member.name.toLowerCase().includes(query);

      // Search by member email
      const emailMatch = member.email.toLowerCase().includes(query);

      // Search by company name
      const companyMatch = userCompanies.some(company =>
        company.name.toLowerCase().includes(query) ||
        company.activity_description?.toLowerCase().includes(query) ||
        company.technologies?.some(tech => tech.toLowerCase().includes(query))
      );

      return nameMatch || emailMatch || companyMatch;
    });
  };

  // Toggle technology filter
  const toggleTechnologyFilter = (tech: string) => {
    setSelectedTechnologies(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedTechnologies([]);
  };

  const pendingMembers = filterMembersBySearch(members.filter(m => m.status === 'pending'));
  const approvedMembers = filterMembersBySearch(members.filter(m => m.status === 'approved'));
  const rejectedMembers = filterMembersBySearch(members.filter(m => m.status === 'rejected'));
  const suspendedMembers = filterMembersBySearch(members.filter(m => m.status === 'suspended'));

  const getRoleBadgeVariant = (role?: UserRole) => {
    switch (role) {
      case 'superadmin':
        return 'destructive';
      case 'admin':
      case 'board_member':
      case 'wg_lead':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'approved':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const handleSuspendMember = async () => {
    if (!suspendMemberId || !user || !actionReason.trim()) {
      toast({
        title: t("dashboard.network.suspend.error.title") || "Error",
        description: t("dashboard.network.suspend.error.reasonRequired") || "Please provide a reason for suspension.",
        variant: "destructive",
      });
      return;
    }

    try {
      await suspendMember(suspendMemberId, actionReason.trim(), user);
      toast({
        title: t("dashboard.network.suspend.success.title") || "Member Suspended",
        description: t("dashboard.network.suspend.success.description") || "Member has been suspended successfully.",
      });
      setSuspendMemberId(null);
      setActionReason("");
      await loadMembers();
    } catch (error: any) {
      console.error("Error suspending member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.suspend.error.title") || "Suspension Failed",
        t("dashboard.network.suspend.error.description") || "Failed to suspend member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleRestoreMember = async () => {
    if (!restoreMemberId || !user) return;

    try {
      await restoreMember(restoreMemberId, user);
      toast({
        title: t("dashboard.network.restore.success.title") || "Member Restored",
        description: t("dashboard.network.restore.success.description") || "Member has been restored successfully.",
      });
      setRestoreMemberId(null);
      await loadMembers();
    } catch (error: any) {
      console.error("Error restoring member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.restore.error.title") || "Restoration Failed",
        t("dashboard.network.restore.error.description") || "Failed to restore member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleBanMember = async () => {
    if (!banMemberId || !user || !actionReason.trim()) {
      toast({
        title: t("dashboard.network.ban.error.title") || "Error",
        description: t("dashboard.network.ban.error.reasonRequired") || "Please provide a reason for ban.",
        variant: "destructive",
      });
      return;
    }

    try {
      await banMember(banMemberId, actionReason.trim(), user);
      toast({
        title: t("dashboard.network.ban.success.title") || "Member Banned",
        description: t("dashboard.network.ban.success.description") || "Member has been banned successfully.",
      });
      setBanMemberId(null);
      setActionReason("");
      await loadMembers();
    } catch (error: any) {
      console.error("Error banning member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.ban.error.title") || "Ban Failed",
        t("dashboard.network.ban.error.description") || "Failed to ban member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteMemberId || !user || !actionReason.trim()) {
      toast({
        title: t("dashboard.network.delete.error.title") || "Error",
        description: t("dashboard.network.delete.error.reasonRequired") || "Please provide a reason for deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteMember(deleteMemberId, actionReason.trim(), user);
      toast({
        title: t("dashboard.network.delete.success.title") || "Member Deleted",
        description: t("dashboard.network.delete.success.description") || "Member has been deleted successfully.",
      });
      setDeleteMemberId(null);
      setActionReason("");
      await loadMembers();
    } catch (error: any) {
      console.error("Error deleting member:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.network.delete.error.title") || "Deletion Failed",
        t("dashboard.network.delete.error.description") || "Failed to delete member"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.network.title") || "Network"}</h2>
          <Badge variant="secondary" className="ml-2">{approvedMembers.length} {t("dashboard.network.label.members") || "members"}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="rounded-full"
            title={t("dashboard.network.reload") || "Reload network data"}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {t("dashboard.network.add.button") || "Add Member"}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>{t("dashboard.network.add.title") || "Add New Member"}</DialogTitle>
                  <DialogDescription>
                    {t("dashboard.network.add.description") || "Add a new member to the network"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-name">
                      {t("dashboard.network.add.form.name") || "Full Name"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="member-name"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder={t("dashboard.network.add.form.name.placeholder") || "Enter full name"}
                      className="rounded-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-email">
                      {t("dashboard.network.add.form.email") || "Email"} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="member-email"
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder={t("dashboard.network.add.form.email.placeholder") || "Enter email address"}
                      className="rounded-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-phone">{t("dashboard.network.add.form.phone") || "Phone"}</Label>
                    <Input
                      id="member-phone"
                      type="tel"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder={t("dashboard.network.add.form.phone.placeholder") || "Enter phone number (optional)"}
                      className="rounded-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="member-role">{t("dashboard.network.add.form.role") || "Role"}</Label>
                    <Select value={newMember.role} onValueChange={(value) => setNewMember({ ...newMember, role: value as UserRole })}>
                      <SelectTrigger className="rounded-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">{t("dashboard.network.role.member") || "Member"}</SelectItem>
                        {isSuperAdmin && <SelectItem value="admin">{t("dashboard.network.role.admin") || "Admin"}</SelectItem>}
                        {isSuperAdmin && <SelectItem value="board_member">{t("dashboard.network.role.board_member") || "Board Member"}</SelectItem>}
                        {isSuperAdmin && <SelectItem value="wg_lead">{t("dashboard.network.role.wg_lead") || "WG Lead"}</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="rounded-full">
                    {t("dashboard.network.add.cancel") || "Cancel"}
                  </Button>
                  <Button onClick={handleAddMember} className="rounded-full">
                    {t("dashboard.network.add.submit") || "Add Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Main View Tabs - Graph, 3D, or List */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "graph" | "3d" | "list")} className="space-y-4">
        <TabsList className="rounded-full">
          <TabsTrigger value="graph" className="rounded-full">
            <Network className="h-4 w-4 mr-2" />
            {t("dashboard.network.view.graph")}
          </TabsTrigger>
          {deviceCapability.canHandle3D && (
            <TabsTrigger value="3d" className="rounded-full">
              <Box className="h-4 w-4 mr-2" />
              {t("dashboard.network.view.3d")}
            </TabsTrigger>
          )}
          <TabsTrigger value="list" className="rounded-full">
            <List className="h-4 w-4 mr-2" />
            {t("dashboard.network.view.list")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="graph" className="space-y-4">
          {/* Search Bar for Graph View */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder={t("dashboard.network.search.placeholder") || "Search by name, email, company, or technology..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-full pl-10"
                  />
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {(searchQuery || selectedTechnologies.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Technology Filter Chips */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("dashboard.network.filter.technologies") || "Filter by Technology"}</Label>
                <div className="flex flex-wrap gap-2">
                  {TECHNOLOGY_FILTERS.map(tech => (
                    <Badge
                      key={tech}
                      variant={selectedTechnologies.includes(tech) ? "default" : "outline"}
                      className="cursor-pointer rounded-full transition-colors hover:bg-primary/20"
                      onClick={() => toggleTechnologyFilter(tech)}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {(searchQuery || selectedTechnologies.length > 0) && (
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.network.search.showing") || "Showing"} {approvedMembers.length} {t("dashboard.network.search.results_of") || "of"} {members.filter(m => m.status === 'approved').length} {t("dashboard.network.search.members") || "members"}
                  {selectedTechnologies.length > 0 && (
                    <span className="ml-2">
                      ({t("dashboard.network.filter.filtered") || "filtered by"}: {selectedTechnologies.join(", ")})
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.network.graph.title")}</CardTitle>
              <CardDescription>
                {t("dashboard.network.graph.description")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full h-[700px] rounded-lg overflow-hidden relative" id="network-graph-container">
                <NetworkGraph
                  members={approvedMembers}
                  companies={companies}
                  width={typeof window !== 'undefined' ? Math.max(800, window.innerWidth - 300) : 1200}
                  height={700}
                />
                <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 text-xs text-white border border-slate-700 max-w-xs">
                  <div className="font-bold mb-2">💡 Tips</div>
                  <ul className="space-y-1 text-slate-300">
                    <li>• Hover over nodes to highlight connections</li>
                    <li>• Click and drag nodes to rearrange</li>
                    <li>• Scroll to zoom in/out</li>
                    <li>• BAMAS core is fixed in center</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {deviceCapability.canHandle3D && (
          <TabsContent value="3d" className="space-y-4">
            {/* Search Bar for 3D View */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder={t("dashboard.network.search.placeholder") || "Search by name, email, company, or technology..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-full pl-10"
                    />
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {(searchQuery || selectedTechnologies.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="rounded-full"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Technology Filter Chips */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">{t("dashboard.network.filter.technologies") || "Filter by Technology"}</Label>
                  <div className="flex flex-wrap gap-2">
                    {TECHNOLOGY_FILTERS.map(tech => (
                      <Badge
                        key={tech}
                        variant={selectedTechnologies.includes(tech) ? "default" : "outline"}
                        className="cursor-pointer rounded-full transition-colors hover:bg-primary/20"
                        onClick={() => toggleTechnologyFilter(tech)}
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {(searchQuery || selectedTechnologies.length > 0) && (
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.network.search.showing") || "Showing"} {approvedMembers.length} {t("dashboard.network.search.results_of") || "of"} {members.filter(m => m.status === 'approved').length} {t("dashboard.network.search.members") || "members"}
                    {selectedTechnologies.length > 0 && (
                      <span className="ml-2">
                        ({t("dashboard.network.filter.filtered") || "filtered by"}: {selectedTechnologies.join(", ")})
                      </span>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.network.graph3d.title")}</CardTitle>
                <CardDescription>
                  {t("dashboard.network.graph3d.description")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full h-[700px] rounded-lg overflow-hidden relative" id="network-graph-3d-container">
                  <Network3DErrorBoundary>
                    <NetworkGraph3D
                      members={approvedMembers}
                      companies={companies}
                      width={typeof window !== 'undefined' ? Math.max(800, window.innerWidth - 300) : 1200}
                      height={700}
                    />
                  </Network3DErrorBoundary>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="list" className="space-y-4">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder={t("dashboard.network.search.placeholder") || "Search by name, email, company, or technology..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rounded-full pl-10"
                  />
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                {(searchQuery || selectedTechnologies.length > 0) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Technology Filter Chips */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t("dashboard.network.filter.technologies") || "Filter by Technology"}</Label>
                <div className="flex flex-wrap gap-2">
                  {TECHNOLOGY_FILTERS.map(tech => (
                    <Badge
                      key={tech}
                      variant={selectedTechnologies.includes(tech) ? "default" : "outline"}
                      className="cursor-pointer rounded-full transition-colors hover:bg-primary/20"
                      onClick={() => toggleTechnologyFilter(tech)}
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {(searchQuery || selectedTechnologies.length > 0) && (
                <p className="text-sm text-muted-foreground">
                  {t("dashboard.network.search.results") || "Showing results for"}:
                  {searchQuery && <span className="font-medium ml-1">{searchQuery}</span>}
                  {selectedTechnologies.length > 0 && (
                    <span className="ml-2">
                      ({t("dashboard.network.filter.filtered") || "filtered by"}: {selectedTechnologies.join(", ")})
                    </span>
                  )}
                </p>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="approved" className="space-y-4">
            <TabsList className="rounded-full">
              <TabsTrigger value="approved" className="rounded-full">
                {t("dashboard.network.tabs.approved") || "Approved"} ({approvedMembers.length})
              </TabsTrigger>
              {isAdmin && (
                <>
                  <TabsTrigger value="pending" className="rounded-full">
                    {t("dashboard.network.tabs.pending") || "Pending"} ({pendingMembers.length})
                  </TabsTrigger>
                  <TabsTrigger value="rejected" className="rounded-full">
                    {t("dashboard.network.tabs.rejected") || "Rejected"} ({rejectedMembers.length})
                  </TabsTrigger>
                  {isSuperAdmin && (
                    <TabsTrigger value="suspended" className="rounded-full">
                      {t("dashboard.network.tabs.suspended") || "Suspended"} ({suspendedMembers.length})
                    </TabsTrigger>
                  )}
                </>
              )}
            </TabsList>

            <TabsContent value="approved" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("dashboard.network.approved.title") || "Approved Members"}</CardTitle>
                  <CardDescription>
                    {t("dashboard.network.approved.description") || "Members with full access to the platform"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {approvedMembers.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      {t("dashboard.network.approved.empty") || "No approved members yet."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("dashboard.network.table.name") || "Name"}</TableHead>
                            <TableHead>{t("dashboard.network.table.email") || "Email"}</TableHead>
                            <TableHead>{t("dashboard.network.table.phone") || "Phone"}</TableHead>
                            <TableHead>{t("dashboard.network.table.role") || "Role"}</TableHead>
                            <TableHead>{t("dashboard.network.table.status") || "Status"}</TableHead>
                            {isAdmin && <TableHead>{t("dashboard.network.table.actions") || "Actions"}</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {approvedMembers.map((member) => (
                            <TableRow key={member.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={member.image} alt={member.name} />
                                    <AvatarFallback>
                                      {member.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{member.name}</span>
                                    {companies.filter(c => c.created_by === member.id).length > 0 && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3" />
                                        {t("dashboard.network.ownerOf") || "Owner of"}{" "}
                                        {companies.filter(c => c.created_by === member.id).map(c => c.name).join(", ")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {member.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                {member.phone ? (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    {member.phone}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRoleBadgeVariant(member.role)} className="rounded-full">
                                  {member.role === 'superadmin'
                                    ? t("dashboard.network.role.superadmin") || "Super Admin"
                                    : member.role === 'admin'
                                      ? t("dashboard.network.role.admin") || "Admin"
                                      : member.role === 'board_member'
                                        ? t("dashboard.network.role.board_member") || "Board Member"
                                        : member.role === 'wg_lead'
                                          ? t("dashboard.network.role.wg_lead") || "WG Lead"
                                          : t("dashboard.network.role.member") || "Member"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(member.status)} className="rounded-full">
                                  {member.status === 'approved'
                                    ? t("dashboard.network.status.approved") || "Approved"
                                    : member.status === 'pending'
                                      ? t("dashboard.network.status.pending") || "Pending"
                                      : member.status === 'suspended'
                                        ? t("dashboard.network.status.suspended") || "Suspended"
                                        : t("dashboard.network.status.rejected") || "Rejected"}
                                </Badge>
                              </TableCell>
                              {isAdmin && (
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Select
                                      value={member.role || 'member'}
                                      onValueChange={(value) => handleUpdateMemberRole(member.id, value as UserRole)}
                                      disabled={member.role === 'superadmin' && !isSuperAdmin}
                                    >
                                      <SelectTrigger className="w-32 h-8 text-xs rounded-full">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="member">{t("dashboard.network.role.member") || "Member"}</SelectItem>
                                        <SelectItem value="admin">{t("dashboard.network.role.admin") || "Admin"}</SelectItem>
                                        {isSuperAdmin && <SelectItem value="board_member">{t("dashboard.network.role.board_member") || "Board Member"}</SelectItem>}
                                        {isSuperAdmin && <SelectItem value="wg_lead">{t("dashboard.network.role.wg_lead") || "WG Lead"}</SelectItem>}
                                        {isSuperAdmin && <SelectItem value="superadmin">{t("dashboard.network.role.superadmin") || "Super Admin"}</SelectItem>}
                                      </SelectContent>
                                    </Select>
                                    {isSuperAdmin && (
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setSuspendMemberId(member.id)}
                                          className="h-8 px-2 rounded-full"
                                          title={t("dashboard.network.suspend.button") || "Suspend"}
                                        >
                                          <Ban className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setBanMemberId(member.id)}
                                          className="h-8 px-2 rounded-full"
                                          title={t("dashboard.network.ban.button") || "Ban"}
                                        >
                                          <UserX className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setDeleteMemberId(member.id)}
                                          className="h-8 px-2 rounded-full text-destructive hover:text-destructive"
                                          title={t("dashboard.network.delete.button") || "Delete"}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="pending" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("dashboard.network.pending.title") || "Pending Requests"}</CardTitle>
                      <CardDescription>
                        {t("dashboard.network.pending.description") || "Members waiting for approval to join BAMAS"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {pendingMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {t("dashboard.network.pending.empty") || "No pending requests at the moment."}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("dashboard.network.table.name") || "Name"}</TableHead>
                                <TableHead>{t("dashboard.network.table.email") || "Email"}</TableHead>
                                <TableHead>{t("dashboard.network.table.phone") || "Phone"}</TableHead>
                                <TableHead>{t("dashboard.network.table.requested") || "Requested"}</TableHead>
                                <TableHead>{t("dashboard.network.table.actions") || "Actions"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pendingMembers.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.image} alt={member.name} />
                                        <AvatarFallback>
                                          {member.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{member.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      {member.email}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {member.phone ? (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {member.phone}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {member.createdAt ? (
                                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(member.createdAt), "PPp")}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleApproveMember(member.id)}
                                        className="rounded-full"
                                      >
                                        <Check className="mr-1 h-3 w-3" />
                                        {t("dashboard.network.approve.button") || "Approve"}
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => setRejectMemberId(member.id)}
                                        className="rounded-full"
                                      >
                                        <X className="mr-1 h-3 w-3" />
                                        {t("dashboard.network.reject.button") || "Reject"}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="rejected" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{t("dashboard.network.rejected.title") || "Rejected Members"}</CardTitle>
                      <CardDescription>
                        {t("dashboard.network.rejected.description") || "Members whose requests were rejected"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {rejectedMembers.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          {t("dashboard.network.rejected.empty") || "No rejected members."}
                        </p>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("dashboard.network.table.name") || "Name"}</TableHead>
                                <TableHead>{t("dashboard.network.table.email") || "Email"}</TableHead>
                                <TableHead>{t("dashboard.network.table.phone") || "Phone"}</TableHead>
                                <TableHead>{t("dashboard.network.table.actions") || "Actions"}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rejectedMembers.map((member) => (
                                <TableRow key={member.id}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={member.image} alt={member.name} />
                                        <AvatarFallback>
                                          {member.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")
                                            .toUpperCase()
                                            .slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="font-medium">{member.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      {member.email}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {member.phone ? (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {member.phone}
                                      </div>
                                    ) : (
                                      <span className="text-muted-foreground">-</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveMember(member.id)}
                                      className="rounded-full"
                                    >
                                      <Check className="mr-1 h-3 w-3" />
                                      {t("dashboard.network.approve.button") || "Approve"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {isSuperAdmin && (
                  <TabsContent value="suspended" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t("dashboard.network.suspended.title") || "Suspended Members"}</CardTitle>
                        <CardDescription>
                          {t("dashboard.network.suspended.description") || "Members who have been temporarily suspended"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {suspendedMembers.length === 0 ? (
                          <p className="text-muted-foreground text-center py-8">
                            {t("dashboard.network.suspended.empty") || "No suspended members."}
                          </p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t("dashboard.network.table.name") || "Name"}</TableHead>
                                  <TableHead>{t("dashboard.network.table.email") || "Email"}</TableHead>
                                  <TableHead>{t("dashboard.network.table.phone") || "Phone"}</TableHead>
                                  <TableHead>{t("dashboard.network.table.role") || "Role"}</TableHead>
                                  <TableHead>{t("dashboard.network.table.status") || "Status"}</TableHead>
                                  <TableHead>{t("dashboard.network.table.actions") || "Actions"}</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {suspendedMembers.map((member) => (
                                  <TableRow key={member.id}>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                          <AvatarImage src={member.image} alt={member.name} />
                                          <AvatarFallback>
                                            {member.name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .toUpperCase()
                                              .slice(0, 2)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{member.name}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3 text-muted-foreground" />
                                        {member.email}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {member.phone ? (
                                        <div className="flex items-center gap-1">
                                          <Phone className="h-3 w-3 text-muted-foreground" />
                                          {member.phone}
                                        </div>
                                      ) : (
                                        <span className="text-muted-foreground">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={getRoleBadgeVariant(member.role)} className="rounded-full">
                                        {member.role === 'superadmin'
                                          ? t("dashboard.network.role.superadmin") || "Super Admin"
                                          : member.role === 'admin'
                                            ? t("dashboard.network.role.admin") || "Admin"
                                            : t("dashboard.network.role.member") || "Member"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={getStatusBadgeVariant(member.status)} className="rounded-full">
                                        {t("dashboard.network.status.suspended") || "Suspended"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        onClick={() => setRestoreMemberId(member.id)}
                                        className="rounded-full"
                                      >
                                        <RotateCcw className="mr-1 h-3 w-3" />
                                        {t("dashboard.network.restore.button") || "Restore"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </>
            )}
          </Tabs>
        </TabsContent>
      </Tabs>

      {/* Suspend Confirmation Dialog */}
      <AlertDialog open={suspendMemberId !== null} onOpenChange={(open) => {
        if (!open) {
          setSuspendMemberId(null);
          setActionReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.network.suspend.confirm.title") || "Suspend Member?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.network.suspend.confirm.description") || "This will temporarily suspend this member. They will lose access to the platform but can be restored later."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suspend-reason">
                {t("dashboard.network.suspend.confirm.reason") || "Reason for suspension (required)"}
              </Label>
              <Textarea
                id="suspend-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={t("dashboard.network.suspend.confirm.reasonPlaceholder") || "Enter reason for suspension..."}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={() => {
              setSuspendMemberId(null);
              setActionReason("");
            }}>
              {t("dashboard.network.reject.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSuspendMember}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.network.suspend.confirm.button") || "Suspend Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreMemberId !== null} onOpenChange={(open) => !open && setRestoreMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.network.restore.confirm.title") || "Restore Member?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.network.restore.confirm.description") || "This will restore this member's access to the platform."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("dashboard.network.reject.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => restoreMemberId && handleRestoreMember()}
              className="rounded-full"
            >
              {t("dashboard.network.restore.confirm.button") || "Restore Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={banMemberId !== null} onOpenChange={(open) => {
        if (!open) {
          setBanMemberId(null);
          setActionReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.network.ban.confirm.title") || "Ban Member?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.network.ban.confirm.description") || "This will permanently ban this member. This action cannot be easily undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban-reason">
                {t("dashboard.network.ban.confirm.reason") || "Reason for ban (required)"}
              </Label>
              <Textarea
                id="ban-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={t("dashboard.network.ban.confirm.reasonPlaceholder") || "Enter reason for ban..."}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={() => {
              setBanMemberId(null);
              setActionReason("");
            }}>
              {t("dashboard.network.reject.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanMember}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.network.ban.confirm.button") || "Ban Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteMemberId !== null} onOpenChange={(open) => {
        if (!open) {
          setDeleteMemberId(null);
          setActionReason("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.network.delete.confirm.title") || "Delete Member?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.network.delete.confirm.description") || "This will permanently delete this member. This action cannot be undone. All their data will be marked as deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-reason">
                {t("dashboard.network.delete.confirm.reason") || "Reason for deletion (required)"}
              </Label>
              <Textarea
                id="delete-reason"
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                placeholder={t("dashboard.network.delete.confirm.reasonPlaceholder") || "Enter reason for deletion..."}
                className="min-h-[100px]"
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full" onClick={() => {
              setDeleteMemberId(null);
              setActionReason("");
            }}>
              {t("dashboard.network.reject.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMember}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.network.delete.confirm.button") || "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={rejectMemberId !== null} onOpenChange={(open) => !open && setRejectMemberId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.network.reject.confirm.title") || "Reject Member?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.network.reject.confirm.description") || "Are you sure you want to reject this member request? They can be approved later if needed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("dashboard.network.reject.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectMemberId && handleRejectMember(rejectMemberId)}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.network.reject.confirm.button") || "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default NetworkContent;
