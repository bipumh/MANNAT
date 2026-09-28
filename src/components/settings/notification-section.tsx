"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { updateNotificationPreferencesAction } from "@/lib/settings/actions";
import type { NotificationPreferences } from "@/types";

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-line bg-surface-2 px-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-dim">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-strong accent-primary"
      />
    </label>
  );
}

export function NotificationSection({
  initial,
}: {
  initial: NotificationPreferences;
}) {
  const router = useRouter();
  const [memberUpdates, setMemberUpdates] = useState(initial.memberUpdates);
  const [invoiceUpdates, setInvoiceUpdates] = useState(initial.invoiceUpdates);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const result = await updateNotificationPreferencesAction({
      memberUpdates,
      invoiceUpdates,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      router.refresh();
    }
  }

  return (
    <Panel>
      <PanelHeader
        title="Notifications"
        description="Choose which workspace events send you a notification."
      />
      <form onSubmit={handleSubmit} className="space-y-3">
        <ToggleRow
          label="Member updates"
          description="When a new member joins your workspace."
          checked={memberUpdates}
          onChange={setMemberUpdates}
        />
        <ToggleRow
          label="Invoice updates"
          description="When an invoice is marked as paid."
          checked={invoiceUpdates}
          onChange={setInvoiceUpdates}
        />

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved ? (
            <span role="status" className="text-sm text-primary-bright">
              Saved
            </span>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </div>
      </form>
    </Panel>
  );
}
