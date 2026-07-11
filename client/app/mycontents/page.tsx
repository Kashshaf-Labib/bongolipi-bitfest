"use client";

import ConfirmDialog from "@/components/common/ConfirmDialog";
import Spinner from "@/components/common/Spinner";
import { Download, Edit, Plus, Trash2,ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";


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

  const downloadPdf = (content: Content) => {
    // Print the content in a clean window: the browser shapes Bangla correctly
    // and the resulting PDF has real, selectable text (not an image).
    const printWindow = window.open("", "_blank", "width=820,height=920");
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF.");
      return;
    }

    const title = DOMPurify.sanitize(content.title, { ALLOWED_TAGS: [] });
    const caption = DOMPurify.sanitize(content.caption, { ALLOWED_TAGS: [] });
    const body = DOMPurify.sanitize(content.content || "");

    printWindow.document.write(`<!doctype html>
<html lang="bn">
  <head>
    <meta charset="utf-8" />
    <title>${title || "document"}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        font-family: 'Nirmala UI', 'Noto Sans Bengali', 'Baloo Da 2', system-ui, Arial, sans-serif;
        color: #111827;
        line-height: 1.7;
        padding: 48px;
      }
      h1.doc-title { font-size: 28px; margin: 0 0 8px; }
      p.doc-caption { color: #4b5563; font-size: 16px; margin: 0 0 24px; }
      .doc-body h1 { font-size: 24px; font-weight: 700; margin: 0.67em 0; }
      .doc-body h2 { font-size: 20px; font-weight: 700; margin: 0.75em 0; }
      .doc-body h3 { font-size: 17px; font-weight: 700; margin: 0.83em 0; }
      .doc-body p { margin: 0.6em 0; }
      .doc-body ul { list-style: disc; padding-left: 1.5rem; }
      .doc-body ol { list-style: decimal; padding-left: 1.5rem; }
      .doc-body strong { font-weight: 700; }
      .doc-body em { font-style: italic; }
    </style>
  </head>
  <body>
    <h1 class="doc-title">${title}</h1>
    <p class="doc-caption">${caption}</p>
    <div class="doc-body">${body}</div>
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.onafterprint = () => printWindow.close();
    // Give the new document a tick to render (fonts) before printing.
    setTimeout(() => printWindow.print(), 400);
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
                <button
                  className="text-blue-600 hover:text-primary"
                  onClick={() => downloadPdf(content)}
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

export default Contents;





