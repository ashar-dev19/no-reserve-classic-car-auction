"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app]", error);
  }, [error]);

  return (
    <div className="wrap flex flex-col items-center py-28 text-center">
      <TriangleAlert size={32} className="text-amber-ac" strokeWidth={1.6} />
      <p className="eyebrow mt-6">Something went wrong</p>
      <h1 className="mt-3 text-[34px] leading-tight">We hit a problem loading that</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-400">
        Nothing you did caused this, and no bid has been affected. Try again, and if it keeps
        happening call the office on (800) 562-7815.
      </p>
      {error.digest && (
        <p className="num mt-3 text-[12px] text-ink-300">Reference {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn btn-primary">
          Try Again
        </button>
        <Link href="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
