"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-64px)] lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-warm-glow lg:flex lg:flex-col lg:justify-center lg:px-16">
        <Link
          href="/"
          className="font-balooda text-3xl font-bold text-foreground"
        >
          <span className="text-primary">ব</span>ঙ্গলিপি
        </Link>
        <h2 className="mt-8 font-balooda text-4xl font-bold text-balance text-foreground">
          Bangla, made simple.
        </h2>
        <p className="mt-4 max-w-md text-muted-foreground">
          Convert Banglish to Bangla, write and share stories, and chat in
          Bangla — all in one warm, community-driven space.
        </p>
        <span className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
          <Sparkles size={14} className="text-secondary" /> বাংলিশ → বাংলা
        </span>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="font-balooda text-2xl font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
