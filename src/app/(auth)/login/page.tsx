import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-muted">
          Sign in to your MANNAT workspace.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-line bg-surface p-6 sm:p-8">
        <AuthForm mode="login" next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        New to MANNAT?{" "}
        <Link
          href="/signup"
          className="link-underline font-medium text-primary hover:text-primary-bright"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
