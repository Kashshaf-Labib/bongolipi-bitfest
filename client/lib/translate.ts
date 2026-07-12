import { BANGLISH_API } from "@/lib/const";

/**
 * Translate Banglish -> Bangla. Uses the fine-tuned mBART model when
 * NEXT_PUBLIC_BANGLISH_API is set; otherwise (or if it fails) falls back to
 * the Groq-backed /api/translate.
 */
export async function translateBanglish(text: string): Promise<string> {
  const input = text.trim();
  if (!input) return "";

  if (BANGLISH_API) {
    try {
      const res = await fetch(`${BANGLISH_API}/banglish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.generated_text) return data.generated_text;
      }
    } catch (error) {
      console.error("mBART translate failed, falling back to Groq:", error);
    }
  }

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inputText: input }),
  });
  const data = await res.json();
  return data.banglaText || "";
}
