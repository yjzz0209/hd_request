"use client";

import { useRef, useState } from "react";
import { Field, GhostButton } from "./ui";

// 첨부파일 정책(오픈 이슈 6-4): 파일당 20MB 이내
// 원본 파일을 그대로 보관하되, 파일명은 "요청날짜_요청제목_이미지명" 형태로 저장합니다.
// (엑셀에 이미지를 직접 넣지 않고, 스토리지 폴더에 파일로 저장 + 링크만 기록)
export function FileUploadField({
  label,
  onUploaded,
  accept,
  titleHint,
  hideLabel,
}: {
  label: string;
  onUploaded: (url: string, name: string) => void;
  accept?: string;
  /** 요청 제목(상품명/팝업 제목 등). 파일명 앞부분에 붙습니다. */
  titleHint?: string;
  /** true면 위쪽 라벨 텍스트를 표시하지 않습니다. 감싸는 Field의 라벨이 이미 이 항목을
   * 설명해줄 때(예: "개별 이미지" 섹션의 첫 번째, 용도 구분 없는 첨부 슬롯) 사용합니다. */
  hideLabel?: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setFileName(file.name);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("label", label);
    if (titleHint) fd.append("title", titleHint);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (res.ok && data.url) {
      setStatus("done");
      onUploaded(data.url, file.name);
    } else {
      setStatus("error");
    }
  }

  const body = (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <GhostButton type="button" onClick={() => inputRef.current?.click()} className="shrink-0">
          파일 찾기
        </GhostButton>
        <span className="truncate text-sm text-neutral-500">
          {fileName || "선택된 파일 없음"}
        </span>
      </div>
      {status === "uploading" && <p className="text-xs text-neutral-400">업로드 중...</p>}
      {status === "done" && <p className="text-xs text-[#12806f]">{fileName} 업로드 완료</p>}
      {status === "error" && <p className="text-xs text-[#d0492e]">업로드에 실패했습니다.</p>}
    </>
  );

  if (hideLabel) {
    return <div className="flex min-w-0 flex-col gap-1.5">{body}</div>;
  }

  return <Field label={label}>{body}</Field>;
}
