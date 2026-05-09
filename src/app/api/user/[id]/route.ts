import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { user as dbUser } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  const user = await db.query.user.findFirst({
    where: eq(dbUser.id, id),
  });

  return NextResponse.json({ user });
};

export const PATCH = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { username, bio, preferredLanguage, linkedin, twitter, instagram } = body;

  const isValidUrl = (val: unknown) => {
    if (!val) return true;
    try {
      const u = new URL(val as string);
      return u.protocol === "https:";
    } catch {
      return false;
    }
  };

  if (!isValidUrl(linkedin) || !isValidUrl(twitter) || !isValidUrl(instagram)) {
    return NextResponse.json(
      { error: "Social links must be valid https:// URLs" },
      { status: 400 },
    );
  }

  await db
    .update(dbUser)
    .set({
      ...(username !== undefined && { username: username || null }),
      ...(bio !== undefined && { bio: bio || null }),
      ...(preferredLanguage !== undefined && { preferredLanguage }),
      ...(linkedin !== undefined && { linkedin: linkedin || null }),
      ...(twitter !== undefined && { twitter: twitter || null }),
      ...(instagram !== undefined && { instagram: instagram || null }),
    })
    .where(eq(dbUser.id, id));

  return NextResponse.json({ ok: true });
};
