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

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full min-w-0 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#12806f] " +
        (props.className ?? "")
      }
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "min-h-24 w-full min-w-0 rounded-lg border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-[#12806f] " +
        (props.className ?? "")
      }
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        "w-full min-w-0 rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#12806f] " +
        (props.className ?? "")
      }
    />
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "rounded-lg bg-[#12806f] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-neutral-300 " +
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
        "rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:border-[#12806f] " +
        (props.className ?? "")
      }
    />
  );
}

export function SectionCard({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4">{children}</div>;
}
