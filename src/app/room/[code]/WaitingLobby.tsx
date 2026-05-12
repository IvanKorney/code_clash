"use client";

import { leaveRoom } from "@/app/actions/rooms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import { type Difficulty } from "@/lib/consts";
import { useWaitingRoom } from "@/hooks/useWaitingRoom";
import { useMutation } from "@tanstack/react-query";
import { Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";

interface WaitingLobbyProps {
  code: string;
  roomId: string;
  difficulty: Difficulty;
  currentUserId: string;
  isHost: boolean;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: "text-green-400 border-green-400/30 bg-green-400/10",
  medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
  hard: "text-red-400 border-red-400/30 bg-red-400/10",
};

export const WaitingLobby = ({
  code,
  roomId,
  difficulty,
  currentUserId,
  isHost,
}: WaitingLobbyProps) => {
  const [copied, setCopied] = useState(false);
  const data = useWaitingRoom(code, roomId, isHost);

  const { mutate: handleLeave, isPending: leaving } = useMutation({
    mutationFn: async () => leaveRoom(roomId),
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const players = data?.players ?? [];
  const hasOpponent = players.length >= 2;

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <Column className="items-center gap-4 w-full max-w-md">
        <Row className="items-center gap-3">
          <h1 className="text-2xl font-bold">Waiting Room</h1>
          <Badge variant="outline" className={DIFFICULTY_STYLES[difficulty]}>
            {difficulty}
          </Badge>
        </Row>

        <Column className="items-center gap-2">
          <p className="text-sm text-muted-foreground">Share this code with your opponent</p>
          <Row className="items-center gap-2">
            <span className="text-4xl font-bold tracking-widest font-mono">{code}</span>
            <Button variant="ghost" size="icon" onClick={handleCopy}>
              {copied ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
            </Button>
          </Row>
        </Column>

        <Column className="w-full gap-3">
          {players.map((player) => (
            <Row
              key={player.userId}
              className="items-center gap-3 rounded-lg border border-border p-3"
            >
              <Avatar className="size-9">
                <AvatarImage src={player.image ?? undefined} />
                <AvatarFallback>{player.name[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <Column className="gap-0.5 flex-1">
                <Row className="items-center gap-2">
                  <span className="font-medium text-sm">{player.name}</span>
                  {player.userId === data?.hostId ? (
                    <Badge variant="secondary" className="text-xs">Host</Badge>
                  ) : null}
                  {player.userId === currentUserId ? (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  ) : null}
                </Row>
                <span className="text-xs text-muted-foreground">{player.elo} ELO</span>
              </Column>
            </Row>
          ))}

          {!hasOpponent ? (
            <Row className="items-center gap-3 rounded-lg border border-dashed border-border p-3 opacity-50">
              <div className="size-9 rounded-full bg-muted" />
              <span className="text-sm text-muted-foreground">Waiting for opponent…</span>
            </Row>
          ) : null}
        </Column>

        <Row className="items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span className="text-sm">
            {hasOpponent ? "Match starting…" : "Waiting for opponent to join…"}
          </span>
        </Row>

        <Button
          variant="destructive"
          size="lg"
          className="mt-8"
          onClick={() => handleLeave()}
          disabled={leaving}
        >
          {leaving ? "Leaving…" : "Cancel"}
        </Button>
      </Column>
    </main>
  );
};
