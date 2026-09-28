import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  getNotificationPreferences,
  getProfileSettings,
  getWorkspaceSettings,
} from "@/lib/settings/queries";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [profile, workspace, preferences] = await Promise.all([
    getProfileSettings(user.id),
    getWorkspaceSettings(user.workspaceId),
    getNotificationPreferences(user.workspaceId, user.id),
  ]);

  return (
    <SettingsView
      user={user}
      profile={{ fullName: profile?.fullName ?? user.fullName }}
      workspace={{ name: workspace?.name ?? user.workspaceName }}
      preferences={preferences}
    />
  );
}
