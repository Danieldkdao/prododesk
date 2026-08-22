"use client";

import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { KeyRoundIcon, Trash2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Fragment, Suspense, useTransition } from "react";
import { toast } from "sonner";
import { SocialProvider, socialProviders } from "../lib/constants";
import { formatSocialProvider } from "../lib/formatters";
import { PasswordDialog } from "./password-dialog";
import { RemovePasswordAccountButton } from "./remove-password-account-button";

export const AccountsSection = () => {
  return (
    <Suspense>
      <AccountsSectionSuspense />
    </Suspense>
  );
};

const AccountsSectionSuspense = () => {
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
  const passwordAccount = connectedAccounts.find(
    (account) => account.providerId === "credential",
  );
  const hasSocialLogin = connectedAccounts.some(
    (account) => account.providerId !== "credential",
  );

  return (
    <Card className="border">
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-2 min-w-0 w-full">
          <div className="flex items-center gap-2 flex-1">
            <KeyRoundIcon className="size-10" />
            <div className="flex flex-col gap-2">
              <span className="text-base font-semibold leading-none">
                Email & Password
              </span>
              {passwordAccount ? (
                <span className="text-sm font-medium text-emerald-600 leading-none">
                  Connected on {format(passwordAccount.createdAt, "PP 'at' p")}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm font-medium leading-none">
                  Not connected
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <PasswordDialog hasPasswordAccount={!!passwordAccount}>
              <Button
                variant="outline"
                className="flex-1"
                disabled={isLinkPending}
              >
                {passwordAccount ? "Update" : "Set"}
              </Button>
            </PasswordDialog>
            {passwordAccount && hasSocialLogin && (
              <RemovePasswordAccountButton
                variant="destructive"
                size="icon"
                disabled={!passwordAccount || !hasSocialLogin}
              >
                <Trash2Icon />
              </RemovePasswordAccountButton>
            )}
          </div>
        </div>
        <Separator />
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
