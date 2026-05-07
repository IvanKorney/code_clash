"use client";

import { useEffect, useState } from "react";

export const useTimer = (matchStartedAtMs: number, timeLimitMinutes: number) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const elapsed = Math.floor((Date.now() - matchStartedAtMs) / 1000);
    return Math.max(0, timeLimitMinutes * 60 - elapsed);
  });

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  return { timeLeft, display: `${m}:${s.toString().padStart(2, "0")}` };
};
