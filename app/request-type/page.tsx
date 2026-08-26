"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { typesForTeam, teamName, TeamId } from "@/lib/requestTypes";
import { loadSession, SessionInfo } from "@/lib/session";

// 2. 요청 유형 선택 화면 (기획 문서 2장-2, 3장-1)
export default function RequestTypePage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  const types = typesForTeam(session.teamId as TeamId);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm text-neutral-500">
          {teamName(session.teamId)} · {session.requesterName}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">어떤 요청인가요?</h1>
      </div>

      <div className="flex flex-col gap-2">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => router.push(`/request/new?type=${t.id}`)}
            className="rounded-lg border border-neutral-300 px-4 py-4 text-left text-sm font-medium text-neutral-800 transition hover:border-[#12806f] hover:bg-[#f0f1f2]"
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => router.push("/")}
        className="text-sm text-neutral-400 underline"
      >
        이전으로
      </button>
    </main>
  );
}
