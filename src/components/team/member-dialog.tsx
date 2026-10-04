"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { inviteMemberAction } from "@/lib/team/actions";
import type { TeamRole } from "@/types";

export function MemberDialog({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(event.currentTarget);
    const input = {
      email: (formData.get("email") as string | null) ?? "",
      role: ((formData.get("role") as string | null) ?? "member") as TeamRole,
    };

    const result = await inviteMemberAction(input);

    setPending(false);
    if (result.error) {
      setError(result.error);
    } else if (result.inviteUrl) {
      setInviteUrl(result.inviteUrl);
      setEmailSent(Boolean(result.emailSent));
      onSaved();
    } else {
      setError("Something went wrong. Please try again.");
    }
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}${inviteUrl}`,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Invite member"
        className="relative flex max-h-[90vh] w-full max-w-md flex-col overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Invite member
            </h2>
            <p className="mt-1 text-sm text-muted">
              Invite someone to collaborate in your workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        {inviteUrl ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-primary/30 bg-primary-soft px-4 py-3 text-sm text-foreground">
              {emailSent
                ? "Invitation sent by email. You can also share the link below directly."
                : "Invitation created. Copy the link below and share it with your teammate to invite them."}
            </div>

            <div className="rounded-lg border border-line bg-surface-2 p-3">
              <p className="truncate text-sm font-medium tabular-nums text-foreground">
                {`${window.location.origin}${inviteUrl}`}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>
                Done
              </Button>
              <Button onClick={copyLink}>
                {copied ? (
                  <Check aria-hidden className="h-4 w-4" />
                ) : (
                  <Copy aria-hidden className="h-4 w-4" />
                )}
                {copied ? "Copied" : "Copy link"}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Field label="Email" htmlFor="invite-email" required>
              <Input
                id="invite-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="teammate@company.com"
                required
              />
            </Field>

            <Field label="Role" htmlFor="invite-role" required>
              <Select id="invite-role" name="role" defaultValue="member">
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>

            <p className="text-xs text-dim">
              Owners are unique to a workspace and cannot be invited.
            </p>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : null}
                Send invite
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
