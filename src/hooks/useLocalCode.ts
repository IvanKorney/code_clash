"use client";

import { useState } from "react";
import type { Language } from "@/types/problem";

export const useLocalCode = (roomId: string, initialCode: Record<Language, string>) => {
  const storageKey = `cc:code:${roomId}`;

  const [codeByLang, setCodeByLang] = useState<Record<Language, string>>(() => {
    if (typeof window === "undefined") return initialCode;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? { ...initialCode, ...JSON.parse(stored) } : initialCode;
    } catch {
      return initialCode;
    }
  });

  const updateCode = (language: Language, code: string) => {
    setCodeByLang((prev) => {
      const next = { ...prev, [language]: code };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return { codeByLang, updateCode };
};
