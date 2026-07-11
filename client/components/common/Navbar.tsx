"use client";

import Link from "next/link";
import MobileSidebar from "./MobileSidebar";
import ThemeToggle from "./ThemeToggle";
import { Search, User, FileText } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth, useUser, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type SearchResult = {
  _id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  title?: string;
  caption?: string;
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Converter", href: "/converter" },
  { label: "Contents", href: "/contents" },
  { label: "Chatbot", href: "/chatbot" },
  { label: "Contribute", href: "/contribute" },
];

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.publicMetadata?.role === "admin";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults([...(data.users || []), ...(data.contents || [])]);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <span className="font-balooda text-2xl font-bold tracking-wide text-foreground transition-transform hover:scale-105">
            <span className="text-primary">ব</span>ঙ্গলিপি
          </span>
        </Link>

        {/* Search (desktop) */}
        <div className="relative mx-2 hidden max-w-md flex-1 lg:block" ref={dropdownRef}>
          <div className="flex items-center rounded-full border border-border bg-card px-3 focus-within:border-ring">
            <Search size={18} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search people or content…"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="absolute mt-2 max-h-72 w-full overflow-auto rounded-2xl border border-border bg-card shadow-warm-lg">
              {searchResults.map((result, index) => (
                <Link
                  key={index}
                  href={
                    result.firstName
                      ? `/profiles/${result.userId}`
                      : `/contents/${result._id}`
                  }
                  onClick={() => setSearchResults([])}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-muted"
                >
                  <span className="truncate text-foreground">
                    {result.firstName
                      ? `${result.firstName} ${result.lastName}`
                      : result.title}
                  </span>
                  {result.firstName ? (
                    <User size={16} className="shrink-0 text-muted-foreground" />
                  ) : (
                    <FileText size={16} className="shrink-0 text-primary" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Nav links (desktop) */}
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
              appearance={{
                elements: { userButtonAvatarBox: "w-9 h-9" },
              }}
            />
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
