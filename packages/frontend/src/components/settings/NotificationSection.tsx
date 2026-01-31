import { Card } from "@/components/ui/card";
import { Bell, Mail, AlertTriangle } from "lucide-react";

interface NotificationSectionProps {
  settings: {
    emailDigest: string;
    newJobAlerts: boolean;
    applicationReminders: boolean;
  };
  onUpdate: (key: string, value: any) => void;
}

export function NotificationSection({
  settings,
  onUpdate,
}: NotificationSectionProps) {
  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">
            Manage how and when you want to be notified
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <label className="text-base font-medium text-foreground block mb-1">
              Email Digest
            </label>
            <p className="text-sm text-muted-foreground">
              Receive a summary of matching jobs
            </p>
          </div>
          <select
            value={settings.emailDigest}
            onChange={(e) => onUpdate("emailDigest", e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-1 text-sm h-8"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="off">Off</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-base font-medium text-foreground block mb-1">
              New Job Alerts
            </label>
            <p className="text-sm text-muted-foreground">
              Get notified when high-scoring jobs are found
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.newJobAlerts}
            onChange={(e) => onUpdate("newJobAlerts", e.target.checked)}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-base font-medium text-foreground block mb-1">
              Application Reminders
            </label>
            <p className="text-sm text-muted-foreground">
              Remind me to follow up on applications
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.applicationReminders}
            onChange={(e) => onUpdate("applicationReminders", e.target.checked)}
            className="toggle-checkbox h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
          />
        </div>
      </div>
    </Card>
  );
}
