import { NextRequest, NextResponse } from "next/server";
import { supabaseMiddleware, isAdminEmail } from "@/lib/supabase-server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // /admin/login must stay reachable, everything else under /admin
  // (and /api/admin) is gated.
  const isGated =
    (req.nextUrl.pathname.startsWith("/admin") &&
      req.nextUrl.pathname !== "/admin/login") ||
    req.nextUrl.pathname.startsWith("/api/admin");

  if (!isGated) {
    return res;
  }

  const supabase = supabaseMiddleware(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    if (req.nextUrl.pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
    const loginUrl = new URL("/admin/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return res;
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
