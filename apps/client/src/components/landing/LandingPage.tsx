"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingLoginForm } from "./LandingLoginForm";
import { LandingRegisterForm } from "./LandingRegisterForm";
import { LandingInfoModal } from "./LandingInfoModal";
import { fetchAuthMe, hasSessionHint } from "@/lib/auth-session";
import "./landing.css";

type View = "LOGIN" | "REGISTER";
type Modal = "GUIDE" | "LORE" | "PRIVACY" | "PRINCIPIA" | null;

export function LandingPage({ initialView = "LOGIN" }: { initialView?: View }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>(initialView);
  const [activeModal, setActiveModal] = useState<Modal>(null);

  useEffect(() => {
    if (!hasSessionHint()) return;
    void fetchAuthMe().then((ok) => {
      if (ok) router.replace("/dashboard");
    });
  }, [router]);

  const closeModal = () => setActiveModal(null);

  const openModal = (modal: Modal) => setActiveModal(modal);

  return (
    <div className="landing-page">
      <div className="landing-background" aria-hidden />
      <div className="landing-overlay" aria-hidden />

      <div className="landing-wrapper">
        <header className="landing-header">
          <div className="landing-title-container">
            <div className="landing-gold-title">Oyasumi</div>
            <p className="landing-motto">LA REALTA&apos; E&apos; SOLO UN SOGNO CHE SANGUINA.</p>
          </div>

          <nav className="landing-nav" aria-label="Navigazione ingresso">
            <button
              type="button"
              className={`landing-nav-btn${activeView === "LOGIN" && !activeModal ? " is-active" : ""}`}
              onClick={() => {
                setActiveView("LOGIN");
                closeModal();
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`landing-nav-btn${activeView === "REGISTER" && !activeModal ? " is-active" : ""}`}
              onClick={() => {
                setActiveView("REGISTER");
                closeModal();
              }}
            >
              Iscriviti
            </button>
            <button
              type="button"
              className={`landing-nav-btn${activeModal === "GUIDE" ? " is-active" : ""}`}
              onClick={() => openModal("GUIDE")}
            >
              Guida
            </button>
            <button
              type="button"
              className={`landing-nav-btn${activeModal === "LORE" ? " is-active" : ""}`}
              onClick={() => openModal("LORE")}
            >
              Ambientazione
            </button>
          </nav>
        </header>

        <div className={`landing-panel${activeView === "REGISTER" ? " landing-panel--chat" : ""}`}>
          {activeModal === "GUIDE" ? (
            <LandingInfoModal kind="guida" onClose={closeModal} />
          ) : activeModal === "LORE" ? (
            <LandingInfoModal kind="ambientazione" onClose={closeModal} />
          ) : activeModal === "PRIVACY" ? (
            <LandingInfoModal kind="privacy" onClose={closeModal} />
          ) : activeModal === "PRINCIPIA" ? (
            <LandingInfoModal kind="principia" onClose={closeModal} />
          ) : activeView === "REGISTER" ? (
            <LandingRegisterForm
              onRegisterSuccess={() => {
                router.replace("/dashboard");
              }}
              onOpenGuida={() => openModal("GUIDE")}
              onOpenLore={() => openModal("LORE")}
              onOpenPrivacy={() => openModal("PRIVACY")}
              onOpenPrincipia={() => openModal("PRINCIPIA")}
              onOpenLogin={() => {
                closeModal();
                setActiveView("LOGIN");
              }}
            />
          ) : (
            <LandingLoginForm />
          )}
        </div>

        <footer className="landing-footer">
          <p>Crediti &amp; PEGI</p>
        </footer>
      </div>
    </div>
  );
}
