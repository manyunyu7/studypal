"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { api } from "~/trpc/react";
import { pathToActivity } from "~/lib/activity";

/**
 * Invisible page-view tracker. Logs one activity event whenever the student
 * navigates to a new path. FINISH_QUIZ / LOGIN are recorded server-side, so
 * this only captures "what page did they open". Failures are silent — tracking
 * must never disrupt the user.
 */
export function ActivityTracker() {
  const pathname = usePathname();
  const log = api.activity.log.useMutation();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastLogged.current) return;
    const activity = pathToActivity(pathname);
    if (!activity) return;
    lastLogged.current = pathname;
    log.mutate({ type: activity.type, label: activity.label, path: pathname });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
