import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: Parameters<typeof supabaseResponse.cookies.set>[2];
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  const isPublicAsset =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/favicon");

  if (isPublicAsset) return supabaseResponse;

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // CEO role enforcement — check app_metadata (set via admin) or JWT custom claims
  if (user && !isAuthRoute) {
    // app_metadata.role is set by the admin SQL provisioning step
    const appRole = (user.app_metadata as Record<string, string> | undefined)?.[
      "role"
    ];

    // Fallback: decode the JWT access token to read custom claims injected by
    // the custom_access_token_hook (public.custom_access_token_hook)
    let jwtRole: string | undefined;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (accessToken) {
      try {
        const parts = accessToken.split(".");
        const encodedPayload = parts[1];
        if (encodedPayload) {
          const payload = JSON.parse(
            atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
          ) as Record<string, unknown>;
          jwtRole = payload["role"] as string | undefined;
        }
      } catch {
        // malformed token — deny access
      }
    }

    const role = appRole ?? jwtRole;
    if (role !== "ceo") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (user && request.nextUrl.pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
