import type { Language } from "@/types/problem";

export const PISTON_LANG: Record<string, { language: string; version: string }> = {
  javascript: { language: "javascript", version: "*" },
  typescript: { language: "typescript", version: "*" },
  python: { language: "python", version: "*" },
  java: { language: "java", version: "*" },
  cpp: { language: "c++", version: "*" },
};

export const SNIPPET_LANG: Record<string, Language> = {
  javascript: "javascript",
  typescript: "typescript",
  python3: "python",
  java: "java",
  cpp: "cpp",
};

export const PROTECTED_ROUTES = [
  "/room",
  "/profile",
  "/settings",
  "/leaderboard",
];

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
export const TIME_LIMITS = [15, 30, 45, 60];
