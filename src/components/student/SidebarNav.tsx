"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "~/lib/utils";
import { toSlug } from "~/lib/slug";

interface Semester {
  id: number;
  name: string;
  year?: string | null;
}

const DASHBOARD_ICON = (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
  </svg>
);

function navItemClass(active: boolean) {
  return cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
    active
      ? "bg-primary/15 text-foreground font-medium"
      : "text-muted-foreground hover:text-foreground hover:bg-accent",
  );
}

export function SidebarNav({ semesters = [] }: { semesters?: Semester[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <p className="px-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Menu</p>
      <Link href="/dashboard" className={navItemClass(pathname === "/dashboard")}>
        {DASHBOARD_ICON}
        Dashboard
      </Link>
      <Link href="/riwayat" className={navItemClass(pathname === "/riwayat")}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
        Riwayat
      </Link>
      <Link href="/untukmu" className={navItemClass(pathname === "/untukmu")}>
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-pink-400">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
        </svg>
        Untukmu 💕
      </Link>

      {semesters.length > 0 && (
        <>
          <p className="px-3 mt-5 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Materi
          </p>
          {semesters.map((sem) => {
            const href = `/semester/${toSlug(sem.name, sem.id)}`;
            return (
            <Link
              key={sem.id}
              href={href}
              className={navItemClass(pathname === href)}
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 flex-shrink-0" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
              <span className="truncate">{sem.name}</span>
            </Link>
            );
          })}
        </>
      )}
    </nav>
  );
}
