import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "업무 협조 요청 시스템",
  description: "마케팅팀·혁신팀이 유통전략팀에 업무 협조를 요청하는 내부 시스템",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        {/* 토스 등 요즘 서비스에서 많이 쓰는 Pretendard 폰트. 시스템 기본 한글 폰트(맑은 고딕 등)보다
            훨씬 정돈되어 보여서, 화면 전체가 한층 덜 촌스럽게 느껴지도록 전역으로 적용합니다. */}
        <link
          rel="stylesheet"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
