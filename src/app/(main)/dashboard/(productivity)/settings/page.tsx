import { ProfileSection } from "@/features/settings/components/profile-section";
import { AccountsSection } from "@/features/settings/components/accounts-section";
import React from "react";
import { DangerSection } from "@/features/settings/components/danger-section";

const SettingsPage = () => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-xl text-muted-foreground">
          Manage your profile and settings.
        </p>
      </div>
      <ProfileSection />
      <AccountsSection />
      <DangerSection />
    </div>
  );
};

export default SettingsPage;
