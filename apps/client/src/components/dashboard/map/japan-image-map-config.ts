/**
 * Config mappa immagine (Diablo/Watch Dogs style) — CRS.Simple + L.imageOverlay.
 * Sostituisci `/maps/mappa_giappone.jpg` con l’arte ad alta risoluzione.
 */

export const MAP_IMAGE_URL = "/maps/mappa_giappone.jpg";
/** Fallback finché non c’è il file custom (dev). */
export const MAP_IMAGE_FALLBACK_URL = "/maps/map-mondo.jpg";

/**
 * Dimensioni di riferimento dell’immagine (pixel).
 * All’avvio, se l’immagine carica, la mappa ricalcola i bounds dalle dimensioni reali.
 */
export const MAP_IMAGE_DEFAULT_SIZE = {
  width: 2048,
  height: 1120,
} as const;

export const MAP_ZOOM = {
  min: -1.25,
  max: 2.5,
  start: 0,
} as const;

/** Padding maxBounds (frazione) — evita di “uscire” dall’immagine. */
export const MAP_BOUNDS_PAD = 0.02;
