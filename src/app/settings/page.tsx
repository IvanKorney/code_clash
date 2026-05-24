"use client";

import { useState } from "react";
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
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: boolean;
  children: React.ReactNode;
}) => (
  <Column className="gap-1.5">
    <label className="text-sm font-medium">{label}</label>
    {children}
    {hint && <p className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{hint}</p>}
  </Column>
);

interface SettingsFormProps {
  userData: UserData;
  userId: string;
  displayName: string;
  userEmail: string;
  initials: string;
}

const SettingsForm = ({ userData, userId, displayName, userEmail, initials }: SettingsFormProps) => {
  const queryClient = useQueryClient();

  // State is initialized directly from userData — no useEffect needed.
  // The parent only renders this component once userData is available, so
  // the initializer always runs with real data.
  const [form, setForm] = useState({
    username: userData.username ?? "",
    bio: userData.bio ?? "",
    language: (userData.preferredLanguage as Language) ?? "javascript",
    linkedin: userData.linkedin ?? "",
    twitter: userData.twitter ?? "",
    instagram: userData.instagram ?? "",
  });

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const isValidUrl = (val: string) => {
    if (!val) return true;
    try {
      return new URL(val).protocol === "https:";
    } catch {
      return false;
    }
  };

  const urlErrors = {
    linkedin: !!form.linkedin && !isValidUrl(form.linkedin),
    twitter: !!form.twitter && !isValidUrl(form.twitter),
    instagram: !!form.instagram && !isValidUrl(form.instagram),
  };
  const hasUrlErrors = Object.values(urlErrors).some(Boolean);

  const { mutate: save, isPending, isSuccess } = useMutation({
    mutationFn: async () => {
      await axios.patch(`/api/user/${userId}`, {
        username: form.username,
        bio: form.bio,
        preferredLanguage: form.language,
        linkedin: form.linkedin,
        twitter: form.twitter,
        instagram: form.instagram,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });

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
            {userData.image && (
              <AvatarImage src={userData.image} alt={displayName} />
            )}
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>
          <Column className="gap-0.5">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          </Column>
        </Row>

        <Column className="gap-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Profile
          </p>

          <Field label="Username" hint="Your unique handle on Code Clash">
            <Input
              value={form.username}
              onChange={(e) => set("username", e.target.value)}
              maxLength={32}
            />
          </Field>

          <Field label="Bio">
            <Input
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              maxLength={160}
            />
          </Field>

          <Field label="Preferred Language">
            <Select
              value={form.language}
              onValueChange={(v) => set("language", v as Language)}
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

          <Field label="LinkedIn" hint={urlErrors.linkedin ? "Must be a valid https:// URL" : undefined} error={urlErrors.linkedin}>
            <Input
              value={form.linkedin}
              onChange={(e) => set("linkedin", e.target.value)}
              className={urlErrors.linkedin ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>

          <Field label="X / Twitter" hint={urlErrors.twitter ? "Must be a valid https:// URL" : undefined} error={urlErrors.twitter}>
            <Input
              value={form.twitter}
              onChange={(e) => set("twitter", e.target.value)}
              className={urlErrors.twitter ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>

          <Field label="Instagram" hint={urlErrors.instagram ? "Must be a valid https:// URL" : undefined} error={urlErrors.instagram}>
            <Input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              className={urlErrors.instagram ? "border-destructive focus-visible:ring-destructive" : ""}
            />
          </Field>
        </Column>

        <Row className="items-center gap-3">
          <Button onClick={() => save()} disabled={isPending || hasUrlErrors}>
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

const SettingsPage = () => {
  const { data: session } = authClient.useSession();

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

  if (!session || isLoading || !userData) return null;

  const displayName = userData.username ?? userData.name ?? session.user.name;
  const initials =
    (userData.name ?? session.user.name)
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <SettingsForm
      userData={userData}
      userId={session.user.id}
      displayName={displayName}
      userEmail={session.user.email}
      initials={initials}
    />
  );
};

export default SettingsPage;
