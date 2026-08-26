"use client";

import { useState } from "react";
import { Field, TextInput, Select, PrimaryButton } from "../ui";
import { FileUploadField } from "../FileUploadField";

export function BannerForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [bannerType, setBannerType] = useState<"pre_login" | "main" | "middle">("main");
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(
      { banner_type: bannerType, title, image_url: imageUrl, link_url: linkUrl || null },
      `배너 "${title}"`
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Field label="배너 위치">
        <Select value={bannerType} onChange={(e) => setBannerType(e.target.value as any)}>
          <option value="pre_login">로그인 전 배너</option>
          <option value="main">메인 배너</option>
          <option value="middle">중간 배너</option>
        </Select>
      </Field>

      <Field label="배너 제목">
        <TextInput required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      <FileUploadField label="배너 이미지" accept="image/*" titleHint={title} onUploaded={(url) => setImageUrl(url)} />

      <Field label="이동 링크">
        <TextInput type="url" placeholder="https://" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
      </Field>

      <PrimaryButton type="submit" disabled={submitting || !imageUrl}>
        {submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
