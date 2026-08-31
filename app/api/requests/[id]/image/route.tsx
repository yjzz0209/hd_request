import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { loadDetailForRequest } from "@/lib/requestDetail";
import { STATUS_LABEL, teamName, typeLabel } from "@/lib/requestTypes";
import { buildImageFields, ImageField } from "@/lib/requestImageFields";

// GET /api/requests/:id/image -> 알림 이메일의 "표 이미지로 저장" 링크가 여는 주소.
// 이메일 자체는 자바스크립트를 못 써서 그 자리에서 이미지를 만들 수 없기 때문에, 서버가 미리
// PNG를 만들어서 내려주고(Content-Disposition: attachment) 클릭하면 바로 다운로드되게 합니다.
// 요청 조회 화면 등 다른 곳과 마찬가지로 별도 로그인 없이 요청 번호(URL)만으로 접근합니다.

const WIDTH = 800;

// 이미지 생성기(satori)는 기본 폰트에 한글이 없어서 아무 설정 없이 쓰면 글자가 네모(□)로
// 깨집니다. 그래서 한글을 지원하는 Pretendard 폰트 파일을 이 라우트 폴더에 함께 두고
// 직접 읽어서 넘겨줍니다. new URL(..., import.meta.url) 패턴은 Next.js가 빌드할 때 이
// 파일들을 서버리스 함수 번들에 자동으로 포함시켜주는, Vercel이 공식적으로 안내하는 방식입니다.
async function loadFonts() {
  const [regular, bold] = await Promise.all([
    fetch(new URL("./Pretendard-Regular.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
    fetch(new URL("./Pretendard-Bold.ttf", import.meta.url)).then((res) => res.arrayBuffer()),
  ]);
  return [
    { name: "Pretendard", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Pretendard", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const fonts = await loadFonts();

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
