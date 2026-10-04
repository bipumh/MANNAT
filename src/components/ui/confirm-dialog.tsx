"use client";

import { useEffect, useRef } from "react";
import { Loader2, TriangleAlert, X } from "lucide-react";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  pending = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, true);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, pending]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-black/60"
        onClick={() => {
          if (!pending) onClose();
        }}
      />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-line bg-surface p-6 shadow-lift"
      >
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-500/25 bg-red-500/10 text-red-300">
            <TriangleAlert aria-hidden className="h-5 w-5" />
          </span>
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-50"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-4 font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          {description}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? (
              <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            ) : null}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
