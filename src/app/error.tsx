"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        <TriangleAlert aria-hidden className="h-6 w-6" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="max-w-sm text-sm text-muted">
        An unexpected error occurred. Please try again, or refresh the page.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="surface" href="/">
          Back home
        </Button>
      </div>
    </div>
  );
}
