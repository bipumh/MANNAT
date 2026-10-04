import { Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/section";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/data/site";
import { cn } from "@/lib/cn";

export function Pricing() {
  return (
    <Section id="pricing" className="border-t border-line bg-background-alt">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title="Free to get started"
        description="MANNAT is free to use today. Paid plans are coming soon."
      />

      <div className="mx-auto mt-10 grid max-w-5xl gap-4 lg:mt-12 lg:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <Reveal key={plan.name} delay={index * 0.06} className="h-full">
            <div
              className={cn(
                "relative flex h-full flex-col rounded-xl border p-6",
                plan.highlighted
                  ? "border-primary/50 bg-surface"
                  : "border-line bg-surface",
              )}
            >
              {plan.comingSoon ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-line-strong bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
                  Coming soon
                </span>
              ) : null}

              <h3 className="font-display text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "font-display text-4xl font-semibold text-foreground",
                    plan.comingSoon && "text-muted",
                  )}
                >
                  {plan.price}
                </span>
                {plan.unit ? (
                  <span className="text-sm text-dim">{plan.unit}</span>
                ) : null}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      aria-hidden
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                    />
                    <span className="text-sm text-muted">{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.comingSoon ? (
                <div className="mt-8 w-full rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-center text-sm font-medium text-muted">
                  Coming soon
                </div>
              ) : (
                <Button
                  href="/signup"
                  variant={plan.highlighted ? "primary" : "surface"}
                  className="mt-8 w-full"
                >
                  {plan.cta}
                </Button>
              )}
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-faint">
        Free to get started. No credit card required.
      </p>
    </Section>
  );
}
