"use client";

import { forfeitMatch } from "@/app/actions/rooms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Row } from "@/components/layout/Row";
import { Column } from "@/components/layout/Column";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useRoomPlayers } from "@/hooks/useRoomPlayers";
import { cn } from "@/lib/utils";

const useTimer = (matchStartedAtMs: number, timeLimitMinutes: number) => {
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

interface MatchHeaderProps {
  code: string;
  roomId: string;
  currentUserId: string;
  matchStartedAtMs: number;
  timeLimitMinutes: number;
  onOpponentFinished: () => void;
  onForfeit: () => void;
  onOpponentForfeited: () => void;
}

export const MatchHeader = ({
  code,
  roomId,
  currentUserId,
  matchStartedAtMs,
  timeLimitMinutes,
  onOpponentFinished,
  onForfeit,
  onOpponentForfeited,
}: MatchHeaderProps) => {
  const { timeLeft, display } = useTimer(matchStartedAtMs, timeLimitMinutes);
  const opponentFinishedRef = useRef(false);
  const wonRef = useRef(false);

  const { mutate: handleGiveUp, isPending: givingUp } = useMutation({
    mutationFn: async () => forfeitMatch(roomId),
    onSuccess: () => onForfeit(),
  });

  const { players, problemTotal, opponentForfeited } = useRoomPlayers(code, roomId);
  const opponent = players.find((p) => p.userId !== currentUserId);

  useEffect(() => {
    if (opponent?.hasPassed && !opponentFinishedRef.current) {
      opponentFinishedRef.current = true;
      onOpponentFinished();
    }
  }, [opponent?.hasPassed, onOpponentFinished]);

  useEffect(() => {
    if (opponentForfeited && !wonRef.current) {
      wonRef.current = true;
      onOpponentForfeited();
    }
  }, [opponentForfeited, onOpponentForfeited]);

  const timerColor =
    timeLeft < 60
      ? "text-destructive"
      : timeLeft < 300
        ? "text-yellow-400"
        : "text-foreground";

  return (
    <Row className="items-center justify-between px-4 h-11 border-b border-border bg-background shrink-0">
      <div className="w-40">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleGiveUp()}
          disabled={givingUp}
          className="h-7 px-3 text-xs"
        >
          {givingUp ? "Leaving…" : "Give Up"}
        </Button>
      </div>

      <span className={cn("font-mono text-base font-bold tabular-nums", timerColor)}>
        {display}
      </span>

      {opponent ? (
        <Row className="items-center gap-2 w-60 justify-end">
          <Column className="items-end gap-0.5">
            <span className="text-xs font-medium">{opponent.name}</span>
            <span className="text-xs text-muted-foreground">
              {opponent.testCasesPassed}/{problemTotal} cases
            </span>
          </Column>
          <Avatar className="size-6">
            <AvatarImage src={opponent.image ?? undefined} />
            <AvatarFallback>{opponent.name[0]}</AvatarFallback>
          </Avatar>
          <Progress
            value={problemTotal > 0 ? (opponent.testCasesPassed / problemTotal) * 100 : 0}
            className="w-16 h-1.5"
          />
        </Row>
      ) : (
        <div className="w-40" />
      )}
    </Row>
  );
};
