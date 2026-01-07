import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { type AgendaItem } from "@/lib/agenda";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";

interface MeetingExecutionProps {
  meetingId: string;
  agendaId: string;
  agendaItems: AgendaItem[];
}

const MeetingExecution = ({ meetingId, agendaId, agendaItems }: MeetingExecutionProps) => {
  const { t } = useLanguage();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const currentItem = agendaItems[currentItemIndex];
  const canGoNext = currentItemIndex < agendaItems.length - 1;
  const canGoPrev = currentItemIndex > 0;

  const handleNext = () => {
    if (canGoNext) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleComplete = () => {
    if (currentItem) {
      setCompletedItems(new Set([...completedItems, currentItem.id]));
      if (canGoNext) {
        setCurrentItemIndex(currentItemIndex + 1);
      }
    }
  };

  if (!currentItem) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t("dashboard.meetings.execution.noItems") || "No agenda items available."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {t("dashboard.meetings.execution.title") || "Meeting Execution"}
            </CardTitle>
            <Badge>
              {currentItemIndex + 1} / {agendaItems.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">{currentItem.title}</h3>
            <p className="text-muted-foreground">{currentItem.description}</p>
          </div>

          {currentItem.sub_items && currentItem.sub_items.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="font-semibold">{t("dashboard.meetings.execution.subItems") || "Sub-items"}</p>
              {currentItem.sub_items.map((subItem) => (
                <div key={subItem.id} className="p-3 border rounded-lg">
                  <p className="font-medium">{subItem.title}</p>
                  <p className="text-sm text-muted-foreground">{subItem.description}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={!canGoPrev}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {t("dashboard.meetings.execution.prev") || "Previous"}
            </Button>

            <Button
              onClick={handleComplete}
              disabled={completedItems.has(currentItem.id)}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {completedItems.has(currentItem.id)
                ? t("dashboard.meetings.execution.completed") || "Completed"
                : t("dashboard.meetings.execution.complete") || "Complete Item"}
            </Button>

            <Button
              variant="outline"
              onClick={handleNext}
              disabled={!canGoNext}
            >
              {t("dashboard.meetings.execution.next") || "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.meetings.execution.progress") || "Progress"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {agendaItems.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-2 p-2 rounded ${
                  index === currentItemIndex ? "bg-primary/10" : ""
                } ${completedItems.has(item.id) ? "opacity-50" : ""}`}
              >
                {completedItems.has(item.id) && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
                <span className={index === currentItemIndex ? "font-semibold" : ""}>
                  {index + 1}. {item.title}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MeetingExecution;

