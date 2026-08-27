"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TEAMS, STATUS_LABEL, typeLabel, teamName } from "@/lib/requestTypes";
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
  erp_doc_no: string | null;
};

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-[#f0f1f2] text-[#8a8f96]",
  in_progress: "bg-[#12806f]/10 text-[#12806f]",
  done: "bg-[#2fbf9f]/15 text-[#12806f]",
};

// 5. 요청 조회 화면 (기획 문서 2장-5, 3장-4)
export default function RequestsPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState("");
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailById, setDetailById] = useState<Record<number, any>>({});

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
            onClick={() => setTeamId(t.id)}
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
                <RequestDetail requestType={r.request_type} detail={detailById[r.id]} />
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
