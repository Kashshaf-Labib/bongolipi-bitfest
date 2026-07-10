"use client";

import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { motion } from "framer-motion";

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
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState("");

  const [pendingContributions, setPendingContributions] = useState<
    Contribution[]
  >([]);
  const [approvedContributions, setApprovedContributions] = useState<
    Contribution[]
  >([]);

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    setError("");

    try {
      const response = await fetch("/api/admin/analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch {
      setError("Failed to fetch analytics. Please try again later.");
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch contributions
  const fetchContributions = async () => {
    try {
      const response = await fetch("/api/contributions");
      const data = await response.json();

      const pending = data.filter(
        (contribution: Contribution) => !contribution.isApproved
      );
      const approved = data.filter(
        (contribution: Contribution) => contribution.isApproved
      );

      setPendingContributions(pending);
      setApprovedContributions(approved);
    } catch {
      setError("Failed to fetch contributions. Please try again later.");
    }
  };

  const approveContribution = async (id: string) => {
    try {
      const response = await fetch("/api/contributions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve contribution.");
      }

      // Update state after approval
      setPendingContributions((prev) =>
        prev.filter((contribution) => contribution._id !== id)
      );
      fetchAnalytics(); // Refresh analytics
    } catch {
      alert("Failed to approve contribution. Please try again.");
    }
  };

  const deleteContribution = async (id: string) => {
    try {
      const response = await fetch(`/api/contributions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete contribution.");
      }

      // Update state after deletion
      setPendingContributions((prev) =>
        prev.filter((contribution) => contribution._id !== id)
      );
      setApprovedContributions((prev) =>
        prev.filter((contribution) => contribution._id !== id)
      );
      fetchAnalytics(); // Refresh analytics
    } catch {
      alert("Failed to delete contribution. Please try again.");
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchContributions();
  }, []);

  const chartData = {
    labels: ["Pending Contributions", "Approved Contributions"],
    datasets: [
      {
        data: [
          analytics?.totalPendingContributions || 0,
          analytics?.totalApprovedContributions || 0,
        ],
        backgroundColor: ["#f87171", "#4ade80"],
        hoverBackgroundColor: ["#f87171", "#4ade80"],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-6 md:px-12">
      <motion.h1
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-bold text-gray-800 text-center mb-12"
      >
        Admin Dashboard
      </motion.h1>

      {loadingAnalytics ? (
        <p className="text-center text-lg text-gray-500">
          Loading analytics...
        </p>
      ) : error ? (
        <p className="text-center text-lg text-red-500">{error}</p>
      ) : (
        analytics && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12"
          >
            {/* Analytics Cards */}
            {[
              {
                label: "Total Users",
                value: analytics.totalUsers,
                bgColor: "bg-blue-500",
              },
              {
                label: "Total Contents",
                value: analytics.totalContents,
                bgColor: "bg-green-500",
              },
              {
                label: "Pending Contributions",
                value: analytics.totalPendingContributions,
                bgColor: "bg-yellow-500",
              },
              {
                label: "Approved Contributions",
                value: analytics.totalApprovedContributions,
                bgColor: "bg-purple-500",
              },
            ].map(({ label, value, bgColor }, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-lg shadow-lg text-white ${bgColor}`}
              >
                <h2 className="text-lg font-semibold">{label}</h2>
                <p className="text-4xl font-bold">{value}</p>
              </motion.div>
            ))}
          </motion.div>
        )
      )}

      {/* Visual Analytics */}
      <div className="bg-white shadow rounded-lg p-6 mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-700">
          Visual Analytics
        </h2>
        <div className="max-w-lg mx-auto">
          <Pie data={chartData} />
        </div>
      </div>

      {/* Contributions Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-700 mb-6">
          Pending Contributions
        </h2>
        {pendingContributions.length === 0 ? (
          <p className="text-center text-lg text-gray-500">
            No pending contributions.
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {pendingContributions.map((contribution) => (
              <motion.div
                key={contribution._id}
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-white shadow rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="text-gray-800">
                    <strong>Banglish:</strong> {contribution.banglish_text}
                  </p>
                  <p className="text-gray-600">
                    <strong>Bangla:</strong> {contribution.bangla_text}
                  </p>
                </div>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                    onClick={() => approveContribution(contribution._id)}
                  >
                    Approve
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                    onClick={() => deleteContribution(contribution._id)}
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Approved Contributions Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold text-gray-700 mb-6">
          Approved Contributions
        </h2>
        {approvedContributions.length === 0 ? (
          <p className="text-center text-lg text-gray-500">
            No approved contributions.
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {approvedContributions.map((contribution) => (
              <motion.div
                key={contribution._id}
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-white shadow rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="text-gray-800">
                    <strong>Banglish:</strong> {contribution.banglish_text}
                  </p>
                  <p className="text-gray-600">
                    <strong>Bangla:</strong> {contribution.bangla_text}
                  </p>
                </div>
                <button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                  onClick={() => deleteContribution(contribution._id)}
                >
                  Delete
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  );
}
