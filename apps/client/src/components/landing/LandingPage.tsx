"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingLoginForm } from "./LandingLoginForm";
import { LandingRegisterForm } from "./LandingRegisterForm";
import { LandingInfoModal } from "./LandingInfoModal";
import "./landing.css";

type View = "LOGIN" | "REGISTER";
type Modal = "GUIDE" | "LORE" | null;

export function LandingPage({ initialView = "LOGIN" }: { initialView?: View }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<View>(initialView);
  const [activeModal, setActiveModal] = useState<Modal>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);

  const closeModal = () => setActiveModal(null);

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
              onClick={() => setActiveModal("GUIDE")}
            >
              Guida
            </button>
            <button
              type="button"
              className={`landing-nav-btn${activeModal === "LORE" ? " is-active" : ""}`}
              onClick={() => setActiveModal("LORE")}
            >
              Ambientazione
            </button>
          </nav>
        </header>

        <div className="landing-panel">
          {activeModal === "GUIDE" ? (
            <LandingInfoModal kind="guida" onClose={closeModal} />
          ) : activeModal === "LORE" ? (
            <LandingInfoModal kind="ambientazione" onClose={closeModal} />
          ) : activeView === "REGISTER" ? (
            <LandingRegisterForm
              onRegisterSuccess={() => setActiveView("LOGIN")}
              onOpenGuida={() => setActiveModal("GUIDE")}
              onOpenLore={() => setActiveModal("LORE")}
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
