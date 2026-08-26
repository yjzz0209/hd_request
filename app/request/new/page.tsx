"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadSession, SessionInfo } from "@/lib/session";
import { typeLabel, teamName } from "@/lib/requestTypes";
import { NewProductForm } from "@/components/forms/NewProductForm";
import { ProductChangeForm } from "@/components/forms/ProductChangeForm";
import { PopupForm } from "@/components/forms/PopupForm";
import { BannerForm } from "@/components/forms/BannerForm";
import { PackageForm } from "@/components/forms/PackageForm";
import { EtcForm } from "@/components/forms/EtcForm";
import { OrderCancelForm } from "@/components/forms/OrderCancelForm";

// 3. 요청 작성 화면 (기획 문서 2장-3, 3장-2)
function NewRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") ?? "";
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      router.replace("/");
      return;
    }
    setSession(s);
  }, [router]);

  if (!session) return null;

  async function handleSubmit(detail: any, summary: string) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: session!.teamId,
          requesterName: session!.requesterName,
          requestType: type,
          detail,
          summary,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "제출 중 오류가 발생했습니다.");
        setSubmitting(false);
        return;
      }
      router.push(`/request/complete?requestNo=${data.request.request_no}&type=${type}`);
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

      {type === "new_product" && <NewProductForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "product_change" && <ProductChangeForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "popup" && <PopupForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "banner" && <BannerForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "package" && <PackageForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "etc" && <EtcForm onSubmit={handleSubmit} submitting={submitting} />}
      {type === "order_cancel" && <OrderCancelForm onSubmit={handleSubmit} submitting={submitting} />}

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
