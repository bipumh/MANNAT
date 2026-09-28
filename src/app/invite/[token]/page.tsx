import type { Metadata } from "next";
import { getSessionUser } from "@/lib/auth/session";
import { getInvitationByToken } from "@/lib/team/queries";
import { InviteAccept } from "@/components/team/invite-accept";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Invitation",
  robots: { index: false, follow: false },
};

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);
  const user = await getSessionUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <InviteAccept invitation={invitation} userEmail={user?.email ?? null} />
    </div>
  );
}
