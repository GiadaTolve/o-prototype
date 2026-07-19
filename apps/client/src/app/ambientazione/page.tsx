"use client";

import { hasSessionHint } from "@/lib/auth-session";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WikiPage } from "@/components/wiki/WikiPage";

export default function AmbientazionePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = hasSessionHint();
    if (!token) {
      router.push("/auth");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="wiki-page-root h-full w-full flex items-center justify-center bg-[var(--panel-bg)]">
        <p className="text-gray-500">Caricamento...</p>
      </div>
    );
  }

  return (
    <div className="wiki-page-root h-full w-full overflow-hidden bg-[var(--panel-bg)]">
      <WikiPage kind="ambientazione" />
    </div>
  );
}
