import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { getHistory, deleteHistoryItem, clearHistory, HistoryItem } from "@/lib/history";
import { formatErrorForToast } from "@/lib/error-messages";
import { Clock, Calendar as CalendarIcon, Filter, X, FileText, CheckSquare, CalendarDays, DollarSign, Users, Trash2 } from "lucide-react";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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

const HistoryContent = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [endTime, setEndTime] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [deleteHistoryId, setDeleteHistoryId] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  // Load history from Supabase
  useEffect(() => {
    loadHistoryFromDatabase();
  }, []);

  const loadHistoryFromDatabase = async () => {
    try {
      const loadedHistory = await getHistory();
      // Convert to component format
      const convertedHistory: HistoryItem[] = loadedHistory.map((item: any) => ({
        id: item.id,
        type: mapHistoryType(item.type),
        action: item.action || "",
        description: item.description || "",
        userId: item.user_id || "",
        userName: item.user_name || "",
        userImage: item.user_image || undefined,
        timestamp: item.created_at,
        metadata: item.metadata || undefined,
      }));
      
      // Sort by timestamp (newest first)
      const sorted = convertedHistory.sort((a: HistoryItem, b: HistoryItem) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setHistoryItems(sorted);
      setFilteredItems(sorted);
    } catch (error) {
      console.error("Error loading history:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.history.error.title") || "Error Loading History",
        t("dashboard.history.error.loadFailed") || "Failed to load history"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteHistoryItem = async () => {
    if (!deleteHistoryId || !user) return;

    try {
      await deleteHistoryItem(deleteHistoryId);
      toast({
        title: t("dashboard.history.delete.success.title") || "History Item Deleted",
        description: t("dashboard.history.delete.success.description") || "History item has been deleted successfully.",
      });
      setDeleteHistoryId(null);
      await loadHistoryFromDatabase();
    } catch (error: any) {
      console.error("Error deleting history item:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.history.delete.error.title") || "Failed to Delete History",
        t("dashboard.history.delete.error.description") || "Failed to delete history item"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const handleClearAllHistory = async () => {
    if (!user) return;

    try {
      await clearHistory();
      toast({
        title: t("dashboard.history.clear.success.title") || "History Cleared",
        description: t("dashboard.history.clear.success.description") || "All history has been cleared successfully.",
      });
      setShowClearAllDialog(false);
      await loadHistoryFromDatabase();
    } catch (error: any) {
      console.error("Error clearing history:", error);
      const errorInfo = formatErrorForToast(
        error,
        t("dashboard.history.clear.error.title") || "Failed to Clear History",
        t("dashboard.history.clear.error.description") || "Failed to clear history"
      );
      toast({
        title: errorInfo.title,
        description: errorInfo.description,
        variant: "destructive",
      });
    }
  };

  const mapHistoryType = (type: string): "document" | "vote" | "agenda" | "budget" | "network" | "settings" | "other" => {
    if (type.startsWith("document")) return "document";
    if (type.startsWith("vote")) return "vote";
    if (type.startsWith("agenda")) return "agenda";
    if (type.startsWith("member")) return "network";
    if (type.startsWith("profile")) return "settings";
    return "other";
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...historyItems];

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(item => {
        const itemDate = parseISO(item.timestamp);
        const itemDateOnly = startOfDay(itemDate);
        
        let start = startDate ? startOfDay(startDate) : undefined;
        let end = endDate ? endOfDay(endDate) : undefined;

        if (start && end) {
          return isWithinInterval(itemDateOnly, { start, end });
        } else if (start) {
          return itemDateOnly >= start;
        } else if (end) {
          return itemDateOnly <= end;
        }
        return true;
      });
    }

    // Filter by time range
    if (startTime || endTime) {
      filtered = filtered.filter(item => {
        const itemDate = parseISO(item.timestamp);
        const itemTime = format(itemDate, "HH:mm");
        
        if (startTime && endTime) {
          return itemTime >= startTime && itemTime <= endTime;
        } else if (startTime) {
          return itemTime >= startTime;
        } else if (endTime) {
          return itemTime <= endTime;
        }
        return true;
      });
    }

    setFilteredItems(filtered);
  }, [historyItems, startDate, endDate, startTime, endTime, selectedType]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setStartTime("");
    setEndTime("");
    setSelectedType("all");
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="h-4 w-4" />;
      case "vote":
        return <CheckSquare className="h-4 w-4" />;
      case "agenda":
        return <CalendarDays className="h-4 w-4" />;
      case "budget":
        return <DollarSign className="h-4 w-4" />;
      case "network":
        return <Users className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      document: t("dashboard.history.type.document") || "Document",
      vote: t("dashboard.history.type.vote") || "Vote",
      agenda: t("dashboard.history.type.agenda") || "Agenda",
      budget: t("dashboard.history.type.budget") || "Budget",
      network: t("dashboard.history.type.network") || "Network",
      settings: t("dashboard.history.type.settings") || "Settings",
      other: t("dashboard.history.type.other") || "Other",
    };
    return labels[type] || type;
  };

  const hasActiveFilters = startDate || endDate || startTime || endTime || selectedType !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.history.title") || "Activity History"}</h2>
        </div>
        {isSuperAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowClearAllDialog(true)}
            className="rounded-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("dashboard.history.clear.all") || "Clear All History"}
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>{t("dashboard.history.filters.title") || "Filters"}</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="rounded-full"
              >
                <X className="h-4 w-4 mr-1" />
                {t("dashboard.history.filters.clear") || "Clear Filters"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div className="space-y-2">
              <Label>{t("dashboard.history.filters.type") || "Type"}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("dashboard.history.filters.type.all") || "All Types"}</SelectItem>
                  <SelectItem value="document">{t("dashboard.history.type.document") || "Document"}</SelectItem>
                  <SelectItem value="vote">{t("dashboard.history.type.vote") || "Vote"}</SelectItem>
                  <SelectItem value="agenda">{t("dashboard.history.type.agenda") || "Agenda"}</SelectItem>
                  <SelectItem value="budget">{t("dashboard.history.type.budget") || "Budget"}</SelectItem>
                  <SelectItem value="network">{t("dashboard.history.type.network") || "Network"}</SelectItem>
                  <SelectItem value="settings">{t("dashboard.history.type.settings") || "Settings"}</SelectItem>
                  <SelectItem value="other">{t("dashboard.history.type.other") || "Other"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>{t("dashboard.history.filters.startDate") || "Start Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : t("dashboard.history.filters.selectDate") || "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>{t("dashboard.history.filters.endDate") || "End Date"}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-full",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : t("dashboard.history.filters.selectDate") || "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label>{t("dashboard.history.filters.timeRange") || "Time Range"}</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  placeholder={t("dashboard.history.filters.startTime") || "Start"}
                  className="rounded-full"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  placeholder={t("dashboard.history.filters.endTime") || "End"}
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("dashboard.history.recent") || "Recent Activity"}
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {filteredItems.length} {t("dashboard.history.items") || "items"}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {t("dashboard.history.description") || "View your recent actions and interactions"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? t("dashboard.history.noResults") || "No activity found matching your filters."
                  : t("dashboard.history.empty") || "No recent activity to display."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => {
                const itemDate = parseISO(item.timestamp);
                return (
                  <div key={item.id} className="flex gap-4 pb-4 last:pb-0 border-b last:border-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.userImage} alt={item.userName} />
                      <AvatarFallback>
                        {item.userName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full">
                          {getTypeIcon(item.type)}
                          <span className="ml-1">{getTypeLabel(item.type)}</span>
                        </Badge>
                        <span className="text-sm font-medium">{item.action}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{format(itemDate, "PPP 'at' p")}</span>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteHistoryId(item.id)}
                        className="rounded-full text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete History Item Confirmation Dialog */}
      <AlertDialog open={deleteHistoryId !== null} onOpenChange={(open) => !open && setDeleteHistoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.history.delete.confirm.title") || "Delete History Item?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.history.delete.confirm.description") || "This action cannot be undone. This will permanently delete this history entry."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t("dashboard.history.delete.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHistoryItem} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("dashboard.history.delete.confirm.button") || "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All History Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.history.clear.confirm.title") || "Clear All History?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.history.clear.confirm.description") || "This action cannot be undone. This will permanently delete all history entries. Are you sure you want to continue?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">{t("dashboard.history.clear.cancel") || "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAllHistory} className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("dashboard.history.clear.confirm.button") || "Clear All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HistoryContent;
