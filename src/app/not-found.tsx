import Link from "next/link";
import { BrandMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-5 text-center">
      <BrandMark className="h-10 w-10 text-primary" />
      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.24em] text-primary">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
        The page you&apos;re looking for doesn&apos;t exist — or hasn&apos;t
        been built yet in this phase of MANNAT.
      </p>
      <div className="mt-8 flex gap-3">
        <Button href="/">Back home</Button>
        <Button href="/dashboard" variant="surface">
          Go to dashboard
        </Button>
      </div>
      <p className="mt-8">
        <Link
          href="/"
          className="link-underline text-xs font-medium text-dim hover:text-muted"
        >
          Return to MANNAT
        </Link>
      </p>
    </div>
  );
}
