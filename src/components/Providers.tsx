"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Suspense, useState } from "react";
import { PostHogProvider, PageViewTracker } from "./PostHogProvider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <PostHogProvider>
          <Suspense>
            <PageViewTracker />
          </Suspense>
          {children}
        </PostHogProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};
