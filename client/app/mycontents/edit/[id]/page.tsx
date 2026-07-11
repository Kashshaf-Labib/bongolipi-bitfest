"use client";

import Switch from "@/components/common/Switch";
import Tiptap from "@/components/contents/TipTap";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";

export default function EditContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [initialContent, setInitialContent] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/contents/${id}`);
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        setTitle(data.title || "");
        setCaption(data.caption || "");
        setContent(data.content || "");
        setInitialContent(data.content || "");
        setIsPublished(!!data.isPublished);
      } catch (error) {
        console.error(error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const saveContent = async () => {
    if (!title || !caption || !content) {
      toast.error("Title, caption and content are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/contents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, caption, content, isPublished }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Content updated.");
        router.push("/mycontents");
      } else {
        toast.error(data.error || "Failed to update content.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader size={32} />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-muted-foreground">
        Content not found.
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <PageHeader
          title="Edit content"
          description="Update your story and save the changes."
        />

        <Card className="mt-8">
          <CardBody className="space-y-5">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Give it a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="caption">Caption</Label>
              <Input
                id="caption"
                placeholder="A short caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
            </div>

            <div>
              <Label>Content</Label>
              <Tiptap
                onContentChange={setContent}
                initialContent={initialContent}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <Switch
                checked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
              />
              <Button onClick={saveContent} loading={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}
