"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Column } from "@/components/layout/Column";
import { Row } from "@/components/layout/Row";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import type { Language } from "@/types/problem";

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

interface UserData {
  id: string;
  name: string;
  image: string | null;
  username: string | null;
  bio: string | null;
  preferredLanguage: string;
  linkedin: string | null;
  twitter: string | null;
  instagram: string | null;
}

const Field = ({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <Column className="gap-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </Column>
);

const SettingsPage = () => {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["user", session?.user?.id],
    queryFn: async () => {
      const { data } = await axios.get<{ user: UserData }>(
        `/api/user/${session!.user.id}`,
      );
      return data.user;
    },
    enabled: !!session?.user?.id,
  });

  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [language, setLanguage] = useState<Language>("javascript");
  const [linkedin, setLinkedin] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    if (!userData) return;
    setUsername(userData.username ?? "");
    setBio(userData.bio ?? "");
    setLanguage((userData.preferredLanguage as Language) ?? "javascript");
    setLinkedin(userData.linkedin ?? "");
    setTwitter(userData.twitter ?? "");
    setInstagram(userData.instagram ?? "");
  }, [userData]);

  const { mutate: save, isPending, isSuccess } = useMutation({
    mutationFn: async () => {
      await axios.patch(`/api/user/${session!.user.id}`, {
        username,
        bio,
        preferredLanguage: language,
        linkedin,
        twitter,
        instagram,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", session?.user?.id] });
    },
  });

  if (!session || isLoading) return null;

  const displayName = userData?.username ?? userData?.name ?? session.user.name;
  const initials = (userData?.name ?? session.user.name)
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";

  return (
    <main className="flex flex-1 justify-center py-10 px-4">
      <Column className="w-full max-w-lg gap-8">
        <Column className="gap-1">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile and preferences
          </p>
        </Column>

        {/* Avatar */}
        <Row className="items-center gap-4">
          <Avatar className="h-16 w-16">
            {userData?.image && (
              <AvatarImage src={userData.image} alt={displayName} />
            )}
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <Column className="gap-0.5">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">
              {session.user.email}
            </span>
          </Column>
        </Row>

        <Column className="gap-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Profile
          </p>

          <Field label="Username" hint="Your unique handle on Code Clash">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={32}
            />
          </Field>

          <Field label="Bio">
            <Input
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
            />
          </Field>

          <Field label="Preferred Language">
            <Select
              value={language}
              onValueChange={(v) => setLanguage(v as Language)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </Column>

        <Column className="gap-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Social Links
          </p>

          <Field label="LinkedIn">
            <Input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </Field>

          <Field label="X / Twitter">
            <Input
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
            />
          </Field>

          <Field label="Instagram">
            <Input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </Field>
        </Column>

        <Row className="items-center gap-3">
          <Button onClick={() => save()} disabled={isPending}>
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
          {isSuccess && (
            <span className="text-sm text-green-400">Saved</span>
          )}
        </Row>
      </Column>
    </main>
  );
};

export default SettingsPage;
