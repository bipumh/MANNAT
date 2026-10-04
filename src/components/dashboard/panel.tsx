"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

export function Panel({
  className,
  children,
  spotlight = false,
  spotlightColor = "rgba(255, 255, 255, 0.08)",
}: {
  className?: string;
  children: ReactNode;
  spotlight?: boolean;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<"cursor" | "static" | null>(null);
  const [reduced, setReduced] = useState(false);
  const [tapped, setTapped] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!spotlight) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReduced(reducedMotion.matches);
      if (fine.matches && !reducedMotion.matches) setMode("cursor");
      else if (!fine.matches) setMode("static");
      else setMode(null);
    };
    update();
    fine.addEventListener("change", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reducedMotion.removeEventListener("change", update);
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
  }, [spotlight]);

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    ref.current.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  function handleTap() {
    setTapped(true);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapped(false), 600);
  }

  return (
    <section
      ref={ref}
      onPointerMove={
        spotlight && mode === "cursor" ? handlePointerMove : undefined
      }
      onPointerDown={
        spotlight && mode === "static" && !reduced ? handleTap : undefined
      }
      className={cn(
        "group/spot relative rounded-xl border border-line bg-gradient-to-b from-surface-2 to-surface p-5",
        spotlight &&
          "transition-[border-color,box-shadow] duration-300",
        spotlight &&
          mode === "cursor" &&
          "hover:border-line-strong hover:shadow-lift",
        spotlight && mode === "static" && tapped && "border-line-strong",
        className,
      )}
    >
      {children}
      {spotlight && mode === "cursor" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/spot:opacity-100"
          style={{
            borderRadius: "inherit",
            background: `radial-gradient(360px circle at var(--spot-x, 50%) var(--spot-y, 50%), ${spotlightColor}, transparent 70%)`,
          }}
        />
      ) : null}
      {spotlight && mode === "static" ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 transition-opacity duration-300",
            tapped ? "opacity-100" : "opacity-60",
          )}
          style={{
            borderRadius: "inherit",
            background: `radial-gradient(130% 90% at 50% 0%, ${spotlightColor}, transparent 70%)`,
          }}
        />
      ) : null}
    </section>
  );
}

export function PanelHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-3", className)}>
      <div>
        <h3 className="font-display text-sm font-semibold text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="mt-0.5 text-xs text-dim">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
