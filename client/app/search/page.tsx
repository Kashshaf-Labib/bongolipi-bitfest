"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { User, FileText, Search as SearchIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { EmptyState } from "@/components/ui/EmptyState";

type UserResult = { userId: string; firstName: string; lastName: string };
type ContentResult = {
  _id: string;
  title: string;
  caption: string;
  created_at: string;
};

function SearchResults() {
  const params = useSearchParams();
  const q = params.get("q") || "";
  const [users, setUsers] = useState<UserResult[]>([]);
  const [contents, setContents] = useState<ContentResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) {
      setUsers([]);
      setContents([]);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=20`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setContents(d.contents || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [q]);

  const empty = !loading && users.length === 0 && contents.length === 0;

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <h1 className="font-balooda text-3xl font-bold text-foreground">
          {q ? <>Results for “{q}”</> : "Search"}
        </h1>

        {loading ? (
          <div className="mt-12 flex justify-center">
            <Loader size={28} />
          </div>
        ) : empty ? (
          <div className="mt-10">
            <EmptyState
              icon={<SearchIcon size={22} />}
              title="No results"
              description={
                q ? `Nothing matched “${q}”.` : "Type a query to search."
              }
            />
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {users.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  People
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {users.map((u) => (
                    <Link key={u.userId} href={`/profiles/${u.userId}`}>
                      <Card className="flex items-center gap-3 p-4 transition-shadow hover:shadow-warm-lg">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User size={18} />
                        </span>
                        <span className="font-medium text-foreground">
                          {u.firstName} {u.lastName}
                        </span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {contents.length > 0 && (
              <section>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Contents
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {contents.map((c) => (
                    <Link key={c._id} href={`/contents/${c._id}`}>
                      <Card className="p-4 transition-shadow hover:shadow-warm-lg">
                        <div className="flex items-center gap-2 text-foreground">
                          <FileText size={16} className="shrink-0 text-primary" />
                          <span className="font-semibold">{c.title}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {c.caption}
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
          <Loader size={28} />
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}
