import { db } from "@/db/db";
import { rooms, roomPlayers, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) => {
  const { code } = await params;

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });

  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const players = await db
    .select({
      userId: roomPlayers.userId,
      name: user.name,
      image: user.image,
      elo: user.elo,
    })
    .from(roomPlayers)
    .innerJoin(user, eq(roomPlayers.userId, user.id))
    .where(eq(roomPlayers.roomId, room.id));

  return NextResponse.json({ status: room.status, hostId: room.hostId, players });
};
