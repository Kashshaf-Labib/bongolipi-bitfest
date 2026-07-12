"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import toast from "react-hot-toast";
import { Check, Wifi, WifiOff } from "lucide-react";
import { COLLAB_URL } from "@/lib/const";
import { translateBanglish } from "@/lib/translate";
import { Loader } from "@/components/ui/Loader";
import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Identity = { name: string; color: string };
type PresenceUser = { name: string; color: string };

export default function CollaborativeEditor({
  docId,
  initialHTML,
}: {
  docId: string;
  initialHTML: string;
}) {
  // Recreate the shared document when the doc id changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ydoc = useMemo(() => new Y.Doc(), [docId]);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let prov: HocuspocusProvider | null = null;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/collab/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docId }),
        });
        if (!res.ok) {
          setError("You don't have access to this document.");
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setIdentity({ name: data.name, color: data.color });
        prov = new HocuspocusProvider({
          url: COLLAB_URL,
          name: docId,
          document: ydoc,
          token: data.token,
        });
        setProvider(prov);
      } catch (e) {
        console.error(e);
        setError("Could not connect to the collaboration server.");
      }
    })();

    return () => {
      cancelled = true;
      prov?.destroy();
    };
  }, [docId, ydoc]);

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!provider || !identity) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-12">
        <Loader size={26} />
      </div>
    );
  }

  return (
    <CollabInner
      provider={provider}
      ydoc={ydoc}
      identity={identity}
      docId={docId}
      initialHTML={initialHTML}
    />
  );
}

function CollabInner({
  provider,
  ydoc,
  identity,
  docId,
  initialHTML,
}: {
  provider: HocuspocusProvider;
  ydoc: Y.Doc;
  identity: Identity;
  docId: string;
  initialHTML: string;
}) {
  const [status, setStatus] = useState<string>("connecting");
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [translating, setTranslating] = useState(false);
  const dirtyRef = useRef(false);
  const seededRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCursor.configure({ provider, user: identity }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "min-h-[300px] focus:outline-none" },
    },
    onUpdate: () => {
      dirtyRef.current = true;
      setSaved(false);
    },
  });

  // Connection status
  useEffect(() => {
    const onStatus = (event: { status: string }) => setStatus(event.status);
    provider.on("status", onStatus);
    return () => {
      provider.off("status", onStatus);
    };
  }, [provider]);

  // Presence (from awareness)
  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;
    const update = () => {
      const states = Array.from(awareness.getStates().values()) as {
        user?: PresenceUser;
      }[];
      const seen = new Map<string, PresenceUser>();
      for (const s of states) {
        if (s.user) seen.set(s.user.name + s.user.color, s.user);
      }
      setUsers([...seen.values()]);
    };
    awareness.on("change", update);
    update();
    return () => {
      awareness.off("change", update);
    };
  }, [provider]);

  // Seed initial content once, only if the shared doc is empty
  useEffect(() => {
    if (!editor) return;
    const trySeed = () => {
      if (seededRef.current) return;
      seededRef.current = true;
      const frag = ydoc.getXmlFragment("default");
      if (frag.length === 0 && initialHTML) {
        editor.commands.setContent(initialHTML, false);
      }
    };
    if (provider.isSynced) trySeed();
    provider.on("synced", trySeed);
    return () => {
      provider.off("synced", trySeed);
    };
  }, [editor, provider, ydoc, initialHTML]);

  const save = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/collab/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editor.getHTML() }),
      });
      if (res.ok) {
        dirtyRef.current = false;
        setSaved(true);
      } else {
        toast.error("Could not save.");
      }
    } catch {
      toast.error("Could not save.");
    } finally {
      setSaving(false);
    }
  }, [editor, docId]);

  // Autosave every 5s while there are unsaved changes
  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current) save();
    }, 5000);
    return () => clearInterval(t);
  }, [save]);

  const translate = async () => {
    if (!editor) return;
    const selection = editor.state.selection;
    if (!selection || selection.empty) {
      toast.error("Please select some text to translate.");
      return;
    }
    const { from, to } = selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    setTranslating(true);
    try {
      const translated = await translateBanglish(selectedText);
      if (translated) {
        editor.chain().focus().insertContentAt({ from, to }, translated).run();
      } else {
        toast.error("Could not translate.");
      }
    } catch {
      toast.error("Could not translate.");
    } finally {
      setTranslating(false);
    }
  };

  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium",
              status === "connected"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {status === "connected" ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
            {status === "connected" ? "Connected" : "Connecting…"}
          </span>

          <div className="flex -space-x-2">
            {users.map((u, i) => (
              <span
                key={i}
                title={u.name}
                style={{ background: u.color }}
                className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-card"
              >
                {(u.name?.[0] || "U").toUpperCase()}
              </span>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {users.length} online
          </span>
        </div>

        <div className="flex items-center gap-3">
          {saved && !saving && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Check size={13} /> Saved
            </span>
          )}
          <Button size="sm" onClick={save} loading={saving}>
            Save
          </Button>
        </div>
      </div>

      {editor && (
        <div className="toolbar flex flex-wrap items-center gap-2 rounded-t-xl border border-b-0 border-border bg-muted px-2 py-1.5">
          <button
            className="font-bold"
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            B
          </button>
          <button
            className="italic"
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            I
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            H1
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            H2
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            p
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            • List
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().undo().run()}
          >
            ↩
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().redo().run()}
          >
            ↪
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={translate}
            disabled={translating}
            className="ml-auto bg-primary text-primary-foreground hover:!bg-primary/90"
          >
            {translating ? "Translating…" : "Translate"}
          </button>
        </div>
      )}
      <EditorContent
        editor={editor}
        className="rounded-b-xl border border-border bg-card p-3"
      />
    </div>
  );
}
