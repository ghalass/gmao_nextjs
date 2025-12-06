import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const session = await getSession();

  const publicPaths = [
    "/",
    "/about",
    "/login",
    "/register",
    "/api/users",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/auth/me",
  ];

  // 🔓 Routes publiques
  if (
    publicPaths.some(
      (path) => pathname === path || pathname.startsWith(path + "/")
    )
  ) {
    if (
      session.isLoggedIn &&
      (pathname === "/login" || pathname === "/register")
    ) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  }

  // 🔒 Routes privées
  const decoded = session.isLoggedIn ? session : null;

  if (!decoded) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
