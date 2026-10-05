"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart, Loader2 } from "lucide-react";
import { toggleWatchAction } from "@/app/actions/bidding";

export function WatchButton({
  lotId,
  initialWatching,
  className = "",
  label = true,
}: {
  lotId: number;
  initialWatching: boolean;
  className?: string;
  label?: boolean;
}) {
  const [watching, setWatching] = useState(initialWatching);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    // Optimistic: the only failure that matters is "not signed in", and that
    // redirects away from this view anyway.
    const next = !watching;
    setWatching(next);
    startTransition(async () => {
      const result = await toggleWatchAction(lotId);
      if (!result.ok) {
        setWatching(!next);
        if (result.needsAuth) router.push("/login");
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={watching}
      className={`btn ${watching ? "btn-dark" : "btn-outline"} ${className}`}
    >
      {pending ? (
        <Loader2 size={15} className="animate-spin" />
      ) : (
        <Heart size={15} fill={watching ? "currentColor" : "none"} />
      )}
      {label && (watching ? "Watching" : "Watch")}
    </button>
  );
}
