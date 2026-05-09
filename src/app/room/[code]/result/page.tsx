import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import {
  rooms,
  roomPlayers,
  user,
  problems,
  matches,
  eloHistory,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ResultView } from "./ResultView";
import type { MatchResult } from "@/types/problem";

const ResultPage = async ({
  params,
}: {
  params: Promise<{ code: string }>;
}) => {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });

  if (!room || room.status !== "finished") {
    redirect(`/room/${code}`);
  }

  const [match, playerList] = await Promise.all([
    db.query.matches.findFirst({ where: eq(matches.roomId, room.id) }),
    db
      .select({
        userId: roomPlayers.userId,
        solution: roomPlayers.solution,
        language: roomPlayers.language,
        name: user.name,
        image: user.image,
      })
      .from(roomPlayers)
      .innerJoin(user, eq(roomPlayers.userId, user.id))
      .where(eq(roomPlayers.roomId, room.id)),
  ]);

  if (!match) {
    redirect("/");
  }

  const [eloRows, problem] = await Promise.all([
    db
      .select({
        userId: eloHistory.userId,
        delta: eloHistory.delta,
        eloBefore: eloHistory.eloBefore,
        eloAfter: eloHistory.eloAfter,
      })
      .from(eloHistory)
      .where(eq(eloHistory.matchId, match.id)),
    db.query.problems.findFirst({
      where: eq(problems.slug, match.problemSlug),
      columns: { title: true, difficulty: true },
    }),
  ]);

  const myPlayerRow = playerList.find((p) => p.userId === session.user.id);
  const opponentRow =
    playerList.find((p) => p.userId !== session.user.id) ?? null;

  const myElo = eloRows.find((e) => e.userId === session.user.id);
  const opponentElo = opponentRow
    ? eloRows.find((e) => e.userId === opponentRow.userId)
    : null;

  let result: MatchResult;
  if (!match.winnerId) {
    result = "draw";
  } else if (
    match.winnerId === session.user.id &&
    match.resultType === "forfeit"
  ) {
    result = "walkover";
  } else if (match.winnerId === session.user.id) {
    result = "won";
  } else if (match.resultType === "forfeit") {
    result = "forfeit";
  } else {
    result = "lost";
  }

  const s = match.durationSeconds;
  const duration = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <ResultView
      roomId={room.id}
      result={result}
      myPlayer={{
        name: myPlayerRow?.name ?? session.user.name,
        image: myPlayerRow?.image ?? null,
        solution: myPlayerRow?.solution ?? null,
        language: myPlayerRow?.language ?? "javascript",
        eloBefore: myElo?.eloBefore ?? 0,
        eloAfter: myElo?.eloAfter ?? 0,
        delta: myElo?.delta ?? 0,
      }}
      opponent={
        opponentRow
          ? {
              name: opponentRow.name,
              image: opponentRow.image ?? null,
              solution: opponentRow.solution ?? null,
              language: opponentRow.language,
              eloBefore: opponentElo?.eloBefore ?? 0,
              eloAfter: opponentElo?.eloAfter ?? 0,
              delta: opponentElo?.delta ?? 0,
            }
          : null
      }
      matchInfo={{
        problemTitle: problem?.title ?? match.problemSlug,
        problemDifficulty: problem?.difficulty ?? "medium",
        duration,
        resultType: match.resultType,
      }}
    />
  );
};

export default ResultPage;
