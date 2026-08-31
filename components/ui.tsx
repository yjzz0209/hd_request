"use client";

import { ReactNode } from "react";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label className="text-sm font-medium text-neutral-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}

// 토스처럼 테두리 대신 옅은 회색 배경으로 입력칸을 구분하고, 포커스 때만 테두리 색이 붙는 방식.
const INPUT_BASE =
  "w-full min-w-0 rounded-2xl border border-transparent bg-neutral-100 px-4 py-3.5 text-[15px] outline-none transition focus:border-[#12806f] focus:bg-white focus:ring-2 focus:ring-[#12806f]/15 ";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={INPUT_BASE + (props.className ?? "")} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={"min-h-24 " + INPUT_BASE + (props.className ?? "")} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={INPUT_BASE + (props.className ?? "")} />;
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-2xl bg-[#12806f] px-4 py-4 text-[15px] font-bold text-white transition hover:bg-[#0f6c5e] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 " +
        (props.className ?? "")
      }
    />
  );
}

export function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-2xl bg-neutral-100 px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200 " +
        (props.className ?? "")
      }
    />
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-2xl bg-neutral-50 p-4">{children}</div>;
}

// 메인 화면의 "소속 팀" 선택처럼, 아이콘 + 라벨이 있는 큰 선택 카드.
// 토스 스타일: 그림자·그라데이션 없이, 선택 여부는 배경 색 하나로만 구분합니다.
export function SelectCard({
  selected,
  onClick,
  icon,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex flex-1 flex-col items-center gap-2 rounded-2xl px-3 py-4 text-sm font-semibold transition " +
        (selected ? "bg-[#12806f] text-white" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200/80")
      }
    >
      <span className={selected ? "text-white" : "text-neutral-400"}>{icon}</span>
      {children}
    </button>
  );
}

// 메인 화면의 "내 요청 이력 조회 / 문의하기" 같은 바로가기 항목에 쓰는 아이콘+텍스트 카드.
// 외부 아이콘 라이브러리 없이 인라인 SVG만 씁니다. 토스 스타일: 옅은 회색 배경 채움, 테두리·그림자 없음.
export function QuickLinkRow({ href, icon, children }: { href: string; icon: ReactNode; children: ReactNode }) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-2xl bg-neutral-100 px-4 py-4 text-[15px] font-semibold text-neutral-800 transition hover:bg-neutral-200/70"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#12806f]/10 text-[#12806f]">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-neutral-400 transition group-hover:translate-x-0.5" />
    </a>
  );
}

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className}>
      <rect x="6" y="4" width="12" height="17" rx="2" strokeLinejoin="round" />
      <path d="M9 4V3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 11h6M9 14.5h6M9 17.5h3.5" strokeLinecap="round" />
    </svg>
  );
}

export function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className}>
      <path
        d="M4 12a8 8 0 1 1 3.3 6.47L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8.5 11.5h7M8.5 14.5h4.5" strokeLinecap="round" />
    </svg>
  );
}

// 소속 팀 선택 카드에 쓰는 아이콘들 (마케팅팀/혁신팀/유통전략팀).
export function MegaphoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l4.5 4V5L6 9H4a1 1 0 0 0-1 1Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 8.5a4 4 0 0 1 0 7M18 6a7.5 7.5 0 0 1 0 12" strokeLinecap="round" />
    </svg>
  );
}

export function BulbIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className}>
      <path
        d="M9 18h6M10 21h4M8 14.5A5.5 5.5 0 1 1 16 14.5c-.8 1-1.5 1.7-1.5 3.5h-5c0-1.8-.7-2.5-1.5-3.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TruckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} className={className}>
      <path d="M3 7h10v9H3z" strokeLinejoin="round" />
      <path d="M13 10h4l3 3v3h-7z" strokeLinejoin="round" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17.5" cy="18" r="1.6" />
    </svg>
  );
}
