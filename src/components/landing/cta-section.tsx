import { ArrowRight } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/logo";

export function CtaSection() {
  return (
    <Section className="py-20 sm:py-24">
      <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-surface px-6 py-16 text-center sm:px-12 sm:py-20">
        <div aria-hidden className="absolute inset-0 bg-glow" />
        <div className="relative mx-auto max-w-2xl">
          <Reveal>
            <BrandMark className="mx-auto h-10 w-10 text-primary" />
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-6 font-display text-[clamp(1.75rem,3.6vw,2.75rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-foreground">
              Give your team one clear view of the business
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-muted sm:text-[17px]">
              Join thousands of teams using MANNAT to keep clients, projects and
              cash flow in perfect view.
            </p>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button href="/signup" size="lg">
                Start free today
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
              <Button href="/login" variant="ghost" size="lg">
                Sign in
              </Button>
            </div>
            <p className="mt-4 text-xs text-faint">
              Free 14-day trial · No credit card required
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
