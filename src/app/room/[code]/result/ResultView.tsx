"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createRematch } from "@/app/actions/rooms";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Center } from "@/components/layout/Center";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/types/problem";
import { useTheme } from "next-themes";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const RESULT_COPY: Record<
  MatchResult,
  { emoji: string; title: string; titleColor: string }
> = {
  won: { emoji: "🏆", title: "You won!", titleColor: "text-green-400" },
  lost: { emoji: "😔", title: "You lost", titleColor: "text-destructive" },
  forfeit: {
    emoji: "🏳️",
    title: "You forfeited",
    titleColor: "text-destructive",
  },
  walkover: {
    emoji: "🏆",
    title: "Opponent forfeited",
    titleColor: "text-green-400",
  },
  draw: { emoji: "🤝", title: "Draw", titleColor: "text-muted-foreground" },
};

const DIFF_COLORS: Record<string, string> = {
  easy: "text-green-400 border-green-400/30",
  medium: "text-yellow-400 border-yellow-400/30",
  hard: "text-destructive border-destructive/30",
};

const MONACO_LANG: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  cpp: "cpp",
};

interface Player {
  name: string;
  image: string | null;
  solution: string | null;
  language: string;
  eloBefore: number;
  eloAfter: number;
  delta: number;
}

interface ResultViewProps {
  roomId: string;
  result: MatchResult;
  myPlayer: Player;
  opponent: Player | null;
  matchInfo: {
    problemTitle: string;
    problemDifficulty: string;
    duration: string;
    resultType: string;
  };
}

const SolutionPanel = ({
  player,
  label,
}: {
  player: Player;
  label: string;
}) => {
  const { theme } = useTheme();
  return (
    <Column className="flex-1 gap-3 min-w-0">
      <Row className="items-center gap-2">
        <Avatar className="h-7 w-7">
          {player.image && <AvatarImage src={player.image} alt={player.name} />}
          <AvatarFallback className="text-xs">{player.name[0]}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline" className="ml-auto text-xs capitalize">
          {player.language}
        </Badge>
      </Row>
      {player.solution ? (
        <div className="h-72 rounded-md border border-border overflow-hidden">
          <MonacoEditor
            height="100%"
            language={MONACO_LANG[player.language] ?? "javascript"}
            value={player.solution}
            theme={theme === "dark" ? "vs-dark" : "vs-light"}
            options={{
              automaticLayout: true,
              readOnly: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 13,
              fontFamily: "var(--font-jetbrains-mono), monospace",
              lineNumbers: "off",
              folding: false,
              contextmenu: false,
              padding: { top: 8 },
            }}
          />
        </div>
      ) : (
        <Center className="h-72 rounded-md border border-border">
          <span className="text-sm text-muted-foreground">
            No solution submitted
          </span>
        </Center>
      )}
    </Column>
  );
};

export const ResultView = ({
  roomId,
  result,
  myPlayer,
  opponent,
  matchInfo,
}: ResultViewProps) => {
  const router = useRouter();
  const { emoji, title, titleColor } = RESULT_COPY[result];

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on("broadcast", { event: "rematch_created" }, (payload) => {
        router.push(`/room/${payload.payload.code}`);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, router]);

  const { mutate: rematch, isPending: isRematching } = useMutation({
    mutationFn: () => createRematch(roomId),
    onSuccess: (code) => {
      if (code) router.push(`/room/${code}`);
    },
  });

  return (
    <main className="flex flex-1 justify-center overflow-y-auto py-10 px-4">
      <Column className="w-full max-w-4xl gap-8">
        <Column className="items-center gap-2">
          <span className="text-5xl">{emoji}</span>
          <h1 className={cn("text-3xl font-bold", titleColor)}>{title}</h1>
          <Row className="items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {matchInfo.problemTitle}
            </span>
            <span>·</span>
            <Badge
              variant="outline"
              className={cn(
                "capitalize",
                DIFF_COLORS[matchInfo.problemDifficulty],
              )}
            >
              {matchInfo.problemDifficulty}
            </Badge>
            <span>·</span>
            <span>{matchInfo.duration}</span>
          </Row>
        </Column>

        <Row className="justify-center gap-6 flex-wrap">
          <Column className="items-center gap-1 rounded-lg border border-border px-6 py-3">
            <span className="text-xs text-muted-foreground">You</span>
            <span className="text-2xl font-bold tabular-nums">
              {myPlayer.eloAfter}
            </span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                myPlayer.delta >= 0 ? "text-green-400" : "text-destructive",
              )}
            >
              {myPlayer.delta > 0 ? `+${myPlayer.delta}` : myPlayer.delta} ELO
            </span>
          </Column>
          {opponent && (
            <Column className="items-center gap-1 rounded-lg border border-border px-6 py-3">
              <span className="text-xs text-muted-foreground">
                {opponent.name}
              </span>
              <span className="text-2xl font-bold tabular-nums">
                {opponent.eloAfter}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  opponent.delta >= 0 ? "text-green-400" : "text-destructive",
                )}
              >
                {opponent.delta > 0 ? `+${opponent.delta}` : opponent.delta} ELO
              </span>
            </Column>
          )}
        </Row>

        <Row className="gap-4 items-start">
          <SolutionPanel player={myPlayer} label="Your Solution" />
          {opponent && (
            <SolutionPanel player={opponent} label={opponent.name} />
          )}
        </Row>

        <Row className="justify-center gap-3">
          <Button onClick={() => rematch()} disabled={isRematching}>
            {isRematching ? "Creating rematch…" : "Rematch"}
          </Button>
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Home
          </Button>
        </Row>
      </Column>
    </main>
  );
};
