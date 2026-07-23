import { cn } from "@/lib/utils";
import { cjk } from "@streamdown/cjk";
import { code } from "@streamdown/code";
import { math } from "@streamdown/math";
import { mermaid } from "@streamdown/mermaid";
import "katex/dist/katex.min.css";
import { ComponentProps } from "react";
import { Streamdown } from "streamdown";

const MarkdownImage = ({
  node: _node,
  className,
  ...props
}: ComponentProps<"img"> & { node?: unknown }) => {
  return (
    <img
      {...props}
      loading="lazy"
      className={cn("my-4 max-w-full rounded-lg", className)}
    />
  );
};

const MarkdownLink = ({
  node: _node,
  href,
  children,
  ...props
}: ComponentProps<"a"> & { node?: unknown }) => (
  <a
    {...props}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="font-medium text-primary underline"
  >
    {children}
  </a>
);

export const markdownAnimateOptions = {
  animation: "blurIn",
  duration: 250,
  easing: "ease-out",
} as const;

export const MarkdownRenderer = ({
  children,
  className,
  ...props
}: {
  children: string;
} & Omit<ComponentProps<typeof Streamdown>, "plugins">) => {
  return (
    <Streamdown
      components={{
        img: MarkdownImage,
        a: MarkdownLink,
      }}
      className={cn(
        "w-full min-w-0 max-w-full",
        "wrap-anywhere",
        "[&_ul]:pl-5",
        "[&_ol]:pl-5",
        "[&_li]:min-w-0",
        "[&_li]:wrap-break-word",
        "[&_pre]:max-w-full",
        "[&_pre]:overflow-x-auto",
        "[&_table]:max-w-full",
        className,
      )}
      plugins={{
        code: code,
        mermaid: mermaid,
        math: math,
        cjk: cjk,
      }}
      linkSafety={{ enabled: false }}
      {...props}
    >
      {children}
    </Streamdown>
  );
};
