"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_LABEL, teamName, typeLabel } from "@/lib/requestTypes";
import { TextInput, PrimaryButton, GhostButton, Select } from "@/components/ui";
import { RequestDetail } from "@/components/RequestDetail";

type RequestRow = {
  id: number;
  request_no: string;
  team_id: string;
  target_team_id: string;
  requester_name: string;
  request_type: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  erp_doc_no: string | null;
};

const ADMIN_KEY = "hd-admin-password";

// 6. 관리자 화면 (기획 문서 2장-6, 3장-5)
// 별도 로그인 체계 없이, ADMIN_PASSWORD 환경변수 값으로만 간단히 보호합니다.
export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailById, setDetailById] = useState<Record<number, any>>({});
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(ADMIN_KEY);
    if (saved) {
      setPassword(saved);
      setAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    load();
  }, [authed]);

  function load() {
    setLoading(true);
    fetch("/api/requests")
      .then((r) => r.json())
      .then((data) => setRows(data.requests ?? []))
      .finally(() => setLoading(false));
  }

  function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (!detailById[id]) {
      fetch(`/api/requests/${id}`)
        .then((r) => r.json())
        .then((data) => setDetailById((prev) => ({ ...prev, [id]: data.detail })));
    }
  }

  async function handleExport() {
    setError("");
    setExporting(true);
    try {
      const res = await fetch("/api/requests/export", {
        headers: { "x-admin-password": password },
      });
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_KEY);
          setAuthed(false);
          return;
        }
        setError("엑셀 다운로드에 실패했습니다.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      a.href = url;
      a.download = `hd_requests_${today}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    sessionStorage.setItem(ADMIN_KEY, password);
    setAuthed(true);
  }

  async function updateStatus(id: number, status: string) {
    setError("");
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "상태 변경에 실패했습니다.");
      if (res.status === 401) {
        sessionStorage.removeItem(ADMIN_KEY);
        setAuthed(false);
      }
      return;
    }
    load();
  }

  if (!authed) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-6">
        <h1 className="text-xl font-semibold text-neutral-900">관리자 화면</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <TextInput
            type="password"
            placeholder="관리자 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <PrimaryButton type="submit">입장</PrimaryButton>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">전체 요청 관리</h1>
        <div className="flex gap-2">
          <GhostButton type="button" onClick={() => router.back()}>
            뒤로가기
          </GhostButton>
          <GhostButton type="button" onClick={() => router.push("/")}>
            홈으로 가기
          </GhostButton>
          <PrimaryButton type="button" onClick={handleExport} disabled={exporting}>
            {exporting ? "다운로드 중..." : "엑셀 다운로드"}
          </PrimaryButton>
        </div>
      </div>

      {error && <p className="rounded-lg bg-[#fdeeee] px-3 py-2 text-sm text-[#d0492e]">{error}</p>}
      {loading && <p className="text-sm text-neutral-400">불러오는 중...</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-neutral-500">
              <th className="py-2 pr-4">요청번호</th>
              <th className="py-2 pr-4">보낸 팀</th>
              <th className="py-2 pr-4">받는 팀</th>
              <th className="py-2 pr-4">담당자</th>
              <th className="py-2 pr-4">유형</th>
              <th className="py-2 pr-4">등록일시</th>
              <th className="py-2 pr-4">종료일시</th>
              <th className="py-2 pr-4">전자결재</th>
              <th className="py-2 pr-4">상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.id}>
                <tr
                  onClick={() => toggleExpand(r.id)}
                  className="cursor-pointer border-b border-neutral-100 hover:bg-[#f0f1f2]"
                >
                  <td className="py-2 pr-4">
                    <span className="mr-1 text-neutral-400">{expandedId === r.id ? "▲" : "▼"}</span>
                    {r.request_no}
                  </td>
                  <td className="py-2 pr-4">{teamName(r.team_id)}</td>
                  <td className="py-2 pr-4">{teamName(r.target_team_id)}</td>
                  <td className="py-2 pr-4">{r.requester_name}</td>
                  <td className="py-2 pr-4">{typeLabel(r.request_type)}</td>
                  <td className="py-2 pr-4 text-neutral-500">{new Date(r.created_at).toLocaleString("ko-KR")}</td>
                  <td className="py-2 pr-4 text-neutral-500">
                    {r.completed_at
                      ? `${r.status === "rejected" ? "반려" : "완료"} ${new Date(r.completed_at).toLocaleString("ko-KR")}`
                      : "-"}
                  </td>
                  <td className="py-2 pr-4 text-neutral-500">{r.erp_doc_no ?? "-"}</td>
                  <td className="py-2 pr-4" onClick={(e) => e.stopPropagation()}>
                    <Select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)}>
                      <option value="pending">{STATUS_LABEL.pending}</option>
                      <option value="in_progress">{STATUS_LABEL.in_progress}</option>
                      <option value="done">{STATUS_LABEL.done}</option>
                      <option value="rejected">{STATUS_LABEL.rejected}</option>
                    </Select>
                  </td>
                </tr>
                {expandedId === r.id && (
                  <tr className="border-b border-neutral-100 bg-[#f0f1f2]/40">
                    <td colSpan={9} className="px-4 py-3">
                      <RequestDetail requestType={r.request_type} detail={detailById[r.id]} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
