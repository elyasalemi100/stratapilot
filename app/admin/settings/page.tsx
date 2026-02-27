import {
  getPlatformSettings,
  updatePlatformSetting,
} from "@/lib/actions/admin-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Control signups, email verification, and whitelist
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Signup & Access Control</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
              signupsBlocked={
                settings.signups_blocked === true ||
                settings.signups_blocked === "true"
              }
              emailWhitelistEnabled={
                settings.email_whitelist_enabled === true ||
                settings.email_whitelist_enabled === "true"
              }
              requireEmailVerification={
                settings.require_email_verification !== false &&
                settings.require_email_verification !== "false"
              }
            />
        </CardContent>
      </Card>
    </div>
  );
}
