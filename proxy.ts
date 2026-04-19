import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

const protectedRoutes = ["/", "/library", "/search"];
const publicRoutes = ["/login", "/register", "/api/image"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.includes(path) || path.startsWith("/playlist/");
  const isPublicRoute = publicRoutes.includes(path);

  const cookie = req.cookies.get("zound_session")?.value;
  const session = await decrypt(cookie);

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isPublicRoute && session && path !== "/api/image") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|covers|mock|.*\\.png$).*)"],
};
