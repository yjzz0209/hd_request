"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, TextInput, TextArea, PrimaryButton, GhostButton } from "@/components/ui";

// 문의하기 (기획 문서 외 추가 기능) — 궁금한 점이나 기능 개선 의견을 자유롭게 남기는 화면.
// 요청 시스템과 달리 소속 팀/요청 유형을 고르지 않고, 이름 + (선택) 연락처 + 내용만 받습니다.
export default function InquiryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canSubmit = name.trim() !== "" && content.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), contact: contact.trim() || null, content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제출 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("제출 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#12806f] text-2xl text-white">
          ✓
        </div>
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">문의가 접수되었습니다</h1>
          <p className="mt-2 text-sm text-neutral-500">확인 후 필요한 경우 남겨주신 연락처로 안내드리겠습니다.</p>
        </div>
        <GhostButton type="button" onClick={() => router.push("/")}>
          홈으로 가기
        </GhostButton>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">문의하기</h1>
        <p className="mt-1 text-sm text-neutral-500">
          궁금한 항목이나 기능이 이렇게 개선되었으면 좋겠다는 의견을 자유롭게 남겨주세요.
        </p>
      </div>

      {error && <p className="rounded-lg bg-[#fdeeee] px-3 py-2 text-sm text-[#d0492e]">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="이름">
          <TextInput required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="연락처" hint="답변을 받고 싶은 경우에만 입력하세요. 필수 입력은 아닙니다.">
          <TextInput value={contact} onChange={(e) => setContact(e.target.value)} placeholder="이메일 또는 전화번호" />
        </Field>

        <Field label="문의/의견 내용">
          <TextArea required value={content} onChange={(e) => setContent(e.target.value)} />
        </Field>

        <PrimaryButton type="submit" disabled={submitting || !canSubmit}>
          {submitting ? "제출 중..." : "제출하기"}
        </PrimaryButton>
      </form>

      <button type="button" onClick={() => router.push("/")} className="text-center text-sm text-neutral-400 underline">
        이전으로
      </button>
    </main>
  );
}
