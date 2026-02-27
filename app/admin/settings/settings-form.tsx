"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePlatformSetting } from "@/lib/actions/admin-actions";

interface SettingsFormProps {
  signupsBlocked: boolean;
  emailWhitelistEnabled: boolean;
  requireEmailVerification: boolean;
}

export function SettingsForm({
  signupsBlocked,
  emailWhitelistEnabled,
  requireEmailVerification,
}: SettingsFormProps) {
  const [blocked, setBlocked] = useState(signupsBlocked);
  const [whitelist, setWhitelist] = useState(emailWhitelistEnabled);
  const [verification, setVerification] = useState(requireEmailVerification);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await Promise.all([
        updatePlatformSetting("signups_blocked", blocked),
        updatePlatformSetting("email_whitelist_enabled", whitelist),
        updatePlatformSetting("require_email_verification", verification),
      ]);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label className="text-base font-medium">Block Signups</Label>
          <p className="text-sm text-muted-foreground">
            When enabled, new users cannot create accounts
          </p>
        </div>
        <input
          type="checkbox"
          checked={blocked}
          onChange={(e) => setBlocked(e.target.checked)}
          className="h-4 w-4"
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label className="text-base font-medium">Email Whitelist</Label>
          <p className="text-sm text-muted-foreground">
            When enabled, only whitelisted domains/emails can sign up
          </p>
        </div>
        <input
          type="checkbox"
          checked={whitelist}
          onChange={(e) => setWhitelist(e.target.checked)}
          className="h-4 w-4"
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <Label className="text-base font-medium">Require Email Verification</Label>
          <p className="text-sm text-muted-foreground">
            Users must verify email before accessing the app
          </p>
        </div>
        <input
          type="checkbox"
          checked={verification}
          onChange={(e) => setVerification(e.target.checked)}
          className="h-4 w-4"
        />
      </div>
      <Button onClick={handleSave} disabled={loading}>
        {loading ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
