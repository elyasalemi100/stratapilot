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
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          supabaseResponse.cookies.set(name, value, options as object);
        },
        remove(name: string, options: Record<string, unknown>) {
          supabaseResponse.cookies.set(name, "", { ...options, maxAge: 0 });
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

    // Subscription gate disabled - allow all authenticated users
  }

  return supabaseResponse;
}
