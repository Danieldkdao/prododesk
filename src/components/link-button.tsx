import Link from "next/link";
import { ComponentProps } from "react";
import { buttonVariants } from "./ui/button";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const LinkButton = ({
  className,
  variant,
  size,
  children,
  ...props
}: ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>) => {
  return (
    <Link
      {...props}
      className={buttonVariants({
        variant,
        size,
        className: cn("w-fit", className),
      })}
    >
      {children}
    </Link>
  );
};
