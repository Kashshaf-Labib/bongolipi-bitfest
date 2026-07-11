"use client";

import Switch from "@/components/common/Switch";
import Tiptap from "@/components/contents/TipTap";
import { useState } from "react";
import toast from "react-hot-toast";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { Sparkles } from "lucide-react";

function Create() {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [loadingTitles, setLoadingTitles] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setIsLoading] = useState(false);

  const generateCaptionAndTitle = async () => {
    if (!content || content.length <= 50) {
      toast.error("Write at least 50 characters before auto-generating.");
      return;
    }
    try {
      setLoadingTitles(true);
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputText: content }),
      });
      const data = await response.json();
      setTitle(data.title || "");
      setCaption(data.caption || "");
    } catch (error) {
      console.error(error);
      toast.error("Could not generate a title and caption.");
    } finally {
      setLoadingTitles(false);
    }
  };

  const createContent = async () => {
    if (!title || !caption || !content) {
      toast.error("Title, caption and content are required.");
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch("/api/contents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, caption, content, isPublished }),
      });
      const data = await response.json();
      toast.success(data.message || "Content created.");
      setTitle("");
      setCaption("");
      setContent("");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <PageHeader
          title="Create content"
          description="Write a story or note, then publish it or keep it private."
        />

        <Card className="mt-8">
          <CardBody className="space-y-5">
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={generateCaptionAndTitle}
                loading={loadingTitles}
              >
                <Sparkles size={16} /> Auto title &amp; caption
              </Button>
            </div>

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
              <Tiptap onContentChange={setContent} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <Switch
                checked={isPublished}
                onChange={() => setIsPublished(!isPublished)}
              />
              <Button onClick={createContent} loading={loading}>
                {loading ? "Creating…" : "Create now"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </Container>
    </div>
  );
}

export default Create;
