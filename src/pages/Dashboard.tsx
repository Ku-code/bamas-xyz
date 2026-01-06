import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Clock,
  CheckSquare,
  Calendar,
  FileText,
  DollarSign,
  Users,
  Settings,
  Home,
  ArrowLeft,
  Package,
  Map,
  Briefcase,
  PenTool,
} from "lucide-react";
import HistoryContent from "@/components/dashboard/HistoryContent";
import VotesContent from "@/components/dashboard/VotesContent";
import AgendaContent from "@/components/dashboard/AgendaContent";
import DocumentsContent from "@/components/dashboard/DocumentsContent";
import BudgetContent from "@/components/dashboard/BudgetContent";
import NetworkContent from "@/components/dashboard/NetworkContent";
import ResourcesContent from "@/components/dashboard/ResourcesContent";
import AdditiveMapContent from "@/components/dashboard/AdditiveMapContent";
import WorkingGroupsContent from "@/components/dashboard/WorkingGroupsContent";
import SignatureCenter from "@/components/dashboard/SignatureCenter";

type MenuItem = "history" | "votes" | "agenda" | "documents" | "budget" | "network" | "resources" | "additivemap" | "workinggroups" | "signatures";

const Dashboard = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<MenuItem>("history");

  const menuItems = [
    { id: "history" as MenuItem, icon: Clock, label: t("dashboard.menu.history") || "History" },
    { id: "votes" as MenuItem, icon: CheckSquare, label: t("dashboard.menu.votes") || "Votes" },
    { id: "agenda" as MenuItem, icon: Calendar, label: t("dashboard.menu.agenda") || "Agenda" },
    { id: "documents" as MenuItem, icon: FileText, label: t("dashboard.menu.documents") || "Documents" },
    { id: "budget" as MenuItem, icon: DollarSign, label: t("dashboard.menu.budget") || "Budget" },
    { id: "network" as MenuItem, icon: Users, label: t("dashboard.menu.network") || "Network" },
    { id: "resources" as MenuItem, icon: Package, label: t("dashboard.menu.resources") || "Resources" },
    { id: "additivemap" as MenuItem, icon: Map, label: t("dashboard.menu.additivemap") || "AdditiveMAP" },
    { id: "workinggroups" as MenuItem, icon: Briefcase, label: t("dashboard.menu.workinggroups") || "Working Groups" },
    { id: "signatures" as MenuItem, icon: PenTool, label: t("dashboard.menu.signatures") || "Signatures" },
  ];

  const renderContent = () => {
    switch (activeItem) {
      case "history":
        return <HistoryContent />;
      case "votes":
        return <VotesContent />;
      case "agenda":
        return <AgendaContent />;
      case "documents":
        return <DocumentsContent />;
      case "budget":
        return <BudgetContent />;
      case "network":
        return <NetworkContent />;
      case "resources":
        return <ResourcesContent />;
      case "additivemap":
        return <AdditiveMapContent />;
      case "workinggroups":
        return <WorkingGroupsContent />;
      case "signatures":
        return <SignatureCenter />;
      default:
        return <HistoryContent />;
    }
  };

  const logoPath = language === 'bg' 
    ? '/lovable-uploads/BAMAS_Logo_bg.png'
    : '/lovable-uploads/6e77d85a-74ad-47e5-b141-a339ec981d57.png';

  const userInitials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <SidebarProvider collapsible="icon">
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border">
            <div className="flex items-center justify-center px-2 py-2 group-data-[collapsible=icon]:px-1.5">
              <div className="h-8 w-8 flex-shrink-0 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 transition-all duration-200">
                <img
                  src={logoPath}
                  alt="BAMAS Logo"
                  className="w-full h-full object-contain rounded"
                />
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          tooltip={item.label}
                          isActive={activeItem === item.id}
                          onClick={() => setActiveItem(item.id)}
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={t("dashboard.menu.settings") || "Settings"}
                  onClick={() => navigate("/settings")}
                >
                  <Settings />
                  <span>{t("dashboard.menu.settings") || "Settings"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center justify-center gap-2 px-2 py-2 group-data-[collapsible=icon]:px-1.5">
              <Avatar className="h-8 w-8 flex-shrink-0 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 transition-all duration-200">
                <AvatarImage src={user?.image} alt={user?.name} />
                <AvatarFallback className="text-xs group-data-[collapsible=icon]:text-[10px] transition-all duration-200">{userInitials}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium truncate">{user?.name}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <SidebarTrigger className="shrink-0" />
              <div className="flex-1 flex items-center justify-center px-4">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary tracking-tight select-none whitespace-nowrap drop-shadow-sm">
                  {language === 'bg' ? 'Твоят Български Адитивен Център' : 'Your Bulgarian Additive Hub'}
                </h1>
              </div>
              <div className="flex items-center gap-2 ml-auto shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <Link to="/">
                    <Home className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline whitespace-nowrap">
                      {t("dashboard.backToHome") || "Back to Home"}
                    </span>
                    <span className="sm:hidden">
                      {t("dashboard.home") || "Home"}
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </header>
          <div className="flex-1 p-4 md:p-6 overflow-auto">
            <div className="max-w-7xl mx-auto w-full">
              {renderContent()}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;

