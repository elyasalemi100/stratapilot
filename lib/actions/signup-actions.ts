"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendSignupOtpEmail } from "@/lib/utils/email";

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

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSignupOtp(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { success: false, error: "Email is required" };

  const eligibility = await checkSignupEligible(normalizedEmail);
  if (!eligibility.allowed) {
    return { success: false, error: eligibility.reason ?? "Signup not allowed" };
  }

  const supabase = createServiceClient();
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const { error: insertError } = await supabase.from("otp_verifications").insert({
    email: normalizedEmail,
    code,
    purpose: "signup",
    expires_at: expiresAt.toISOString(),
  });

  if (insertError) return { success: false, error: "Failed to create verification code" };

  try {
    await sendSignupOtpEmail({ to: normalizedEmail, code });
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to send email",
    };
  }

  return { success: true };
}

export async function verifyOtpAndSignup(
  email: string,
  code: string,
  fullName: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedCode = code.trim().replace(/\s/g, "");

  if (!normalizedEmail || !trimmedCode || !password) {
    return { success: false, error: "Email, code, and password are required" };
  }
  if (trimmedCode.length !== 6 || !/^\d{6}$/.test(trimmedCode)) {
    return { success: false, error: "Code must be 6 digits" };
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" };
  }

  const supabase = createServiceClient();

  const { data: otpRow, error: fetchError } = await supabase
    .from("otp_verifications")
    .select("id, used_at")
    .eq("email", normalizedEmail)
    .eq("code", trimmedCode)
    .eq("purpose", "signup")
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchError || !otpRow) {
    return { success: false, error: "Invalid or expired code" };
  }
  if (otpRow.used_at) {
    return { success: false, error: "Code already used" };
  }

  const { error: updateError } = await supabase
    .from("otp_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("id", otpRow.id);

  if (updateError) return { success: false, error: "Verification failed" };

  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || undefined },
  });

  if (createError) {
    if (createError.message.includes("already been registered")) {
      return { success: false, error: "An account with this email already exists. Sign in instead." };
    }
    return { success: false, error: createError.message };
  }

  if (!userData.user) return { success: false, error: "Account creation failed" };

  const { error: profileError } = await supabase.from("users_profile").insert({
    id: userData.user.id,
    email: normalizedEmail,
    full_name: fullName || null,
    role: "strata_manager",
  });

  if (profileError) {
    return { success: false, error: "Profile creation failed. Please try signing in." };
  }

  const authClient = await createClient();
  const { error: signInError } = await authClient.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });

  if (signInError) {
    return { success: false, error: "Account created. Please sign in." };
  }

  return { success: true };
}
