import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes("your-project")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, value ? (options as object) : { ...options, maxAge: 0 });
          });
        },
      },
    }
  );

  let user;
  try {
    const { data } = await supabase.auth.getUser();
    user = data?.user;
  } catch {
    return supabaseResponse;
  }

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/signup");
  const isAccountSuspended = request.nextUrl.pathname === "/account-suspended";
  const isSignOut = request.nextUrl.pathname === "/auth/signout";

  if (!user && !isAuthPage && !request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  if (user && !isAccountSuspended && !isSignOut) {
    const { data: profile } = await supabase
      .from("users_profile")
      .select("status, role, management_company_id")
      .eq("id", user.id)
      .single();

    if (profile?.status === "suspended" || profile?.status === "banned") {
      const url = request.nextUrl.clone();
      url.pathname = "/account-suspended";
      return NextResponse.redirect(url);
    }

    // Subscription gate: block dashboard access without valid subscription
    const pathname = request.nextUrl.pathname;
    const isBillingRequired = pathname === "/billing-required";
    const isBillingPage = pathname.match(/^\/[^/]+\/settings\/billing$/);
    const skipSubscriptionCheck =
      isBillingRequired || isBillingPage || pathname === "/";

    if (!skipSubscriptionCheck) {
      // platform_super_admin bypasses
      if (profile?.role === "platform_super_admin") {
        return supabaseResponse;
      }

      if (profile?.management_company_id) {
        const { data: company } = await supabase
          .from("management_companies")
          .select("is_enterprise, stripe_subscription_id, subscription_status")
          .eq("id", profile.management_company_id)
          .single();

        const hasAccess =
          company?.is_enterprise ||
          (company?.stripe_subscription_id &&
            company?.subscription_status !== "canceled" &&
            company?.subscription_status !== "unpaid");

        if (!hasAccess) {
          const url = request.nextUrl.clone();
          url.pathname = "/billing-required";
          return NextResponse.redirect(url);
        }
      } else {
        // No management company - new users go to billing-required
        const url = request.nextUrl.clone();
        url.pathname = "/billing-required";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
