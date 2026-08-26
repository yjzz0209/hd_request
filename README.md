# 업무 협조 요청 시스템

마케팅팀·혁신팀이 유통전략팀에 업무 협조를 요청할 때 쓰는 내부 웹앱입니다.
기획 내용은 Claude 프로젝트의 `claude/업무협조요청시스템_기획문서_1차.md` 를 기준으로 합니다.

## 화면 구성

1. `/` — 시작 화면 (팀 선택, 담당자 이름 입력)
2. `/request-type` — 요청 유형 선택 (팀별로 다르게 노출)
3. `/request/new?type=...` — 요청 작성 (유형별 입력 폼)
4. `/request/complete` — 제출 완료
5. `/requests` — 요청 조회 (팀 선택 시 그 팀 요청만 필터링)
6. `/admin` — 관리자 화면 (비밀번호로 간단히 보호, 처리 상태 변경)

## 스택

- Next.js (App Router) + TypeScript + Tailwind
- Supabase (Postgres + Storage) — DB, 파일 업로드
- Resend — 요청 등록 시 담당자에게 알림 이메일 발송
- Power Automate — 알림 이메일을 감지해서 OneDrive/SharePoint 엑셀 파일에 실시간으로 한 행씩 반영 (Azure AD 앱 등록 없이, 표준 커넥터인 Outlook 트리거 + Excel 커넥터로 구성)

## 처음 설정하는 방법

### 1. Supabase

1. https://supabase.com 에서 새 프로젝트를 만듭니다.
2. 프로젝트의 SQL Editor에서 `supabase/schema.sql` 내용을 그대로 실행합니다.
3. Storage에서 `request-uploads` 라는 이름의 버킷을 만들고 Public으로 설정합니다. (버킷 이름을 바꾸면 `.env.local`의 `SUPABASE_STORAGE_BUCKET` 값도 함께 바꿔주세요)
4. 프로젝트 설정 > API 메뉴에서 Project URL과 `service_role` 키를 복사해둡니다.

### 2. Resend

1. https://resend.com 에서 가입하고 API Key를 발급받습니다.
2. 요청 알림을 받을 이메일 주소를 정합니다. (이 주소로 등록될 때마다 알림이 오고, 이 메일을 Power Automate가 감지해서 엑셀에 반영합니다)

### 3. 환경변수

`.env.example` 을 `.env.local` 로 복사한 뒤 값을 채웁니다.

```bash
cp .env.example .env.local
```

### 4. 로컬에서 실행

```bash
npm install
npm run dev
```

http://localhost:3000 으로 접속해서 확인합니다.

### 5. Vercel 배포

1. 이 저장소를 GitHub에 올리고, Vercel에서 New Project로 이 저장소를 가져옵니다.
2. Vercel 프로젝트 Settings > Environment Variables 에 `.env.local` 과 같은 값들을 등록합니다.
3. Deploy를 누르면 끝입니다. 이후로는 `main` 브랜치에 푸시할 때마다 자동으로 재배포됩니다.

### 6. Power Automate 흐름 (엑셀 실시간 반영)

Azure AD 앱 등록 없이, 이미 위에서 보내는 알림 이메일을 감지하는 방식으로 구성합니다.

1. https://make.powerautomate.com 에서 새 흐름을 만들고 트리거를 "새 이메일이 도착하는 경우(V3)" (Outlook)로 선택합니다. 제목에 `[업무협조요청]` 이 포함된 메일만 걸러지도록 필터를 겁니다.
2. 이메일 본문(HTML 표)에서 요청번호/팀/담당자/요청유형/상태/등록일시/상세내용 값을 "텍스트 추출" 또는 "HTML 테이블에서 값 가져오기" 액션으로 뽑아냅니다.
3. 마지막 액션으로 "테이블에 행 추가" (Excel Online (Business))를 붙이고, `업무협조요청_기록.xlsx` 파일과 그 안의 표를 대상으로 지정합니다.
4. 파일 위치: OneDrive의 `1. 자사몰/업무협조요청_기록/업무협조요청_기록.xlsx` (Claude가 미리 만들어둔 파일입니다)

이 방식은 Outlook 트리거와 Excel 커넥터가 모두 표준(무료) 커넥터라 추가 비용이나 IT팀의 Azure AD 앱 등록 없이 그대로 진행할 수 있습니다.

## DB 스키마

`supabase/schema.sql` 참고. 기획 문서 7장의 테이블 구조를 그대로 옮겼습니다.
