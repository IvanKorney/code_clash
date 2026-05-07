import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { rooms, problems, roomPlayers, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { addPlayerToRoom } from "@/app/actions/rooms";
import { WaitingLobby } from "./WaitingLobby";
import { MatchView } from "./MatchView";
import { Column } from "@/components/layout/Column";
import { SNIPPET_LANG } from "@/lib/consts";
import type { Language, TestCase } from "@/types/problem";

const RoomPage = async ({ params }: { params: Promise<{ code: string }> }) => {
  const { code } = await params;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const room = await db.query.rooms.findFirst({
    where: eq(rooms.code, code.toUpperCase()),
  });

  if (!room) notFound();

  if (room.expiresAt < new Date() && room.status === "waiting") {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Column className="items-center gap-2">
          <h1 className="text-xl font-bold">Room Expired</h1>
          <p className="text-sm text-muted-foreground">
            This room is no longer available.
          </p>
        </Column>
      </main>
    );
  }

  const status = await addPlayerToRoom(room.id, session.user.id);

  if (status === "waiting") {
    return (
      <WaitingLobby
        code={code.toUpperCase()}
        roomId={room.id}
        difficulty={room.difficulty}
        currentUserId={session.user.id}
      />
    );
  }

  // Re-fetch room — addPlayerToRoom may have just set problemSlug on this render
  const freshRoom = await db.query.rooms.findFirst({
    where: eq(rooms.id, room.id),
  });
  if (!freshRoom?.problemSlug) notFound();

  const [problem, playerList] = await Promise.all([
    db.query.problems.findFirst({
      where: eq(problems.slug, freshRoom.problemSlug),
    }),
    db
      .select({
        userId: roomPlayers.userId,
        name: user.name,
        image: user.image,
        elo: user.elo,
      })
      .from(roomPlayers)
      .innerJoin(user, eq(roomPlayers.userId, user.id))
      .where(eq(roomPlayers.roomId, room.id)),
  ]);

  if (!problem) notFound();

  const opponent = playerList.find((p) => p.userId !== session.user.id) ?? null;

  return (
    <MatchView
      code={code.toUpperCase()}
      currentUserId={session.user.id}
      matchStartedAt={freshRoom.matchStartedAt!.getTime()}
      roomId={room.id}
      timeLimitMinutes={room.timeLimitMinutes}
      problem={{
        title: problem.title,
        slug: problem.slug,
        difficulty: problem.difficulty,
        description: problem.description,
        examples: (problem.examples as TestCase[]).slice(0, 2),
        constraints: problem.constraints,
        hints: (problem.hints as string[]) ?? [],
        codeSnippets: Object.fromEntries(
          (problem.codeSnippets ?? [])
            .filter(({ langSlug }) => langSlug in SNIPPET_LANG)
            .map(({ langSlug, code }) => [SNIPPET_LANG[langSlug], code]),
        ) as Partial<Record<Language, string>>,
      }}
      opponent={opponent}
    />
  );
};

export default RoomPage;
