"use client";

import { Suspense, useEffect, useState } from "react";
import { useUser, UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useSearchParams, useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import ContentManager from "@/components/dashboard/ContentManager";
import { cn } from "@/lib/utils";

type Tab = "contents" | "account";
const tabs: { key: Tab; label: string }[] = [
  { key: "contents", label: "My Contents" },
  { key: "account", label: "Account settings" },
];

function DashboardInner() {
  const { user, isLoaded } = useUser();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(
    params.get("tab") === "account" ? "account" : "contents",
  );

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setTab(params.get("tab") === "account" ? "account" : "contents");
  }, [params]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader size={30} />
      </div>
    );
  }

  const setTabUrl = (t: Tab) => {
    setTab(t);
    router.replace(`/dashboard?tab=${t}`);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        {/* Profile header */}
        <Card className="p-6">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10" />
            )}
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold text-foreground">
                {user?.fullName || user?.firstName || "Your dashboard"}
              </h1>
              <p className="truncate text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 border-b border-border">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTabUrl(t.key)}
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                tab === t.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {tab === t.key && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === "contents" ? (
            <ContentManager />
          ) : (
            <div className="flex justify-center">
              <UserProfile
                routing="hash"
                appearance={{
                  baseTheme:
                    mounted && resolvedTheme === "dark" ? dark : undefined,
                  variables: {
                    colorPrimary: "#c55a34",
                    borderRadius: "0.75rem",
                  },
                  elements: { card: "shadow-warm" },
                }}
              />
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <Loader size={30} />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
