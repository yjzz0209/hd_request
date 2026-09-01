"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAMS, STATUS_LABEL, typeLabel, teamName } from "@/lib/requestTypes";
import { RequestDetail } from "@/components/RequestDetail";
import { isTeamViewUnlocked, unlockTeamView } from "@/lib/session";
import { TextInput, PrimaryButton } from "@/components/ui";

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

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#f0f1f2] text-[#8a8f96]",
  in_progress: "bg-[#12806f]/10 text-[#12806f]",
  done: "bg-[#2fbf9f]/15 text-[#12806f]",
  rejected: "bg-[#fdeeee] text-[#d0492e]",
};

// 5. 요청 조회 화면 (기획 문서 2장-5, 3장-4)
export default function RequestsPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailById, setDetailById] = useState<Record<number, any>>({});

  // 팀 비밀번호 확인 상태. 이미 이 세션에서 확인된 팀을 누르면 바로 목록을 보여주고,
  // 아직 확인되지 않은 팀을 누르면 비밀번호 입력창을 띄웁니다.
  const [pendingTeam, setPendingTeam] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);

  function handleTeamClick(id: string) {
    if (isTeamViewUnlocked(id)) {
      setTeamId(id);
      setPendingTeam(null);
      return;
    }
    setPendingTeam(id);
    setPassword("");
    setAuthError("");
  }

  function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingTeam || !password) return;
    setAuthenticating(true);
    setAuthError("");
    fetch("/api/requests/team-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: pendingTeam, password }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setAuthError(data.error ?? "비밀번호가 올바르지 않습니다.");
          return;
        }
        unlockTeamView(pendingTeam);
        setTeamId(pendingTeam);
        setPendingTeam(null);
      })
      .catch(() => setAuthError("확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."))
      .finally(() => setAuthenticating(false));
  }

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    fetch(`/api/requests?team=${teamId}`)
      .then((r) => r.json())
      .then((data) => setRows(data.requests ?? []))
      .finally(() => setLoading(false));
  }, [teamId]);

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

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">요청 조회</h1>
        <p className="mt-1 text-sm text-neutral-500">소속 팀을 선택하면 그 팀이 등록한 요청만 보여줍니다.</p>
      </div>

      <div className="flex gap-2">
        {TEAMS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleTeamClick(t.id)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
              teamId === t.id
                ? "border-[#12806f] bg-[#12806f] text-white"
                : "border-neutral-300 text-neutral-700 hover:border-[#12806f]"
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {pendingTeam && (
        <form
          onSubmit={handleAuthSubmit}
          className="flex flex-col gap-3 rounded-lg border border-neutral-200 p-4"
        >
          <p className="text-sm text-neutral-600">{teamName(pendingTeam)} 비밀번호를 입력해주세요.</p>
          <TextInput
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
          />
          {authError && <p className="text-xs text-[#d0492e]">{authError}</p>}
          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={authenticating || !password}>
              {authenticating ? "확인 중..." : "확인"}
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setPendingTeam(null)}
              className="text-sm text-neutral-400 underline"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {loading && <p className="text-sm text-neutral-400">불러오는 중...</p>}

      {!loading && teamId && rows.length === 0 && (
        <p className="text-sm text-neutral-400">등록된 요청이 없습니다.</p>
      )}

      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-lg border border-neutral-200">
            <button
              type="button"
              onClick={() => toggleExpand(r.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <p className="text-sm font-medium text-neutral-900">
                  {typeLabel(r.request_type)} <span className="text-neutral-400">· {r.request_no}</span>
                  {r.team_id === "distribution" && (
                    <span className="ml-1 text-neutral-400">→ {teamName(r.target_team_id)}</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-neutral-500">
                  {r.requester_name} · {new Date(r.created_at).toLocaleString("ko-KR")}
                  {r.completed_at && (
                    <>
                      {" "}
                      · {r.status === "rejected" ? "반려" : "완료"} {new Date(r.completed_at).toLocaleString("ko-KR")}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                  {STATUS_LABEL[r.status]}
                </span>
                <span className="text-neutral-400">{expandedId === r.id ? "▲" : "▼"}</span>
              </div>
            </button>
            {expandedId === r.id && (
              <div className="border-t border-neutral-100 px-4 py-3">
                {r.erp_doc_no && (
                  <p className="mb-2 text-xs text-neutral-500">전자결재 문서번호 · {r.erp_doc_no}</p>
                )}
                <RequestDetail
                  requestType={r.request_type}
                  detail={detailById[r.id]}
                  requestNo={r.request_no}
                  createdAt={r.created_at}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <button type="button" onClick={() => router.push("/")} className="text-sm text-neutral-400 underline">
        처음으로
      </button>
    </main>
  );
}
