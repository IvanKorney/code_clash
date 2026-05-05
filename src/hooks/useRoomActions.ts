"use client";

import { createRoom, joinRoom } from "@/app/actions/rooms";
import { type Difficulty } from "@/lib/consts";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

export const useRoomActions = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [code, setCode] = useState("");

  const { mutate: handleCreate, isPending: creating } = useMutation({
    mutationFn: () => createRoom(difficulty),
  });

  const { mutate: handleJoin, isPending: joining, error: joinError, reset: resetJoin } = useMutation({
    mutationFn: async () => {
      const result = await joinRoom(code);
      if (result?.error) throw new Error(result.error);
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
    creating, joining,
    joinError: joinError?.message ?? null,
    handleCreate: () => handleCreate(),
    handleJoin: (e: { preventDefault: () => void }) => { e.preventDefault(); handleJoin(); },
  };
};
