"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import AuthShell from "@/components/common/AuthShell";

export default function SignInPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to Bongolipi">
      <SignIn
        path="/sign-in"
        appearance={{
          baseTheme: mounted && resolvedTheme === "dark" ? dark : undefined,
          variables: { colorPrimary: "#c55a34", borderRadius: "0.75rem" },
          elements: {
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            card: "shadow-warm",
          },
          layout: { socialButtonsPlacement: "bottom" },
        }}
      />
    </AuthShell>
  );
}
