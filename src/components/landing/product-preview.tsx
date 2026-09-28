import { Check, ArrowRight } from "lucide-react";
import { Section } from "@/components/shared/section";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { DashboardPreview } from "@/components/landing/dashboard-preview";

const points = [
  "Clients, projects and billing live in one workspace",
  "Revenue and pipeline visible at a glance, in real time",
  "Roles and permissions that scale from freelancer to agency",
];

export function ProductPreview() {
  return (
    <Section id="product" className="overflow-hidden">
      <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <Reveal>
            <span className="inline-flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
              <span aria-hidden className="h-px w-8 bg-primary/50" />
              Product
            </span>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="mt-4 font-display text-[clamp(1.75rem,3.4vw,2.5rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
              One workspace, every operation in view
            </h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="mt-4 text-[15px] leading-relaxed text-muted sm:text-[17px]">
              Stop tab-hopping between tools to find out where a project stands.
              MANNAT surfaces the parts of your business that need attention,
              when they need it.
            </p>
          </Reveal>

          <ul className="mt-8 space-y-4">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sm text-foreground">{point}</span>
              </li>
            ))}
          </ul>

          <Reveal delay={0.18}>
            <div className="mt-9">
              <Button href="/signup">
                Get started
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>

        <Reveal direction="up" delay={0.1}>
          <DashboardPreview />
        </Reveal>
      </div>
    </Section>
  );
}
