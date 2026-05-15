"use client";

import { useState, useCallback } from "react";

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

let listeners: Array<(toasts: ToastData[]) => void> = [];
let toasts: ToastData[] = [];

const notify = () => listeners.forEach((l) => l([...toasts]));

export const toast = (data: Omit<ToastData, "id">) => {
  const id = crypto.randomUUID();
  toasts = [...toasts, { ...data, id }];
  notify();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  }, 4000);
};

export const useToastState = () => {
  const [state, setState] = useState<ToastData[]>([]);

  const subscribe = useCallback(() => {
    const handler = (next: ToastData[]) => setState(next);
    listeners.push(handler);
    return () => {
      listeners = listeners.filter((l) => l !== handler);
    };
  }, []);

  return { state, subscribe };
};
