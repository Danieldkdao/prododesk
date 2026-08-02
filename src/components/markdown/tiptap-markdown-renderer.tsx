"use client";

import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export const TiptapMarkdownRenderer = ({ children }: { children: string }) => {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content: children,
    contentType: "markdown",
    editable: false,
  });

  return <EditorContent editor={editor} />;
};
