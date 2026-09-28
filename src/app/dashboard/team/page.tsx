import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  listPendingInvitations,
  listWorkspaceMembers,
} from "@/lib/team/queries";
import { TeamView } from "@/components/team/team-view";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export default async function TeamPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(user.workspaceId),
    listPendingInvitations(user.workspaceId),
  ]);

  return (
    <TeamView
      members={members}
      invitations={invitations}
      currentUser={{ id: user.id, role: user.role }}
    />
  );
}
