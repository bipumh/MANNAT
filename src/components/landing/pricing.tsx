"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Section, SectionHeading } from "@/components/shared/section";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { pricingPlans } from "@/data/site";
import { cn } from "@/lib/cn";

export function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <Section id="pricing" className="border-t border-line bg-background-alt">
      <SectionHeading
        align="center"
        eyebrow="Pricing"
        title="Simple pricing that scales with you"
        description="Start free, upgrade as your team grows. Every plan includes unlimited clients and projects."
      />

      <Reveal>
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center rounded-lg border border-line-strong bg-surface p-1">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                !annual
                  ? "bg-primary text-[#05251c]"
                  : "text-muted hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                annual
                  ? "bg-primary text-[#05251c]"
                  : "text-muted hover:text-foreground",
              )}
            >
              Annual
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  annual
                    ? "bg-[#05251c]/15 text-[#05251c]"
                    : "bg-primary-soft text-primary-bright",
                )}
              >
                −20%
              </span>
            </button>
          </div>
        </div>
      </Reveal>

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
              {plan.highlighted ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-xs font-medium text-primary-bright">
                  Most popular
                </span>
              ) : null}

              <h3 className="font-display text-lg font-semibold text-foreground">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-muted">{plan.description}</p>

              <p className="mt-6 flex items-baseline gap-1.5">
                <span className="font-display text-4xl font-semibold text-foreground">
                  {annual ? plan.annual : plan.monthly}
                </span>
                <span className="text-sm text-dim">{plan.unit}</span>
              </p>
              {annual && plan.annual !== plan.monthly ? (
                <p className="mt-1 text-xs text-dim">billed annually</p>
              ) : (
                <p className="mt-1 text-xs text-faint">&nbsp;</p>
              )}

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

              <Button
                href="/signup"
                variant={plan.highlighted ? "primary" : "surface"}
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mt-8 text-center text-xs text-faint">
        Prices in USD. Cancel anytime.
      </p>
    </Section>
  );
}
