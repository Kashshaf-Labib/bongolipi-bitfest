"use client";

import {
  ChangeEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Upload } from "lucide-react";
import { PDF_QUERY_URL } from "@/lib/const";
import toast from "react-hot-toast";

type ChatMessage = {
  _id?: string;
  role: string;
  content: string;
};

function ChatbotContent() {
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState<string>("");
  const [loadingResponse, setLoadingResponse] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const refreshHistory = useCallback(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => setChatHistory(data.sessions || []))
      .catch(console.error);
  }, []);

  // Keep the active session in sync with the URL so history clicks work.
  useEffect(() => {
    setSessionId(searchParams.get("sessionId") || "");
  }, [searchParams]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  // Load the messages for the active session.
  useEffect(() => {
    if (!sessionId) {
      setChats([]);
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/chat/${sessionId}`);
        const data = await res.json();
        setChats(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    })();
  }, [sessionId]);

  const persistMessage = async (
    session: string,
    role: string,
    content: string,
  ) => {
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: session, role, content }),
    });
  };

  const handleSendMessage = async () => {
    const question = currentMessage.trim();
    if (!question) {
      toast.error(
        file ? "Please type a question about the PDF." : "Please type a message.",
      );
      return;
    }

    setLoadingResponse(true);
    try {
      if (file) {
        // Retrieval-augmented answer over the uploaded PDF.
        const formData = new FormData();
        formData.append("pdf_file", file);
        formData.append("question", question);

        const res = await fetch(`${PDF_QUERY_URL}/rag-multi-query`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (!data.answer) {
          toast.error("Could not get an answer from the document.");
          return;
        }

        // The RAG service is stateless, so persist the exchange ourselves.
        const activeSession = sessionId || crypto.randomUUID();
        setChats((prev) => [
          ...prev,
          { role: "user", content: question },
          { role: "assistant", content: data.answer },
        ]);
        await persistMessage(activeSession, "user", question);
        await persistMessage(activeSession, "assistant", data.answer);

        setFile(null);
        setCurrentMessage("");
        if (!sessionId) {
          setSessionId(activeSession);
          router.push(`/chatbot?sessionId=${activeSession}`);
        }
      } else {
        // Plain chat; /api/chat/generate persists both sides itself.
        const res = await fetch(`/api/chat/generate?sessionId=${sessionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: question }),
        });
        const data = await res.json();

        const newSessionId = data.sessionId || sessionId;
        setChats((prev) => [
          ...prev,
          { role: "user", content: question },
          ...(data.response ? [data.response as ChatMessage] : []),
        ]);
        setCurrentMessage("");

        if (newSessionId && newSessionId !== sessionId) {
          setSessionId(newSessionId);
          router.push(`/chatbot?sessionId=${newSessionId}`);
        }
      }

      refreshHistory();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setLoadingResponse(false);
    }
  };

  const newChat = () => {
    setSessionId("");
    setChats([]);
    setCurrentMessage("");
    router.push("/chatbot");
  };

  const handleFileChange = (e: ChangeEvent) => {
    const selected = (e.target as HTMLInputElement).files?.[0];
    setFile(selected || null);
  };

  return (
    <div className="flex w-full h-screen bg-gradient-to-b bg-gray-300 text-gray-800">
      {/* Left Chat History */}
      <aside className="w-1/4 bg-gray-100 border-r border-gray-300 p-4">
        <button
          className="text-white rounded-md bg-primary my-4 px-4 py-2 block"
          onClick={newChat}
        >
          New Chat
        </button>
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold mb-4"
        >
          Chat History
        </motion.h2>
        <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {chatHistory.map((session, index) => (
            <li key={"s" + index} className="p-2 rounded-md bg-white shadow truncate">
              <Link href={`/chatbot?sessionId=${session}`}>{session}</Link>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right Chat Area */}
      <main className="flex flex-col w-3/4 p-6">
        {/* Chat Messages */}
        <div className="flex-grow overflow-y-auto space-y-4 p-4 bg-white rounded shadow-inner">
          {chats.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "flex-row-reverse" : ""
              } justify-start items-center gap-4`}
            >
              <span
                className={`w-10 h-10 rounded-full ${
                  message.role == "user" ? "bg-primary" : "bg-secondary"
                } flex items-center justify-center`}
              ></span>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`p-3 rounded shadow ${
                  message.role === "user"
                    ? "bg-primary text-white"
                    : "bg-gray-200 text-gray-800"
                } w-fit`}
              >
                {message.content}
              </motion.div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="mt-4 flex items-center space-x-4 sticky bottom-[10px] bg-white p-4 shadow-inner">
          <input
            type="file"
            ref={pdfInputRef}
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
          />
          <button
            onClick={() => pdfInputRef.current?.click()}
            className="px-4 py-2 bg-gray-200 rounded text-gray-800 font-semibold shadow"
          >
            <Upload />
          </button>
          <div className="flex-grow">
            {file && <p className="text-sm text-gray-500">{file.name}</p>}
            <input
              type="text"
              placeholder="Type your message..."
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !loadingResponse) handleSendMessage();
              }}
              className="w-full px-4 py-2 bg-gray-200 rounded text-gray-800 outline-none placeholder-gray-500 shadow"
            />
          </div>
          <motion.button
            onClick={handleSendMessage}
            disabled={loadingResponse}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 bg-primary hover:bg-primary rounded text-white font-semibold shadow disabled:opacity-60"
          >
            {loadingResponse ? "Sending..." : "Send"}
          </motion.button>
        </div>
      </main>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ChatbotContent />
    </Suspense>
  );
}
