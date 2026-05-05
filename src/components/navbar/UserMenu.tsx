"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";
import { Column } from "@/components/layout/Column";
import { ELO_TIER_COLORS, getEloTier } from "@/lib/elo";
import {
  ChevronDown,
  History,
  LogOut,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Match History", href: "/match-history", icon: History },
  { label: "Settings", href: "/settings", icon: Settings },
];

export const UserMenu = () => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending)
    return <div className="h-9 w-24 animate-pulse rounded-md bg-elevated" />;

  if (!session) {
    return (
      <Button>
        <Link href="/sign-in">Sign In</Link>
      </Button>
    );
  }

  type SessionUser = typeof session.user & {
    elo: number;
    username: string | null;
  };
  const user = session.user as SessionUser;
  const elo = user.elo ?? 1000;
  const tier = getEloTier(elo);
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-elevated transition-colors outline-none">
          <Avatar className="size-7">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block font-medium">
            {user.username ?? user.name}
          </span>
          <Badge className={ELO_TIER_COLORS[tier]} variant="outline">
            {tier}
          </Badge>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="font-normal">
          <Column className="gap-0.5">
            <span className="font-medium text-foreground">
              {user.username ?? user.name}
            </span>
            <span className="text-xs text-muted-foreground">{elo} ELO</span>
          </Column>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild>
            <Link href={href} className="flex items-center gap-2">
              <Icon className="size-4" />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
