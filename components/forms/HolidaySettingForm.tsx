"use client";

import { useState } from "react";
import { Field, TextInput, PrimaryButton } from "../ui";

export function HolidaySettingForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (detail: any, summary: string) => void;
  submitting: boolean;
}) {
  const [holidayStartDate, setHolidayStartDate] = useState("");
  const [holidayEndDate, setHolidayEndDate] = useState("");
  const [orderCutoffAt, setOrderCutoffAt] = useState("");
  const [shipmentResumeDate, setShipmentResumeDate] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const detail = {
      holiday_start_date: holidayStartDate,
      holiday_end_date: holidayEndDate || null,
      order_cutoff_at: orderCutoffAt,
      shipment_resume_date: shipmentResumeDate,
    };
    const period = holidayEndDate ? `${holidayStartDate} ~ ${holidayEndDate}` : holidayStartDate;
    onSubmit(detail, `휴무일 ${period} / 출고 재개 ${shipmentResumeDate}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="휴무 시작일">
          <TextInput
            required
            type="date"
            value={holidayStartDate}
            onChange={(e) => setHolidayStartDate(e.target.value)}
          />
        </Field>
        <Field label="휴무 종료일" hint="하루만 쉬는 경우 비워두세요.">
          <TextInput type="date" value={holidayEndDate} onChange={(e) => setHolidayEndDate(e.target.value)} />
        </Field>
      </div>

      <Field label="주문 마감 일시" hint="이 시각까지 들어온 주문만 정상 처리됩니다.">
        <TextInput
          required
          type="datetime-local"
          value={orderCutoffAt}
          onChange={(e) => setOrderCutoffAt(e.target.value)}
        />
      </Field>

      <Field label="출고 재개일">
        <TextInput
          required
          type="date"
          value={shipmentResumeDate}
          onChange={(e) => setShipmentResumeDate(e.target.value)}
        />
      </Field>

      <PrimaryButton type="submit" disabled={submitting}>
        {submitting ? "제출 중..." : "요청 제출"}
      </PrimaryButton>
    </form>
  );
}
