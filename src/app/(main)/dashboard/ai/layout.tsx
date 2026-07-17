import { SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { AISidebar } from "@/features/ai/components/sidebar";
import { ChatViewRealSkeleton } from "@/features/chats/components/chat-view-skeleton";
import { ChatContextProvider } from "@/hooks/use-chat-provider";
import { ReactNode, Suspense } from "react";

const DashboardAILayout = ({ children }: { children: ReactNode }) => {
  return (
    <Suspense fallback={<DashboardAILayoutSkeleton />}>
      <ChatContextProvider>
        <div className="relative w-full h-full min-w-0 min-h-0 p-10">
          <div className="relative w-full min-w-0 h-full min-h-0">
            <SidebarProvider
              enableShortcut={false}
              className="w-full h-full min-h-0 min-w-0 flex items-center gap-8"
            >
              <AISidebar />
              <div className="w-full h-full min-h-0 flex-1">{children}</div>
            </SidebarProvider>
          </div>
        </div>
      </ChatContextProvider>
    </Suspense>
  );
};

const DashboardAILayoutSkeleton = () => {
  return (
    <div className="relative h-full min-h-0 w-full min-w-0 p-10">
      <div className="relative h-full min-h-0 w-full min-w-0">
        <div className="flex h-full min-h-0 min-w-0 w-full items-center gap-8">
          <aside className="hidden h-full w-64 shrink-0 flex-col border bg-sidebar md:flex">
            <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
              <div className="flex flex-col gap-1 p-2">
                <div className="flex h-8 items-center gap-2 px-3">
                  <Skeleton className="size-4 shrink-0 rounded-none" />
                  <Skeleton className="h-4 w-20 rounded-none" />
                </div>

                <div className="flex h-8 items-center gap-2 px-3">
                  <Skeleton className="size-4 shrink-0 rounded-none" />
                  <Skeleton className="h-4 w-24 rounded-none" />
                </div>
              </div>
              <div className="flex w-full min-w-0 flex-col p-2">
                <div className="flex h-8 items-center px-3">
                  <Skeleton className="h-3 w-12 rounded-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex h-8 items-center gap-2 px-3">
                    <Skeleton className="size-4 shrink-0 rounded-none" />
                    <Skeleton className="h-4 w-32 rounded-none" />
                  </div>
                  <div className="flex h-8 items-center gap-2 px-3">
                    <Skeleton className="size-4 shrink-0 rounded-none" />
                    <Skeleton className="h-4 w-24 rounded-none" />
                  </div>
                  <div className="flex h-8 items-center gap-2 px-3">
                    <Skeleton className="size-4 shrink-0 rounded-none" />
                    <Skeleton className="h-4 w-36 rounded-none" />
                  </div>
                  <div className="flex h-8 items-center gap-2 px-3">
                    <Skeleton className="size-4 shrink-0 rounded-none" />
                    <Skeleton className="h-4 w-28 rounded-none" />
                  </div>
                  <div className="flex h-8 items-center gap-2 px-3">
                    <Skeleton className="size-4 shrink-0 rounded-none" />
                    <Skeleton className="h-4 w-40 rounded-none" />
                  </div>
                </div>
              </div>
            </div>
          </aside>
          <main className="h-full min-h-0 min-w-0 flex-1">
            <div className="mx-auto h-full min-h-0 w-full max-w-5xl">
              <ChatViewRealSkeleton />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardAILayout;
