import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import {
  getUnreadNotificationCount,
  listNotifications,
} from "@/lib/notifications/queries";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const [unreadCount, notifications] = await Promise.all([
    getUnreadNotificationCount(user.workspaceId, user.id),
    listNotifications(user.workspaceId, user.id, { limit: 15 }),
  ]);

  return (
    <DashboardShell
      user={user}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {children}
    </DashboardShell>
  );
}
