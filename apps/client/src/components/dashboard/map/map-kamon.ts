/**
 * Kamon SVG mockup per regione selezionata (simboli di casato stilizzati).
 */
import type { GameMapId } from "@/config/map-config";

const STROKE = "#8a7343";
const FILL = "rgba(94, 77, 39, 0.35)";
const VIOLET = "#b832b8";

export function kamonSvg(id: GameMapId): string {
  switch (id) {
    case "ogon":
      // Cerchio + tre petali (stile mon)
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="${STROKE}" stroke-width="1.2" opacity="0.85"/>
        <circle cx="32" cy="32" r="10" fill="${FILL}" stroke="#ffd700" stroke-width="1" opacity="0.9"/>
        <path d="M32 8 L36 24 L32 22 L28 24 Z" fill="#ffd700" opacity="0.75"/>
        <path d="M52 42 L36 36 L38 32 L36 28 Z" fill="#ffd700" opacity="0.75"/>
        <path d="M12 42 L28 36 L26 32 L28 28 Z" fill="#ffd700" opacity="0.75"/>
      </svg>`;
    case "izayoi":
      // Luna crescente
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="${STROKE}" stroke-width="1.2" opacity="0.7"/>
        <path d="M38 12a20 20 0 1 0 0 40 16 16 0 0 1 0-40z" fill="${VIOLET}" opacity="0.55"/>
        <path d="M38 12a20 20 0 1 0 0 40 16 16 0 0 1 0-40z" fill="none" stroke="#c9a0ff" stroke-width="1"/>
      </svg>`;
    case "onimori":
      // Corna / triangolo
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="${STROKE}" stroke-width="1.2" opacity="0.7"/>
        <path d="M32 14 L48 48 H16 Z" fill="rgba(74,21,75,0.5)" stroke="${VIOLET}" stroke-width="1.2"/>
        <circle cx="32" cy="36" r="4" fill="#ffd700" opacity="0.7"/>
      </svg>`;
    case "ezochi":
      // Fiocco / nord
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="${STROKE}" stroke-width="1.2" opacity="0.7"/>
        <path d="M32 10 L34 30 L32 28 L30 30 Z M32 54 L34 34 L32 36 L30 34 Z
                 M10 32 L30 34 L28 32 L30 30 Z M54 32 L34 34 L36 32 L34 30 Z"
              fill="#ffd700" opacity="0.8"/>
        <circle cx="32" cy="32" r="5" fill="${FILL}" stroke="#8a7343" stroke-width="1"/>
      </svg>`;
    case "altrove":
    default:
      return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="none" stroke="${STROKE}" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.7"/>
        <circle cx="32" cy="32" r="8" fill="none" stroke="${VIOLET}" stroke-width="1.5" opacity="0.8"/>
        <circle cx="32" cy="32" r="2" fill="#ffd700"/>
      </svg>`;
  }
}
