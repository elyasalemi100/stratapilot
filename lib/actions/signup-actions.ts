"use server";

import { createClient } from "@/lib/supabase/server";

export async function checkSignupEligible(email: string): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const supabase = await createClient();

  const { data: signupsBlocked } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "signups_blocked")
    .single();

  if (signupsBlocked?.value === true || signupsBlocked?.value === "true") {
    return { allowed: false, reason: "Signups are currently disabled." };
  }

  const { data: whitelistEnabled } = await supabase
    .from("platform_settings")
    .select("value")
    .eq("key", "email_whitelist_enabled")
    .single();

  if (whitelistEnabled?.value === true || whitelistEnabled?.value === "true") {
    const { data: patterns } = await supabase
      .from("email_whitelist")
      .select("pattern, pattern_type");

    const normalizedEmail = email.trim().toLowerCase();
    const matched = (patterns ?? []).some((p) => {
      if (p.pattern_type === "exact") {
        return p.pattern === normalizedEmail;
      }
      if (p.pattern_type === "domain") {
        const domain = p.pattern.startsWith("@") ? p.pattern : `@${p.pattern}`;
        return normalizedEmail.endsWith(domain);
      }
      return false;
    });

    if (!matched) {
      return {
        allowed: false,
        reason: "Your email domain is not on the signup whitelist.",
      };
    }
  }

  return { allowed: true };
}

export async function getSignupStatus(): Promise<{
  blocked: boolean;
  whitelistEnabled: boolean;
}> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["signups_blocked", "email_whitelist_enabled"]);

  const map = Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
  return {
    blocked: map.signups_blocked === true || map.signups_blocked === "true",
    whitelistEnabled:
      map.email_whitelist_enabled === true ||
      map.email_whitelist_enabled === "true",
  };
}
