import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ProductPreview } from "@/components/landing/product-preview";
import { Pricing } from "@/components/landing/pricing";
import { CtaSection } from "@/components/landing/cta-section";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <ProductPreview />
      <Pricing />
      <CtaSection />
    </>
  );
}
