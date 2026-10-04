import { Logo } from "@/components/brand/logo";
import { AuthAmbient } from "@/components/auth/auth-ambient";

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
            Because spreadsheets have feelings too. 🥹
          </p>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
            Give your clients, projects, tasks, and invoices a better place to
            live. ✨
          </p>
        </div>

        <div className="relative" aria-hidden />
      </aside>

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <AuthAmbient />

        <header className="relative flex h-16 items-center px-5 sm:px-8 lg:hidden">
          <Logo />
        </header>

        <div className="relative mt-1 px-6 text-center lg:hidden">
          <p className="mx-auto max-w-xs font-display text-lg font-medium leading-snug text-foreground">
            Because spreadsheets have feelings too. 🥹
          </p>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
            Give your clients, projects, tasks, and invoices a better place to
            live. ✨
          </p>
        </div>

        <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 sm:py-12">
          {children}
        </main>
        <footer className="relative hidden justify-center pb-8 text-xs text-faint lg:flex">
          © {new Date().getFullYear()} Mannat Labs
        </footer>
      </div>
    </div>
  );
}
