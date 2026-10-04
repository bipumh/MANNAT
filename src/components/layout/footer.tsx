import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { footerColumns, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-background-alt">
      <Container className="py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.6fr_repeat(4,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-muted">
              {site.description}
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="link-underline text-sm text-muted transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-dim">
            © {new Date().getFullYear()} {site.legalName}. All rights reserved.
          </p>
          <p className="text-sm text-dim">{site.email}</p>
        </div>
      </Container>
    </footer>
  );
}
