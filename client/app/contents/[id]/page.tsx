"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import RichContent from "@/components/common/RichContent";
import { ThumbsUp } from "lucide-react";
import { Loader } from "@/components/ui/Loader";
import { Container } from "@/components/ui/Container";
import { Card, CardBody } from "@/components/ui/Card";

type Content = {
  _id: string;
  title: string;
  caption: string;
  content: string;
  created_at: string;
  userId: string;
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
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader size={32} />
      </div>
    );
  }

  if (notFound || !content) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-muted-foreground">
        Content not found.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container className="max-w-3xl">
        <h1 className="font-balooda text-3xl font-bold text-balance text-foreground sm:text-4xl">
          {content.title}
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">{content.caption}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>
            By{" "}
            <Link
              href={`/profiles/${content.userId}`}
              className="font-medium text-foreground hover:text-primary"
            >
              {content.userName}
            </Link>
          </span>
          <span>{new Date(content.created_at).toLocaleDateString()}</span>
          <span className="inline-flex items-center gap-1">
            <ThumbsUp size={15} className="text-primary" />
            {content.upvotes?.length || 0}
          </span>
        </div>

        <Card className="mt-8">
          <CardBody className="p-8">
            <RichContent html={content.content} />
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
