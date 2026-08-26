"use client";

// 별도 로그인 없이, 시작 화면에서 고른 팀/이름을 브라우저에 잠깐 기억해둡니다. (2장 1번)
const KEY = "hd-request-session";

export type SessionInfo = { teamId: string; requesterName: string };

export function saveSession(info: SessionInfo) {
  sessionStorage.setItem(KEY, JSON.stringify(info));
}

export function loadSession(): SessionInfo | null {
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
