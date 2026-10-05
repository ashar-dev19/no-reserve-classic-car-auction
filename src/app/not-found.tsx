import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="wrap flex flex-col items-center py-28 text-center">
      <SearchX size={32} className="text-ink-200" strokeWidth={1.6} />
      <p className="eyebrow mt-6">Error 404</p>
      <h1 className="mt-3 text-[38px] leading-tight">We can't find that page</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink-400">
        The lot may have closed and been archived, or the link may be mistyped. The catalogue is the
        best place to pick the thread back up.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/lots" className="btn btn-primary">
          Browse the Catalogue
        </Link>
        <Link href="/" className="btn btn-outline">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
