"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import Spinner from "@/components/common/Spinner";
import { translateBanglish } from "@/lib/translate";

const Tiptap = ({
  onContentChange,
  initialContent = "",
}: {
  onContentChange: (data: string) => void;
  initialContent?: string;
}) => {
  const [translationLoading, setTranslationLoading] = useState(false);
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML());
    },
  });

  useEffect(() => {
    return () => {
      if (editor) editor.destroy();
    };
  }, [editor]);

  const translate = async () => {
    if (!editor) return;

    const selection = editor.state.selection;
    if (!selection || selection.empty) {
      alert("Please select some text!");
      return;
    }

    const { from, to } = selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");
    const translatedText = await fetchTranslation(selectedText);
    if (translatedText) {
      editor.chain().focus().insertContentAt({ from, to }, translatedText).run();
    }
  };

  const fetchTranslation = async (text: string) => {
    try {
      setTranslationLoading(true);
      return await translateBanglish(text);
    } catch (error) {
      console.log(error);
      alert("Something went wrong. Please try again later.");
    } finally {
      setTranslationLoading(false);
    }
  };

  // Keep the editor's text selection when a toolbar button is clicked, so
  // block commands (headings/paragraph) apply to the selected block.
  const keepSelection = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className="w-full">
      {/* Toolbar */}
      {editor && (
        <div className="toolbar flex flex-wrap items-center justify-start gap-2 rounded-t-xl border border-b-0 border-border bg-muted px-2 py-1.5">
          <button
            className="font-bold"
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            style={{ marginRight: "5px" }}
          >
            B
          </button>
          <button
            className="italic"
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            style={{ marginRight: "5px" }}
          >
            I
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            style={{ marginRight: "5px" }}
          >
            H1
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            style={{ marginRight: "5px" }}
          >
            H2
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().setParagraph().run()}
            style={{ marginRight: "5px" }}
          >
            p
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().undo().run()}
            style={{ marginRight: "5px" }}
          >
            ↩
          </button>
          <button
            onMouseDown={keepSelection}
            onClick={() => editor.chain().focus().redo().run()}
          >
            ↪
          </button>

          <div className="px-4">
            <button
              disabled={translationLoading}
              className="bg-primary text-primary-foreground hover:!bg-primary/90"
              onMouseDown={keepSelection}
              onClick={translate}
            >
              {translationLoading ? <Spinner /> : "Translate"}
            </button>
          </div>
        </div>
      )}
      <div className="w-full">
        <EditorContent
          className="rounded-b-xl border border-border bg-card p-3"
          editor={editor}
        />
      </div>
    </div>
  );
};

export default Tiptap;
