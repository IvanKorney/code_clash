"use server";

import { db } from "@/db/db";
import { rooms } from "@/db/schema";
import { type Difficulty } from "@/lib/consts";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => CHARS[b % CHARS.length]).join("");

const getUniqueCode = async (): Promise<string> => {
  const code = generateCode();
  const existing = await db.query.rooms.findFirst({ where: eq(rooms.code, code) });
  return existing ? getUniqueCode() : code;
};

export const createRoom = async (difficulty: Difficulty) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const code = await getUniqueCode();

  await db.insert(rooms).values({
    id: crypto.randomUUID(),
    code,
    hostId: session.user.id,
    difficulty,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h * 60m * 60s * 1000ms = 1 day
  });

  redirect(`/room/${code}`);
};

export const joinRoom = async (code: string) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const room = await db.query.rooms.findFirst({
    where: and(eq(rooms.code, code.toUpperCase()), eq(rooms.status, "waiting")),
  });

  if (!room) return { error: "Room not found or already in progress" };

  redirect(`/room/${code.toUpperCase()}`);
};
