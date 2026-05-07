"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { Language, MatchResult, PanelOutput, SubmitOutput, TestCase } from "@/types/problem";

const decodeHtml = (s: string) =>
  s
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

interface UseMatchProps {
  roomId: string;
  problemSlug: string;
  firstExample: TestCase | undefined;
}

export const useMatch = ({ roomId, problemSlug, firstExample }: UseMatchProps) => {
  const [output, setOutput] = useState<PanelOutput | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const example = useMemo(
    () =>
      firstExample
        ? { input: decodeHtml(firstExample.input), expected_output: decodeHtml(firstExample.expected_output) }
        : undefined,
    [firstExample],
  );

  const { mutate: run, isPending: isRunning } = useMutation({
    mutationFn: async ({ userCode, lang }: { userCode: string; lang: Language }) => {
      const { data } = await axios.post("/api/execute", {
        code: userCode,
        language: lang,
        problemSlug,
        stdin: example?.input ?? "",
      });
      return data as { stdout: string; stderr: string; exitCode: number | null };
    },
    onSuccess: (data) => {
      setOutput({
        type: "run",
        input: example?.input ?? "",
        expected: example?.expected_output ?? "",
        stdout: data.stdout,
        stderr: data.stderr,
        exitCode: data.exitCode,
      });
    },
  });

  const { mutate: submit, isPending: isSubmitting } = useMutation({
    mutationFn: async ({ userCode, lang }: { userCode: string; lang: Language }) => {
      const { data } = await axios.post("/api/submit", {
        code: userCode,
        language: lang,
        roomId,
        problemSlug,
      });
      return data as Omit<SubmitOutput, "type">;
    },
    onSuccess: (data) => {
      setOutput({ type: "submit", ...data });
      if (data.allPassed) {
        setMatchResult("won");
      }
    },
  });

  const handleOpponentFinished = useCallback(() => {
    if (matchResult === null) {
      setMatchResult("lost");
    }
  }, [matchResult]);

  return { output, matchResult, setMatchResult, run, submit, isRunning, isSubmitting, handleOpponentFinished };
};
