"use client";

import { useState } from "react";
import { Field, TextArea, PrimaryButton } from "../ui";
import { FileUploadField, useUploadGuard } from "../FileUploadField";

export function EtcForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [content, setContent] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const { anyUploading, onUploadingChange } = useUploadGuard();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ content, file_url: fileUrl || null }, content.slice(0, 80));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="요청 내용">
        <TextArea required value={content} onChange={(e) => setContent(e.target.value)} placeholder="자유롭게 요청 내용을 입력해주세요." />
      </Field>
      <FileUploadField label="첨부파일" onUploaded={(url) => setFileUrl(url)} onUploadingChange={onUploadingChange} />
      <p className="text-xs text-neutral-400">제출하시면 내용 확인 후 담당자가 상세 연락드리겠습니다.</p>
      <PrimaryButton type="submit" disabled={submitting || anyUploading}>
        {anyUploading ? "파일 업로드 중..." : submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
