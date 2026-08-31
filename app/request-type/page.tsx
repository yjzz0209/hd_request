"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { typesForTeam, teamName, TeamId, marketingGroupedTypes } from "@/lib/requestTypes";
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

  const isMarketing = session.teamId === "marketing";
  const types = typesForTeam(session.teamId as TeamId);
  const groups = isMarketing ? marketingGroupedTypes() : [];

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-7 px-6 py-10">
      <div>
        <p className="text-sm font-semibold text-[#12806f]">
          {teamName(session.teamId)} · {session.requesterName}
        </p>
        <h1 className="mt-2 text-[22px] font-extrabold text-neutral-900">어떤 요청인가요?</h1>
      </div>

      {isMarketing ? (
        <div className="flex flex-col gap-6">
          {groups.map((g) => (
            <div key={g.id} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-neutral-400">{g.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {g.types.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => router.push(`/request/new?type=${t.id}`)}
                    className="rounded-2xl bg-neutral-100 px-3 py-4 text-center text-sm font-semibold leading-snug text-neutral-800 transition hover:bg-neutral-200/70"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => router.push(`/request/new?type=${t.id}`)}
              className="rounded-2xl bg-neutral-100 px-3 py-4 text-center text-sm font-semibold leading-snug text-neutral-800 transition hover:bg-neutral-200/70"
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      <button type="button" onClick={() => router.push("/")} className="text-sm text-neutral-400 underline">
        이전으로
      </button>
    </main>
  );
}
