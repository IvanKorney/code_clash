"use client";

import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MatchHeader } from "./MatchHeader";
import { ProblemPanel } from "./ProblemPanel";
import { EditorPanel } from "./EditorPanel";
import { OutputPanel } from "./OutputPanel";
import { Button } from "@/components/ui/button";
import { Column } from "@/components/layout/Column";
import { useMatch } from "@/hooks/useMatch";
import { cn } from "@/lib/utils";
import type { MatchResolution } from "@/hooks/useRoomPlayers";
import type { Difficulty } from "@/lib/consts";
import type { Language, MatchResult, TestCase } from "@/types/problem";

const MATCH_RESULT_COPY: Record<
  MatchResult,
  { emoji: string; title: string; subtitle: string }
> = {
  won: {
    emoji: "🏆",
    title: "You solved it!",
    subtitle: "All test cases passed. Well done!",
  },
  lost: {
    emoji: "😔",
    title: "Opponent solved it first",
    subtitle: "Better luck next time.",
  },
  forfeit: {
    emoji: "😔",
    title: "You gave up",
    subtitle: "Better luck next time.",
  },
  walkover: {
    emoji: "🏆",
    title: "Opponent forfeited",
    subtitle: "Your opponent threw in the towel.",
  },
  draw: {
    emoji: "🤝",
    title: "It's a draw",
    subtitle: "Same progress when time ran out. No ELO change.",
  },
};

interface Problem {
  title: string;
  slug: string;
  difficulty: Difficulty;
  description: string;
  examples: TestCase[];
  constraints: string | null;
  hints: string[];
  codeSnippets: Partial<Record<Language, string>>;
}

interface Opponent {
  userId: string;
  name: string;
  image: string | null;
  elo: number;
}

interface MatchViewProps {
  code: string;
  currentUserId: string;
  matchStartedAt: number;
  timeLimitMinutes: number;
  roomId: string;
  problem: Problem;
  opponent: Opponent | null;
}

export const MatchView = ({
  code,
  currentUserId,
  matchStartedAt,
  timeLimitMinutes,
  roomId,
  problem,
  opponent,
}: MatchViewProps) => {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "javascript";
    return (localStorage.getItem("cc:lang") as Language) ?? "javascript";
  });

  const handleLanguageChange = (lang: Language) => {
    localStorage.setItem("cc:lang", lang);
    setLanguage(lang);
  };

  const [eloResult, setEloResult] = useState<{
    delta: number;
    eloAfter: number;
  } | null>(null);

  const {
    output,
    matchResult,
    setMatchResult,
    run,
    submit,
    isRunning,
    isSubmitting,
    handleOpponentFinished,
  } = useMatch({
    roomId,
    problemSlug: problem.slug,
    firstExample: problem.examples[0],
  });

  const handleMatchResolved = (resolution: MatchResolution) => {
    setEloResult({
      delta: resolution.myDelta,
      eloAfter: resolution.myEloAfter,
    });

    // Only set match result from resolution for timeout scenarios
    if (matchResult === null) {
      if (resolution.winnerId === currentUserId) {
        setMatchResult("won");
      } else if (resolution.loserId === currentUserId) {
        setMatchResult("lost");
      } else {
        setMatchResult("draw");
      }
    }
  };

  return (
    <Column className="relative h-[calc(100vh-3.5rem)]">
      {matchResult && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <Column className="items-center gap-4">
            {(() => {
              const { emoji, title, subtitle } = MATCH_RESULT_COPY[matchResult];
              return (
                <>
                  <span className="text-5xl">{emoji}</span>
                  <h2 className="text-2xl font-bold">{title}</h2>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                  {eloResult && matchResult !== "draw" ? (
                    <p
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        eloResult.delta >= 0
                          ? "text-green-400"
                          : "text-destructive",
                      )}
                    >
                      {eloResult.delta > 0
                        ? `+${eloResult.delta}`
                        : `${eloResult.delta}`}{" "}
                      ELO → {eloResult.eloAfter}
                    </p>
                  ) : null}
                </>
              );
            })()}
            <Button onClick={() => router.push("/")}>Back to Home</Button>
          </Column>
        </div>
      )}

      <MatchHeader
        code={code}
        currentUserId={currentUserId}
        matchStartedAtMs={matchStartedAt}
        roomId={roomId}
        timeLimitMinutes={timeLimitMinutes}
        onOpponentFinished={handleOpponentFinished}
        onForfeit={() => setMatchResult("forfeit")}
        onOpponentForfeited={() => setMatchResult((r) => r === null ? "walkover" : r)}
        onMatchResolved={handleMatchResolved}
      />
      <PanelGroup orientation="horizontal" className="flex-1 min-h-0">
        <Panel defaultSize={40} minSize={25}>
          <ProblemPanel
            title={problem.title}
            difficulty={problem.difficulty}
            description={problem.description}
          />
        </Panel>
        <PanelResizeHandle className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors" />
        <Panel defaultSize={60} minSize={30}>
          <PanelGroup orientation="vertical" className="h-full">
            <Panel defaultSize={70} minSize={30}>
              <EditorPanel
                roomId={roomId}
                language={language}
                onLanguageChange={handleLanguageChange}
                onRun={(userCode, lang) => run({ userCode, lang })}
                onSubmit={(userCode, lang) => submit({ userCode, lang })}
                isRunning={isRunning}
                isSubmitting={isSubmitting}
                codeSnippets={problem.codeSnippets}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors" />
            <Panel defaultSize={30} minSize={15}>
              <OutputPanel output={output} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </Column>
  );
};
