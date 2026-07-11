"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ThumbsUp, FileText } from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Profile = {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    userId: string;
  };
  contents: {
    _id: string;
    title: string;
    caption: string;
    created_at: string;
    upvotes: string[];
  }[];
};

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      try {
        const res = await fetch(`/api/profiles/${userId}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setProfile(await res.json());
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader size={32} />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-muted-foreground">
        User not found.
      </div>
    );
  }

  const { user, contents } = profile;
  const initial = (user.firstName?.[0] || "?").toUpperCase();

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <Card className="p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {initial}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </Card>

        <h2 className="mt-10 font-balooda text-2xl font-bold text-foreground">
          Published contents
        </h2>

        <div className="mt-4">
          {contents.length === 0 ? (
            <EmptyState
              icon={<FileText size={22} />}
              title="No published contents yet"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {contents.map((c) => (
                <Link key={c._id} href={`/contents/${c._id}`}>
                  <Card className="h-full p-5 transition-shadow hover:shadow-warm-lg">
                    <h3 className="text-lg font-bold text-foreground">
                      {c.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.caption}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp size={14} className="text-primary" />
                        {c.upvotes?.length || 0}
                      </span>
                      <span className="ml-auto">
                        {new Date(c.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
