import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Lock, User, CreditCard, Link as LinkIcon } from "lucide-react";

export function SettingsPage() {
  const [emailDigest, setEmailDigest] = useState("daily");
  const [newJobAlerts, setNewJobAlerts] = useState(true);
  const [applicationReminders, setApplicationReminders] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences and settings
          </p>
        </div>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Account Settings
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Email Address</p>
                  <p className="text-sm text-gray-600">john.doe@example.com</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div>
                  <p className="font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-600">••••••••</p>
                </div>
                <Button variant="outline" size="sm">
                  Change
                </Button>
              </div>

              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">Not enabled</p>
                </div>
                <Button variant="outline" size="sm">
                  Enable
                </Button>
              </div>
            </div>
          </Card>

          {/* Notification Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Notifications
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Digest Frequency
                </label>
                <select
                  value={emailDigest}
                  onChange={(e) => setEmailDigest(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="realtime">Real-time</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">New High-Score Jobs</p>
                    <p className="text-sm text-gray-600">
                      Get notified when jobs with TrueScore {">"} 80 match your profile
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newJobAlerts}
                    onChange={(e) => setNewJobAlerts(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Application Reminders</p>
                    <p className="text-sm text-gray-600">
                      Remind me to follow up on applications
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={applicationReminders}
                    onChange={(e) => setApplicationReminders(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                </label>

                <label className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-900">Skill Gap Updates</p>
                    <p className="text-sm text-gray-600">
                      Weekly recommendations for skills to learn
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300"
                  />
                </label>
              </div>
            </div>
          </Card>

          {/* Privacy Settings */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Privacy
              </h2>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Profile Visibility</p>
                  <p className="text-sm text-gray-600">
                    Allow recruiters to find your profile
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300"
                />
              </label>

              <label className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-sm text-gray-600">
                    Help improve TrueHire by sharing anonymous usage data
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-gray-300"
                />
              </label>
            </div>
          </Card>

          {/* Integrations */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <LinkIcon className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Integrations
              </h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-bold">
                    in
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">LinkedIn</p>
                    <p className="text-sm text-gray-600">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>

              <div className="flex items-center justify-between py-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center text-white font-bold">
                    ID
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Indeed</p>
                    <p className="text-sm text-gray-600">Not connected</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  Connect
                </Button>
              </div>
            </div>
          </Card>

          {/* Subscription */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Subscription
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Current Plan</p>
                  <p className="text-sm text-gray-600">Free Plan</p>
                </div>
                <Button>Upgrade to Pro</Button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Pro Benefits:</strong> Unlimited job searches, advanced analytics,
                  priority support, and more.
                </p>
              </div>
            </div>
          </Card>

          {/* Danger Zone */}
          <Card className="p-6 border-red-200">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Danger Zone
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-red-200">
                <div>
                  <p className="font-medium text-gray-900">Export Data</p>
                  <p className="text-sm text-gray-600">
                    Download all your data in JSON format
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">Delete Account</p>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end gap-3">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
