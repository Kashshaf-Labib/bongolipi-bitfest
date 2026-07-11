"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThumbsUp, X, Compass } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import RichContent from "@/components/common/RichContent";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

type Content = {
  _id: string;
  title: string;
  caption: string;
  userId: string;
  userName: string;
  created_at: string;
  content: string;
  upvotes: string[];
};

function PublicContents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { userId } = useAuth();

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/publiccontents");
      const data = await response.json();
      setContents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (contentId: string) => {
    if (!userId) {
      alert("You must be logged in to upvote!");
      return;
    }
    try {
      const response = await fetch("/api/upvote", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, userId }),
      });
      const data = await response.json();
      if (response.ok) {
        setContents((prev) =>
          prev.map((content) =>
            content._id === contentId
              ? { ...content, upvotes: data.upvotes }
              : content,
          ),
        );
      }
    } catch (error) {
      console.error("Error upvoting content:", error);
    }
  };

  useEffect(() => {
    fetchContents();
  }, []);

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <PageHeader
          title="Explore"
          description="Discover stories published by the community."
          actions={
            <Button variant="outline" onClick={() => router.push("/mycontents")}>
              My dashboard
            </Button>
          }
        />

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-44 w-full" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <EmptyState
              icon={<Compass size={24} />}
              title="Nothing published yet"
              description="Published stories from the community will appear here."
            />
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {contents.map((content, i) => {
                const isUpvoted =
                  Array.isArray(content.upvotes) &&
                  content.upvotes.includes(userId || "");
                return (
                  <motion.div
                    key={content._id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.05 }}
                  >
                    <Card
                      className="flex h-full cursor-pointer flex-col p-6 transition-shadow hover:shadow-warm-lg"
                      onClick={() => setSelectedContent(content)}
                    >
                      <h2 className="text-xl font-bold text-foreground">
                        {content.title}
                      </h2>
                      <p className="mt-2 flex-1 text-muted-foreground">
                        {content.caption}
                      </p>
                      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm text-muted-foreground">
                        <span>
                          <Link
                            href={`/profiles/${content.userId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {content.userName}
                          </Link>{" "}
                          · {new Date(content.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpvote(content._id);
                          }}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium transition-colors",
                            isUpvoted
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground hover:bg-primary/10 hover:text-primary",
                          )}
                        >
                          <ThumbsUp size={15} />
                          {content.upvotes?.length || 0}
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </Container>

      {/* Modal */}
      {selectedContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={() => setSelectedContent(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-auto rounded-2xl border border-border bg-card p-8 shadow-warm-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-2xl font-bold text-foreground">
                {selectedContent.title}
              </h2>
              <button
                onClick={() => setSelectedContent(null)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-muted-foreground">
              {selectedContent.caption}
            </p>
            <div className="mt-2 text-sm text-muted-foreground">
              By{" "}
              <Link
                href={`/profiles/${selectedContent.userId}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {selectedContent.userName}
              </Link>{" "}
              · {new Date(selectedContent.created_at).toLocaleDateString()}
            </div>
            <div className="mt-6 border-t border-border pt-6">
              <RichContent html={selectedContent.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicContents;
