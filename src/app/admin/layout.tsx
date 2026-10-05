import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";
import { db } from "@/lib/db";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/dashboard");

  const counts = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE bidder_status = 'pending')  AS pendingBidders,
         (SELECT COUNT(*) FROM consignments WHERE status = 'new')      AS newConsignments`,
    )
    .get() as { pendingBidders: number; newConsignments: number };

  return (
    <>
      <header className="border-b border-ink-800 bg-ink-900 text-white">
        <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-sm bg-brand-500">
              <ShieldCheck size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h1 className="display text-[20px] uppercase leading-none tracking-[0.1em]">
                Admin Console
              </h1>
              <p className="mt-1 text-[12px] text-ink-300">Signed in as {user.name}</p>
            </div>
          </div>
          <Link href="/" className="btn btn-ghost-light btn-sm">
            View public site
          </Link>
        </div>
      </header>

      <AdminNav
        pendingBidders={counts.pendingBidders}
        newConsignments={counts.newConsignments}
      />

      <div className="wrap py-9">{children}</div>
    </>
  );
}
