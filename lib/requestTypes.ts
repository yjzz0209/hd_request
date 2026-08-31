// 화면 하드코딩이 아니라 데이터로 관리 (기획 문서 3-1)
// 팀/요청유형이 늘어나면 이 파일만 수정하면 됩니다.

export type TeamId = "marketing" | "innovation" | "distribution";

export const TEAMS: { id: TeamId; name: string }[] = [
  { id: "marketing", name: "마케팅팀" },
  { id: "innovation", name: "혁신팀" },
  { id: "distribution", name: "유통전략팀" },
];

export type RequestTypeId =
  | "new_product"
  | "product_change"
  | "popup"
  | "banner"
  | "package"
  | "etc"
  | "order_cancel"
  | "pharmacy_info_change"
  | "exception_order_shipment"
  | "holiday_setting"
  | "soldout_processing"
  | "popup_takedown"
  | "notice";

// 마케팅팀 화면에서 요청 유형이 많아져서 찾기 쉽도록 묶는 그룹입니다. 다른 팀 화면에는
// 영향이 없고(마케팅팀 목록에서만 이 그룹으로 나눠 보여줍니다), group이 없는 유형은
// 마케팅팀에 노출되지 않는 유형이라 그룹도 필요 없습니다.
export type MarketingGroupId = "product" | "expose" | "etc";

export const MARKETING_GROUPS: { id: MarketingGroupId; label: string }[] = [
  { id: "product", label: "상품 관련" },
  { id: "expose", label: "노출·홍보 관련" },
  { id: "etc", label: "기타" },
];

// targetTeam: 이 요청이 기본적으로 누구에게 가는지. 마케팅팀·혁신팀이 보내는 유형은
// 항상 유통전략팀이 받고, 유통전략팀이 보내는 유형은 유형별로 기본 받는 팀이 다릅니다.
// 유통전략팀이 새 요청을 작성할 때는 이 기본값을 그대로 두거나, 화면에서 받는 팀을
// 바꾸거나 마케팅팀·혁신팀 둘 다로 선택할 수 있습니다(요청 작성 화면 참고).
export const REQUEST_TYPES: {
  id: RequestTypeId;
  label: string;
  teams: TeamId[];
  targetTeam: TeamId;
  marketingGroup?: MarketingGroupId;
}[] = [
  { id: "new_product", label: "신규 상품 등록", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "product" },
  { id: "product_change", label: "상품 정보 변경 요청", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "product" },
  { id: "package", label: "패키지 상품 등록", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "product" },
  { id: "soldout_processing", label: "품절처리 요청", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "product" },
  { id: "popup", label: "팝업 등록 요청", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "expose" },
  { id: "banner", label: "배너 등록 요청", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "expose" },
  { id: "popup_takedown", label: "팝업 내리기 요청", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "expose" },
  { id: "notice", label: "공지사항 등록 요청", teams: ["marketing", "innovation"], targetTeam: "distribution", marketingGroup: "expose" },
  { id: "order_cancel", label: "주문 취소 문자 발송", teams: ["innovation"], targetTeam: "distribution" },
  { id: "pharmacy_info_change", label: "약국 정보 변경 요청", teams: ["distribution"], targetTeam: "innovation" },
  { id: "exception_order_shipment", label: "예외 주문건 출고 요청", teams: ["distribution"], targetTeam: "innovation" },
  { id: "holiday_setting", label: "휴무일 세팅", teams: ["innovation"], targetTeam: "distribution" },
  // "기타"는 목록 어디서나 항상 맨 마지막에 오도록 배열 맨 끝에 둡니다.
  { id: "etc", label: "기타", teams: ["marketing"], targetTeam: "distribution", marketingGroup: "etc" },
];

export function typesForTeam(teamId: TeamId) {
  return REQUEST_TYPES.filter((t) => t.teams.includes(teamId));
}

// 마케팅팀 요청 유형 선택 화면에서만 사용합니다. MARKETING_GROUPS 순서대로,
// 그룹에 속한 유형이 하나도 없으면 그 그룹 자체를 건너뜁니다.
export function marketingGroupedTypes() {
  const marketingTypes = typesForTeam("marketing");
  return MARKETING_GROUPS.map((g) => ({
    ...g,
    types: marketingTypes.filter((t) => t.marketingGroup === g.id),
  })).filter((g) => g.types.length > 0);
}

// 유통전략팀이 새 요청을 만들 때 받는 팀을 고를 수 있는 후보(자기 자신 제외).
export function selectableTargetTeams(): TeamId[] {
  return ["marketing", "innovation"];
}

export function targetTeamFor(requestType: string): TeamId {
  return REQUEST_TYPES.find((t) => t.id === requestType)?.targetTeam ?? "distribution";
}

export function teamName(teamId: string) {
  return TEAMS.find((t) => t.id === teamId)?.name ?? teamId;
}

export function typeLabel(typeId: string) {
  return REQUEST_TYPES.find((t) => t.id === typeId)?.label ?? typeId;
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  in_progress: "처리중",
  done: "완료",
  rejected: "반려",
};

// 신규 상품 등록/상품 정보 변경 요청이 공유하는 필드 목록 (4-1, 4-2)
export const NEW_PRODUCT_FIELDS: { key: string; label: string }[] = [
  { key: "product_code", label: "자체 상품코드" },
  { key: "product_name", label: "상품명" },
  { key: "is_taxable", label: "과세 여부" },
  { key: "stock_type", label: "판매 재고 유형" },
  { key: "stock_qty", label: "상품 재고" },
  { key: "bundle_unit", label: "묶음 주문 단위" },
  { key: "sale_period", label: "판매기간" },
  { key: "use_finance_fee", label: "금융비 사용 설정" },
  { key: "pricing_tiers", label: "수량/등급별 가격 세팅" },
  { key: "images", label: "개별 이미지" },
  { key: "description_file", label: "상품 상세 설명 문구" },
];

export const IMAGE_TYPES: { key: string; label: string }[] = [
  { key: "zoom", label: "확대 이미지" },
  { key: "detail", label: "상세 이미지" },
  { key: "thumbnail", label: "썸네일 이미지" },
  { key: "list", label: "리스트 이미지(기본)" },
  { key: "list_group", label: "리스트그룹형 이미지" },
  { key: "product_type", label: "상품이미지형 이미지" },
];
