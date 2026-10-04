import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { canManage } from "@/lib/auth/roles";
import { listActivityEvents } from "@/lib/activity/queries";
import { ActivityView } from "@/components/activity/activity-view";
import type { ActivityEntityType } from "@/types";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

const entityTypes: ActivityEntityType[] = [
  "client",
  "project",
  "task",
  "invoice",
  "time",
  "member",
];

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!canManage(user)) redirect("/dashboard/my-work");

  const sp = await searchParams;
  const filter = entityTypes.includes(sp.filter as ActivityEntityType)
    ? (sp.filter as ActivityEntityType)
    : undefined;

  const parsed = typeof sp.limit === "string" ? parseInt(sp.limit, 10) : NaN;
  const limit =
    Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, 100) : 25;

  const events = await listActivityEvents(user.workspaceId, {
    entityType: filter,
    limit: limit + 1,
  });
  const hasMore = events.length > limit;

  return (
    <ActivityView
      events={events.slice(0, limit)}
      filter={filter}
      hasMore={hasMore}
      limit={limit}
    />
  );
}
