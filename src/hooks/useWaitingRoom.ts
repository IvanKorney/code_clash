"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

const fetchRoom = async (code: string) => {
  const { data } = await axios.get<RoomData>(`/api/rooms/${code}`);
  return data;
};

export const useWaitingRoom = (code: string, roomId: string) => {
  const router = useRouter();
  const [data, setData] = useState<RoomData | null>(null);

  useEffect(() => {
    const load = async () => setData(await fetchRoom(code));
    load();

    const interval = setInterval(async () => {
      const room = await fetchRoom(code);
      setData(room);
      if (room.status === "in_progress") {
        clearInterval(interval);
        router.refresh();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [code, router]);

  useEffect(() => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
        (payload) => {
          const updated = payload.new as DbRoom;
          setData((prev) => (prev ? { ...prev, status: updated.status } : prev));
          if (updated.status === "in_progress") router.refresh();
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_players", filter: `room_id=eq.${roomId}` },
        async () => {
          const room = await fetchRoom(code);
          setData(room);
          if (room.status === "in_progress") router.refresh();
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId, code, router]);

  return data;
};
