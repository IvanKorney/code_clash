"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import type { DbRoomPlayer } from "@/types/db";

interface Player {
  userId: string;
  name: string;
  image: string | null;
  testCasesPassed: number;
  hasPassed: boolean;
}

interface UseRoomPlayersResult {
  players: Player[];
  problemTotal: number;
  opponentForfeited: boolean;
}

export const useRoomPlayers = (
  code: string,
  roomId: string,
): UseRoomPlayersResult => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [problemTotal, setProblemTotal] = useState(0);
  const [opponentForfeited, setOpponentForfeited] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await axios.get(`/api/rooms/${code}`);
      setPlayers(data.players ?? []);
      setProblemTotal(data.totalTestCases ?? 0);
    };
    load();
  }, [code]);

  useEffect(() => {
    const channel = supabase
      .channel(`match:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const row = payload.new as DbRoomPlayer;
          setPlayers((prev) =>
            prev.map((p) =>
              p.userId === row.user_id
                ? {
                    ...p,
                    testCasesPassed: row.test_cases_passed,
                    hasPassed: row.has_passed,
                  }
                : p,
            ),
          );
        },
      )
      .on("broadcast", { event: "forfeit" }, () => {
        setOpponentForfeited(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { players, problemTotal, opponentForfeited };
};
