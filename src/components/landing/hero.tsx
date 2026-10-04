import { ArrowRight, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/shared/reveal";
import { DashboardPreview } from "@/components/landing/dashboard-preview";
import { LiquidSurface } from "@/components/visual/liquid-surface";

export function Hero() {
  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col overflow-hidden">
      <LiquidSurface className="absolute inset-0 h-full w-full" />
      <div aria-hidden className="absolute inset-0 bg-glow" />

      <Container className="relative pt-8 pb-10 sm:pt-10 sm:pb-12 lg:pt-14 lg:pb-14">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-surface px-3.5 py-1.5 text-xs font-medium text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Business management platform
            </span>
          </Reveal>

          <Reveal delay={0.06}>
            <h1 className="mt-7 font-display text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-foreground">
              Every client, project and invoice —{" "}
              <span className="text-primary">one clear view</span>.
            </h1>
          </Reveal>

          <Reveal delay={0.12}>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              MANNAT is the business-management platform that keeps your team
              aligned and your cash flow under control — without the spreadsheet
              chaos.
            </p>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/signup" size="lg">
                Start free
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
              <Button href="#product" variant="surface" size="lg">
                Explore the product
              </Button>
            </div>
            <p className="mt-4 text-xs text-faint">
              Free forever · No credit card required
            </p>
          </Reveal>

          <Reveal delay={0.22}>
            <p className="mx-auto mt-10 max-w-md text-sm text-dim">
              Built for teams that want their work in one place.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.24} direction="up" className="relative mt-14 sm:mt-16">
          <div
            aria-hidden
            className="absolute -inset-x-8 -top-12 bottom-0 rounded-[2rem] bg-gradient-to-b from-primary/10 to-transparent blur-2xl"
          />
          <div className="relative">
            <DashboardPreview />
          </div>
          <div className="mt-7 flex justify-center">
            <a
              href="#features"
              className="inline-flex items-center gap-2 text-xs font-medium text-faint transition-colors hover:text-muted"
            >
              See what&apos;s inside
              <ArrowDown aria-hidden className="h-3.5 w-3.5" />
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
