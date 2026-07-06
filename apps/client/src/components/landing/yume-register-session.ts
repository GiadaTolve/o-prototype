export type YumeUserData = {
  nomePg: string;
  email: string;
  password: string;
  playerPreferences: string;
};

export type YumeBranch = "novice" | "veteran" | null;

export type StoredChatMessage = {
  text: string;
  sender: "yume" | "user";
};

export type YumeRegisterSession = {
  version: 1;
  step: number;
  branch: YumeBranch;
  userData: YumeUserData;
  messages: StoredChatMessage[];
  isTerminated: boolean;
  isComplete: boolean;
  privacyNoCount: number;
  yesNoFailCount: number;
  submitRetryCount: number;
};

export const YUME_SESSION_KEY = "oyasumi-yume-register-v1";

const EMPTY_USER: YumeUserData = {
  nomePg: "",
  email: "",
  password: "",
  playerPreferences: "",
};

export function loadYumeSession(): YumeRegisterSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(YUME_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as YumeRegisterSession;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveYumeSession(session: YumeRegisterSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(YUME_SESSION_KEY, JSON.stringify(session));
}

export function clearYumeSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(YUME_SESSION_KEY);
}

export function createFreshSession(): YumeRegisterSession {
  return {
    version: 1,
    step: 0,
    branch: null,
    userData: { ...EMPTY_USER },
    messages: [],
    isTerminated: false,
    isComplete: false,
    privacyNoCount: 0,
    yesNoFailCount: 0,
    submitRetryCount: 0,
  };
}

const YES_RE = /\b(s[iìí]|[yY]es|certo|confermo|conferma|esatto|proprio\s+cos[iì]|tutto\s+giusto)\b/;
const NO_RE = /\b(no|nope|nah|negativo|non\s+sono|non\s+ho|correggi)\b/;

export function parseYesNo(input: string): "yes" | "no" | null {
  const t = input.trim().toLowerCase();
  if (!t) return null;
  if (t === "sì" || t === "si") return "yes";
  const hasYes = YES_RE.test(t);
  const hasNo = NO_RE.test(t);
  if (hasYes && !hasNo) return "yes";
  if (hasNo && !hasYes) return "no";
  return null;
}

export function isContinuationInput(input: string): boolean {
  const t = input.trim().toLowerCase();
  return t === "" || t === "ok" || t === "...";
}

export function isAffirmativeDreamAnswer(input: string): boolean {
  const t = input.trim().toLowerCase();
  if (!t || t === "...") return false;
  if (NO_RE.test(t)) return false;
  return true;
}

const NAME_RE = /^[\p{L}\p{M}'’\-\s.·]{2,30}$/u;

export function validateCharacterName(input: string): "ok" | "empty" | "invalid" {
  const t = input.trim();
  if (!t) return "empty";
  if (!NAME_RE.test(t)) return "invalid";
  return "ok";
}

export function validateEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim());
}
