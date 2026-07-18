"use client";

import { Suspense } from "react";
import SokaijuPageContent from "./SokaijuPageContent";

function SokaijuFallback() {
  return (
    <div className="min-h-full bg-[var(--panel-bg)] flex items-center justify-center">
      <p className="text-gray-400 text-sm">Caricamento…</p>
    </div>
  );
}

export default function SokaijuRoutePage() {
  return (
    <Suspense fallback={<SokaijuFallback />}>
      <SokaijuPageContent />
    </Suspense>
  );
}
