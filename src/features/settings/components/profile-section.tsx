import { Suspense } from "react";
import { readUserProfileAction } from "../actions/actions";
import { ErrorState } from "@/components/error-state";
import { ProfileSectionForm } from "./profile-section-form";

export const ProfileSection = () => {
  return (
    <Suspense>
      <ProfileSectionSuspense />
    </Suspense>
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
