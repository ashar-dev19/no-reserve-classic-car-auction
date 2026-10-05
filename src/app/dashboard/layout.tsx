import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { unreadCount } from "@/lib/queries";
import { DashboardNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const unread = unreadCount(user.id);

  return (
    <>
      <header className="border-b border-ink-100 bg-ink-50">
        <div className="wrap flex flex-wrap items-end justify-between gap-5 py-9">
          <div>
            <p className="eyebrow">Your Account</p>
            <h1 className="mt-2 text-[32px] leading-tight">{user.name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-ink-400">
              {user.company && <span>{user.company}</span>}
              {user.company && <span aria-hidden>·</span>}
              <span>{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user.bidder_status === "approved" ? (
              <span className="badge badge-sold">Paddle {user.paddle_no}</span>
            ) : user.bidder_status === "suspended" ? (
              <span className="badge badge-live">Suspended</span>
            ) : (
              <span className="badge badge-ended">Registration under review</span>
            )}
            {user.role === "admin" && (
              <Link href="/admin" className="btn btn-dark btn-sm">
                Admin Console
              </Link>
            )}
          </div>
        </div>
      </header>

      <DashboardNav unread={unread} />

      <div className="wrap py-10">{children}</div>
    </>
  );
}
