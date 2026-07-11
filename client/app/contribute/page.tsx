"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Textarea, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HeartHandshake } from "lucide-react";

type Contribution = {
  banglish_text: string;
  bangla_text: string;
  isApproved: boolean;
};

export default function Contribute() {
  const [loading, setLoading] = useState(false);
  const [banglish, setBanglish] = useState("");
  const [bangla, setBangla] = useState("");
  const [contributions, setContributions] = useState<Contribution[] | null>();

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const response = await fetch("/api/contribution");
        const data = await response.json();
        setContributions(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Something went wrong. Please try again later.");
        console.error(err);
      }
    };
    fetchContributions();
  }, []);

  const onSubmit = async () => {
    try {
      if (!banglish || !bangla) return;
      setLoading(true);
      const response = await fetch("/api/contribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          banglish_text: banglish,
          bangla_text: bangla,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Successfully submitted!");
        setContributions((prev) => [
          { banglish_text: banglish, bangla_text: bangla, isApproved: false },
          ...(prev || []),
        ]);
        setBanglish("");
        setBangla("");
      } else {
        toast.error("Something went wrong. Please try again later.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <PageHeader
          title="Contribute"
          description="Help improve Banglish → Bangla by submitting text pairs. Every contribution makes the translation smarter."
        />

        <Card className="mt-8">
          <CardBody className="space-y-5">
            <div>
              <Label htmlFor="banglish">Banglish text</Label>
              <Textarea
                id="banglish"
                placeholder="Ekhane banglish likhun…"
                value={banglish}
                onChange={(e) => setBanglish(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="bangla">Bangla text</Label>
              <Textarea
                id="bangla"
                className="font-bengali"
                placeholder="এখানে বাংলা লিখুন…"
                value={bangla}
                onChange={(e) => setBangla(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button
                onClick={onSubmit}
                loading={loading}
                disabled={!banglish || !bangla}
              >
                {loading ? "Submitting…" : "Submit"}
              </Button>
            </div>
          </CardBody>
        </Card>

        <h2 className="mb-4 mt-12 font-balooda text-2xl font-bold text-foreground">
          My contributions
        </h2>

        {!contributions ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : contributions.length === 0 ? (
          <EmptyState
            icon={<HeartHandshake size={22} />}
            title="No contributions yet"
            description="Your submitted pairs will appear here."
          />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Banglish</th>
                    <th className="px-4 py-3 font-medium">Bangla</th>
                    <th className="px-4 py-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.map((c, index) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="px-4 py-3 text-foreground">
                        {c.banglish_text}
                      </td>
                      <td className="px-4 py-3 font-bengali text-foreground">
                        {c.bangla_text}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge tone={c.isApproved ? "success" : "warning"}>
                          {c.isApproved ? "Approved" : "Pending"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Container>
    </div>
  );
}
