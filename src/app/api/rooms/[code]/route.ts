import { db } from "@/db/db";
import { rooms, roomPlayers, user, problems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { TestCase } from "@/types/problem";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) => {
  const { code } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 });
  }

  const [players, problem] = await Promise.all([
    db
      .select({
        userId: roomPlayers.userId,
        name: user.name,
        image: user.image,
        elo: user.elo,
        testCasesPassed: roomPlayers.testCasesPassed,
        totalTestCases: roomPlayers.totalTestCases,
        hasPassed: roomPlayers.hasPassed,
      })
      .from(roomPlayers)
      .innerJoin(user, eq(roomPlayers.userId, user.id))
      .where(eq(roomPlayers.roomId, room.id)),
    room.problemSlug
      ? db.query.problems.findFirst({
          where: eq(problems.slug, room.problemSlug),
          columns: { testCases: true },
        })
      : Promise.resolve(null),
  ]);

  const totalTestCases = (problem?.testCases as TestCase[])?.length ?? 0;

  return NextResponse.json({
    status: room.status,
    hostId: room.hostId,
    players,
    totalTestCases,
  });
};
