"use client";

import { useState } from "react";
import { Field, TextInput, TextArea, PrimaryButton } from "../ui";

export function PopupTakedownForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [popupName, setPopupName] = useState("");
  const [reason, setReason] = useState("");
  const [desiredTakedownAt, setDesiredTakedownAt] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      popup_name: popupName,
      reason: reason || null,
      desired_takedown_at: desiredTakedownAt || null,
    };
    onSubmit(detail, `팝업 "${popupName}" 내리기 요청`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="팝업명">
        <TextInput required value={popupName} onChange={(e) => setPopupName(e.target.value)} />
      </Field>

      <Field label="내리는 사유" hint="필수 입력은 아닙니다.">
        <TextArea value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>

      <Field label="희망 내리기 일시" hint="필수 입력은 아닙니다.">
        <TextInput
          type="datetime-local"
          value={desiredTakedownAt}
          onChange={(e) => setDesiredTakedownAt(e.target.value)}
        />
      </Field>

      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
