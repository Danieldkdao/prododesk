import { cn } from "@/lib/utils";
import Image from "next/image";
import { ComponentProps } from "react";

export const LightDarkImage = ({
  lightImageSrc: lightImageSrc,
  darkImageSrc: darkImageSrc,
  className,
  alt,
  ...props
}: { lightImageSrc: string; darkImageSrc: string } & Omit<
  ComponentProps<typeof Image>,
  "src"
>) => {
  return (
    <>
      <Image
        src={lightImageSrc}
        alt={`${alt}-light`}
        className={cn(className, "dark:hidden!")}
        {...props}
      />
      <Image
        src={darkImageSrc}
        alt={`${alt}-dark`}
        className={cn(className, "hidden! dark:block!")}
        {...props}
      />
    </>
  );
};
