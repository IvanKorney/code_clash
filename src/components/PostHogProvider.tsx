"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { posthog } from "@/lib/posthog";
import { authClient } from "@/lib/auth-client";

export const PostHogProvider = ({ children }: { children: React.ReactNode }) => {
  const { data: session } = authClient.useSession();

  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      capture_pageview: false,
      capture_pageleave: true,
    });
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    posthog.identify(session.user.id, { email: session.user.email, name: session.user.name });
  }, [session?.user]);

  return <>{children}</>;
};

export const PageViewTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    posthog.capture("$pageview", { $current_url: window.location.href });
  }, [pathname, searchParams]);

  return null;
};
