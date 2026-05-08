import { Row } from "../layout/Row";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";

export const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-(--surface)/80 backdrop-blur-sm">
      <Row className="mx-auto h-14 max-w-7xl items-center justify-between px-4">
        <Row className="items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/assets/logo.png"
              alt="Code Clash"
              width={28}
              height={28}
              className="rounded-sm"
            />
            <span className="font-bold text-foreground tracking-tight">
              Code Clash
            </span>
          </Link>
          <ThemeToggle />
          <Link
            href="/leaderboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Trophy className="size-4" />
            <span className="hidden sm:block">Leaderboard</span>
          </Link>
        </Row>

        <UserMenu />
      </Row>
    </header>
  );
};
