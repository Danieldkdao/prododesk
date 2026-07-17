import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import { mermaid } from "@streamdown/mermaid";
import { math } from "@streamdown/math";
import { cjk } from "@streamdown/cjk";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
export const MarkdownRenderer = ({
  children,
  className,
}: {
  children: string;
  className?: string;
}) => {
  return (
    <Streamdown
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
    >
      {children}
    </Streamdown>
  );
};
