// 메일/요청 조회 화면에서 "파일 다운로드"를 눌렀을 때 브라우저에 저장되는 파일 이름을
// 만드는 데 씁니다. 형식: 요청번호_항목명_등록일자(예: REQ-000020_확대 이미지_20260901.jpg)
//
// Supabase Storage에 실제 저장되는 파일명(오브젝트 키)은 한글 등 비ASCII 문자를 못 써서
// 별도의 안전한 이름으로 관리되고 있습니다(app/api/upload/route.ts 참고). 이 함수가 만드는
// 이름은 그 저장 파일명과는 별개로, 다운로드될 때 사용자에게 보여줄 이름으로만 쓰입니다.
// Supabase Storage의 공개 URL은 ?download=원하는파일명 형태로 다운로드 파일명을
// 지정할 수 있어서 이 방식이 가능합니다.

export function extFromUrl(url?: string | null): string {
  if (!url) return "";
  const clean = url.split("?")[0];
  const m = clean.match(/\.([a-zA-Z0-9]+)$/);
  return m ? `.${m[1]}` : "";
}

export function dateStampFrom(dateLike: string | number | Date | null | undefined): string {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function buildDownloadName(
  requestNo: string | null | undefined,
  label: string,
  createdAt: string | number | Date | null | undefined,
  url?: string | null
): string {
  const stamp = dateStampFrom(createdAt);
  const parts = [requestNo, label, stamp].filter(Boolean);
  return `${parts.join("_")}${extFromUrl(url)}`;
}
