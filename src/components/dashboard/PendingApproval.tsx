import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PendingApproval = () => {
  const { t } = useLanguage();
  
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <CardTitle>
            {t("dashboard.pendingApproval.title") || "Account Pending Approval"}
          </CardTitle>
        </div>
        <CardDescription>
          {t("dashboard.pendingApproval.description") || "Your account is waiting for administrator approval."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
          <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {t("dashboard.pendingApproval.message") || "What happens next?"}
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>{t("dashboard.pendingApproval.step1") || "A superadmin will review your registration"}</li>
              <li>{t("dashboard.pendingApproval.step2") || "You'll receive access once approved"}</li>
              <li>{t("dashboard.pendingApproval.step3") || "You can browse menu items but cannot access content yet"}</li>
            </ul>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {t("dashboard.pendingApproval.contact") || "If you have questions, please contact an administrator."}
        </p>
      </CardContent>
    </Card>
  );
};

export default PendingApproval;

