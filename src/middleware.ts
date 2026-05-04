import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { PROTECTED_ROUTE_MATCHERS, PROTECTED_ROUTES } from "./lib/consts";

type Session = typeof auth.$Infer.Session;

export const middleware = async (request: NextRequest) => {
  const isProtected = PROTECTED_ROUTES.some((route) =>
    request.nextUrl.pathname.startsWith(route),
  );

  if (!isProtected) return NextResponse.next();

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: { cookie: request.headers.get("cookie") ?? "" },
    },
  );

  if (!session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
};

export const config = {
  matcher: PROTECTED_ROUTE_MATCHERS,
};
