"use client";

import { translateBanglish } from "@/lib/translate";
import { ArrowRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export default function Converter() {
  const [banglish, setBanglish] = useState("");
  const [bangla, setBangla] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const onTranslate = async () => {
    try {
      if (!banglish.trim()) return;
      setBangla("");
      setLoading(true);
      setBangla(await translateBanglish(banglish));
    } catch (err) {
      alert("Something went wrong. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyOut = async () => {
    if (!bangla) return;
    await navigator.clipboard.writeText(bangla);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-warm-glow py-14">
      <Container>
        <PageHeader
          title="Banglish → Bangla"
          description="Type in Banglish and get natural Bangla. সহজে লিখুন বাংলায়।"
        />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <label className="mb-2 block text-sm font-medium text-muted-foreground">
              Banglish
            </label>
            <Textarea
              value={banglish}
              onChange={(e) => setBanglish(e.target.value)}
              placeholder="Ekhane kichu ekta likhun…"
              className="min-h-52 border-0 bg-transparent px-0 focus:border-0"
            />
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-warm">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-muted-foreground">
                বাংলা
              </label>
              {bangla && (
                <button
                  onClick={copyOut}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}
            </div>
            <Textarea
              readOnly
              value={bangla}
              placeholder="এখানে বাংলা দেখতে পাবেন…"
              className="min-h-52 border-0 bg-transparent px-0 font-bengali focus:border-0"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            size="lg"
            onClick={onTranslate}
            loading={loading}
            disabled={!banglish.trim()}
          >
            {loading ? (
              "Translating…"
            ) : (
              <>
                Translate <ArrowRight size={18} />
              </>
            )}
          </Button>
        </div>
      </Container>
    </div>
  );
}
