"use client";

import { CircleX, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/components/ui/Button";
import ThemeToggle from "./ThemeToggle";
import SearchBox from "./SearchBox";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Converter", href: "/converter" },
  { label: "Contents", href: "/contents" },
  { label: "Chatbot", href: "/chatbot" },
  { label: "Contribute", href: "/contribute" },
];

export default function MobileSidebar() {
  const [show, setShow] = useState(false);
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const close = () => setShow(false);

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
                <SearchBox onNavigate={close} />
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
                {isSignedIn && (
                  <Link
                    href="/dashboard"
                    onClick={close}
                    className={cn(
                      "rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                      isActive("/dashboard")
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    Dashboard
                  </Link>
                )}
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
