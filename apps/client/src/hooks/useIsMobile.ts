import { useState, useEffect } from "react";

const MOBILE_MQ = "(max-width: 768px)";
const TABLET_MQ = "(max-width: 1280px)";
const SHORT_VIEWPORT_MQ = "(max-height: 520px)";
const MOBILE_UA_RE = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

function detectMobile(): boolean {
  if (typeof window === "undefined") return false;

  const isSmallScreen = window.matchMedia(MOBILE_MQ).matches;
  const isTabletWide = window.matchMedia(TABLET_MQ).matches;
  const isShortViewport = window.matchMedia(SHORT_VIEWPORT_MQ).matches;
  const ua = (navigator.userAgent || navigator.vendor || "").toLowerCase();
  const isMobileUA = MOBILE_UA_RE.test(ua);
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;

  // Schermo stretto → layout Lite.
  // Tablet / iPad landscape e viewport bassi → Lite o stack scrollabile (evita sidebar tagliate).
  return (
    isSmallScreen ||
    (isMobileUA && isTabletWide) ||
    (coarsePointer && isTabletWide) ||
    (isShortViewport && isTabletWide)
  );
}

/**
 * Rileva dispositivo mobile per Oyasumi Lite (bottom nav, mappa compatta).
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => detectMobile());

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const tabletMq = window.matchMedia(TABLET_MQ);
    const shortMq = window.matchMedia(SHORT_VIEWPORT_MQ);
    const coarseMq = window.matchMedia("(pointer: coarse)");
    const update = () => setIsMobile(detectMobile());

    update();
    mq.addEventListener("change", update);
    tabletMq.addEventListener("change", update);
    shortMq.addEventListener("change", update);
    coarseMq.addEventListener("change", update);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      mq.removeEventListener("change", update);
      tabletMq.removeEventListener("change", update);
      shortMq.removeEventListener("change", update);
      coarseMq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return isMobile;
}
