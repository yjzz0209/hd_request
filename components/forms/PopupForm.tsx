"use client";

import { useState } from "react";
import { Field, TextInput, Select, PrimaryButton } from "../ui";
import { FileUploadField, useUploadGuard } from "../FileUploadField";

export function PopupForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const { anyUploading, onUploadingChange } = useUploadGuard();
  const [exposePc, setExposePc] = useState(true);
  const [exposeMobile, setExposeMobile] = useState(true);
  const [title, setTitle] = useState("");
  const [exposeType, setExposeType] = useState<"always" | "period" | "period_time">("always");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [hideTodayOption, setHideTodayOption] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      expose_pc: exposePc,
      expose_mobile: exposeMobile,
      title,
      expose_type: exposeType,
      start_at: exposeType !== "always" ? startAt : null,
      end_at: exposeType !== "always" ? endAt : null,
      hide_today_option: hideTodayOption,
      image_url: imageUrl,
      link_url: linkUrl || null,
    };
    onSubmit(detail, `팝업 "${title}"`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="노출 위치">
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={exposePc} onChange={(e) => setExposePc(e.target.checked)} />
            PC
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={exposeMobile} onChange={(e) => setExposeMobile(e.target.checked)} />
            모바일
          </label>
        </div>
      </Field>

      <Field label="팝업 제목">
        <TextInput required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <Field label="기간별 노출 설정">
        <Select value={exposeType} onChange={(e) => setExposeType(e.target.value as any)}>
          <option value="always">항상 노출</option>
          <option value="period">특정 기간만 노출</option>
          <option value="period_time">특정 기간 및 특정 시간만 노출</option>
        </Select>
      </Field>
      {exposeType !== "always" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="노출 시작">
            <TextInput required type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </Field>
          <Field label="노출 종료">
            <TextInput required type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </Field>
        </div>
      )}

      <Field label="오늘 하루 보지 않음">
        <Select value={hideTodayOption ? "true" : "false"} onChange={(e) => setHideTodayOption(e.target.value === "true")}>
          <option value="true">사용</option>
          <option value="false">미사용</option>
        </Select>
      </Field>

      <FileUploadField
        label="업로드 이미지"
        accept="image/*"
        titleHint={title}
        onUploaded={(url) => setImageUrl(url)}
        onUploadingChange={onUploadingChange}
      />

      <Field label="이동 링크">
        <TextInput type="url" placeholder="https://" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
      </Field>

      <PrimaryButton type="submit" disabled={submitting || anyUploading || !imageUrl}>
        {anyUploading ? "파일 업로드 중..." : submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
