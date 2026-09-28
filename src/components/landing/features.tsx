import { Section, SectionHeading } from "@/components/shared/section";
import { Reveal } from "@/components/shared/reveal";
import { features } from "@/data/site";

export function Features() {
  return (
    <Section id="features" className="border-t border-line bg-background-alt">
      <SectionHeading
        eyebrow="Features"
        title="Everything your business needs, nothing it doesn't"
        description="A focused set of tools that replace the patchwork of spreadsheets, chat threads and disconnected apps."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal
            key={feature.title}
            delay={index * 0.05}
            className="h-full"
          >
            <div className="group relative h-full overflow-hidden rounded-xl border border-line bg-surface p-6 transition-colors duration-300 hover:border-line-strong">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-500 group-hover:scale-x-100"
              />
              <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-line-strong bg-surface-2 text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-[#05251c]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
