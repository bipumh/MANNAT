import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignupPage({
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
          Start your free trial
        </h1>
        <p className="mt-2 text-sm text-muted">
          Create a MANNAT account and set up your workspace.
        </p>
      </div>

      <div className="mt-8 rounded-xl border border-line bg-surface p-6 sm:p-8">
        <AuthForm mode="signup" next={next} />
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="link-underline font-medium text-primary hover:text-primary-bright"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
