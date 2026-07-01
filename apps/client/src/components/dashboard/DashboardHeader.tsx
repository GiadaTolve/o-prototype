"use client";

import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { icons } from "@/lib/icons";

const PUBLIC_LINKS = [
  { href: "/guida", label: "Guida" },
  { href: "/ambientazione", label: "Ambientazione" },
  { href: "/forum", label: "Forum" },
] as const;

const RESTRICTED_LINKS = [
  { href: "/gestione", label: "Pannello Gestionale", key: "gestione" as const },
  { href: "/shinigami", label: "Shinigami", key: "shinigami" as const },
] as const;

type Props = {
  onGoToMap?: () => void;
  onOpenShinigami?: () => void;
  onOpenGuida?: () => void;
  onOpenAmbientazione?: () => void;
  onOpenForum?: () => void;
  onOpenGestione?: () => void;
  canAccessGestione?: boolean;
  canAccessShinigami?: boolean;
  /** Notifica SMS: mostra "*drin drin!*" quando arriva un nuovo messaggio */
  smsNotification?: boolean;
};

export function DashboardHeader({
  onGoToMap,
  onOpenShinigami,
  onOpenGuida,
  onOpenAmbientazione,
  onOpenForum,
  onOpenGestione,
  canAccessGestione,
  canAccessShinigami,
  smsNotification = false,
}: Props) {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/auth");
  };

  const restricted = RESTRICTED_LINKS.filter(({ key }) =>
    key === "gestione" ? canAccessGestione : canAccessShinigami
  );
  const links = [...PUBLIC_LINKS, ...restricted];

  const handleLinkClick = (key: string | undefined, href: string) => {
    // Se abbiamo callback specifici, usali invece del Link
    if (key === "shinigami" && onOpenShinigami) {
      onOpenShinigami();
      return;
    }
    if (key === "gestione" && onOpenGestione) {
      onOpenGestione();
      return;
    }
    if (href === "/guida" && onOpenGuida) {
      onOpenGuida();
      return;
    }
    if (href === "/ambientazione" && onOpenAmbientazione) {
      onOpenAmbientazione();
      return;
    }
    if (href === "/forum" && onOpenForum) {
      onOpenForum();
      return;
    }
    // Fallback: navigazione normale
    router.push(href);
  };

  return (
    <header
      className="border-b border-[var(--border-color)] backdrop-blur-sm sticky top-0 z-20"
      style={{
        backgroundImage: "linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.85)), url('/backgrounds/cloudy.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 max-w-[1800px] mx-auto">
        <div className="flex items-baseline gap-4">
          <h1
            className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-[var(--accent-gold)]"
            style={{ textShadow: "0 0 12px rgba(212,175,55,0.5)" }}
          >
            OYASUMI
          </h1>
          <span className="text-gray-500 text-sm hidden sm:inline">— Protocollo onirico</span>
        </div>
        <nav className="flex flex-wrap items-center gap-2 md:gap-4">
          {smsNotification && (
            <span className="text-[var(--accent-gold)] text-sm italic animate-pulse">*drin drin!*</span>
          )}
          {onGoToMap && (
            <button
              type="button"
              onClick={onGoToMap}
              className="text-xs md:text-sm uppercase tracking-wider text-gray-400 hover:text-[var(--accent-gold)] transition-colors px-2 py-1 flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={icons.map} className="w-3.5 h-3.5" />
              Mappa
            </button>
          )}
          {links.map((link) => {
            const linkKey = 'key' in link ? link.key : undefined;
            return (
              <button
                key={link.href}
                type="button"
                onClick={() => handleLinkClick(linkKey, link.href)}
                className="text-xs md:text-sm uppercase tracking-wider text-gray-400 hover:text-[var(--accent-gold)] transition-colors px-2 py-1"
              >
                {link.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="text-xs md:text-sm uppercase tracking-wider text-gray-400 hover:text-red-400 transition-colors px-2 py-1 flex items-center gap-1.5"
          >
            <FontAwesomeIcon icon={icons.logout} className="w-3.5 h-3.5" />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
