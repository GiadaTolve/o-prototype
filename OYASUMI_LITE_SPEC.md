# Oyasumi Lite — Interfaccia Mobile v1

> **Scope v1:** Interfaccia mobile-first per giocare da smartphone. Non sostituisce la dashboard desktop, ma la semplifica su schermi piccoli.

---

## 1. Obiettivi

- **Navigazione rapida** tramite bottom nav invece del layout a tre colonne
- **Funzionalità prioritarie** accessibili in 1-2 tap: Scheda, SMS, Chat, Bacheca Fetch
- **Chat full-screen** quando aperta; mappa/lista zone compatta
- **Stile Dark Arcane** coerente con il progetto

---

## 2. Tab Bottom Navigation (v1)

| Tab | Icona | Contenuto |
|-----|-------|------------|
| **Scheda** | User | Mini-scheda (nome, avatar, REM, Body/Jigoka) + link "Apri scheda completa" |
| **SMS** | Message | Lista conversazioni + apertura thread (come desktop ma full-screen) |
| **Mappa** | Map | Mappa root → zone → lista chat → Chat full-screen |
| **Fetch** | Beeper | Bacheca fetch disponibili + "Le tue fetch concluse" |
| **Altro** | Ellipsis/Grid | Menu: Shop, Banca, Waza, Presenti, Notifiche, Logout |

---

## 3. Comportamento

### Scheda tab
- Mostra mini-profilo compatto
- Pulsante **"Entra in Casa"** se si ha un'abitazione (`/housing/me` → `chatRoomId`)
- Altrimenti pulsante **Housing** (affitto/gestione)
- Tap profilo → apre finestra Scheda (modal full-screen su mobile)

### SMS tab
- Lista conversazioni (come colonna sinistra desktop)
- Tap conversazione → thread full-screen
- Input **500 caratteri** con contatore

### Mappa tab
- Vista iniziale: mappa root con pin ed etichette visibili
- Tap zona → lista chat della zona
- Tap chat → Chat full-screen (layout compatto)
- Pulsante **Luogo/Chat** in header; bottom nav nascosta in chat immersiva
- **Combattimento nascosto** su mobile (no `ChatCombatPanel`)
- Input chat: Luogo + azione in colonna, max **500 caratteri**, no HUD turni/quarti

### Fetch tab
- UI Beeper (pager anni 80)
- Sezione "Le tue fetch concluse"
- Tap "Accetta" → azione come desktop
- Badge tab se fetch in arrivo non assegnate

### Altro tab
- Griglia di pulsanti: Mercato, Banca, Waza, Ordine, Bestiario, Presenti, Spazio Eventi, Notifiche
- **Logout** in fondo alla griglia (+ icona in header)

---

## 4. Rilevamento Mobile

- `useIsMobile()`: viewport ≤768px **oppure** UA mobile con larghezza ≤1024px
- Se `isMobile` → render `DashboardMobileLayout`
- Se desktop → layout attuale (tre colonne + dock)

---

## 5. Limiti e vincoli

- **500 caratteri** per messaggi chat e SMS da mobile (client-side `maxLength`)
- Nessun pannello combattimento su mobile
- `viewport-fit: cover` + `safe-area-inset` per bottom nav su iPhone
- Shell `100dvh` con bottom nav **nel flusso** (no `fixed` + padding doppio) — evita scroll pagina in PWA

---

## 6. Stato implementazione (v1)

| Voce | Stato |
|------|--------|
| Bottom nav 5 tab | ✅ |
| SMS inline stack | ✅ |
| Beeper / Fetch pager | ✅ |
| Mappa stack + chat immersiva | ✅ |
| Chat mobile (layout, no combat) | ✅ |
| Scheda + Entra in Casa | ✅ |
| Altro + Logout | ✅ |
| Badge SMS / Beeper | ✅ |
| Safe area iPhone | ✅ |
| Limite 500 char chat mobile | ✅ |
| Deploy marker build in header | ✅ |

### Prossimi step (fuori scope v1 minimo)

- Validazione server 500 char per UA mobile (oggi solo client)
- `docs/DEPLOY.md` + pipeline deploy client automatico
- Polish accessibilità e `prefers-reduced-motion` su animazioni tab

---

## 7. Riferimenti

- `useIsMobile` in `hooks/useIsMobile.ts`
- `DashboardMobileLayout.tsx` — layout Lite
- `DashboardCenter.tsx` — mappa e chat (`variant="mobile"`)
- `GAME_LAYOUT_SPEC.md` per palette e stili
