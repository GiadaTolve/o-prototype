"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";
import { getDevicePayload } from "@/lib/device-fingerprint";
import { hasSessionHint } from "@/lib/auth-session";

const SESSION_KEY = "oyasumi-session-ip-ping";

/** Una volta per sessione browser: segnala IP + device fingerprint al server. */
export function SessionIpPing() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!hasSessionHint()) return;
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
    } catch {
      /* private mode */
    }

    const device = getDevicePayload();
    void api
      .post("/auth/session-ping", device)
      .then(() => {
        try {
          sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        /* best-effort */
      });
  }, []);

  return null;
}
