import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, addHours } from "date-fns";
import {
  Calendar,
  Download,
  ExternalLink,
  Copy,
  Check,
  Clock,
  MapPin,
  Bell,
  RefreshCw,
  Link as LinkIcon,
  Mail,
  CalendarPlus,
  CalendarDays,
  Globe,
  Share2,
} from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  url?: string;
  allDay?: boolean;
}

// Mock events from Strategic Calendar
const MOCK_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "BAMAS Monthly Meeting",
    description: "Regular monthly meeting of BAMAS members to discuss progress and upcoming activities.",
    start: new Date(2026, 1, 15, 14, 0),
    end: new Date(2026, 1, 15, 16, 0),
    location: "Sofia Tech Park, Sofia, Bulgaria",
  },
  {
    id: "2",
    title: "Formnext 2026",
    description: "The leading international exhibition and conference for additive manufacturing.",
    start: new Date(2026, 10, 17, 9, 0),
    end: new Date(2026, 10, 20, 18, 0),
    location: "Messe Frankfurt, Germany",
    url: "https://formnext.mesago.com/",
  },
  {
    id: "3",
    title: "RAPID + TCT 2026",
    description: "North America's largest and most influential additive manufacturing event.",
    start: new Date(2026, 4, 5, 9, 0),
    end: new Date(2026, 4, 7, 17, 0),
    location: "Detroit, Michigan, USA",
    url: "https://rapid3devent.com/",
  },
  {
    id: "4",
    title: "AM Workshop: Design for Additive",
    description: "Hands-on workshop covering DfAM principles and best practices.",
    start: new Date(2026, 2, 10, 10, 0),
    end: new Date(2026, 2, 10, 16, 0),
    location: "Technical University of Sofia",
  },
];

const EventCalendarIntegration = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportSettings, setExportSettings] = useState({
    includeDescription: true,
    includeLocation: true,
    setReminder: true,
    reminderMinutes: 30,
  });
  
  // Generate ICS file content for single event
  const generateICS = (event: CalendarEvent) => {
    const formatDate = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };
    
    const escapeText = (text: string) => {
      return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };
    
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BAMAS//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${event.id}@bamas.xyz`,
      `DTSTART:${formatDate(event.start)}`,
      `DTEND:${formatDate(event.end)}`,
      `SUMMARY:${escapeText(event.title)}`,
    ];
    
    if (exportSettings.includeDescription && event.description) {
      ics.push(`DESCRIPTION:${escapeText(event.description)}`);
    }
    
    if (exportSettings.includeLocation && event.location) {
      ics.push(`LOCATION:${escapeText(event.location)}`);
    }
    
    if (event.url) {
      ics.push(`URL:${event.url}`);
    }
    
    if (exportSettings.setReminder) {
      ics.push('BEGIN:VALARM');
      ics.push('ACTION:DISPLAY');
      ics.push(`TRIGGER:-PT${exportSettings.reminderMinutes}M`);
      ics.push(`DESCRIPTION:Reminder: ${escapeText(event.title)}`);
      ics.push('END:VALARM');
    }
    
    ics.push('END:VEVENT');
    ics.push('END:VCALENDAR');
    
    return ics.join('\r\n');
  };
  
  // Generate ICS for all events
  const generateAllEventsICS = () => {
    const formatDate = (date: Date) => {
      return format(date, "yyyyMMdd'T'HHmmss");
    };
    
    const escapeText = (text: string) => {
      return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };
    
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BAMAS//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:BAMAS Events',
    ];
    
    events.forEach(event => {
      icsLines.push('BEGIN:VEVENT');
      icsLines.push(`UID:${event.id}@bamas.xyz`);
      icsLines.push(`DTSTART:${formatDate(event.start)}`);
      icsLines.push(`DTEND:${formatDate(event.end)}`);
      icsLines.push(`SUMMARY:${escapeText(event.title)}`);
      
      if (exportSettings.includeDescription && event.description) {
        icsLines.push(`DESCRIPTION:${escapeText(event.description)}`);
      }
      
      if (exportSettings.includeLocation && event.location) {
        icsLines.push(`LOCATION:${escapeText(event.location)}`);
      }
      
      if (event.url) {
        icsLines.push(`URL:${event.url}`);
      }
      
      if (exportSettings.setReminder) {
        icsLines.push('BEGIN:VALARM');
        icsLines.push('ACTION:DISPLAY');
        icsLines.push(`TRIGGER:-PT${exportSettings.reminderMinutes}M`);
        icsLines.push(`DESCRIPTION:Reminder: ${escapeText(event.title)}`);
        icsLines.push('END:VALARM');
      }
      
      icsLines.push('END:VEVENT');
    });
    
    icsLines.push('END:VCALENDAR');
    return icsLines.join('\r\n');
  };
  
  // Generate Google Calendar URL
  const generateGoogleCalendarUrl = (event: CalendarEvent) => {
    const formatDate = (date: Date) => format(date, "yyyyMMdd'T'HHmmss'Z'");
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${formatDate(event.start)}/${formatDate(event.end)}`,
    });
    
    if (event.description) {
      params.append('details', event.description);
    }
    
    if (event.location) {
      params.append('location', event.location);
    }
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };
  
  // Generate Outlook Web URL
  const generateOutlookUrl = (event: CalendarEvent) => {
    const formatDate = (date: Date) => date.toISOString();
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: event.title,
      startdt: formatDate(event.start),
      enddt: formatDate(event.end),
    });
    
    if (event.description) {
      params.append('body', event.description);
    }
    
    if (event.location) {
      params.append('location', event.location);
    }
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  };
  
  const handleDownloadICS = (event?: CalendarEvent) => {
    const icsContent = event ? generateICS(event) : generateAllEventsICS();
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = event ? `bamas-${event.id}.ics` : 'bamas-events.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t("dashboard.calendar.downloaded") || "Calendar Downloaded",
      description: t("dashboard.calendar.downloadedDesc") || "ICS file downloaded successfully",
    });
  };
  
  const handleCopyLink = async (type: 'google' | 'outlook', event: CalendarEvent) => {
    const url = type === 'google' ? generateGoogleCalendarUrl(event) : generateOutlookUrl(event);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(`${type}-${event.id}`);
      setTimeout(() => setCopied(null), 2000);
      toast({
        title: t("dashboard.calendar.linkCopied") || "Link Copied",
        description: t("dashboard.calendar.linkCopiedDesc") || "Calendar link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: t("dashboard.calendar.error") || "Error",
        description: t("dashboard.calendar.copyError") || "Failed to copy link",
        variant: "destructive",
      });
    }
  };
  
  const handleOpenCalendar = (type: 'google' | 'outlook', event: CalendarEvent) => {
    const url = type === 'google' ? generateGoogleCalendarUrl(event) : generateOutlookUrl(event);
    window.open(url, '_blank');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarPlus className="h-6 w-6" />
          <h2 className="text-2xl font-bold">{t("dashboard.calendar.title") || "Calendar Integration"}</h2>
        </div>
        <Button onClick={() => setShowExportDialog(true)} className="rounded-full">
          <Download className="mr-2 h-4 w-4" />
          {t("dashboard.calendar.exportAll") || "Export All Events"}
        </Button>
      </div>
      
      <p className="text-muted-foreground">
        {t("dashboard.calendar.description") || "Add BAMAS events to your personal calendar. Export to Google Calendar, Outlook, Apple Calendar, or download ICS files."}
      </p>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDownloadICS()}>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{t("dashboard.calendar.downloadICS") || "Download ICS"}</h3>
              <p className="text-sm text-muted-foreground">{t("dashboard.calendar.downloadICSDesc") || "For any calendar app"}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => events.length > 0 && handleOpenCalendar('google', events[0])}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-red-500/10 rounded-full">
              <CalendarDays className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-semibold">{t("dashboard.calendar.googleCalendar") || "Google Calendar"}</h3>
              <p className="text-sm text-muted-foreground">{t("dashboard.calendar.addToGoogle") || "Add events directly"}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => events.length > 0 && handleOpenCalendar('outlook', events[0])}
        >
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold">{t("dashboard.calendar.outlook") || "Outlook"}</h3>
              <p className="text-sm text-muted-foreground">{t("dashboard.calendar.addToOutlook") || "Add to Outlook calendar"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("dashboard.calendar.upcomingEvents") || "Upcoming Events"}
          </CardTitle>
          <CardDescription>
            {t("dashboard.calendar.upcomingEventsDesc") || "Click on an event to add it to your calendar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {events.map(event => (
            <Card key={event.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(event.start, 'PPp')}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    {event.url && (
                      <a 
                        href={event.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 mt-2 hover:underline"
                      >
                        <Globe className="h-3 w-3" />
                        {t("dashboard.calendar.visitWebsite") || "Visit Website"}
                      </a>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleDownloadICS(event)}
                    >
                      <Download className="mr-2 h-3 w-3" />
                      ICS
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleOpenCalendar('google', event)}
                    >
                      <CalendarDays className="mr-2 h-3 w-3 text-red-500" />
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleOpenCalendar('outlook', event)}
                    >
                      <Mail className="mr-2 h-3 w-3 text-blue-500" />
                      Outlook
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {events.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("dashboard.calendar.noEvents") || "No upcoming events"}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* iCal Feed URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            {t("dashboard.calendar.feedTitle") || "Calendar Feed"}
          </CardTitle>
          <CardDescription>
            {t("dashboard.calendar.feedDesc") || "Subscribe to get automatic updates when new events are added"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input 
              readOnly 
              value="https://bamas.xyz/api/calendar/events.ics" 
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={async () => {
                await navigator.clipboard.writeText("https://bamas.xyz/api/calendar/events.ics");
                toast({ title: "Copied!", description: "Feed URL copied to clipboard" });
              }}
              className="rounded-full"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("dashboard.calendar.feedHelp") || "Paste this URL in your calendar app to subscribe. Events will sync automatically."}
          </p>
        </CardContent>
      </Card>
      
      {/* Export Settings Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t("dashboard.calendar.exportSettings") || "Export Settings"}</DialogTitle>
            <DialogDescription>
              {t("dashboard.calendar.exportSettingsDesc") || "Customize what to include in the exported calendar"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label>{t("dashboard.calendar.includeDescription") || "Include descriptions"}</Label>
              <Switch
                checked={exportSettings.includeDescription}
                onCheckedChange={(v) => setExportSettings(prev => ({ ...prev, includeDescription: v }))}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>{t("dashboard.calendar.includeLocation") || "Include locations"}</Label>
              <Switch
                checked={exportSettings.includeLocation}
                onCheckedChange={(v) => setExportSettings(prev => ({ ...prev, includeLocation: v }))}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <Label>{t("dashboard.calendar.setReminder") || "Set reminder"}</Label>
              <Switch
                checked={exportSettings.setReminder}
                onCheckedChange={(v) => setExportSettings(prev => ({ ...prev, setReminder: v }))}
              />
            </div>
            
            {exportSettings.setReminder && (
              <div className="space-y-2">
                <Label>{t("dashboard.calendar.reminderTime") || "Reminder time"}</Label>
                <Select
                  value={String(exportSettings.reminderMinutes)}
                  onValueChange={(v) => setExportSettings(prev => ({ ...prev, reminderMinutes: parseInt(v) }))}
                >
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes before</SelectItem>
                    <SelectItem value="15">15 minutes before</SelectItem>
                    <SelectItem value="30">30 minutes before</SelectItem>
                    <SelectItem value="60">1 hour before</SelectItem>
                    <SelectItem value="1440">1 day before</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)} className="rounded-full">
              {t("common.cancel") || "Cancel"}
            </Button>
            <Button onClick={() => { handleDownloadICS(); setShowExportDialog(false); }} className="rounded-full">
              <Download className="mr-2 h-4 w-4" />
              {t("dashboard.calendar.downloadAll") || "Download All"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventCalendarIntegration;
