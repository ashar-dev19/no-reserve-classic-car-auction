"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { postCommentAction } from "@/app/actions/bidding";
import type { Comment, PublicUser } from "@/lib/types";

export function CommentThread({
  lotId,
  comments,
  user,
}: {
  lotId: number;
  comments: Comment[];
  user: PublicUser | null;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await postCommentAction(lotId, body);
      if (result.ok) {
        setBody("");
        router.refresh();
      } else {
        setError(result.message ?? "Could not post that.");
        if (result.needsAuth) router.push("/login");
      }
    });
  }

  return (
    <div>
      {comments.length === 0 ? (
        <div className="card p-8 text-center">
          <MessageSquare size={22} className="mx-auto text-ink-200" />
          <p className="mt-3 text-[14px] text-ink-400">
            No questions yet. Ask the specialist anything about this lot.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => {
            const staff = c.author_role === "admin";
            return (
              <li key={c.id} className="flex gap-3">
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-bold ${
                    staff ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500"
                  }`}
                >
                  {staff ? <ShieldCheck size={15} /> : (c.author_name ?? "?").slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                    <span className="font-medium">{c.author_name}</span>
                    {staff && <span className="badge badge-live">NRC Specialist</span>}
                    <span className="text-ink-400">{relativeTime(c.created_at)}</span>
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-600">
                    {c.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {user ? (
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="comment" className="label">
            Ask a question
          </label>
          <textarea
            id="comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="field"
            rows={3}
            maxLength={2000}
            placeholder="Questions about condition, history or logistics are answered by our specialists."
          />
          {error && <p className="mt-2 text-[13px] text-brand-600">{error}</p>}
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-[12px] text-ink-400">
              Comments are public and attached to this lot permanently.
            </p>
            <button type="submit" className="btn btn-dark btn-sm" disabled={pending || !body.trim()}>
              {pending && <Loader2 size={14} className="animate-spin" />}
              Post
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-6 rounded-sm border border-ink-100 bg-ink-50 px-4 py-3 text-[13px] text-ink-500">
          <Link href="/login" className="text-brand-500 underline">
            Sign in
          </Link>{" "}
          to ask a question about this lot.
        </p>
      )}
    </div>
  );
}
