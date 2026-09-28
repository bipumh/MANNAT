import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/shared/reveal";

export function Section({
  id,
  className,
  children,
  containerClassName,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
  containerClassName?: string;
}) {
  return (
    <section
      id={id}
      className={cn("relative py-16 sm:py-20 lg:py-28", className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary",
        className,
      )}
    >
      <span aria-hidden className="h-px w-8 bg-primary/50" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleClassName,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <Reveal direction="up">
          <Eyebrow className={cn(align === "center" && "justify-center")}>
            {eyebrow}
          </Eyebrow>
        </Reveal>
      ) : null}
      <Reveal delay={0.06} direction="up">
        <h2
          className={cn(
            "mt-4 font-display text-[clamp(1.75rem,3.4vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground",
            titleClassName,
          )}
        >
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={0.12} direction="up">
          <p
            className={cn(
              "mt-4 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-[17px]",
              align === "center" && "mx-auto",
            )}
          >
            {description}
          </p>
        </Reveal>
      ) : null}
    </div>
  );
}
