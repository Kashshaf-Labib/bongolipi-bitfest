"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RichContent from "@/components/common/RichContent";
import { ThumbsUp } from "lucide-react";
import Spinner from "@/components/common/Spinner";

type Content = {
  _id: string;
  title: string;
  caption: string;
  content: string;
  created_at: string;
  userName: string;
  upvotes: string[];
};

export default function ContentDetail() {
  const { id } = useParams<{ id: string }>();
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/publiccontents/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setContent(await res.json());
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Content not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 max-w-4xl mx-auto px-4">
      <h1 className="text-4xl font-bold text-gray-800 mb-2">{content.title}</h1>
      <p className="text-lg text-gray-600 mb-4">{content.caption}</p>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
        <span>By {content.userName}</span>
        <span>{new Date(content.created_at).toLocaleDateString()}</span>
        <span className="flex items-center gap-1">
          <ThumbsUp size={16} /> {content.upvotes?.length || 0}
        </span>
      </div>
      <div className="p-6 bg-white rounded-lg border shadow">
        <RichContent html={content.content} />
      </div>
    </div>
  );
}
