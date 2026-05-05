"use client";

import {
  Panel,
  Group as PanelGroup,
  Separator as PanelResizeHandle,
} from "react-resizable-panels";
import { useState } from "react";
import { MatchHeader } from "./MatchHeader";
import { ProblemPanel } from "./ProblemPanel";
import { EditorPanel } from "./EditorPanel";
import { OutputPanel } from "./OutputPanel";
import type { Difficulty } from "@/lib/consts";
import type { Language, TestCase } from "@/types/problem";

type Problem = {
  title: string;
  slug: string;
  difficulty: Difficulty;
  description: string;
  examples: TestCase[];
  constraints: string | null;
  hints: string[];
};

type Opponent = {
  userId: string;
  name: string;
  image: string | null;
  elo: number;
};

export const MatchView = ({
  code,
  currentUserId,
  matchStartedAt,
  timeLimitMinutes,
  roomId,
  problem,
}: {
  code: string;
  currentUserId: string;
  matchStartedAt: number;
  timeLimitMinutes: number;
  roomId: string;
  problem: Problem;
  opponent: Opponent | null;
}) => {
  const [language, setLanguage] = useState<Language>("javascript");
  const [output, setOutput] = useState<string | null>(null);

  const handleRun = (code: string, lang: Language) => {
    // Step 9: wire up Piston API
    setOutput(`// Run with ${lang}\n${code}`);
  };

  const handleSubmit = (code: string, lang: Language) => {
    // Step 9: wire up submission + test cases
    setOutput(`// Submitted with ${lang}\n${code}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <MatchHeader
        code={code}
        currentUserId={currentUserId}
        matchStartedAtMs={matchStartedAt}
        roomId={roomId}
        timeLimitMinutes={timeLimitMinutes}
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
                language={language}
                onLanguageChange={setLanguage}
                onRun={handleRun}
                onSubmit={handleSubmit}
              />
            </Panel>
            <PanelResizeHandle className="h-1 bg-border hover:bg-primary/50 cursor-row-resize transition-colors" />
            <Panel defaultSize={30} minSize={15}>
              <OutputPanel output={output} />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};
