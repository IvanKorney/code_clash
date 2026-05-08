import { db } from "@/db/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getEloTier, ELO_TIER_COLORS } from "@/lib/elo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import { cn } from "@/lib/utils";
import { desc, gt, eq, count } from "drizzle-orm";
import { headers } from "next/headers";

const RANK_COLORS: Record<number, string> = {
  1: "text-yellow-400 font-bold",
  2: "text-slate-300 font-bold",
  3: "text-amber-600 font-bold",
};

const PlayerRow = ({
  rank,
  player,
  isMe,
}: {
  rank: number;
  player: { id: string; name: string; username: string | null; image: string | null; elo: number };
  isMe: boolean;
}) => {
  const tier = getEloTier(player.elo);
  const displayName = player.username ?? player.name;
  const initials = player.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Row
      className={cn(
        "items-center gap-4 rounded-lg border border-border px-4 py-3",
        isMe && "border-primary/40 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "w-7 text-right text-sm tabular-nums text-muted-foreground",
          RANK_COLORS[rank],
        )}
      >
        {rank}
      </span>
      <Avatar className="h-8 w-8">
        {player.image && <AvatarImage src={player.image} alt={displayName} />}
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <span className="flex-1 text-sm font-medium truncate">
        {displayName}
        {isMe && (
          <span className="ml-2 text-xs text-muted-foreground">(you)</span>
        )}
      </span>
      <Badge variant="outline" className={cn("text-xs", ELO_TIER_COLORS[tier])}>
        {tier}
      </Badge>
      <span className="text-sm font-semibold tabular-nums w-16 text-right">
        {player.elo} ELO
      </span>
    </Row>
  );
};

const LeaderboardPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  const top100 = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      elo: user.elo,
    })
    .from(user)
    .orderBy(desc(user.elo))
    .limit(100);

  // Fetch current user's rank if logged in and not in top 100
  let myRank: { rank: number; player: typeof top100[number] } | null = null;
  if (session && top100.findIndex((p) => p.id === session.user.id) === -1) {
    const [myData] = await db
      .select({ id: user.id, name: user.name, username: user.username, image: user.image, elo: user.elo })
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (myData) {
      const [{ above }] = await db
        .select({ above: count() })
        .from(user)
        .where(gt(user.elo, myData.elo));
      myRank = { rank: above + 1, player: myData };
    }
  }

  return (
    <main className="flex flex-1 justify-center py-10 px-4">
      <Column className="w-full max-w-2xl gap-6">
        <Column className="gap-1">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top 100 players by ELO</p>
        </Column>

        {myRank && (
          <Column className="gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Your Position
            </span>
            <PlayerRow rank={myRank.rank} player={myRank.player} isMe />
          </Column>
        )}

        <Column className="gap-1">
          {top100.map((player, i) => (
            <PlayerRow
              key={player.id}
              rank={i + 1}
              player={player}
              isMe={session?.user.id === player.id}
            />
          ))}
        </Column>
      </Column>
    </main>
  );
};

export default LeaderboardPage;
