"use client";

import { closeHistory } from "@tiptap/pm/history";
import {
  EditorContent,
  EditorContext,
  Extension,
  ResizableNodeView,
  useEditor,
  type Attributes,
} from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

// --- Tiptap Core Extensions ---
import { FindAndReplace } from "@tiptap/extension-find-and-replace";
import { Highlight } from "@tiptap/extension-highlight";
import { Image } from "@tiptap/extension-image";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TextAlign } from "@tiptap/extension-text-align";
import { Typography } from "@tiptap/extension-typography";
import { Selection } from "@tiptap/extensions";
import { StarterKit } from "@tiptap/starter-kit";

// --- UI Primitives ---
import { Button } from "@/components/tiptap/tiptap-ui-primitive/button";
import { Spacer } from "@/components/tiptap/tiptap-ui-primitive/spacer";
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap/tiptap-ui-primitive/toolbar";

// --- Tiptap Node ---
import "@/components/tiptap/tiptap-node/blockquote-node/blockquote-node.scss";
import "@/components/tiptap/tiptap-node/code-block-node/code-block-node.scss";
import "@/components/tiptap/tiptap-node/heading-node/heading-node.scss";
import { HorizontalRule } from "@/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension";
import "@/components/tiptap/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss";
import "@/components/tiptap/tiptap-node/image-node/image-node.scss";
import { ImageUploadNode } from "@/components/tiptap/tiptap-node/image-upload-node/image-upload-node-extension";
import "@/components/tiptap/tiptap-node/list-node/list-node.scss";
import "@/components/tiptap/tiptap-node/paragraph-node/paragraph-node.scss";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// --- Tiptap UI ---
import { BlockquoteButton } from "@/components/tiptap/tiptap-ui/blockquote-button";
import { CodeBlockButton } from "@/components/tiptap/tiptap-ui/code-block-button";
import {
  ColorHighlightPopover,
  ColorHighlightPopoverButton,
  ColorHighlightPopoverContent,
} from "@/components/tiptap/tiptap-ui/color-highlight-popover";
import { HeadingDropdownMenu } from "@/components/tiptap/tiptap-ui/heading-dropdown-menu";
import { ImageUploadButton } from "@/components/tiptap/tiptap-ui/image-upload-button";
import {
  LinkButton,
  LinkContent,
  LinkPopover,
} from "@/components/tiptap/tiptap-ui/link-popover";
import { ListDropdownMenu } from "@/components/tiptap/tiptap-ui/list-dropdown-menu";
import { MarkButton } from "@/components/tiptap/tiptap-ui/mark-button";
import {
  SearchAndReplace,
  SearchAndReplaceButton,
} from "@/components/tiptap/tiptap-ui/search-and-replace";
import { TextAlignButton } from "@/components/tiptap/tiptap-ui/text-align-button";
import { UndoRedoButton } from "@/components/tiptap/tiptap-ui/undo-redo-button";

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap/tiptap-icons/arrow-left-icon";
import { HighlighterIcon } from "@/components/tiptap/tiptap-icons/highlighter-icon";
import { LinkIcon } from "@/components/tiptap/tiptap-icons/link-icon";

// --- Hooks ---
import { useCursorVisibility } from "@/hooks/use-cursor-visibility";
import { useRefRect } from "@/hooks/use-element-rect";
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint";
import { useWindowSize } from "@/hooks/use-window-size";

// --- Lib ---
import {
  handleImageUpload,
  MAX_FILE_SIZE,
} from "@/components/tiptap/lib/tiptap-utils";

// --- Styles ---
import "@/components/tiptap/tiptap-templates/simple/simple-editor.scss";
import { cn } from "@/lib/utils";

// --- Extensions ---
import { Markdown } from "@tiptap/markdown";
import { Plugin } from "@tiptap/pm/state";
import { toast } from "sonner";
import { UPLOAD_LIMITS } from "@/features/uploads/lib/constants";

const lowlight = createLowlight(common);

const SEARCH_AND_REPLACE_SCROLL_OPTIONS: ScrollIntoViewOptions = {
  block: "center",
};

const escapeAttribute = (value: unknown) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const ResizableImage = Image.extend({
  renderMarkdown(node) {
    const { src, alt, title, width, height } = node.attrs ?? {};

    if (width || height) {
      const attributes = [
        `src="${escapeAttribute(src)}"`,
        alt ? `alt="${escapeAttribute(alt)}"` : null,
        title ? `title="${escapeAttribute(title)}"` : null,
        width ? `width="${escapeAttribute(width)}"` : null,
        height ? `height="${escapeAttribute(height)}"` : null,
      ].filter(Boolean);

      return `<img ${attributes.join(" ")} />`;
    }

    const escapedAlt = String(alt).replaceAll("]", "\\]");
    const escapedTitle = String(title ?? "").replaceAll('"', '\\"');

    return title
      ? `![${escapedAlt}](${src} "${escapedTitle}")`
      : `![${escapedAlt}](${src})`;
  },
  addNodeView() {
    const resize = this.options.resize;

    if (!resize || !resize.enabled || typeof document === "undefined") {
      return null;
    }

    return ({ node, getPos, HTMLAttributes, editor }) => {
      const image = document.createElement("img");
      image.draggable = false;

      const syncAttributes = (attributes: Attributes) => {
        const src = attributes.src;
        if (typeof src === "string" && src) {
          image.src = src;
        } else {
          image.removeAttribute("src");
        }

        for (const attribute of ["alt", "title"] as const) {
          const value = attributes[attribute];

          if (value == null) {
            image.removeAttribute(attribute);
          } else {
            image.setAttribute(attribute, String(value));
          }
        }

        const width = Number(attributes.width);
        const height = Number(attributes.height);

        if (Number.isFinite(width) && width > 0) {
          image.style.width = `${width}px`;
        } else {
          image.style.removeProperty("width");
        }

        if (Number.isFinite(height) && height > 0) {
          image.style.height = `${height}px`;
        } else {
          image.style.removeProperty("height");
        }
      };

      syncAttributes(HTMLAttributes);

      return new ResizableNodeView({
        element: image,
        editor,
        node,
        getPos,
        onResize(width, height) {
          image.style.width = `${width}px`;
          image.style.height = `${height}px`;
        },
        onCommit(width, height) {
          const position = getPos();
          if (position === undefined) return;

          const imageNode = editor.state.doc.nodeAt(position);
          if (!imageNode || imageNode.type.name !== "image") return;

          const transaction = editor.state.tr.setNodeMarkup(
            position,
            undefined,
            {
              ...imageNode.attrs,
              width: Math.round(width),
              height: Math.round(height),
            },
          );

          editor.view.dispatch(closeHistory(transaction));
        },
        onUpdate(updatedNode) {
          if (updatedNode.type !== node.type) {
            return false;
          }

          syncAttributes(updatedNode.attrs);

          return true;
        },
        options: {
          directions: resize.directions,
          min: {
            width: resize.minWidth,
            height: resize.minHeight,
          },
          preserveAspectRatio: resize.alwaysPreserveAspectRatio,
        },
      });
    };
  },
}).configure({
  resize: {
    enabled: true,
    directions: ["top-left", "top-right", "bottom-left", "bottom-right"],
    minWidth: 80,
    minHeight: 80,
    alwaysPreserveAspectRatio: true,
  },
});

const looksLikeMarkdown = (text: string) =>
  [
    /^#{1,6}\s/m,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /^\s*>\s+/m,
    /^```/m,
    /\*\*[^*]+\*\*/,
    /_[^_]+_/,
    /\[[^\]]+\]\([^)]+\)/,
    /^\s*[-*+]\s+\[[ xX]\]\s+/m,
  ].some((pattern) => pattern.test(text));

const PasteMarkdown = Extension.create({
  name: "pasteMarkdown",
  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        props: {
          handlePaste(_view, event) {
            const text = event.clipboardData?.getData("text/plain");

            if (!text || !looksLikeMarkdown(text)) return false;

            editor.commands.insertContent(text, {
              contentType: "markdown",
            });

            return true;
          },
        },
      }),
    ];
  },
});

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  onSearchAndReplaceClick,
  isSearchAndReplaceOpen,
  searchAndReplaceButtonRef,
  isMobile,
}: {
  onHighlighterClick: () => void;
  onLinkClick: () => void;
  onSearchAndReplaceClick: () => void;
  isSearchAndReplaceOpen: boolean;
  searchAndReplaceButtonRef: React.RefObject<HTMLButtonElement | null>;
  isMobile: boolean;
}) => {
  return (
    <>
      <Spacer />

      <ToolbarGroup>
        <UndoRedoButton action="undo" />
        <UndoRedoButton action="redo" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
        <ListDropdownMenu
          modal={false}
          types={["bulletList", "orderedList", "taskList"]}
        />
        <BlockquoteButton />
        <CodeBlockButton />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="bold" />
        <MarkButton type="italic" />
        <MarkButton type="strike" />
        <MarkButton type="code" />
        <MarkButton type="underline" />
        {!isMobile ? (
          <ColorHighlightPopover />
        ) : (
          <ColorHighlightPopoverButton onClick={onHighlighterClick} />
        )}
        {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <MarkButton type="superscript" />
        <MarkButton type="subscript" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <TextAlignButton align="left" />
        <TextAlignButton align="center" />
        <TextAlignButton align="right" />
        <TextAlignButton align="justify" />
      </ToolbarGroup>

      <ToolbarSeparator />

      <ToolbarGroup>
        <ImageUploadButton text="Add" />
      </ToolbarGroup>

      <Spacer />

      {isMobile && <ToolbarSeparator />}

      <ToolbarGroup>
        <SearchAndReplaceButton
          ref={searchAndReplaceButtonRef}
          aria-expanded={isSearchAndReplaceOpen}
          data-active-state={isSearchAndReplaceOpen ? "on" : "off"}
          onClick={onSearchAndReplaceClick}
        />
      </ToolbarGroup>
    </>
  );
};

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link";
  onBack: () => void;
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
);

export function SimpleEditor({
  value,
  onValueChange,
  className,
  editorClassName,
  documentId,
}: {
  value: string;
  onValueChange?: (value: string) => void;
  className?: string;
  editorClassName?: string;
  documentId: string;
}) {
  const isMobile = useIsBreakpoint();
  const { height } = useWindowSize();
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main",
  );
  const [isSearchAndReplaceOpen, setIsSearchAndReplaceOpen] = useState(false);

  const lastEmittedValueRef = useRef(value);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const searchAndReplaceButtonRef = useRef<HTMLButtonElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Main content area, start typing to enter text.",
        class: cn("simple-editor", editorClassName),
      },
    },
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Markdown,
      PasteMarkdown,
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      ResizableImage,
      Typography,
      Superscript,
      Subscript,
      Selection,
      FindAndReplace.configure({
        searchDebounceMs: 500,
        injectCSS: false,
      }),
      ImageUploadNode.configure({
        accept: UPLOAD_LIMITS["document-image"].accept,
        maxSize: UPLOAD_LIMITS["document-image"].maxSize,
        limit: 3,
        upload: (file, onProgress, abortSignal) => {
          return handleImageUpload(file, onProgress, abortSignal, {
            documentId,
          });
        },
        onError: (error) => {
          console.error("Upload failed:", error);
          const errorMessage = Error.isError(error)
            ? error.message
            : "Upload failed";
          toast.error(errorMessage);
        },
      }),
    ],
    content: value,
    contentType: "markdown",
    onUpdate: ({ editor }) => {
      const nextValue = editor.getMarkdown();
      lastEmittedValueRef.current = nextValue;
      onValueChange?.(nextValue);
    },
  });

  const toolbarRect = useRefRect(toolbarRef, {
    throttleMs: 100,
    useResizeObserver: true,
  });
  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRect.height,
  });

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    if (value === lastEmittedValueRef.current) return;

    if (editor.getMarkdown() !== value) {
      editor
        .chain()
        .command(({ tr }) => {
          tr.setMeta("addToHistory", false);
          return true;
        })
        .setContent(value || "", {
          emitUpdate: false,
          contentType: "markdown",
        })
        .run();
    }

    lastEmittedValueRef.current = value;
  }, [editor, value]);

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main");
    }
  }, [isMobile, mobileView]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const currentValue = editor.getMarkdown();

    if (currentValue !== value) {
      editor.commands.setContent(value || "", {
        emitUpdate: false,
        contentType: "markdown",
      });
    }
  }, [editor, value]);

  const openSearchAndReplace = useCallback(() => {
    setMobileView("main");
    setIsSearchAndReplaceOpen(true);
  }, []);

  const closeSearchAndReplace = useCallback(() => {
    setIsSearchAndReplaceOpen(false);
    searchAndReplaceButtonRef.current?.focus();
  }, []);

  const toggleSearchAndReplace = useCallback(() => {
    if (isSearchAndReplaceOpen) {
      closeSearchAndReplace();
      return;
    }

    openSearchAndReplace();
  }, [closeSearchAndReplace, isSearchAndReplaceOpen, openSearchAndReplace]);

  return (
    <div className={cn("simple-editor-wrapper", className)}>
      <EditorContext.Provider value={{ editor }}>
        <Toolbar
          ref={toolbarRef}
          style={{
            ...(isMobile
              ? {
                  bottom: `calc(100% - ${height - rect.y}px)`,
                }
              : {}),
          }}
        >
          {mobileView === "main" ? (
            <MainToolbarContent
              onHighlighterClick={() => setMobileView("highlighter")}
              onLinkClick={() => setMobileView("link")}
              onSearchAndReplaceClick={toggleSearchAndReplace}
              isSearchAndReplaceOpen={isSearchAndReplaceOpen}
              searchAndReplaceButtonRef={searchAndReplaceButtonRef}
              isMobile={isMobile}
            />
          ) : (
            <MobileToolbarContent
              type={mobileView === "highlighter" ? "highlighter" : "link"}
              onBack={() => setMobileView("main")}
            />
          )}
        </Toolbar>

        <SearchAndReplace
          className="simple-editor-search-and-replace"
          open={isSearchAndReplaceOpen}
          onOpen={openSearchAndReplace}
          onClose={closeSearchAndReplace}
          scrollIntoViewOptions={SEARCH_AND_REPLACE_SCROLL_OPTIONS}
        />

        <EditorContent
          editor={editor}
          role="presentation"
          className="simple-editor-content"
        />
      </EditorContext.Provider>
    </div>
  );
}
