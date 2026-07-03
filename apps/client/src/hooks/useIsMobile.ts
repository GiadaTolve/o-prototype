import { useState, useEffect } from "react";

const MOBILE_MQ = "(max-width: 768px)";
const MOBILE_UA_RE = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;

  const isSmallScreen = window.matchMedia(MOBILE_MQ).matches;
  const ua = (navigator.userAgent || navigator.vendor || "").toLowerCase();
  const isMobileUA = MOBILE_UA_RE.test(ua);

  // Schermo stretto → layout Lite (anche finestra desktop ridotta).
  // Su iPhone/iPad con "sito desktop" la viewport può superare 768px: usa UA + larghezza ragionevole.
  return isSmallScreen || (isMobileUA && window.innerWidth <= 1024);
}

/**
 * Rileva dispositivo mobile per Oyasumi Lite (bottom nav, mappa compatta).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => detectMobile());

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const update = () => setIsMobile(detectMobile());

    update();
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobile;
}
