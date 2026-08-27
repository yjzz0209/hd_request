import { Resend } from "resend";
import { teamName, typeLabel } from "./requestTypes";

// Power Automate가 Outlook 트리거로 이 이메일을 감지해서
// SharePoint/OneDrive의 엑셀 파일에 한 행씩 옮겨 적습니다.
// 그래서 아래 표 형식(라벨: 값)을 절대 임의로 바꾸면 안 되고,
// 바꿔야 한다면 Power Automate 흐름의 파싱 로직도 함께 수정해야 합니다.
export async function sendRequestNotification(params: {
  requestNo: string;
  teamId: string;
  requesterName: string;
  requestType: string;
  createdAt: string;
  summary: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REQUEST_NOTIFICATION_EMAIL;

  if (!apiKey || !to) {
    console.warn(
      "[email] RESEND_API_KEY 또는 REQUEST_NOTIFICATION_EMAIL 이 설정되지 않아 이메일 발송을 건너뜁니다."
    );
    return { skipped: true };
  }

  const resend = new Resend(apiKey);

  const html = `
    <p>새로운 업무 협조 요청이 등록되었습니다.</p>
    <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse;">
      <tr><td><b>요청번호</b></td><td>${params.requestNo}</td></tr>
      <tr><td><b>팀</b></td><td>${teamName(params.teamId)}</td></tr>
      <tr><td><b>담당자</b></td><td>${params.requesterName}</td></tr>
      <tr><td><b>요청유형</b></td><td>${typeLabel(params.requestType)}</td></tr>
      <tr><td><b>상태</b></td><td>대기</td></tr>
      <tr><td><b>등록일시</b></td><td>${params.createdAt}</td></tr>
      <tr><td><b>상세내용</b></td><td>${params.summary}</td></tr>
    </table>
  `;

  return resend.emails.send({
    from: "업무협조요청시스템 <noreply@today-pharm.co.kr>",
    to,
    subject: `[업무협조요청] ${typeLabel(params.requestType)} - ${teamName(
      params.teamId
    )} ${params.requesterName}`,
    html,
  });
}
