"use client";

import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      className="w-full justify-start text-muted-foreground hover:bg-accent hover:text-sidebar-foreground"
      onClick={() => signOut({ callbackUrl: "/login" })}
    >
      Sign Out
    </Button>
  );
}
