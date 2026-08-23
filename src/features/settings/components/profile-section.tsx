import { Suspense } from "react";
import { readUserProfileAction } from "../actions/actions";
import { ErrorState } from "@/components/error-state";
import { ProfileSectionForm } from "./profile-section-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const ProfileSection = () => {
  return (
    <Suspense fallback={<ProfileSectionSkeleton />}>
      <ProfileSectionSuspense />
    </Suspense>
  );
};

const ProfileSectionSkeleton = () => {
  return (
    <Card className="w-full min-w-0 border">
      <CardContent>
        <div className="flex flex-col gap-4" aria-hidden="true">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="size-20 rounded-full" />
          </div>

          {Array.from({ length: 2 }).map((_, index) => (
            <div className="flex flex-col gap-3" key={index}>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-10 w-full rounded-none" />
            </div>
          ))}

          <div className="flex flex-col gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full rounded-none" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-3/5" />
            </div>
          </div>

          <Skeleton className="h-12 w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

const ProfileSectionSuspense = async () => {
  const userProfile = await readUserProfileAction();
  if (!userProfile)
    return (
      <ErrorState
        title="Unauthorized Error"
        description="You are not signed in. Please continue to your account to access this page."
      />
    );

  return <ProfileSectionForm userProfile={userProfile} />;
};
