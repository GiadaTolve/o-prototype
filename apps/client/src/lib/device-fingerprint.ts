/**
 * Fingerprint dispositivo leggero (Supervisione).
 * - deviceId: UUID persistente in localStorage (stesso profilo browser)
 * - signalHash: hash soft di UA/lingua/timezone/schermo (segnalazione, non prova)
 */

const DEVICE_KEY = "oyasumi-device-id";

function uuidv4(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(DEVICE_KEY)?.trim();
    if (existing && existing.length >= 8) return existing;
    const id = uuidv4();
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch {
    return uuidv4();
  }
}

/** Hash djb2 esadecimale — leggero, non crittografico. */
function djb2Hex(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export function getLightSignalHash(): string {
  if (typeof window === "undefined") return "";
  try {
    const parts = [
      navigator.userAgent || "",
      navigator.language || "",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      String(window.devicePixelRatio || 1),
      navigator.platform || "",
    ];
    return djb2Hex(parts.join("|"));
  } catch {
    return "";
  }
}

export function getDevicePayload(): { deviceId: string; signalHash: string } {
  return {
    deviceId: getOrCreateDeviceId(),
    signalHash: getLightSignalHash(),
  };
}
