import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { loadMeetings } from "@/lib/meetings";
import {
  Calendar,
  CalendarDays,
  MapPin,
  Globe,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Clock,
  Users,
  Building2,
  Plane,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO, isWithinInterval } from "date-fns";

interface StrategicEvent {
  id: string;
  title: string;
  description?: string;
  event_type: 'conference' | 'exhibition' | 'workshop' | 'webinar' | 'meeting' | 'deadline' | 'other';
  scope: 'national' | 'international' | 'european';
  start_date: string;
  end_date?: string;
  location?: string;
  venue_name?: string;
  website?: string;
  organizer?: string;
  registration_deadline?: string;
  is_free: boolean;
  cost_info?: string;
  tags?: string[];
  created_by: string;
  created_by_name: string;
  created_at: string;
  updated_at?: string;
  source?: 'strategic_event';
}

/** Meetings from the Meetings dashboard, shown as calendar events */
interface MeetingCalendarItem {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: 'conference' | 'meeting';
  scope: 'national';
  location?: string;
  source: 'meeting';
  status: string;
  is_free: true;
}

type CalendarEvent = StrategicEvent | MeetingCalendarItem;

const EVENT_TYPES = [
  { value: 'conference', label: 'Conference', icon: Users },
  { value: 'exhibition', label: 'Exhibition', icon: Building2 },
  { value: 'workshop', label: 'Workshop', icon: Calendar },
  { value: 'webinar', label: 'Webinar', icon: Globe },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'deadline', label: 'Deadline', icon: Clock },
  { value: 'other', label: 'Other', icon: CalendarDays },
];

const SCOPE_OPTIONS = [
  { value: 'national', label: 'National (Bulgaria)', icon: '🇧🇬' },
  { value: 'european', label: 'European', icon: '🇪🇺' },
  { value: 'international', label: 'International', icon: '🌍' },
];

const StrategicCalendar = () => {
  const { t } = useLanguage();
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Filters
  const [filterScope, setFilterScope] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  
  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  // Form
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_type: "conference" as StrategicEvent['event_type'],
    scope: "national" as StrategicEvent['scope'],
    start_date: "",
    end_date: "",
    location: "",
    venue_name: "",
    website: "",
    organizer: "",
    registration_deadline: "",
    is_free: true,
    cost_info: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  
  // Load events
  useEffect(() => {
    loadEvents();
  }, []);
  
  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const [strategicRes, meetingsList] = await Promise.all([
        supabase.from('strategic_events').select('*').order('start_date', { ascending: true }),
        loadMeetings().catch(() => [] as Awaited<ReturnType<typeof loadMeetings>>),
      ]);

      const { data: strategicData, error } = strategicRes;
      if (error) {
        if (error.code === '42P01') {
          console.warn('Strategic events table does not exist');
        } else throw error;
      }

      const strategic: CalendarEvent[] = ((strategicData || []) as StrategicEvent[]).map((e) => ({
        ...e,
        source: 'strategic_event' as const,
      }));

      const fromMeetings: MeetingCalendarItem[] = (meetingsList || []).map((m) => ({
        id: m.id,
        title: m.title,
        start_date: m.scheduled_date,
        end_date: m.scheduled_date,
        event_type: m.type === 'general_assembly' ? 'conference' : 'meeting',
        scope: 'national' as const,
        location: m.location,
        source: 'meeting' as const,
        status: m.status,
        is_free: true,
      }));

      setEvents([...strategic, ...fromMeetings].sort((a, b) => a.start_date.localeCompare(b.start_date)));
    } catch (error: any) {
      console.error('Error loading events:', error);
      if (error?.code !== '42P01') {
        toast({
          title: t("dashboard.calendar.error.loadFailed") || "Load Failed",
          description: error?.message || "Failed to load events",
          variant: "destructive",
        });
      }
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateEvent = async () => {
    if (!user || !isSuperAdmin) return;
    
    if (!eventForm.title.trim() || !eventForm.start_date) {
      toast({
        title: t("dashboard.calendar.error.validation") || "Validation Error",
        description: t("dashboard.calendar.error.required") || "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('strategic_events')
        .insert({
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          event_type: eventForm.event_type,
          scope: eventForm.scope,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date || null,
          location: eventForm.location.trim() || null,
          venue_name: eventForm.venue_name.trim() || null,
          website: eventForm.website.trim() || null,
          organizer: eventForm.organizer.trim() || null,
          registration_deadline: eventForm.registration_deadline || null,
          is_free: eventForm.is_free,
          cost_info: eventForm.cost_info.trim() || null,
          tags: eventForm.tags.length > 0 ? eventForm.tags : null,
          created_by: user.id,
          created_by_name: user.name,
        });
      
      if (error) throw error;
      
      toast({
        title: t("dashboard.calendar.success.created") || "Event Created",
        description: t("dashboard.calendar.success.createdDesc") || "Strategic event has been added",
      });
      
      resetForm();
      setIsCreateDialogOpen(false);
      await loadEvents();
    } catch (error: any) {
      toast({
        title: t("dashboard.calendar.error.createFailed") || "Create Failed",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditEvent = async () => {
    if (!selectedEvent || !user || !isSuperAdmin || selectedEvent.source === 'meeting') return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('strategic_events')
        .update({
          title: eventForm.title.trim(),
          description: eventForm.description.trim() || null,
          event_type: eventForm.event_type,
          scope: eventForm.scope,
          start_date: eventForm.start_date,
          end_date: eventForm.end_date || null,
          location: eventForm.location.trim() || null,
          venue_name: eventForm.venue_name.trim() || null,
          website: eventForm.website.trim() || null,
          organizer: eventForm.organizer.trim() || null,
          registration_deadline: eventForm.registration_deadline || null,
          is_free: eventForm.is_free,
          cost_info: eventForm.cost_info.trim() || null,
          tags: eventForm.tags.length > 0 ? eventForm.tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEvent.id);
      
      if (error) throw error;
      
      toast({
        title: t("dashboard.calendar.success.updated") || "Event Updated",
        description: t("dashboard.calendar.success.updatedDesc") || "Strategic event has been updated",
      });
      
      resetForm();
      setIsEditDialogOpen(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch (error: any) {
      toast({
        title: t("dashboard.calendar.error.updateFailed") || "Update Failed",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteEvent = async () => {
    if (!selectedEvent || !user || !isSuperAdmin || selectedEvent.source === 'meeting') return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('strategic_events')
        .delete()
        .eq('id', selectedEvent.id);
      
      if (error) throw error;
      
      toast({
        title: t("dashboard.calendar.success.deleted") || "Event Deleted",
        description: t("dashboard.calendar.success.deletedDesc") || "Strategic event has been removed",
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedEvent(null);
      await loadEvents();
    } catch (error: any) {
      toast({
        title: t("dashboard.calendar.error.deleteFailed") || "Delete Failed",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      event_type: "conference",
      scope: "national",
      start_date: "",
      end_date: "",
      location: "",
      venue_name: "",
      website: "",
      organizer: "",
      registration_deadline: "",
      is_free: true,
      cost_info: "",
      tags: [],
    });
    setTagInput("");
  };
  
  const openEditDialog = (event: StrategicEvent) => {
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      event_type: event.event_type,
      scope: event.scope,
      start_date: event.start_date,
      end_date: event.end_date || "",
      location: event.location || "",
      venue_name: event.venue_name || "",
      website: event.website || "",
      organizer: event.organizer || "",
      registration_deadline: event.registration_deadline || "",
      is_free: event.is_free,
      cost_info: event.cost_info || "",
      tags: event.tags || [],
    });
    setIsEditDialogOpen(true);
  };
  
  const addTag = () => {
    if (tagInput.trim() && !eventForm.tags.includes(tagInput.trim())) {
      setEventForm({ ...eventForm, tags: [...eventForm.tags, tagInput.trim()] });
      setTagInput("");
    }
  };
  
  const removeTag = (tag: string) => {
    setEventForm({ ...eventForm, tags: eventForm.tags.filter(t => t !== tag) });
  };
  
  // Calendar helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get events for a specific day
  const getEventsForDay = (date: Date) => {
    return filteredEvents.filter(event => {
      const startDate = parseISO(event.start_date);
      const endDate = event.end_date ? parseISO(event.end_date) : startDate;
      return isWithinInterval(date, { start: startDate, end: endDate }) || isSameDay(date, startDate);
    });
  };
  
  // Filter events
  const filteredEvents = events.filter(event => {
    if (filterScope !== "all" && event.scope !== filterScope) return false;
    if (filterType !== "all" && event.event_type !== filterType) return false;
    return true;
  });
  
  // Get upcoming events (next 30 days)
  const upcomingEvents = filteredEvents
    .filter(event => {
      const startDate = parseISO(event.start_date);
      const today = new Date();
      const thirtyDaysLater = addMonths(today, 1);
      return startDate >= today && startDate <= thirtyDaysLater;
    })
    .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime())
    .slice(0, 5);
  
  const getScopeIcon = (scope: string) => {
    const option = SCOPE_OPTIONS.find(o => o.value === scope);
    return option?.icon || '🌍';
  };
  
  const getEventTypeIcon = (type: string) => {
    const option = EVENT_TYPES.find(o => o.value === type);
    const Icon = option?.icon || CalendarDays;
    return <Icon className="h-4 w-4" />;
  };
  
  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'conference': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'exhibition': return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
      case 'workshop': return 'bg-green-500/10 text-green-600 border-green-500/30';
      case 'webinar': return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30';
      case 'meeting': return 'bg-orange-500/10 text-orange-600 border-orange-500/30';
      case 'deadline': return 'bg-red-500/10 text-red-600 border-red-500/30';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.calendar.title") || "Strategic Calendar"}</h2>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.calendar.addEvent") || "Add Event"}
          </Button>
        )}
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterScope} onValueChange={setFilterScope}>
            <SelectTrigger className="w-[160px] rounded-full">
              <SelectValue placeholder="Scope" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("dashboard.calendar.filter.allScopes") || "All Scopes"}</SelectItem>
              {SCOPE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    {option.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] rounded-full">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("dashboard.calendar.filter.allTypes") || "All Types"}</SelectItem>
            {EVENT_TYPES.map(option => (
              <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="rounded-full"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  className="rounded-full"
                >
                  {t("dashboard.calendar.today") || "Today"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="rounded-full"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month start */}
              {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1" />
              ))}
              
              {daysInMonth.map(day => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`h-24 p-1 border rounded-lg cursor-pointer transition-colors ${
                      isToday(day) ? 'bg-primary/10 border-primary' : 'border-border hover:bg-muted/50'
                    } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className={`text-sm font-medium ${isToday(day) ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate cursor-pointer ${getEventTypeColor(event.event_type)}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setIsDetailDialogOpen(true);
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              {t("dashboard.calendar.upcoming") || "Upcoming Events"}
            </CardTitle>
            <CardDescription>
              {t("dashboard.calendar.upcomingDesc") || "Next 30 days"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t("dashboard.calendar.noUpcoming") || "No upcoming events"}</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <Card
                      key={event.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedEvent(event);
                        setIsDetailDialogOpen(true);
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="text-center min-w-[50px]">
                            <div className="text-2xl font-bold text-primary">
                              {format(parseISO(event.start_date), 'd')}
                            </div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {format(parseISO(event.start_date), 'MMM')}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className={`rounded-full text-xs ${getEventTypeColor(event.event_type)}`}>
                                {getEventTypeIcon(event.event_type)}
                                <span className="ml-1">{event.event_type}</span>
                              </Badge>
                              <span className="text-sm">{getScopeIcon(event.scope)}</span>
                            </div>
                            <h4 className="font-semibold truncate">{event.title}</h4>
                            {event.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Event Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className={`rounded-full ${getEventTypeColor(selectedEvent.event_type)}`}>
                    {getEventTypeIcon(selectedEvent.event_type)}
                    <span className="ml-1">{selectedEvent.event_type}</span>
                  </Badge>
                  <span>{getScopeIcon(selectedEvent.scope)}</span>
                  {!selectedEvent.is_free && (
                    <Badge variant="secondary" className="rounded-full">Paid</Badge>
                  )}
                </div>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                {selectedEvent.description && (
                  <DialogDescription>{selectedEvent.description}</DialogDescription>
                )}
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {format(parseISO(selectedEvent.start_date), 'PPP')}
                    {selectedEvent.end_date && selectedEvent.end_date !== selectedEvent.start_date && (
                      <> - {format(parseISO(selectedEvent.end_date), 'PPP')}</>
                    )}
                  </span>
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                
                {selectedEvent.venue_name && (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.venue_name}</span>
                  </div>
                )}
                
                {selectedEvent.organizer && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedEvent.organizer}</span>
                  </div>
                )}
                
                {selectedEvent.registration_deadline && (
                  <div className="flex items-center gap-2 text-sm text-orange-600">
                    <Clock className="h-4 w-4" />
                    <span>Registration deadline: {format(parseISO(selectedEvent.registration_deadline), 'PPP')}</span>
                  </div>
                )}
                
                {selectedEvent.cost_info && (
                  <div className="text-sm p-2 bg-muted rounded-lg">
                    <span className="font-medium">Cost:</span> {selectedEvent.cost_info}
                  </div>
                )}
                
                {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedEvent.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="rounded-full text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                {selectedEvent.source === 'meeting' && (
                  <Button
                    variant="default"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      navigate(`/dashboard?meeting=${selectedEvent.id}`);
                    }}
                    className="rounded-full flex-1 sm:flex-none"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("dashboard.meetings.actions.view") || "View in Meetings"}
                  </Button>
                )}
                {selectedEvent.website && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedEvent.website!, '_blank')}
                    className="rounded-full flex-1 sm:flex-none"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("dashboard.calendar.visitWebsite") || "Visit Website"}
                  </Button>
                )}
                {isSuperAdmin && selectedEvent.source !== 'meeting' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        openEditDialog(selectedEvent as StrategicEvent);
                      }}
                      className="rounded-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      {t("common.edit") || "Edit"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailDialogOpen(false);
                        setIsDeleteDialogOpen(true);
                      }}
                      className="rounded-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("common.delete") || "Delete"}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create/Edit Dialog */}
      <Dialog 
        open={isCreateDialogOpen || isEditDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen 
                ? (t("dashboard.calendar.editEvent") || "Edit Event")
                : (t("dashboard.calendar.createEvent") || "Create Event")
              }
            </DialogTitle>
            <DialogDescription>
              {t("dashboard.calendar.eventFormDesc") || "Add strategic events for the AM community"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="title">
                  {t("dashboard.calendar.form.title") || "Event Title"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder={t("dashboard.calendar.form.titlePlaceholder") || "e.g. Formnext 2026"}
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("dashboard.calendar.form.type") || "Event Type"}</Label>
                <Select
                  value={eventForm.event_type}
                  onValueChange={(value: StrategicEvent['event_type']) => setEventForm({ ...eventForm, event_type: value })}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(option => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>{t("dashboard.calendar.form.scope") || "Scope"}</Label>
                <Select
                  value={eventForm.scope}
                  onValueChange={(value: StrategicEvent['scope']) => setEventForm({ ...eventForm, scope: value })}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="start_date">
                  {t("dashboard.calendar.form.startDate") || "Start Date"} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="start_date"
                  type="date"
                  value={eventForm.start_date}
                  onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end_date">{t("dashboard.calendar.form.endDate") || "End Date"}</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={eventForm.end_date}
                  onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                  className="rounded-full"
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">{t("dashboard.calendar.form.description") || "Description"}</Label>
                <Textarea
                  id="description"
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder={t("dashboard.calendar.form.descriptionPlaceholder") || "Brief description of the event"}
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">{t("dashboard.calendar.form.location") || "Location"}</Label>
                <Input
                  id="location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  placeholder="e.g. Frankfurt, Germany"
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="venue_name">{t("dashboard.calendar.form.venue") || "Venue"}</Label>
                <Input
                  id="venue_name"
                  value={eventForm.venue_name}
                  onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                  placeholder="e.g. Messe Frankfurt"
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="organizer">{t("dashboard.calendar.form.organizer") || "Organizer"}</Label>
                <Input
                  id="organizer"
                  value={eventForm.organizer}
                  onChange={(e) => setEventForm({ ...eventForm, organizer: e.target.value })}
                  placeholder="e.g. BAMAS"
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">{t("dashboard.calendar.form.website") || "Website"}</Label>
                <Input
                  id="website"
                  type="url"
                  value={eventForm.website}
                  onChange={(e) => setEventForm({ ...eventForm, website: e.target.value })}
                  placeholder="https://..."
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="registration_deadline">{t("dashboard.calendar.form.deadline") || "Registration Deadline"}</Label>
                <Input
                  id="registration_deadline"
                  type="date"
                  value={eventForm.registration_deadline}
                  onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                  className="rounded-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("dashboard.calendar.form.pricing") || "Pricing"}</Label>
                <Select
                  value={eventForm.is_free ? "free" : "paid"}
                  onValueChange={(value) => setEventForm({ ...eventForm, is_free: value === "free" })}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t("dashboard.calendar.form.free") || "Free"}</SelectItem>
                    <SelectItem value="paid">{t("dashboard.calendar.form.paid") || "Paid"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {!eventForm.is_free && (
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="cost_info">{t("dashboard.calendar.form.costInfo") || "Cost Information"}</Label>
                  <Input
                    id="cost_info"
                    value={eventForm.cost_info}
                    onChange={(e) => setEventForm({ ...eventForm, cost_info: e.target.value })}
                    placeholder="e.g. €150 early bird, €200 regular"
                    className="rounded-full"
                  />
                </div>
              )}
              
              <div className="col-span-2 space-y-2">
                <Label>{t("dashboard.calendar.form.tags") || "Tags"}</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder={t("dashboard.calendar.form.tagsPlaceholder") || "Add tag and press Enter"}
                    className="rounded-full"
                  />
                  <Button type="button" variant="outline" onClick={addTag} className="rounded-full">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {eventForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {eventForm.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="rounded-full">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
                resetForm();
              }}
              className="rounded-full"
            >
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button
              onClick={isEditDialogOpen ? handleEditEvent : handleCreateEvent}
              disabled={isLoading}
              className="rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.saving") || "Saving..."}
                </>
              ) : isEditDialogOpen ? (
                t("common.save") || "Save Changes"
              ) : (
                t("dashboard.calendar.create") || "Create Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.calendar.delete.title") || "Delete Event?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.calendar.delete.description") || "This action cannot be undone. The event will be permanently removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">
              {t("common.cancel") || "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteEvent}
              disabled={isLoading}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.deleting") || "Deleting..."}
                </>
              ) : (
                t("common.delete") || "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StrategicCalendar;
