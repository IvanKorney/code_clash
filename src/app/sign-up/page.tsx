"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useMutation } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import Link from "next/link";
import { Row } from "@/components/layout/Row";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SignUpPage = () => {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const { name, email, password } = form;

  const { mutate: signUp, isPending, error } = useMutation({
    mutationFn: async () => {
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
        callbackURL: "/",
      });
      if (error) throw new Error(error.message ?? "Sign up failed");
    },
    onSuccess: () => router.push("/"),
  });

  const handleSocial = (provider: "github" | "google") =>
    authClient.signIn.social({ provider, callbackURL: "/" });

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted-foreground">Join Code Clash</p>
        </div>

        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={() => handleSocial("github")}>
            <GitBranch className="size-4" />
            Continue with GitHub
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleSocial("google")}>
            <svg className="size-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>
        </div>

        <div className="relative">
          <Row className="absolute inset-0 items-center">
            <div className="w-full border-t border-border" />
          </Row>
          <Row className="relative justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </Row>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); signUp(); }} className="space-y-3">
          <Input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            minLength={8}
            required
          />
          {error && <p className="text-xs text-destructive">{error.message}</p>}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account…" : "Sign up"}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
};

export default SignUpPage;
