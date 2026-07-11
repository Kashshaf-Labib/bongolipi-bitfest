"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, User, FileText } from "lucide-react";
import { Loader } from "@/components/ui/Loader";

type UserResult = { userId: string; firstName: string; lastName: string };
type ContentResult = { _id: string; title: string };

export default function SearchBox({ onNavigate }: { onNavigate?: () => void }) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [contents, setContents] = useState<ContentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setUsers([]);
      setContents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setUsers(data.users || []);
        setContents(data.contents || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
    router.push(href);
  };

  const seeAll = () => {
    const q = query.trim();
    if (q) go(`/search?q=${encodeURIComponent(q)}`);
  };

  const hasResults = users.length > 0 || contents.length > 0;

  return (
    <div className="relative w-full" ref={ref}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          seeAll();
        }}
        className="flex items-center rounded-full border border-border bg-card px-3 focus-within:border-ring"
      >
        <Search size={18} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search people or content…"
          className="w-full bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </form>

      {open && query.trim().length >= 1 && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-warm-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
              <Loader size={16} /> Searching…
            </div>
          ) : !hasResults ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">
              No results for “{query.trim()}”.
            </div>
          ) : (
            <div className="max-h-80 overflow-auto">
              {users.map((u, i) => (
                <button
                  key={"u" + i}
                  onClick={() => go(`/profiles/${u.userId}`)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <User size={16} className="shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">
                    {u.firstName} {u.lastName}
                  </span>
                </button>
              ))}
              {contents.map((c, i) => (
                <button
                  key={"c" + i}
                  onClick={() => go(`/contents/${c._id}`)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <FileText size={16} className="shrink-0 text-primary" />
                  <span className="truncate text-foreground">{c.title}</span>
                </button>
              ))}
            </div>
          )}

          {hasResults && (
            <button
              onClick={seeAll}
              className="block w-full border-t border-border px-4 py-2.5 text-left text-sm font-medium text-primary hover:bg-muted"
            >
              See all results
            </button>
          )}
        </div>
      )}
    </div>
  );
}
