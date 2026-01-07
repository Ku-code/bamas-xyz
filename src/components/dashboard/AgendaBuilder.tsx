import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { updateAgendaItemOrder, type AgendaItem } from "@/lib/agenda";
import { GripVertical, Plus } from "lucide-react";

interface AgendaBuilderProps {
  meetingId: string;
  agendaId: string;
  agendaItems: AgendaItem[];
  onAgendaUpdated: () => void;
}

const AgendaBuilder = ({ meetingId, agendaId, agendaItems, onAgendaUpdated }: AgendaBuilderProps) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [items, setItems] = useState<AgendaItem[]>(agendaItems);

  const handleOrderChange = async (newOrder: Array<{ id: string; order_index: number }>) => {
    try {
      await updateAgendaItemOrder(newOrder);
      toast({
        title: t("dashboard.agenda.order.success.title") || "Order Updated",
        description: t("dashboard.agenda.order.success.description") || "Agenda item order has been updated.",
      });
      onAgendaUpdated();
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: t("dashboard.agenda.order.error.title") || "Error",
        description: t("dashboard.agenda.order.error.description") || "Failed to update order.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t("dashboard.agenda.builder.title") || "Agenda Items"}</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t("dashboard.agenda.builder.empty") || "No agenda items yet."}
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50"
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{index + 1}.</span>
                      <span>{item.title}</span>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgendaBuilder;

