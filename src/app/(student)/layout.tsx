import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { SignOutButton } from "~/components/student/SignOutButton";
import { SidebarNav } from "~/components/student/SidebarNav";
import { ActivityTracker } from "~/components/student/ActivityTracker";
import { ThemeToggle } from "~/components/theme/theme-toggle";
import { ThemeCustomizer } from "~/components/theme/theme-customizer";
import { PersonalizationProvider } from "~/components/student/PersonalizationProvider";
import { NEUTRAL_FALLBACK } from "~/lib/personalization";
import { api } from "~/trpc/server";

type Semester = { id: number; name: string; year?: string | null };

function SidebarContent({
  name,
  email,
  image,
  semesters,
  footer,
  showLetter,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  semesters: Semester[];
  footer: string;
  showLetter: boolean;
}) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "SP";

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/15 border border-primary/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-primary" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="text-lg font-semibold tracking-tight">StudyPal</span>
        </div>
        <ThemeToggle className="text-muted-foreground hover:text-foreground" />
      </div>

      {/* Nav */}
      <SidebarNav semesters={semesters} showLetter={showLetter} />

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        <ThemeCustomizer
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground hover:bg-accent px-3"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
              Personalisasi Tema
            </Button>
          }
        />

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent/50">
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={image ?? undefined} alt={name ?? "User"} />
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{name ?? "Pengguna"}</p>
            <p className="text-xs text-muted-foreground truncate">{email ?? ""}</p>
          </div>
        </div>
        <SignOutButton />

        {/* Tanda tangan */}
        <p className="px-3 text-center text-[11px] text-muted-foreground">
          {footer}
        </p>
      </div>
    </div>
  );
}

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, email, image } = session.user;
  const [semesters, msgs] = await Promise.all([
    api.semester.getAll().catch(() => []),
    api.personalization.getMine().catch(() => NEUTRAL_FALLBACK),
  ]);
  const showLetter = !!msgs.letter;

  return (
    <div className="min-h-screen bg-background flex">
      <ActivityTracker />
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 flex-shrink-0 flex-col">
        <div className="sticky top-0 h-screen">
          <SidebarContent
            name={name}
            email={email}
            image={image}
            semesters={semesters}
            footer={msgs.footer}
            showLetter={showLetter}
          />
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-sidebar border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15 border border-primary/30">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-primary" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <span className="text-base font-semibold text-foreground">StudyPal</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-muted-foreground hover:text-foreground" />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" />
              }
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 border-sidebar-border bg-sidebar">
              <SidebarContent
                name={name}
                email={email}
                image={image}
                semesters={semesters}
                footer={msgs.footer}
                showLetter={showLetter}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 min-w-0 md:overflow-auto">
        <div className="md:hidden h-14" /> {/* mobile header spacer */}
        <PersonalizationProvider value={msgs}>{children}</PersonalizationProvider>
      </main>
    </div>
  );
}
