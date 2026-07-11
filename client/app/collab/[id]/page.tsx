"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Users, Link2, Copy, Check, X, Plus } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card, CardBody } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { Input, Label } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Switch from "@/components/common/Switch";
import CollaborativeEditor from "@/components/contents/CollaborativeEditor";
import toast from "react-hot-toast";

type Collaborator = { userId: string; name: string; image: string };
type DocData = {
  title: string;
  content: string;
  isOwner: boolean;
  linkAccess: boolean;
  collaborators: Collaborator[];
};

export default function CollabPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [sharePanel, setSharePanel] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [linkAccess, setLinkAccess] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/collab/${id}`);
        if (!res.ok) {
          setForbidden(true);
          return;
        }
        const d = await res.json();
        setData(d);
        setCollaborators(d.collaborators || []);
        setLinkAccess(d.linkAccess);
      } catch (e) {
        console.error(e);
        setForbidden(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const invite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/collab/${id}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setCollaborators((prev) =>
          prev.some((c) => c.userId === d.userId) ? prev : [...prev, d],
        );
        setInviteEmail("");
        toast.success("Collaborator added.");
      } else {
        toast.error(d.error || "Could not add collaborator.");
      }
    } catch {
      toast.error("Could not add collaborator.");
    } finally {
      setInviting(false);
    }
  };

  const removeCollab = async (collaboratorId: string) => {
    const res = await fetch(`/api/collab/${id}/collaborators`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collaboratorId }),
    });
    if (res.ok) {
      setCollaborators((prev) => prev.filter((c) => c.userId !== collaboratorId));
    }
  };

  const toggleLink = async (val: boolean) => {
    setLinkAccess(val);
    const res = await fetch(`/api/collab/${id}/link`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkAccess: val }),
    });
    if (!res.ok) setLinkAccess(!val);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader size={30} />
      </div>
    );
  }

  if (forbidden || !data) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center gap-2 text-center text-muted-foreground">
        <p className="text-lg font-semibold text-foreground">No access</p>
        <p>You don&apos;t have permission to edit this document.</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Collaborative document
            </p>
            <h1 className="font-balooda text-2xl font-bold text-foreground">
              {data.title}
            </h1>
          </div>
          {data.isOwner && (
            <Button variant="outline" onClick={() => setSharePanel((s) => !s)}>
              <Users size={18} /> Share
            </Button>
          )}
        </div>

        {data.isOwner && sharePanel && (
          <Card className="mt-4">
            <CardBody className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 font-medium text-foreground">
                    <Link2 size={16} /> Anyone with the link
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Signed-in users with this link can edit.
                  </p>
                </div>
                <Switch
                  checked={linkAccess}
                  onChange={() => toggleLink(!linkAccess)}
                  label=""
                />
              </div>

              <div className="flex items-center gap-2">
                <Input readOnly value={shareUrl} className="text-sm" />
                <Button variant="outline" onClick={copyLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>

              <div>
                <Label>Invite by email</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") invite();
                    }}
                  />
                  <Button onClick={invite} loading={inviting}>
                    <Plus size={16} /> Add
                  </Button>
                </div>
              </div>

              {collaborators.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Collaborators
                  </p>
                  {collaborators.map((c) => (
                    <div
                      key={c.userId}
                      className="flex items-center justify-between rounded-xl border border-border px-3 py-2"
                    >
                      <span className="text-sm text-foreground">{c.name}</span>
                      <button
                        onClick={() => removeCollab(c.userId)}
                        className="text-muted-foreground hover:text-destructive"
                        aria-label="Remove collaborator"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        <div className="mt-6">
          <CollaborativeEditor docId={id} initialHTML={data.content} />
        </div>
      </Container>
    </div>
  );
}
