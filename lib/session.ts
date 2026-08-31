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

// 요청 조회 화면에서 팀 비밀번호를 한 번 맞히면, 그 브라우저 세션(탭을 닫기 전까지) 동안은
// 같은 팀을 다시 눌러도 비밀번호를 또 물어보지 않도록 팀별로 "확인됨" 상태를 기억해둡니다.
// 비밀번호 자체는 저장하지 않고, 서버가 맞다고 확인해준 팀 id만 저장합니다.
const VIEW_AUTH_KEY = "hd-request-view-auth";

export function isTeamViewUnlocked(teamId: string): boolean {
  const raw = sessionStorage.getItem(VIEW_AUTH_KEY);
  if (!raw) return false;
  try {
    const unlocked: string[] = JSON.parse(raw);
    return Array.isArray(unlocked) && unlocked.includes(teamId);
  } catch {
    return false;
  }
}

export function unlockTeamView(teamId: string) {
  const raw = sessionStorage.getItem(VIEW_AUTH_KEY);
  let unlocked: string[] = [];
  try {
    unlocked = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(unlocked)) unlocked = [];
  } catch {
    unlocked = [];
  }
  if (!unlocked.includes(teamId)) unlocked.push(teamId);
  sessionStorage.setItem(VIEW_AUTH_KEY, JSON.stringify(unlocked));
}
