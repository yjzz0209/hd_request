import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { loadDetailForRequest } from "@/lib/requestDetail";
import { STATUS_LABEL, teamName, typeLabel } from "@/lib/requestTypes";
import { buildImageFields, ImageField } from "@/lib/requestImageFields";
import { PRETENDARD_REGULAR_BASE64 } from "./pretendardRegularBase64";
import { PRETENDARD_BOLD_BASE64 } from "./pretendardBoldBase64";

// GET /api/requests/:id/image -> 알림 이메일의 "표 이미지로 저장" 링크가 여는 주소.
// 이메일 자체는 자바스크립트를 못 써서 그 자리에서 이미지를 만들 수 없기 때문에, 서버가 미리
// PNG를 만들어서 내려주고(Content-Disposition: attachment) 클릭하면 바로 다운로드되게 합니다.
// 요청 조회 화면 등 다른 곳과 마찬가지로 별도 로그인 없이 요청 번호(URL)만으로 접근합니다.

const WIDTH = 800;

// 이미지 생성기(satori)는 기본 폰트에 한글이 없어서 아무 설정 없이 쓰면 글자가 네모(□)로
// 깨집니다. 그래서 한글을 지원하는 Pretendard 폰트가 필요한데, 배포 환경(Vercel)마다
// 폰트 "파일"을 찾는 방식(new URL(..., import.meta.url) + fetch, 또는 fs로 직접 읽기)이
// 500 에러로 이어져서, 아예 파일시스템에 의존하지 않도록 폰트를 base64 문자열로 코드에
// 직접 담아뒀습니다(./pretendardRegularBase64.ts, ./pretendardBoldBase64.ts). 이 방식은
// 배포 환경과 무관하게 항상 똑같이 동작합니다.
function loadFonts() {
  return [
    { name: "Pretendard", data: Buffer.from(PRETENDARD_REGULAR_BASE64, "base64"), weight: 400 as const, style: "normal" as const },
    { name: "Pretendard", data: Buffer.from(PRETENDARD_BOLD_BASE64, "base64"), weight: 700 as const, style: "normal" as const },
  ];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    return await renderImage(await params);
  } catch (e) {
    // 원인을 알 수 없는 크래시는 Vercel의 빈 500 에러 화면으로 나가버려서 원인 파악이
    // 어렵기 때문에, 서버 로그에 자세히 남기고 화면에는 안내 문구를 내려줍니다.
    console.error("[표 이미지로 저장] 생성 실패", e);
    return new Response("표 이미지를 만드는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", {
      status: 500,
    });
  }
}

async function renderImage({ id }: { id: string }) {
  const supabase = getSupabaseServerClient();

  const { data: r, error } = await supabase.from("requests").select("*").eq("id", id).single();
  if (error || !r) {
    return new Response("요청을 찾을 수 없습니다.", { status: 404 });
  }

  const detail = await loadDetailForRequest(supabase, r.id, r.request_type);
  const fields = buildImageFields(r.request_type, detail);

  const commonRows: [string, string][] = [
    ["요청번호", r.request_no],
    ["보낸 팀", teamName(r.team_id)],
    ["받는 팀", teamName(r.target_team_id)],
    ["담당자", r.requester_name],
    ["요청유형", typeLabel(r.request_type)],
    ["상태", STATUS_LABEL[r.status] ?? r.status],
    ["등록일시", r.created_at ? new Date(r.created_at).toLocaleString("ko-KR") : "-"],
    ["전자결재 문서번호", r.erp_doc_no ?? "-"],
  ];

  // 내용 양에 따라 이미지 높이를 대략 계산합니다(이미지는 화면처럼 스크롤이 안 되기 때문에,
  // 표/항목이 많은 요청도 잘리지 않도록 미리 넉넉하게 잡아둡니다).
  let height = 200 + commonRows.length * 46;
  for (const f of fields) {
    height += f.kind === "table" ? 70 + f.rows.length * 40 : 66;
  }
  height += 60;

  const fonts = loadFonts();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: WIDTH,
          padding: 40,
          background: "#ffffff",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", marginBottom: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#12806f" }}>업무 협조 요청</span>
          <span style={{ fontSize: 30, fontWeight: 800, color: "#171717", marginTop: 6 }}>{r.request_no}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", border: "1px solid #e5e5e5", borderRadius: 16 }}>
          {commonRows.map(([label, value], i) => (
            <div
              key={i}
              style={{
                display: "flex",
                borderTop: i === 0 ? "none" : "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 170,
                  padding: "12px 16px",
                  background: "#fafafa",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#525252",
                }}
              >
                {label}
              </div>
              <div style={{ display: "flex", flex: 1, padding: "12px 16px", fontSize: 14, color: "#171717" }}>
                {value || "-"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 28, gap: 20 }}>
          {fields.map((f: ImageField, i: number) =>
            f.kind === "text" ? (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a3a3a3" }}>{f.label}</span>
                <span style={{ fontSize: 14, color: "#171717" }}>{f.value}</span>
              </div>
            ) : (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#a3a3a3" }}>{f.label}</span>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e5e5e5",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ display: "flex", background: "#fafafa" }}>
                    {f.columns.map((c) => (
                      <div
                        key={c.key}
                        style={{ display: "flex", flex: 1, padding: "8px 10px", fontSize: 12, fontWeight: 700, color: "#525252" }}
                      >
                        {c.label}
                      </div>
                    ))}
                  </div>
                  {f.rows.length === 0 ? (
                    <div style={{ display: "flex", padding: "10px 12px", fontSize: 12, color: "#a3a3a3" }}>
                      등록된 항목이 없습니다.
                    </div>
                  ) : (
                    f.rows.map((row, ri) => (
                      <div key={ri} style={{ display: "flex", borderTop: "1px solid #f0f0f0" }}>
                        {f.columns.map((c) => (
                          <div
                            key={c.key}
                            style={{ display: "flex", flex: 1, padding: "8px 10px", fontSize: 12, color: "#171717" }}
                          >
                            {String(row[c.key] ?? "-")}
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          )}
        </div>

        <div style={{ display: "flex", marginTop: 28, fontSize: 11, color: "#d4d4d4" }}>
          오늘의팜 업무협조요청시스템
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height,
      fonts,
      headers: {
        "Content-Disposition": `attachment; filename="${r.request_no}.png"`,
      },
    }
  );
}
