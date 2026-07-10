"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Spinner from "@/components/common/Spinner";
import { Download, Edit, Plus, Trash2,ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import MarkdownPreview from "@uiw/react-markdown-preview";
import html2canvas from "html2canvas";


type Content = {
  _id: string;
  title: string;
  caption: string;
  content: string;
  isPublished: boolean;
  upvotes: string[];
};


function Contents() {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(
    null
  );
  const [analytics, setAnalytics] = useState({
    totalContents: 0,
    totalUpvotes: 0,
    totalChatInteractions: 0,
    totalContributions: 0,
  });

  useEffect(() => {
    fetch("/api/analytics")
    .then(res => res.json())
    .then(data => {
      setAnalytics(data);
    }).catch(err=> console.log(err))
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const url = `/api/contents`;
      const response = await fetch(url, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      await response.json();
      setContents((c) => c.filter((content) => content._id !== id));
    } catch (error) {
      console.error(error);
    }

    setDialogOpen(false);
    setSelectedContentId(null);
  };

  const handleCancel = () => {
    setDialogOpen(false);
    setSelectedContentId(null);
  };

  const fetchContents = async () => {
    try {
      setLoading(true);
      const url = `/api/contents`;
      const response = await fetch(url);
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = async (doc_id: string) => {
    const content = document.getElementById(doc_id) as HTMLElement;
    content.style.display = "block";

    const canvas = await html2canvas(content, {
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save("document.pdf");
    content.style.display = "none";
  };

  useEffect(() => {
    fetchContents();
  }, []);

  // const pieData = {
  //   labels: ["Contents", "Upvotes", "Chat Interactions", "Contributions"],
  //   datasets: [
  //     {
  //       data: [
  //         analytics?.totalContents || 0,
  //         analytics?.totalUpvotes || 0,
  //         analytics?.totalChatInteractions || 0,
  //         analytics?.totalContributions || 0,
  //       ],
  //       backgroundColor: ["#4CAF50", "#2196F3", "#FF9800", "#F44336"],
  //       hoverBackgroundColor: ["#45A049", "#1E88E5", "#FB8C00", "#E53935"],
  //     },
  //   ],
  // };

  return (
    <div className="min-h-screen py-12 max-w-7xl mx-auto px-4">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-primary">Manage Contents</h1>
        <Link
          href="/mycontents/create"
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-indigo-500 transition"
        >
          <Plus />
          <span>Create</span>
        </Link>
      </div>

      {/* Contents Section */}
      <div className="p-6 shadow-md rounded-lg bg-gray-50 border">

        {loading ? (
          <Spinner />
        ) : contents.length === 0 ? (
          <p className="text-center text-gray-500">No contents found.</p>
        ) : (
          contents.map((content) => (
            <div
              key={content._id}
              className="p-6 bg-white rounded-lg shadow-md border hover:shadow-lg transition mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {content.title}
              </h2>
              <p className="text-gray-600 text-base mb-4">{content.caption}</p>
              <div className="text-sm text-gray-500 mb-4">
                <span
                  className={`px-3 py-1 rounded ${
                    content.isPublished
                      ? "bg-green-100 text-green-600"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {content.isPublished ? "Published" : "Private"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                  <ThumbsUp className="text-blue-600" size={20} />
                  <span>{content.upvotes?.length || 0}</span>
                </div>
              <div className="flex justify-end items-center gap-4">
                <ContentTemplate {...content} />
                <button
                  className="text-blue-600 hover:text-primary"
                  onClick={() => downloadPdf(`doc_${content._id}`)}
                >
                  <Download size={20} />
                </button>
                <Link
                  href={`/mycontents/edit/${content._id}`}
                  className="text-orange-600 hover:text-orange-800"
                >
                  <Edit size={20} />
                </Link>
                <button
                  className="text-red-600 hover:text-red-800"
                  onClick={() => {
                    setDialogOpen(true);
                    setSelectedContentId(content._id);
                  }}
                >
                  <Trash2 size={20} />
                </button>
                {selectedContentId === content._id && (
                  <ConfirmDialog
                    isOpen={isDialogOpen}
                    title="Confirm Deletion"
                    message="Are you sure you want to delete? This action cannot be undone."
                    onConfirm={() => handleDelete(content._id)}
                    onCancel={handleCancel}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Analytics Section */}
      <h1 className="pt-12 pb-4 text-3xl text-primary font-bold">User Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="p-4 bg-green-100 rounded shadow text-center">
          <h2 className="text-xl font-semibold text-green-700">Total Contents</h2>
          <p className="text-3xl font-bold">{analytics?.totalContents || 0}</p>
        </div>
        <div className="p-4 bg-blue-100 rounded shadow text-center">
          <h2 className="text-xl font-semibold text-blue-700">Total Upvotes</h2>
          <p className="text-3xl font-bold">{analytics?.totalUpvotes || 0}</p>
        </div>
        <div className="p-4 bg-orange-100 rounded shadow text-center">
          <h2 className="text-xl font-semibold text-orange-700">
            Chat Interactions
          </h2>
          <p className="text-3xl font-bold">
            {analytics?.totalChatInteractions || 0}
          </p>
        </div>
        <div className="p-4 bg-red-100 rounded shadow text-center">
          <h2 className="text-xl font-semibold text-red-700">Contributions</h2>
          <p className="text-3xl font-bold">{analytics?.totalContributions || 0}</p>
        </div>
      </div>
    </div>
  );
}

const ContentTemplate = (content: Content) => {
  return (
    <div
      id={`doc_` + content._id}
      style={{ display: "none" }}
      className="p-6 bg-white rounded-lg border shadow fixed"
    >
      <h2 className="text-2xl font-bold mb-4">{content.title}</h2>
      <p className="text-base text-gray-600 mb-6">{content.caption}</p>
      <MarkdownPreview
        style={{ backgroundColor: "transparent" }}
        source={content.content}
      />
    </div>
  );
};

export default Contents;





