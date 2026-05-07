const kFactor = (elo: number) => {
  if (elo < 1200) return 40;
  if (elo < 1600) return 32;
  return 24;
};

export const calcElo = (ratingA: number, ratingB: number, scoreA: 1 | 0) => {
  const expected = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const kA = kFactor(ratingA);
  const kB = kFactor(ratingB);
  const deltaA = Math.round(kA * (scoreA - expected));
  const deltaB = Math.round(kB * (1 - scoreA - (1 - expected)));
  const newA = Math.max(0, ratingA + deltaA);
  const newB = Math.max(0, ratingB + deltaB);
  return { newA, newB, deltaA: newA - ratingA, deltaB: newB - ratingB };
};

export type EloTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master";

export function getEloTier(elo: number): EloTier {
  if (elo >= 1800) return "Master";
  if (elo >= 1600) return "Diamond";
  if (elo >= 1400) return "Platinum";
  if (elo >= 1200) return "Gold";
  if (elo >= 1000) return "Silver";
  return "Bronze";
}

export const ELO_TIER_COLORS: Record<EloTier, string> = {
  Bronze: "text-amber-700 bg-amber-700/10 border-amber-700/30",
  Silver: "text-slate-400 bg-slate-400/10 border-slate-400/30",
  Gold: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Platinum: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  Diamond: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  Master: "text-purple-400 bg-purple-400/10 border-purple-400/30",
};
