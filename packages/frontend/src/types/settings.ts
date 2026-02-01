export interface UserSettings {
  emailDigest: "daily" | "weekly" | "never";
  newJobAlerts: boolean;
  applicationReminders: boolean;
  skillGapUpdates: boolean;
  profileVisibility: boolean;
  shareAnalytics: boolean;
  privacyMode: boolean;
  darkMode: boolean;
}
