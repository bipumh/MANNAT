"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/dashboard/status";
import { acceptInvitationAction } from "@/lib/team/actions";
import type { TeamInvitation } from "@/types";

function roleLabel(invitation: TeamInvitation): string {
  return invitation.role === "admin" ? "Admin" : "Member";
}

export function InviteAccept({
  invitation,
  userEmail,
}: {
  invitation: TeamInvitation | null;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    if (!invitation) return;
    setPending(true);
    setError(null);
    const result = await acceptInvitationAction(invitation.token);
    setPending(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  if (!invitation) {
    return (
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <p className="font-display text-xl font-semibold text-foreground">
          Invitation not found
        </p>
        <p className="mt-2 text-sm text-muted">
          This invitation link is invalid or has been removed.
        </p>
        <Button href="/login" className="mt-6">
          Go to sign in
        </Button>
      </div>
    );
  }

  const accepted = invitation.acceptedAt !== null;
  const expired = invitation.expired;
  const emailMatch =
    userEmail !== null &&
    userEmail.trim().toLowerCase() === invitation.email.trim().toLowerCase();

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-8">
      <div className="text-center">
        <p className="text-sm font-medium text-muted">You&apos;ve been invited to join</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-foreground">
          {invitation.workspaceName}
        </h1>
        <div className="mt-3 flex items-center justify-center gap-2">
          <RoleBadge role={invitation.role} />
        </div>
        <p className="mt-3 text-sm text-muted">{invitation.email}</p>
      </div>

      <div className="mt-8">
        {accepted ? (
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-4 text-center text-sm text-muted">
            This invitation has already been accepted.
          </div>
        ) : expired ? (
          <div className="rounded-lg border border-line bg-surface-2 px-4 py-4 text-center text-sm text-muted">
            This invitation has expired. Ask a workspace owner or admin to send
            a new one.
          </div>
        ) : userEmail === null ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted">
              Sign in or create an account with{" "}
              <span className="font-medium text-foreground">
                {invitation.email}
              </span>{" "}
              to accept this invitation.
            </p>
            <Button
              href={`/login?next=${encodeURIComponent(`/invite/${invitation.token}`)}`}
              className="w-full"
            >
              Sign in
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Button>
            <Button
              href={`/signup?next=${encodeURIComponent(`/invite/${invitation.token}`)}`}
              variant="outline"
              className="w-full"
            >
              Create account
            </Button>
          </div>
        ) : !emailMatch ? (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            This invitation was sent to {invitation.email}, but you are signed
            in as {userEmail}. Sign in with the invited email to accept it.
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted">
              You&apos;ll join as {roleLabel(invitation).toLowerCase()}.
            </p>
            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            ) : null}
            <Button onClick={accept} disabled={pending} className="w-full">
              {pending ? (
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
              ) : null}
              Accept invitation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
