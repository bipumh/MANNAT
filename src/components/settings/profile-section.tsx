"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/dashboard/panel";
import { updateProfileAction } from "@/lib/settings/actions";

export function ProfileSection({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
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
    const result = await updateProfileAction({ fullName: name });
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
        title="Profile"
        description="Your personal information."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="profile-name" required>
          <Input
            id="profile-name"
            name="fullName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
          />
        </Field>

        <Field
          label="Email"
          htmlFor="profile-email"
          hint="Email is managed by your account and can't be changed here."
        >
          <Input
            id="profile-email"
            value={email}
            readOnly
            disabled
          />
        </Field>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
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
