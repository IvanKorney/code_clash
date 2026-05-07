import { db } from "@/db/db";
import { rooms, roomPlayers, matches, eloHistory, user } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { calcElo } from "./elo";
import { broadcastToRoom } from "./supabase-server";

type ResultType = "completed" | "forfeit" | "timeout";

export const resolveMatch = async (roomId: string, resultType: ResultType) => {
  // Atomically claim resolution — if room is already finished, bail out
  const updated = await db
    .update(rooms)
    .set({ status: "finished" })
    .where(and(eq(rooms.id, roomId), eq(rooms.status, "in_progress")))
    .returning();

  if (updated.length === 0 || !updated[0].problemSlug) {
    return;
  }

  const room = updated[0];

  const players = await db
    .select({
      userId: roomPlayers.userId,
      hasPassed: roomPlayers.hasPassed,
      testCasesPassed: roomPlayers.testCasesPassed,
      finishedAt: roomPlayers.finishedAt,
      elo: user.elo,
    })
    .from(roomPlayers)
    .innerJoin(user, eq(roomPlayers.userId, user.id))
    .where(eq(roomPlayers.roomId, roomId));

  if (players.length < 2) return;

  const [a, b] = players;

  // Determine winner
  let winnerId: string | null = null;
  let loserId: string | null = null;
  let scoreA: 1 | 0.5 | 0 = 0.5;

  if (a.hasPassed && !b.hasPassed) {
    scoreA = 1;
    winnerId = a.userId;
    loserId = b.userId;
  } else if (b.hasPassed && !a.hasPassed) {
    scoreA = 0;
    winnerId = b.userId;
    loserId = a.userId;
  } else if (a.hasPassed && b.hasPassed) {
    // Both passed — earlier finishedAt wins
    const aFirst =
      !!a.finishedAt && !!b.finishedAt && a.finishedAt < b.finishedAt;
    scoreA = aFirst ? 1 : 0;
    winnerId = aFirst ? a.userId : b.userId;
    loserId = aFirst ? b.userId : a.userId;
  } else {
    // Timeout — compare partial progress
    if (a.testCasesPassed > b.testCasesPassed) {
      scoreA = 1;
      winnerId = a.userId;
      loserId = b.userId;
    } else if (b.testCasesPassed > a.testCasesPassed) {
      scoreA = 0;
      winnerId = b.userId;
      loserId = a.userId;
    } else {
      scoreA = 0.5; // draw — no ELO change per plan
    }
  }

  const isDraw = scoreA === 0.5;
  let deltaA = 0,
    deltaB = 0,
    newA = a.elo,
    newB = b.elo;

  if (!isDraw) {
    ({ newA, newB, deltaA, deltaB } = calcElo(a.elo, b.elo, scoreA as 1 | 0));
  }

  const durationSeconds = room.matchStartedAt
    ? Math.floor((Date.now() - new Date(room.matchStartedAt).getTime()) / 1000)
    : 0;

  const matchId = crypto.randomUUID();

  await db.insert(matches).values({
    id: matchId,
    roomId,
    problemSlug: room.problemSlug!, // guarded above
    durationSeconds,
    resultType,
    ...(winnerId != null
      ? {
          winnerId,
          loserId: loserId!,
          winnerEloBefore: winnerId === a.userId ? a.elo : b.elo,
          loserEloBefore: loserId! === a.userId ? a.elo : b.elo,
          winnerEloAfter: winnerId === a.userId ? newA : newB,
          loserEloAfter: loserId! === a.userId ? newA : newB,
        }
      : {}),
  });

  await db.insert(eloHistory).values([
    {
      id: crypto.randomUUID(),
      userId: a.userId,
      matchId,
      eloBefore: a.elo,
      eloAfter: newA,
      delta: deltaA,
    },
    {
      id: crypto.randomUUID(),
      userId: b.userId,
      matchId,
      eloBefore: b.elo,
      eloAfter: newB,
      delta: deltaB,
    },
  ]);

  if (!isDraw) {
    await Promise.all([
      db.update(user).set({ elo: newA }).where(eq(user.id, a.userId)),
      db.update(user).set({ elo: newB }).where(eq(user.id, b.userId)),
    ]);
  }

  broadcastToRoom(roomId, "match_resolved", {
    winnerId,
    loserId,
    players: [
      { userId: a.userId, delta: deltaA, eloAfter: newA },
      { userId: b.userId, delta: deltaB, eloAfter: newB },
    ],
  }).catch((e) => console.error("broadcast failed", e));
};
