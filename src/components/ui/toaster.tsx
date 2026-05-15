"use client";

import { useEffect } from "react";
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from "./toast";
import { useToastState } from "@/hooks/use-toast";

export const Toaster = () => {
  const { state, subscribe } = useToastState();

  useEffect(() => {
    return subscribe();
  }, [subscribe]);

  return (
    <ToastProvider>
      {state.map((t) => (
        <Toast key={t.id} variant={t.variant}>
          <div className="flex flex-col gap-0.5">
            <ToastTitle>{t.title}</ToastTitle>
            {t.description && (
              <ToastDescription>{t.description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
};
