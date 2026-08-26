"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEAMS } from "@/lib/requestTypes";
import { saveSession } from "@/lib/session";

// 1. 시작 화면 (기획 문서 2장-1)
export default function StartPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [name, setName] = useState("");

  const canSubmit = teamId !== "" && name.trim() !== "";

  function handleNext() {
    if (!canSubmit) return;
    saveSession({ teamId, requesterName: name.trim() });
    router.push("/request-type");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">업무 협조 요청</h1>
        <p className="mt-1 text-sm text-neutral-500">
          소속 팀과 담당자 이름을 입력해주세요. 별도 로그인 없이 이 정보로 요청이 기록됩니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">소속 팀</label>
        <div className="flex gap-2">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTeamId(t.id)}
              className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                teamId === t.id
                  ? "border-[#12806f] bg-[#12806f] text-white"
                  : "border-neutral-300 text-neutral-700 hover:border-[#12806f]"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">담당자 이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="rounded-lg border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-[#12806f]"
        />
      </div>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleNext}
        className="rounded-lg bg-[#12806f] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        다음
      </button>

      <a href="/requests" className="text-center text-sm text-neutral-400 underline">
        내 요청 이력 조회
      </a>
    </main>
  );
}
