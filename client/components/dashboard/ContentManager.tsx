"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Download,
  Edit,
  Plus,
  Trash2,
  ThumbsUp,
  FileText,
  MessageCircle,
  HandHeart,
  Heart,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Loader";

type Content = {
  _id: string;
  title: string;
  caption: string;
  content: string;
  isPublished: boolean;
  upvotes: string[];
};

type Analytics = {
  totalContents: number;
  totalUpvotes: number;
  totalChatInteractions: number;
  totalContributions: number;
};

const statMeta: { key: keyof Analytics; label: string; icon: typeof FileText }[] =
  [
    { key: "totalContents", label: "Contents", icon: FileText },
    { key: "totalUpvotes", label: "Upvotes", icon: Heart },
    { key: "totalChatInteractions", label: "Chat messages", icon: MessageCircle },
    { key: "totalContributions", label: "Contributions", icon: HandHeart },
  ];

export default function ContentManager() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    null,
  );
  const [analytics, setAnalytics] = useState<Analytics>({
    totalContents: 0,
    totalUpvotes: 0,
    totalChatInteractions: 0,
    totalContributions: 0,
  });

  useEffect(() => {
    fetch("/api/analytics")
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch((err) => console.log(err));
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch("/api/contents", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await response.json();
      setContents((c) => c.filter((content) => content._id !== id));
    } catch (error) {
      console.error(error);
    }
    setDialogOpen(false);
    setSelectedContentId(null);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedContentId(null);
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contents");
      const data = await response.json();
      setContents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (content: Content) => {
    const printWindow = window.open("", "_blank", "width=820,height=920");
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF.");
      return;
    }

    const title = DOMPurify.sanitize(content.title, { ALLOWED_TAGS: [] });
    const caption = DOMPurify.sanitize(content.caption, { ALLOWED_TAGS: [] });
    const body = DOMPurify.sanitize(content.content || "");

    printWindow.document.write(`<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <title>${title || "document"}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Nirmala UI', 'Noto Sans Bengali', 'Baloo Da 2', system-ui, Arial, sans-serif;
        color: #111827;
        line-height: 1.7;
        padding: 48px;
      }
      h1.doc-title { font-size: 28px; margin: 0 0 8px; }
      p.doc-caption { color: #4b5563; font-size: 16px; margin: 0 0 24px; }
      .doc-body h1 { font-size: 24px; font-weight: 700; margin: 0.67em 0; }
      .doc-body h2 { font-size: 20px; font-weight: 700; margin: 0.75em 0; }
      .doc-body h3 { font-size: 17px; font-weight: 700; margin: 0.83em 0; }
      .doc-body p { margin: 0.6em 0; }
      .doc-body ul { list-style: disc; padding-left: 1.5rem; }
      .doc-body ol { list-style: decimal; padding-left: 1.5rem; }
      .doc-body strong { font-weight: 700; }
      .doc-body em { font-style: italic; }
    </style>
  </head>
  <body>
    <h1 class="doc-title">${title}</h1>
    <p class="doc-caption">${caption}</p>
    <div class="doc-body">${body}</div>
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    setTimeout(() => printWindow.print(), 400);
  };

  useEffect(() => {
    fetchContents();
  }, []);

  return (
    <div>
      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statMeta.map((s) => (
          <Card key={s.key} className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {analytics[s.key] || 0}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="font-balooda text-2xl font-bold text-foreground">
          My stories
        </h2>
        <Link href="/mycontents/create">
          <Button>
            <Plus size={18} /> Create
          </Button>
        </Link>
      </div>

      <div className="mt-4 space-y-4">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : contents.length === 0 ? (
          <EmptyState
            icon={<FileText size={24} />}
            title="No contents yet"
            description="Create your first story and it will show up here."
            action={
              <Link href="/mycontents/create">
                <Button>
                  <Plus size={18} /> Create content
                </Button>
              </Link>
            }
          />
        ) : (
          contents.map((content) => (
            <Card
              key={content._id}
              className="p-6 transition-shadow hover:shadow-warm-lg"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="truncate text-xl font-bold text-foreground">
                      {content.title}
                    </h3>
                    <Badge tone={content.isPublished ? "success" : "warning"}>
                      {content.isPublished ? "Published" : "Private"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-muted-foreground">{content.caption}</p>
                  <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <ThumbsUp size={16} className="text-primary" />
                    {content.upvotes?.length || 0}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/collab/${content._id}`}>
                    <Button variant="ghost" size="icon" aria-label="Collaborate">
                      <Users size={18} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => downloadPdf(content)}
                    aria-label="Download PDF"
                  >
                    <Download size={18} />
                  </Button>
                  <Link href={`/mycontents/edit/${content._id}`}>
                    <Button variant="ghost" size="icon" aria-label="Edit">
                      <Edit size={18} />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      setDialogOpen(true);
                      setSelectedContentId(content._id);
                    }}
                    aria-label="Delete"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>

              {selectedContentId === content._id && (
                <ConfirmDialog
                  isOpen={isDialogOpen}
                  title="Delete this content?"
                  message="This action cannot be undone."
                  onConfirm={() => handleDelete(content._id)}
                  onCancel={handleCancel}
                />
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
