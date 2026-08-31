"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSession, SessionInfo } from "@/lib/session";
import { typeLabel, teamName, targetTeamFor, selectableTargetTeams } from "@/lib/requestTypes";
import { Field, TextInput } from "@/components/ui";
import { NewProductForm } from "@/components/forms/NewProductForm";
import { ProductChangeForm } from "@/components/forms/ProductChangeForm";
import { PopupForm } from "@/components/forms/PopupForm";
import { BannerForm } from "@/components/forms/BannerForm";
import { PackageForm } from "@/components/forms/PackageForm";
import { EtcForm } from "@/components/forms/EtcForm";
import { OrderCancelForm } from "@/components/forms/OrderCancelForm";
import { PharmacyInfoChangeForm } from "@/components/forms/PharmacyInfoChangeForm";
import { ExceptionOrderShipmentForm } from "@/components/forms/ExceptionOrderShipmentForm";
import { HolidaySettingForm } from "@/components/forms/HolidaySettingForm";
import { SoldoutProcessingForm } from "@/components/forms/SoldoutProcessingForm";
import { PopupTakedownForm } from "@/components/forms/PopupTakedownForm";
import { NoticeForm } from "@/components/forms/NoticeForm";

// 3. 요청 작성 화면 (기획 문서 2장-3, 3장-2)
function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "";
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [erpDocNo, setErpDocNo] = useState("");
  // 유통전략팀이 새 요청을 작성할 때만 쓰는 "받는 팀" 선택 상태. 유형별 기본 받는 팀으로
  // 미리 체크해두고, 필요하면 다른 팀을 추가로 체크해서 두 팀 모두에게 보낼 수 있습니다.
  const [targetTeams, setTargetTeams] = useState<string[]>(() => (type ? [targetTeamFor(type)] : []));

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  const isDistribution = session.teamId === "distribution";

  function toggleTargetTeam(id: string) {
    setTargetTeams((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // 최소 1개 팀은 선택되어 있어야 합니다.
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  }

  async function handleSubmit(detail: any, summary: string) {
    setSubmitting(true);
    setError("");
    try {
      // 유통전략팀이 받는 팀을 2개 선택했으면, 같은 내용으로 요청을 팀별로 하나씩 나눠 등록합니다.
      const targets = isDistribution && targetTeams.length > 0 ? targetTeams : [null];
      const requestNos: string[] = [];
      for (const t of targets) {
        const res = await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teamId: session!.teamId,
            requesterName: session!.requesterName,
            requestType: type,
            detail,
            summary,
            erpDocNo: erpDocNo || null,
            ...(t ? { targetTeamId: t } : {}),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "제출 중 오류가 발생했습니다.");
          setSubmitting(false);
          return;
        }
        requestNos.push(data.request.request_no);
      }
      router.push(`/request/complete?requestNo=${requestNos.join(",")}&type=${type}`);
    } catch {
      setError("제출 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-6 py-10">
      <div>
        <p className="text-sm text-neutral-500">
          {teamName(session.teamId)} · {session.requesterName}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">{typeLabel(type)}</h1>
      </div>

      {error && (
        <p className="rounded-lg bg-[#fdeeee] px-3 py-2 text-sm text-[#d0492e]">{error}</p>
      )}

      {isDistribution && (
        <Field
          label="받는 팀"
          hint="기본으로 선택된 팀을 그대로 두거나, 두 팀 모두에게 보내야 하면 나머지 팀도 함께 선택하세요."
        >
          <div className="flex gap-4 text-sm">
            {selectableTargetTeams().map((id) => (
              <label key={id} className="flex items-center gap-1.5">
                <input type="checkbox" checked={targetTeams.includes(id)} onChange={() => toggleTargetTeam(id)} />
                {teamName(id)}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="전자결재 문서번호" hint="필수 입력은 아닙니다. 있는 경우에만 입력하세요.">
        <TextInput value={erpDocNo} onChange={(e) => setErpDocNo(e.target.value)} />
      </Field>

      {type === "new_product" && <NewProductForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "product_change" && <ProductChangeForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "popup" && <PopupForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "banner" && <BannerForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "package" && <PackageForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "etc" && <EtcForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "order_cancel" && <OrderCancelForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "pharmacy_info_change" && (
        <PharmacyInfoChangeForm onSubmit={handleSubmit} submitting={submitting} />
      )}
      {type === "exception_order_shipment" && (
        <ExceptionOrderShipmentForm onSubmit={handleSubmit} submitting={submitting} />
      )}
      {type === "holiday_setting" && <HolidaySettingForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "soldout_processing" && (
        <SoldoutProcessingForm onSubmit={handleSubmit} submitting={submitting} />
      )}
      {type === "popup_takedown" && <PopupTakedownForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "notice" && <NoticeForm onSubmit={handleSubmit} submitting={submitting} />}

      <button type="button" onClick={() => router.push("/request-type")} className="text-sm text-neutral-400 underline">
        이전으로
      </button>
    </main>
  );
}

export default function NewRequestPage() {
  return (
    <Suspense fallback={null}>
      <NewRequestContent />
    </Suspense>
  );
}
