import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { getAnalytics } from "@/lib/analytics/queries";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = {
  title: "Analytics",
  robots: { index: false, follow: false },
};

export default async function AnalyticsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManage(user)) redirect("/dashboard/my-work");

  const data = await getAnalytics(user.workspaceId);

  return <AnalyticsView data={data} />;
}
