"use client";

import Link from "next/link";
import MobileSidebar from "./MobileSidebar";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Converter", href: "/converter" },
  { label: "Contents", href: "/contents" },
  { label: "Chatbot", href: "/chatbot" },
  { label: "Contribute", href: "/contribute" },
];

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin = user?.publicMetadata?.role === "admin";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="shrink-0">
          <span className="font-balooda text-2xl font-bold tracking-wide text-foreground transition-transform hover:scale-105">
            <span className="text-primary">ব</span>ঙ্গলিপি
          </span>
        </Link>

        <div className="mx-2 hidden max-w-md flex-1 lg:block">
          <SearchBox />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  isActive("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <ThemeToggle />

          {isSignedIn ? (
            <UserButton
              appearance={{ elements: { userButtonAvatarBox: "w-9 h-9" } }}
              userProfileMode="navigation"
              userProfileUrl="/dashboard"
            >
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Dashboard"
                  labelIcon={<LayoutDashboard size={16} />}
                  href="/dashboard"
                />
              </UserButton.MenuItems>
            </UserButton>
          ) : (
            <Button size="sm" onClick={() => router.push("/sign-in")}>
              Login
            </Button>
          )}

          <div className="lg:hidden">
            <MobileSidebar />
          </div>
        </div>
      </div>
    </header>
  );
}
