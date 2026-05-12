"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { posthog } from "@/lib/posthog";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import type { DbRoom } from "@/types/db";

interface Player {
  userId: string;
  name: string;
  image: string | null;
  elo: number;
}

interface RoomData {
  status: string;
  hostId: string;
  players: Player[];
}

export const useWaitingRoom = (code: string, roomId: string, isHost: boolean) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isHost) posthog.capture("room_created");
  }, [isHost]);

  const { data } = useQuery({
    queryKey: ["waiting-room", code],
    queryFn: async () => {
      const { data } = await axios.get<RoomData>(`/api/rooms/${code}`);
      return data;
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on("broadcast", { event: "match_started" }, () => {
        posthog.capture("match_started");
        router.refresh();
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as DbRoom;
          queryClient.setQueryData<RoomData>(["waiting-room", code], (prev) =>
            prev ? { ...prev, status: updated.status } : prev,
          );
          if (updated.status === "in_progress") {
            posthog.capture("match_started");
            router.refresh();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        async () => {
          await queryClient.invalidateQueries({ queryKey: ["waiting-room", code] });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, code, router, queryClient]);

  return data;
};
