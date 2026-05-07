"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

export interface MatchResolution {
  winnerId: string | null;
  loserId: string | null;
  myDelta: number;
  myEloAfter: number;
}

interface UseRoomPlayersResult {
  players: Player[];
  problemTotal: number;
  opponentForfeited: boolean;
  resolution: MatchResolution | null;
}

export const useRoomPlayers = (
  code: string,
  roomId: string,
  currentUserId: string,
): UseRoomPlayersResult => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [problemTotal, setProblemTotal] = useState(0);
  const [opponentForfeited, setOpponentForfeited] = useState(false);
  const [resolution, setResolution] = useState<MatchResolution | null>(null);

  useQuery({
    queryKey: ["room-players", code],
    queryFn: async () => {
      const { data } = await axios.get(`/api/rooms/${code}`);
      setPlayers(data.players ?? []);
      setProblemTotal(data.totalTestCases ?? 0);
      return data;
    },
  });

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
                ? { ...p, testCasesPassed: row.test_cases_passed, hasPassed: row.has_passed }
                : p,
            ),
          );
        },
      )
      .on("broadcast", { event: "forfeit" }, (payload: { payload: { forfeitingUserId: string } }) => {
        if (payload.payload.forfeitingUserId !== currentUserId) {
          setOpponentForfeited(true);
        }
      })
      .on(
        "broadcast",
        { event: "match_resolved" },
        (payload: {
          payload: {
            winnerId: string | null;
            loserId: string | null;
            players: { userId: string; delta: number; eloAfter: number }[];
          };
        }) => {
          const { winnerId, loserId, players: eloPlayers } = payload.payload;
          const me = eloPlayers.find((p) => p.userId === currentUserId);
          setResolution({
            winnerId,
            loserId,
            myDelta: me?.delta ?? 0,
            myEloAfter: me?.eloAfter ?? 0,
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUserId]);

  return { players, problemTotal, opponentForfeited, resolution };
};
