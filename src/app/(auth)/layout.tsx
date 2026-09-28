import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="relative hidden w-[44%] flex-col justify-between overflow-hidden border-r border-line bg-surface p-10 lg:flex xl:p-12">
        <div aria-hidden className="absolute inset-0 bg-glow" />
        <div aria-hidden className="absolute inset-0 bg-grid" />

        <div className="relative">
          <Logo />
        </div>

        <div className="relative">
          <p className="max-w-md font-display text-2xl font-medium leading-snug text-foreground">
            &ldquo;MANNAT gives our whole team one clear view of clients,
            projects and cash flow.&rdquo;
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Avatar initials="SR" tone="primary" className="h-10 w-10 text-sm" />
            <div>
              <p className="text-sm font-medium text-foreground">Sofia Reyes</p>
              <p className="text-xs text-dim">
                Operations Lead, Northwind Labs
              </p>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-faint">Trusted by 2,000+ teams</div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center px-5 sm:px-8 lg:hidden">
          <Logo />
        </header>
        <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
          {children}
        </main>
        <footer className="hidden justify-center pb-8 text-xs text-faint lg:flex">
          © {new Date().getFullYear()} Mannat Labs
        </footer>
      </div>
    </div>
  );
}
