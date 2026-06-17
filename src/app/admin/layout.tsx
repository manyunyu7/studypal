import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { SignOutButton } from "./_components/sign-out-button";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import { ThemeCustomizer } from "~/components/theme/theme-customizer";
import { Button } from "~/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center justify-between border-b border-sidebar-border px-6 py-5">
          <span className="text-lg font-bold tracking-tight text-sidebar-foreground">
            ⚙ Admin Panel
          </span>
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          <Link
            href="/admin"
            className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-accent hover:text-sidebar-foreground"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/semester"
            className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-accent hover:text-sidebar-foreground"
          >
            Semester
          </Link>
          <Link
            href="/admin/users"
            className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-accent hover:text-sidebar-foreground"
          >
            Users
          </Link>
          <Link
            href="/admin/aktivitas"
            className="rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-accent hover:text-sidebar-foreground"
          >
            Aktivitas
          </Link>
        </nav>
        <div className="space-y-2 border-t border-sidebar-border p-4">
          <ThemeCustomizer
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                </svg>
                Personalisasi Tema
              </Button>
            }
          />
          <SignOutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
