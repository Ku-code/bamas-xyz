import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LanguageView } from "@/lib/terminology";

interface TerminologyLanguageToggleProps {
  value: LanguageView;
  onChange: (value: LanguageView) => void;
}

export const TerminologyLanguageToggle = ({ value, onChange }: TerminologyLanguageToggleProps) => {
  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Languages className="h-4 w-4 text-muted-foreground" />
      <Button
        variant={value === "both" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("both")}
        className={cn(
          "flex-1",
          value === "both" && "bg-background shadow-sm"
        )}
      >
        Both
      </Button>
      <Button
        variant={value === "english" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("english")}
        className={cn(
          "flex-1",
          value === "english" && "bg-background shadow-sm"
        )}
      >
        EN
      </Button>
      <Button
        variant={value === "bulgarian" ? "default" : "ghost"}
        size="sm"
        onClick={() => onChange("bulgarian")}
        className={cn(
          "flex-1",
          value === "bulgarian" && "bg-background shadow-sm"
        )}
      >
        BG
      </Button>
    </div>
  );
};
