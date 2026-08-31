"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TEAMS, TeamId } from "@/lib/requestTypes";
import { saveSession } from "@/lib/session";
import {
  QuickLinkRow,
  ClipboardListIcon,
  ChatIcon,
  SelectCard,
  MegaphoneIcon,
  BulbIcon,
  TruckIcon,
  PrimaryButton,
  TextInput,
  Field,
} from "@/components/ui";

const TEAM_ICON: Record<TeamId, React.ReactNode> = {
  marketing: <MegaphoneIcon className="h-6 w-6" />,
  innovation: <BulbIcon className="h-6 w-6" />,
  distribution: <TruckIcon className="h-6 w-6" />,
};

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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-10">
      <div>
        <p className="text-sm font-semibold text-[#12806f]">오늘의팜</p>
        <h1 className="mt-2 text-[26px] font-extrabold leading-snug text-neutral-900">
          업무 협조
          <br />
          요청할게요
        </h1>
        <p className="mt-2 text-[15px] text-neutral-400">
          소속 팀과 담당자 이름을 입력해주세요. 별도 로그인 없이 이 정보로 요청이 기록됩니다.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-neutral-800">소속 팀</label>
        <div className="flex gap-2">
          {TEAMS.map((t) => (
            <SelectCard
              key={t.id}
              selected={teamId === t.id}
              onClick={() => setTeamId(t.id)}
              icon={TEAM_ICON[t.id as TeamId]}
            >
              {t.name}
            </SelectCard>
          ))}
        </div>
      </div>

      <Field label="담당자 이름">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" />
      </Field>

      <PrimaryButton type="button" disabled={!canSubmit} onClick={handleNext}>
        다음
      </PrimaryButton>

      <div className="flex flex-col gap-2">
        <QuickLinkRow href="/requests" icon={<ClipboardListIcon className="h-5 w-5" />}>
          내 요청 이력 조회
        </QuickLinkRow>
        <QuickLinkRow href="/inquiry" icon={<ChatIcon className="h-5 w-5" />}>
          문의하기
        </QuickLinkRow>
      </div>

      <a href="/admin" className="text-center text-xs text-neutral-400 underline">
        전체 요청 보기 (관리자용)
      </a>
    </main>
  );
}
