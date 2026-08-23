import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";
import { ResetAccountDataButton } from "../reset-account-data-button";
import { DeleteAccountButton } from "./delete-account-button";

export const DangerSection = () => {
  return (
    <Card className="border min-w-0 py-0">
      <CardContent className="px-0 min-w-0">
        <div className="flex gap-3 min-w-0 p-4">
          <RefreshCwIcon className="text-destructive mt-0.5 shrink-0" />
          <div className="flex flex-col md:flex-row items-start gap-4 flex-1">
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-xl font-semibold text-destructive">
                Reset account data
              </span>
              <p className="text-muted-foreground text-base max-w-200">
                This permanently deletes your tasks, projects, areas, documents,
                milestones, activity history, and preferences. Your Prododesk
                account and sign-in methods will remain active.
              </p>
            </div>
            <ResetAccountDataButton variant="destructive">
              Reset account data
            </ResetAccountDataButton>
          </div>
        </div>
        <Separator />
        <div className="flex gap-3 min-w-0 p-4">
          <TriangleAlertIcon className="text-destructive mt-0.5 shrink-0" />
          <div className="flex flex-col md:flex-row items-start gap-4 flex-1">
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-xl font-semibold text-destructive">
                Delete account
              </span>
              <p className="text-muted-foreground text-base max-w-200">
                This permanently deletes your account and all associated data,
                including tasks, projects, areas, documents, milestones,
                activity history, and preferences. This action cannot be undone.
              </p>
            </div>
            <DeleteAccountButton variant="destructive">
              Delete my account
            </DeleteAccountButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
