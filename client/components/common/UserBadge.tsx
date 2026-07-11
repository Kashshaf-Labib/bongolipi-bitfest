"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export default function UserBadge({
  userId,
  name,
  image,
  size = 32,
  subtitle,
  className,
  onClick,
}: {
  userId: string;
  name: string;
  image?: string;
  size?: number;
  subtitle?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const initial = (name?.[0] || "U").toUpperCase();

  return (
    <Link
      href={`/profiles/${userId}`}
      onClick={onClick}
      className={cn("group inline-flex items-center gap-2.5", className)}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          style={{ width: size, height: size }}
          className="shrink-0 rounded-full object-cover ring-1 ring-border"
        />
      ) : (
        <span
          style={{ width: size, height: size }}
          className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
        >
          {initial}
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-medium text-foreground group-hover:text-primary">
          {name}
        </span>
        {subtitle && (
          <span className="block truncate text-xs text-muted-foreground">
            {subtitle}
          </span>
        )}
      </span>
    </Link>
  );
}
