"use client";

import { useState } from "react";
import { Field, TextInput, TextArea, PrimaryButton } from "../ui";

export function NoticeForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      title,
      content,
      start_date: startDate,
      end_date: endDate,
    };
    onSubmit(detail, `공지 "${title}" (${startDate} ~ ${endDate})`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="공지 제목">
        <TextInput required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field label="공지 내용">
        <TextArea required value={content} onChange={(e) => setContent(e.target.value)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="공지 게시 시작일">
          <TextInput required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="공지 게시 종료일">
          <TextInput required type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </Field>
      </div>

      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
