"use client";

import Switch from "@/components/common/Switch";
import Tiptap from "@/components/contents/TipTap";
import Spinner from "@/components/common/Spinner";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
      toast.error("Title, Caption and Content are required.");
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
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Content not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4">
      <h1 className="text-4xl font-bold">Edit Content</h1>
      <div className="my-6 p-4 shadow bg-white rounded border">
        <input
          type="text"
          name="title"
          placeholder="Title"
          className="w-full border rounded-md p-2 outline-none my-4"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          name="caption"
          placeholder="Caption"
          className="w-full border rounded-md p-2 outline-none my-4"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />
        <div className="p-4 shadow bg-white rounded border min-h-40">
          <Tiptap onContentChange={setContent} initialContent={initialContent} />
        </div>
        <div className="pt-4">
          <Switch
            checked={isPublished}
            onChange={() => setIsPublished(!isPublished)}
          />
        </div>
        <div className="pt-8">
          <button
            disabled={saving}
            onClick={saveContent}
            className="bg-primary rounded text-white p-4"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
