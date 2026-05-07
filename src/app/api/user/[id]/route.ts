import { db } from "@/db/db";
import { eq } from "drizzle-orm";
import { user as dbUser } from "@/db/schema";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  const user = await db.query.user.findFirst({
    where: eq(dbUser.id, id),
  });

  return NextResponse.json({
    user,
  });
};
