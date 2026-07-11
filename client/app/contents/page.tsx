"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ThumbsUp } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import RichContent from "@/components/common/RichContent";

type Content = {
  _id: string;
  title: string;
  caption: string;
  userId: string;
  userName: string;
  created_at: string;
  content: string;
  upvotes: string[];
};

function PublicContents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { userId } = useAuth();

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/publiccontents");
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error("Error fetching contents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (contentId: string) => {
    if (!userId) {
      alert("You must be logged in to upvote!");
      return;
    }

    try {
      const response = await fetch("/api/upvote", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentId, userId }),
      });

      const data = await response.json();
      if (response.ok) {
        setContents((prev) =>
          prev.map((content) =>
            content._id === contentId
              ? { ...content, upvotes: data.upvotes }
              : content
          )
        );
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Error upvoting content:", error);
    }
  };

  const closeModal = () => {
    setSelectedContent(null);
  };

  useEffect(() => {
    fetchContents();
  }, []);

  function onSelectContent(content:Content) {
    console.log(content)
    setSelectedContent(content)
  }
  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <motion.h1
          className="text-4xl font-bold text-blue-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Public Contents
        </motion.h1>
        <motion.button
          onClick={() => router.push("/mycontents")}
          className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-indigo-500 shadow-lg transition-transform transform hover:scale-105"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          View Dashboard
        </motion.button>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg font-semibold text-gray-500">
            Loading contents...
          </p>
        </div>
      ) : contents.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg font-semibold text-gray-500">
            No public contents found.
          </p>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.2 },
            },
          }}
        >
          {contents.map((content) => {
            const isUpvoted =
              Array.isArray(content.upvotes) &&
              content.upvotes.includes(userId || "");
            return (
              <motion.div
                key={content._id}
                className="p-6 bg-white rounded-lg shadow-lg border hover:shadow-xl transition-transform transform hover:scale-105"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => onSelectContent(content)}
              >
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  {content.title}
                </h2>
                <p className="text-base text-gray-600 mb-6">
                  {content.caption}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <p>
                    <strong>Created by:</strong> {content.userName}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(content.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent modal from opening
                    handleUpvote(content._id);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded ${
                    isUpvoted
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  } hover:bg-blue-500 transition`}
                >
                  <ThumbsUp size={18} />
                  <span>{content.upvotes?.length || 0}</span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-2/3 p-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              {selectedContent.title}
            </h2>
            <p className="text-base text-gray-600 mb-6">
              {selectedContent.caption}
            </p>
            <div className="text-gray-600 mb-4 max-h-[60vh] overflow-auto">
              <RichContent html={selectedContent.content} />
            </div>
            <div className="text-sm text-gray-500">
              <p>
                <strong>Created by:</strong> {selectedContent.userName}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedContent.created_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={closeModal}
              className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PublicContents;
