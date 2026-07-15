import { cn } from "@/lib/utils";

export const SimpleIcon = ({
  title,
  hex,
  path,
  className,
}: {
  title: string;
  hex: string;
  path: string;
  className?: string;
}) => {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      className={cn("size-5", className)}
      fill={`#${hex}`}
    >
      <path d={path} />
    </svg>
  );
};
