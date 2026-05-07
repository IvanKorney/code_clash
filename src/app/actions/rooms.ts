"use server";

import { db } from "@/db/db";
import { rooms, roomPlayers, user, problems } from "@/db/schema";
import { type Difficulty } from "@/lib/consts";
import { auth } from "@/lib/auth";
import { eq, and, ne } from "drizzle-orm";
import { broadcastToRoom, broadcastToWaitingRoom } from "@/lib/supabase-server";
import { resolveMatch } from "@/lib/resolve";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type RoomStatus = "waiting" | "in_progress" | "finished" | "abandoned";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () =>
  Array.from(
    crypto.getRandomValues(new Uint8Array(6)),
    (b) => CHARS[b % CHARS.length],
  ).join("");

const getUniqueCode = async (): Promise<string> => {
  const code = generateCode();
  const existing = await db.query.rooms.findFirst({
    where: eq(rooms.code, code),
  });
  return existing ? getUniqueCode() : code;
};

export const createRoom = async (difficulty: Difficulty, timeLimitMinutes: number) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const code = await getUniqueCode();

  await db.insert(rooms).values({
    id: crypto.randomUUID(),
    code,
    hostId: session.user.id,
    difficulty,
    timeLimitMinutes,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h * 60m * 60s * 1000ms = 1 day
  });

  redirect(`/room/${code}`);
};

export const addPlayerToRoom = async (
  roomId: string,
  userId: string,
): Promise<RoomStatus> => {
  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
  if (!room || room.status !== "waiting") return room?.status ?? "abandoned";

  const existing = await db.query.roomPlayers.findFirst({
    where: and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, userId)),
  });

  if (!existing) {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });
    await db.insert(roomPlayers).values({
      id: crypto.randomUUID(),
      roomId,
      userId,
      language: userRecord?.preferredLanguage ?? "javascript",
    });
  }

  const players = await db.query.roomPlayers.findMany({
    where: eq(roomPlayers.roomId, roomId),
  });

  if (players.length >= 2) {
    const problemPool = await db.query.problems.findMany({
      where: and(eq(problems.difficulty, room.difficulty), eq(problems.isActive, true)),
      columns: { slug: true },
    });
    const picked = problemPool[Math.floor(Math.random() * problemPool.length)];

    await db
      .update(rooms)
      .set({ status: "in_progress", matchStartedAt: new Date(), problemSlug: picked?.slug ?? null })
      .where(eq(rooms.id, roomId));
    broadcastToWaitingRoom(roomId, "match_started").catch(console.error);
    return "in_progress";
  }

  return "waiting";
};

export const forfeitMatch = async (roomId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  await db
    .update(roomPlayers)
    .set({ finishedAt: new Date() })
    .where(and(eq(roomPlayers.roomId, roomId), eq(roomPlayers.userId, session.user.id)));

  await db
    .update(roomPlayers)
    .set({ hasPassed: true })
    .where(and(eq(roomPlayers.roomId, roomId), ne(roomPlayers.userId, session.user.id)));

  broadcastToRoom(roomId, "forfeit", { forfeitingUserId: session.user.id }).catch((e) => console.error("broadcast failed", e));
  resolveMatch(roomId, "forfeit").catch((e) => console.error("resolve failed", e));
};

export const resolveMatchOnTimeout = async (roomId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return;
  await resolveMatch(roomId, "timeout");
};

export const leaveRoom = async (roomId: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  await db
    .delete(roomPlayers)
    .where(
      and(
        eq(roomPlayers.roomId, roomId),
        eq(roomPlayers.userId, session.user.id),
      ),
    );

  const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
  if (room?.hostId === session.user.id) {
    await db
      .update(rooms)
      .set({ status: "abandoned" })
      .where(eq(rooms.id, roomId));
  }

  redirect("/");
};

export const joinRoom = async (code: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const room = await db.query.rooms.findFirst({
    where: and(eq(rooms.code, code.toUpperCase()), eq(rooms.status, "waiting")),
  });

  if (!room) return { error: "Room not found or already in progress" };

  const existing = await db.query.roomPlayers.findFirst({
    where: and(
      eq(roomPlayers.roomId, room.id),
      eq(roomPlayers.userId, session.user.id),
    ),
  });
  if (existing) return { error: "You're already in this room" };

  return { url: `/room/${code.toUpperCase()}` };
};
