export const PROTECTED_ROUTES = [
  "/room",
  "/profile",
  "/settings",
  "/leaderboard",
];

export type Difficulty = "easy" | "medium" | "hard";
export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
export const TIME_LIMITS = [15, 30, 45, 60];
