"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { useEffect, useState } from "react";
import Spinner from "@/components/common/Spinner";

const Tiptap = ({
  onContentChange,
}: {
  onContentChange: (data: string) => void;
}) => {
  const [translationLoading, setTranslationLoading] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: "",
    onUpdate: ({ editor }) => {
      const htmlContent = editor?.storage?.markdown?.getMarkdown();
      onContentChange(htmlContent);
    },
  });

  useEffect(() => {
    return () => {
      if (editor) editor.destroy();
    };
  }, [editor]);

  const translate = async () => {
    if (!editor) return;

    // Get the current selection
    const selection = editor.state.selection;

    // Check if there's a selection
    if (!selection || selection.empty) {
      alert("Please select some text!");
      return;
    }

    // Modify the selected text: wrap in parentheses
    const { from, to } = selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const translatedText = await fetchTranslation(selectedText);
    editor.chain().focus().insertContentAt({ from, to }, translatedText).run();
  };

  const fetchTranslation = async (text: string) => {
    try {
      // const url = `${BANGLISH_API}/banglish`;
      // const options = {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ text }),
      // };
      setTranslationLoading(true);
      // const response = await fetch(url, options);
      // const data = await response.json();
      // return data.generated_text;
      return _fetchTranslation(text);
    } catch (error) {
      console.log(error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setTranslationLoading(false);
    }
  };
  return (
    <div className="w-full">
      {/* Toolbar */}
      {editor && (
        <div className="flex flex-wrap justify-start items-center gap-2 toolbar bg-white bg-opacity-15 rounded-t-md py-1">
          <button
            className="font-bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            style={{ marginRight: "5px" }}
          >
            B
          </button>
          <button
            className="italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            style={{ marginRight: "5px" }}
          >
            I
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            style={{ marginRight: "5px" }}
          >
            H1
          </button>
          <button
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            style={{ marginRight: "5px" }}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            style={{ marginRight: "5px" }}
          >
            p
          </button>
          <button
            onClick={() => editor.chain().focus().undo().run()}
            style={{ marginRight: "5px" }}
          >
            ↩
          </button>
          <button onClick={() => editor.chain().focus().redo().run()}>↪</button>

          <div className="px-4">
            <button
              disabled={translationLoading}
              className="bg-primary text-white"
              onClick={translate}
            >
              {translationLoading ? <Spinner /> : "Translate"}
            </button>
          </div>
        </div>
      )}
      <div className="w-full">
        <EditorContent className="border p-2 rounded-sm" editor={editor} />
      </div>
    </div>
  );
};

export default Tiptap;

const _fetchTranslation = async (inputText: string) => {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputText }),
  });
  const data = await res.json();
  return data.banglaText;
};


