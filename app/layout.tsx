import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "업무 협조 요청 시스템",
  description: "마케팅팀·혁신팀이 유통전략팀에 업무 협조를 요청하는 내부 시스템",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
