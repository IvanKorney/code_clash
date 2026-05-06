import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { rooms } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { addPlayerToRoom } from "@/app/actions/rooms";
import { WaitingLobby } from "./WaitingLobby";
import { Column } from "@/components/layout/Column";

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

  return (
    <main className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">
        Match starting — coming in step 8!
      </p>
    </main>
  );
};

export default RoomPage;
