import { BottomNav } from "./BottomNav";
import { ThemeToggle } from "./ThemeToggle";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-paper/90 px-4 py-3 backdrop-blur">
        <p className="text-sm font-medium tracking-wide text-ink">JLPT N1</p>
        <ThemeToggle />
      </header>
      <main className="flex-1 px-4 pb-24 pt-5">{children}</main>
      <BottomNav />
    </div>
  );
}
