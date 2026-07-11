import DOMPurify from "isomorphic-dompurify";

/**
 * Renders user-authored rich text (stored as HTML) after sanitizing it,
 * so it is safe to display on public pages.
 */
export default function RichContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const clean = DOMPurify.sanitize(html || "");
  return (
    <div
      className={`rich-content ${className || ""}`}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
