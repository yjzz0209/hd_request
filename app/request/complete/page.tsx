"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PrimaryButton, GhostButton } from "@/components/ui";

// 4. 제출 완료 화면 (기획 문서 2장-4)
function CompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestNo = searchParams.get("requestNo");
  const type = searchParams.get("type");

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#12806f] text-2xl text-white">✓</div>
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">요청이 등록되었습니다</h1>
        <p className="mt-2 text-sm text-neutral-500">요청 번호: {requestNo}</p>
        {type === "etc" && (
          <p className="mt-2 text-sm text-neutral-500">내용 확인 후 담당자가 상세 연락드리겠습니다.</p>
        )}
      </div>
      <div className="flex w-full flex-col gap-2">
        <PrimaryButton type="button" onClick={() => router.push("/request-type")}>
          새 요청 등록하기
        </PrimaryButton>
        <GhostButton type="button" onClick={() => router.push("/requests")}>
          요청 이력 조회
        </GhostButton>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteContent />
    </Suspense>
  );
}
