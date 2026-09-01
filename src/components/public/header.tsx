import { getCurrentUser } from "@/lib/auth/helpers";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FaGithub } from "react-icons/fa6";
import { LinkButton } from "../link-button";
import { ThemeToggle } from "../theme-toggle";
import { TooltipWrapper } from "../tooltip-wrapper";
import { Skeleton } from "../ui/skeleton";
import { LayoutDashboardIcon } from "lucide-react";

export const Header = () => {
  return (
    <nav className="w-full p-4 bg-card border-b">
      <div className="flex items-center gap-2 mx-auto w-full max-w-7xl justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="flex items-center gap-2">
              <div className="size-8 relative">
                <Image
                  src="/logo.png"
                  alt="Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-semibold hidden md:block">
                ProdoDesk
              </span>
            </div>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <TooltipWrapper
            content="View source code"
            contentProps={{ side: "bottom" }}
          >
            <LinkButton
              href="https://github.com/Danieldkdao/prododesk"
              variant="ghost"
              size="icon"
              className="[&_svg:not([class*='size-'])]:size-6"
            >
              <FaGithub />
            </LinkButton>
          </TooltipWrapper>
          <Suspense fallback={<Skeleton className="h-9 w-32 rounded-md" />}>
            <HeaderSuspense />
          </Suspense>
        </div>
      </div>
    </nav>
  );
};

const HeaderSuspense = async () => {
  const { userId } = await getCurrentUser();

  return userId ? (
    <>
      <LinkButton href="/dashboard" variant="ghost">
        Go to dashboard
      </LinkButton>
    </>
  ) : (
    <div className="flex items-center gap-2">
      <LinkButton variant="outline" size="sm" href="/sign-in">
        Sign in
      </LinkButton>
      <LinkButton href="/sign-up">Sign up</LinkButton>
    </div>
  );
};
