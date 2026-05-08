import { auth } from "@/lib/auth";
import { db } from "@/db/db";
import { user, matches, eloHistory, problems } from "@/db/schema";
import { eq, desc, count, asc, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getEloTier, ELO_TIER_COLORS } from "@/lib/elo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import { Center } from "@/components/layout/Center";
import { cn } from "@/lib/utils";
import { EloChart } from "./EloChart";
import { ExternalLink } from "lucide-react";
import type { MatchResult } from "@/types/problem";

const RESULT_STYLES: Record<MatchResult, string> = {
  won: "text-green-400",
  lost: "text-destructive",
  draw: "text-muted-foreground",
  forfeit: "text-destructive",
  walkover: "text-green-400",
};

const RESULT_LABEL: Record<MatchResult, string> = {
  won: "Won",
  lost: "Lost",
  draw: "Draw",
  forfeit: "Forfeit",
  walkover: "Walkover",
};

const StatCard = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) => (
  <Column className="flex-1 items-center gap-0.5 rounded-lg border border-border py-4">
    <span className="text-2xl font-bold tabular-nums">{value}</span>
    <span className="text-xs text-muted-foreground">{label}</span>
    {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
  </Column>
);

const ProfilePage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");

  const userId = session.user.id;

  const [profile, matchRows, eloRows, [{ wins }], [{ losses }]] =
    await Promise.all([
      db.query.user.findFirst({ where: eq(user.id, userId) }),
      db
        .select({
          matchId: eloHistory.matchId,
          delta: eloHistory.delta,
          eloBefore: eloHistory.eloBefore,
          eloAfter: eloHistory.eloAfter,
          createdAt: eloHistory.createdAt,
          winnerId: matches.winnerId,
          loserId: matches.loserId,
          resultType: matches.resultType,
          problemSlug: matches.problemSlug,
          durationSeconds: matches.durationSeconds,
        })
        .from(eloHistory)
        .innerJoin(matches, eq(eloHistory.matchId, matches.id))
        .where(eq(eloHistory.userId, userId))
        .orderBy(desc(eloHistory.createdAt))
        .limit(50),
      db
        .select({
          eloAfter: eloHistory.eloAfter,
          delta: eloHistory.delta,
          createdAt: eloHistory.createdAt,
        })
        .from(eloHistory)
        .where(eq(eloHistory.userId, userId))
        .orderBy(asc(eloHistory.createdAt)),
      db
        .select({ wins: count() })
        .from(matches)
        .where(eq(matches.winnerId, userId)),
      db
        .select({ losses: count() })
        .from(matches)
        .where(eq(matches.loserId, userId)),
    ]);

  if (!profile) redirect("/");

  const total = eloRows.length;
  const draws = total - wins - losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const tier = getEloTier(profile.elo);
  const displayName = profile.username ?? profile.name;
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const chartData = eloRows.map((r, i) => ({
    match: i + 1,
    elo: r.eloAfter,
    delta: r.delta,
  }));

  const problemSlugs = [...new Set(matchRows.map((r) => r.problemSlug))];
  const problemTitles: Record<string, string> =
    problemSlugs.length > 0
      ? await db
          .select({ slug: problems.slug, title: problems.title })
          .from(problems)
          .where(inArray(problems.slug, problemSlugs))
          .then((rows) =>
            Object.fromEntries(rows.map((r) => [r.slug, r.title])),
          )
      : {};

  return (
    <main className="flex flex-1 justify-center py-10 px-4">
      <Column className="w-full max-w-2xl gap-8">
        {/* Header */}
        <Row className="items-start gap-5">
          <Avatar className="h-20 w-20">
            {profile.image && (
              <AvatarImage src={profile.image} alt={displayName} />
            )}
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <Column className="flex-1 gap-1.5">
            <Row className="items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{displayName}</h1>
              <Badge
                variant="outline"
                className={cn("text-xs", ELO_TIER_COLORS[tier])}
              >
                {tier}
              </Badge>
            </Row>
            {profile.username && (
              <span className="text-sm text-muted-foreground">
                {profile.name}
              </span>
            )}
            <span className="text-sm font-semibold tabular-nums">
              {profile.elo} ELO
            </span>
            {profile.bio && (
              <p className="text-sm text-muted-foreground">{profile.bio}</p>
            )}
            {(profile.linkedin || profile.twitter || profile.instagram) && (
              <Row className="gap-3 mt-1">
                {[
                  { href: profile.linkedin, label: "LinkedIn" },
                  { href: profile.twitter, label: "X" },
                  { href: profile.instagram, label: "Instagram" },
                ]
                  .filter((s) => s.href)
                  .map(({ href, label }) => (
                    <a
                      key={label}
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="size-3" />
                      {label}
                    </a>
                  ))}
              </Row>
            )}
          </Column>
        </Row>

        {/* Tabs */}
        <Tabs defaultValue="stats">
          <TabsList className="w-full">
            <TabsTrigger value="stats" className="flex-1">
              Stats
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Match History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats">
            <Column className="gap-6 pt-4">
              <Row className="gap-3">
                <StatCard label="Matches" value={total} />
                <StatCard label="Wins" value={wins} />
                <StatCard label="Losses" value={losses} />
                <StatCard label="Draws" value={draws} />
                <StatCard label="Win Rate" value={`${winRate}%`} />
              </Row>

              <Column className="gap-2">
                <span className="text-sm font-medium">ELO History</span>
                <EloChart data={chartData} />
              </Column>
            </Column>
          </TabsContent>

          <TabsContent value="history">
            <Column className="gap-1 pt-4">
              {matchRows.length === 0 ? (
                <Center className="py-16">
                  <span className="text-sm text-muted-foreground">
                    No matches yet
                  </span>
                </Center>
              ) : (
                matchRows.map((m) => {
                  const isWinner = m.winnerId === userId;
                  const isLoser = m.loserId === userId;
                  const isDraw = !m.winnerId && !m.loserId;
                  let result: MatchResult;
                  if (isDraw) result = "draw";
                  else if (isWinner)
                    result = m.resultType === "forfeit" ? "walkover" : "won";
                  else if (isLoser)
                    result = m.resultType === "forfeit" ? "forfeit" : "lost";
                  else result = "draw";

                  const mins = Math.floor(m.durationSeconds / 60);
                  const secs = String(m.durationSeconds % 60).padStart(2, "0");
                  const title =
                    problemTitles[m.problemSlug] ?? m.problemSlug;
                  const date = new Date(m.createdAt).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  );

                  return (
                    <Row
                      key={m.matchId}
                      className="items-center gap-4 rounded-lg border border-border px-4 py-3"
                    >
                      <span
                        className={cn(
                          "w-16 text-sm font-semibold",
                          RESULT_STYLES[result],
                        )}
                      >
                        {RESULT_LABEL[result]}
                      </span>
                      <span className="flex-1 text-sm truncate">{title}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {mins}:{secs}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular-nums w-14 text-right",
                          m.delta >= 0 ? "text-green-400" : "text-destructive",
                        )}
                      >
                        {m.delta > 0 ? `+${m.delta}` : m.delta}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {date}
                      </span>
                    </Row>
                  );
                })
              )}
            </Column>
          </TabsContent>
        </Tabs>
      </Column>
    </main>
  );
};

export default ProfilePage;
