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
import { Upload, X, Bot, Plus, Send, MessageSquare } from "lucide-react";
import { PDF_QUERY_URL } from "@/lib/const";
import toast from "react-hot-toast";
import { useUser } from "@clerk/nextjs";
import Button from "@/components/ui/Button";
import { Loader } from "@/components/ui/Loader";
import { cn } from "@/lib/utils";

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
  const [chatHistory, setChatHistory] = useState<
    { sessionId: string; title: string }[]
  >([]);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const removeFile = () => {
    setFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const refreshHistory = useCallback(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data) => setChatHistory(data.sessions || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setSessionId(searchParams.get("sessionId") || "");
  }, [searchParams]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    setFile(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";

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
    removeFile();
    router.push("/chatbot");
  };

  const handleFileChange = (e: ChangeEvent) => {
    const selected = (e.target as HTMLInputElement).files?.[0];
    setFile(selected || null);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-card p-4 md:flex">
        <Button className="w-full" onClick={newChat}>
          <Plus size={18} /> New chat
        </Button>
        <p className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          History
        </p>
        <ul className="flex-1 space-y-1 overflow-y-auto">
          {chatHistory.map((session, index) => {
            const active = session.sessionId === sessionId;
            return (
              <li key={"s" + index}>
                <button
                  onClick={() =>
                    router.push(`/chatbot?sessionId=${session.sessionId}`)
                  }
                  className={cn(
                    "block w-full truncate rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {session.title || "Untitled chat"}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Chat area */}
      <main className="flex flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mx-auto flex max-w-3xl flex-col gap-5">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <MessageSquare size={26} />
                </div>
                <h2 className="text-lg font-semibold text-foreground">
                  Start a conversation
                </h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Ask anything in Bangla or Banglish — or attach a PDF and ask
                  about it.
                </p>
              </div>
            ) : (
              chats.map((message, index) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex items-end gap-3",
                      isUser && "flex-row-reverse",
                    )}
                  >
                    {isUser ? (
                      user?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.imageUrl}
                          alt="You"
                          className="h-9 w-9 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="h-9 w-9 shrink-0 rounded-full bg-primary" />
                      )
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                        <Bot size={18} />
                      </span>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm shadow-warm",
                        isUser
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md bg-card text-card-foreground",
                      )}
                    >
                      {message.content}
                    </motion.div>
                  </div>
                );
              })
            )}
            {loadingResponse && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader size={16} /> Thinking…
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            {file && (
              <div className="mb-2 flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-foreground">
                <span className="max-w-[220px] truncate">{file.name}</span>
                <button
                  onClick={removeFile}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove attached PDF"
                >
                  <X size={15} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 focus-within:border-ring">
              <input
                type="file"
                ref={pdfInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={handleFileChange}
              />
              <button
                onClick={() => pdfInputRef.current?.click()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Attach a PDF"
              >
                <Upload size={18} />
              </button>
              <input
                type="text"
                placeholder="Type your message…"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !loadingResponse) handleSendMessage();
                }}
                className="flex-1 bg-transparent px-2 text-foreground outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={loadingResponse}
                aria-label="Send"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatbotPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
          <Loader size={28} />
        </div>
      }
    >
      <ChatbotContent />
    </Suspense>
  );
}
