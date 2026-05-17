"use client";

import { createRoom, joinRoom } from "@/app/actions/rooms";
import { type Difficulty } from "@/lib/consts";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { posthog } from "@/lib/posthog";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useRoomActions = () => {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [timeLimit, setTimeLimit] = useState(30);
  const [code, setCode] = useState("");

  const { mutate: handleCreate, isPending: creating } = useMutation({
    mutationFn: () => createRoom(difficulty, timeLimit),
    onError: (err) => {
      if (err.message.includes("Too many rooms")) {
        toast({ title: "Slow down", description: "Too many rooms created recently", variant: "destructive" });
      }
    },
  });

  const { mutate: handleJoin, isPending: joining, error: joinError, reset: resetJoin } = useMutation({
    mutationFn: async () => {
      const result = await joinRoom(code);
      if (result.error) throw new Error(result.error);
      return result.url;
    },
    onSuccess: (url) => {
      posthog.capture("room_joined");
      if (url) router.push(url);
    },
  });

  const handleCodeChange = (value: string) => {
    resetJoin();
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6));
  };

  return {
    createOpen, setCreateOpen,
    joinOpen, setJoinOpen,
    difficulty, setDifficulty,
    code, handleCodeChange,
    timeLimit, setTimeLimit,
    creating, joining,
    joinError: joinError?.message ?? null,
    handleCreate: () => handleCreate(),
    handleJoin: (e: { preventDefault: () => void }) => { e.preventDefault(); handleJoin(); },
  };
};
