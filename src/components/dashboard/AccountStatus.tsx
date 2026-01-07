import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, XCircle, Ban } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { MemberStatus } from "@/contexts/AuthContext";

interface AccountStatusProps {
  status: Exclude<MemberStatus, 'pending' | 'approved'>;
}

const AccountStatus = ({ status }: AccountStatusProps) => {
  const { t } = useLanguage();
  
  if (status === 'rejected') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/20">
              <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>
              {t("dashboard.rejected.title") || "Account Rejected"}
            </CardTitle>
          </div>
          <CardDescription>
            {t("dashboard.rejected.description") || "Your account registration has been rejected."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.rejected.contact") || "If you believe this is an error, please contact an administrator."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (status === 'suspended') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Ban className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle>
              {t("dashboard.suspended.title") || "Account Suspended"}
            </CardTitle>
          </div>
          <CardDescription>
            {t("dashboard.suspended.description") || "Your account has been suspended. Please contact an administrator."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              {t("dashboard.suspended.contact") || "For more information about your suspension, please contact an administrator."}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return null;
};

export default AccountStatus;

