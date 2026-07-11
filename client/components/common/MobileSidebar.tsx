"use client";

import { CircleX, Menu, Search, User, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

type SearchResult = {
  _id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
};

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Converter", href: "/converter" },
  { label: "Contents", href: "/contents" },
  { label: "Chatbot", href: "/chatbot" },
  { label: "Contribute", href: "/contribute" },
];

export default function MobileSidebar() {
  const [show, setShow] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults([...(data.users || []), ...(data.contents || [])]);
    } catch (error) {
      console.error(error);
    }
  };

  const close = () => {
    setShow(false);
    setResults([]);
    setSearchQuery("");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="p-2 text-foreground"
        aria-label="Open menu"
      >
        <Menu />
      </button>

      <AnimatePresence>
        {show && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="fixed right-0 top-0 z-50 flex h-screen w-4/5 max-w-xs flex-col border-l border-border bg-background p-5"
            >
              <div className="flex items-center justify-between">
                <span className="font-balooda text-xl font-bold text-foreground">
                  <span className="text-primary">ব</span>ঙ্গলিপি
                </span>
                <button onClick={close} aria-label="Close menu">
                  <CircleX className="text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              <div className="mt-5">
                <div className="flex items-center rounded-full border border-border bg-card px-3 focus-within:border-ring">
                  <Search size={18} className="text-muted-foreground" />
                  <input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search…"
                    className="w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
                {results.length > 0 && (
                  <div className="mt-2 max-h-48 overflow-auto rounded-xl border border-border bg-card">
                    {results.map((r, i) => (
                      <Link
                        key={i}
                        href={
                          r.firstName
                            ? `/profiles/${r.userId}`
                            : `/contents/${r._id}`
                        }
                        onClick={close}
                        className="flex items-center justify-between px-3 py-2 text-sm hover:bg-muted"
                      >
                        <span className="truncate text-foreground">
                          {r.firstName
                            ? `${r.firstName} ${r.lastName}`
                            : r.title}
                        </span>
                        {r.firstName ? (
                          <User size={14} className="text-muted-foreground" />
                        ) : (
                          <FileText size={14} className="text-primary" />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={close}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-auto flex items-center justify-between pt-6">
                {isSignedIn ? (
                  <UserButton />
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      close();
                      router.push("/sign-in");
                    }}
                  >
                    Login
                  </Button>
                )}
                <ThemeToggle />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
