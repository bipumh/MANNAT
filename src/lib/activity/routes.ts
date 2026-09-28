/**
 * Maps an activity/notification entity to its dashboard link, or `null` when
 * the entity cannot be linked (so callers can avoid broken links).
 */
export function entityHref(
  entityType: string | null,
  entityId: string | null,
): string | null {
  switch (entityType) {
    case "client":
      return entityId ? `/dashboard/clients/${entityId}` : null;
    case "project":
      return entityId ? `/dashboard/projects/${entityId}` : null;
    case "task":
      return entityId ? `/dashboard/tasks/${entityId}` : null;
    case "invoice":
      return entityId ? `/dashboard/invoices/${entityId}` : null;
    case "time":
      return entityId ? `/dashboard/time/${entityId}` : null;
    case "member":
      return "/dashboard/team";
    default:
      return null;
  }
}
