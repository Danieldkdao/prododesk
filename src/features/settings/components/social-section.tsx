"use client";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useSearchParams } from "next/navigation";
import { Fragment, Suspense, useTransition } from "react";
import { toast } from "sonner";
import { SocialProvider, socialProviders } from "../lib/constants";
import { formatSocialProvider } from "../lib/formatters";

export const SocialSection = () => {
  return (
    <Suspense>
      <SocialSectionSuspense />
    </Suspense>
  );
};

const SocialSectionSuspense = () => {
  const queryClient = useQueryClient();
  const { data, error, isPending } = useQuery({
    queryKey: ["socials"],
    queryFn: () => authClient.listAccounts(),
  });
  const [isLinkPending, startLinkTransition] = useTransition();
  const searchParams = useSearchParams();

  if (isPending) return <div>loading</div>;

  if (!data || error || data?.error || !data.data)
    return (
      <ErrorState
        title="Failed to load social accounts"
        description="We were unable to load your connects social accounts. Try refreshing the page or come back later."
      />
    );

  const linkSocialProvider = (provider: SocialProvider) => {
    if (isLinkPending) return;
    startLinkTransition(async () => {
      await authClient.linkSocial({
        provider,
        callbackURL: "/dashboard/settings",
        errorCallbackURL: "/dashboard/settings?error=linking_failed",
        fetchOptions: {
          onError: (error) => {
            toast.error(
              error.error.message || "Failed to link social account.",
            );
          },
        },
      });
    });
  };

  const unlinkSocialProvider = (accountId: string, providerId: string) => {
    if (isLinkPending) return;
    startLinkTransition(async () => {
      await authClient.unlinkAccount({
        accountId,
        providerId,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Successfully unlinked social account.");
            void queryClient.invalidateQueries({ queryKey: ["socials"] });
          },
          onError: (error) => {
            toast.error(
              error.error.message || "Failed to link social account.",
            );
          },
        },
      });
    });
  };

  const connectedAccounts = data.data;

  return (
    <Card className="border">
      <CardContent className="flex flex-col gap-4">
        {socialProviders.map((provider) => {
          const connectedAccount = connectedAccounts.find(
            (account) => account.providerId === provider,
          );
          const { label, icon: Icon, color } = formatSocialProvider(provider);

          return (
            <Fragment key={provider}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2 min-w-0 w-full">
                <div className="flex items-center gap-2 flex-1">
                  <Icon color={color} size={40} />
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-semibold leading-none">
                      {label}
                    </span>
                    {connectedAccount ? (
                      <span className="text-sm font-medium text-emerald-600 leading-none">
                        Connected on{" "}
                        {format(connectedAccount.createdAt, "PP 'at' p")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm font-medium leading-none">
                        Not connected
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant={connectedAccount ? "destructive" : "outline"}
                  onClick={() =>
                    connectedAccount
                      ? unlinkSocialProvider(
                          connectedAccount.accountId,
                          connectedAccount.providerId,
                        )
                      : linkSocialProvider(provider)
                  }
                  disabled={isLinkPending}
                >
                  <LoadingSwap isLoading={isLinkPending}>
                    {connectedAccount ? "Unlink" : "Link"}
                  </LoadingSwap>
                </Button>
              </div>
              <Separator className="last:hidden" />
            </Fragment>
          );
        })}
        {searchParams.get("error") === "linking_failed" && (
          <span className="text-sm text-destructive">
            Failed to link social account. Please try again.
          </span>
        )}
      </CardContent>
    </Card>
  );
};
