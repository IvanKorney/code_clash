"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Difficulty } from "@/lib/consts";
import { cn } from "@/lib/utils";
import { Row } from "@/components/layout/Row";
import { useRoomActions } from "@/hooks/useRoomActions";

const DIFFICULTIES: { value: Difficulty; label: string; className: string }[] = [
  { value: "easy", label: "Easy", className: "text-green-400 border-green-400/30 bg-green-400/10 hover:bg-green-400/20" },
  { value: "medium", label: "Medium", className: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20" },
  { value: "hard", label: "Hard", className: "text-red-400 border-red-400/30 bg-red-400/10 hover:bg-red-400/20" },
];

export const HomeActions = () => {
  const {
    createOpen, setCreateOpen,
    joinOpen, setJoinOpen,
    difficulty, setDifficulty,
    code, handleCodeChange,
    creating, joining, joinError,
    handleCreate, handleJoin,
  } = useRoomActions();

  return (
    <>
      <Row className="gap-3">
        <Button size="lg" onClick={() => setCreateOpen(true)}>
          Create Room
        </Button>
        <Button size="lg" variant="outline" onClick={() => setJoinOpen(true)}>
          Join Room
        </Button>
      </Row>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Room</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Difficulty</p>
              <Row className="gap-2">
                {DIFFICULTIES.map(({ value, label, className }) => (
                  <button
                    key={value}
                    onClick={() => setDifficulty(value)}
                    className={cn(
                      "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                      className,
                      difficulty !== value && "opacity-50",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </Row>
            </div>
            <Button className="w-full" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create Room"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Room</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleJoin} className="space-y-4">
            <Input
              placeholder="XXXXXX"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
            {joinError && <p className="text-xs text-destructive">{joinError}</p>}
            <Button type="submit" className="w-full" disabled={joining || code.length !== 6}>
              {joining ? "Joining…" : "Join Room"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
