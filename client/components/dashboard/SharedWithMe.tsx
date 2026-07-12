"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Loader";

type Shared = {
  _id: string;
  title: string;
  caption: string;
  ownerName: string;
};

export default function SharedWithMe() {
  const [items, setItems] = useState<Shared[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collab/shared")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Users size={24} />}
        title="Nothing shared with you yet"
        description="Documents people invite you to collaborate on will appear here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((s) => (
        <Link key={s._id} href={`/collab/${s._id}`}>
          <Card className="p-6 transition-shadow hover:shadow-warm-lg">
            <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
            <p className="mt-1 text-muted-foreground">{s.caption}</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Shared by {s.ownerName}
            </p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
