"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Users, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader } from "@/components/ui/Loader";

ChartJS.register(ArcElement, Tooltip, Legend);

type Contribution = {
  _id: string;
  userId: string;
  banglish_text: string;
  bangla_text: string;
  isApproved: boolean;
};

type Analytics = {
  totalUsers: number;
  totalContents: number;
  totalPendingContributions: number;
  totalApprovedContributions: number;
};

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [pendingContributions, setPendingContributions] = useState<
    Contribution[]
  >([]);
  const [approvedContributions, setApprovedContributions] = useState<
    Contribution[]
  >([]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/admin/analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch {
      // ignore
    }
  };

  const fetchContributions = async () => {
    try {
      const response = await fetch("/api/contributions");
      const data = await response.json();
      setPendingContributions(
        data.filter((c: Contribution) => !c.isApproved),
      );
      setApprovedContributions(
        data.filter((c: Contribution) => c.isApproved),
      );
    } catch {
      // ignore
    }
  };

  const approveContribution = async (id: string) => {
    try {
      const response = await fetch("/api/contributions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed");
      const approved = pendingContributions.find((c) => c._id === id);
      setPendingContributions((prev) => prev.filter((c) => c._id !== id));
      if (approved)
        setApprovedContributions((prev) => [
          { ...approved, isApproved: true },
          ...prev,
        ]);
      fetchAnalytics();
    } catch {
      alert("Failed to approve contribution. Please try again.");
    }
  };

  const deleteContribution = async (id: string) => {
    try {
      const response = await fetch(`/api/contributions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed");
      setPendingContributions((prev) => prev.filter((c) => c._id !== id));
      setApprovedContributions((prev) => prev.filter((c) => c._id !== id));
      fetchAnalytics();
    } catch {
      alert("Failed to delete contribution. Please try again.");
    }
  };

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.replace("/");
      return;
    }
    if (isAdmin) {
      fetchAnalytics();
      fetchContributions();
    }
  }, [isLoaded, isAdmin, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center">
        <Loader size={30} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center text-muted-foreground">
        Access denied.
      </div>
    );
  }

  const chartData = {
    labels: ["Pending", "Approved"],
    datasets: [
      {
        data: [
          analytics?.totalPendingContributions || 0,
          analytics?.totalApprovedContributions || 0,
        ],
        backgroundColor: ["#e9a23b", "#5b8c51"],
        borderWidth: 0,
      },
    ],
  };

  const stats = [
    { label: "Users", value: analytics?.totalUsers, icon: Users },
    { label: "Contents", value: analytics?.totalContents, icon: FileText },
    {
      label: "Pending",
      value: analytics?.totalPendingContributions,
      icon: Clock,
    },
    {
      label: "Approved",
      value: analytics?.totalApprovedContributions,
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] py-12">
      <Container>
        <PageHeader
          title="Admin dashboard"
          description="Overview and contribution moderation."
        />

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {s.value ?? 0}
                  </p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Chart */}
        <Card className="mt-6">
          <CardBody>
            <h2 className="text-lg font-bold text-foreground">Contributions</h2>
            <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
              <div className="h-52 w-52">
                <Pie
                  data={chartData}
                  options={{ plugins: { legend: { display: false } } }}
                />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-secondary" />
                  <span className="text-muted-foreground">
                    Pending · {analytics?.totalPendingContributions || 0}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: "#5b8c51" }}
                  />
                  <span className="text-muted-foreground">
                    Approved · {analytics?.totalApprovedContributions || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Pending */}
        <section className="mt-10">
          <h2 className="mb-4 font-balooda text-2xl font-bold text-foreground">
            Pending contributions
          </h2>
          {pendingContributions.length === 0 ? (
            <EmptyState icon={<Clock size={22} />} title="Nothing pending" />
          ) : (
            <div className="space-y-3">
              {pendingContributions.map((c) => (
                <Card key={c._id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-foreground">
                        <span className="text-muted-foreground">Banglish:</span>{" "}
                        {c.banglish_text}
                      </p>
                      <p className="font-bengali text-foreground">
                        <span className="font-sans text-muted-foreground">
                          Bangla:
                        </span>{" "}
                        {c.bangla_text}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => approveContribution(c._id)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => deleteContribution(c._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Approved */}
        <section className="mt-10">
          <h2 className="mb-4 font-balooda text-2xl font-bold text-foreground">
            Approved contributions
          </h2>
          {approvedContributions.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={22} />}
              title="No approved contributions yet"
            />
          ) : (
            <div className="space-y-3">
              {approvedContributions.map((c) => (
                <Card key={c._id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-foreground">
                        <span className="text-muted-foreground">Banglish:</span>{" "}
                        {c.banglish_text}
                      </p>
                      <p className="font-bengali text-foreground">
                        <span className="font-sans text-muted-foreground">
                          Bangla:
                        </span>{" "}
                        {c.bangla_text}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive"
                      onClick={() => deleteContribution(c._id)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </Container>
    </div>
  );
}
