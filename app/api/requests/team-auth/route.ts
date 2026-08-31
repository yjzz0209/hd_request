import { NextRequest, NextResponse } from "next/server";

// 요청 조회 화면에서 팀을 선택할 때 그 팀 비밀번호를 확인하는 용도로만 씁니다.
// 팀별 비밀번호는 코드에 직접 넣지 않고(깃허브에 그대로 노출되면 안 되니까) 환경변수로
// 관리합니다. Vercel 프로젝트 설정 -> Environment Variables 에 아래 3개를 추가해주세요.
//   TEAM_PASSWORD_MARKETING (마케팅팀)
//   TEAM_PASSWORD_INNOVATION (혁신팀)
//   TEAM_PASSWORD_DISTRIBUTION (유통전략팀)
const ENV_KEY: Record<string, string> = {
  marketing: "TEAM_PASSWORD_MARKETING",
  innovation: "TEAM_PASSWORD_INNOVATION",
  distribution: "TEAM_PASSWORD_DISTRIBUTION",
};

// POST /api/requests/team-auth  body: { teamId, password }
export async function POST(req: NextRequest) {
  const { teamId, password } = await req.json();

  const envKey = ENV_KEY[teamId];
  const expected = envKey ? process.env[envKey] : undefined;

  if (!expected) {
    return NextResponse.json(
      { error: "이 팀의 비밀번호가 서버에 설정되어 있지 않습니다. 관리자에게 문의해주세요." },
      { status: 500 }
    );
  }

  if (typeof password !== "string" || password !== expected) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
