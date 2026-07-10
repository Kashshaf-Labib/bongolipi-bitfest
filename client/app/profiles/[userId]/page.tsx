"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ThumbsUp } from "lucide-react";
import Spinner from "@/components/common/Spinner";

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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        User not found.
      </div>
    );
  }

  const { user, contents } = profile;

  return (
    <div className="min-h-screen py-12 max-w-4xl mx-auto px-4">
      <div className="p-6 bg-white rounded-lg border shadow mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-gray-500">{user.email}</p>
      </div>

      <h2 className="text-2xl font-bold text-primary mb-4">Published Contents</h2>
      {contents.length === 0 ? (
        <p className="text-gray-500">No published contents yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {contents.map((c) => (
            <Link
              key={c._id}
              href={`/contents/${c._id}`}
              className="p-4 bg-white rounded-lg border shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-bold text-gray-800">{c.title}</h3>
              <p className="text-gray-600 mb-2">{c.caption}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ThumbsUp size={14} /> {c.upvotes?.length || 0}
                <span className="ml-auto">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
