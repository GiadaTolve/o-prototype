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
| **Fetch** | Trophy | Bacheca fetch disponibili + "Le tue fetch concluse" |
| **Altro** | Ellipsis/Grid | Menu: Shop, Banca, Waza, Presenti, Notifiche, Logout |

---

## 3. Comportamento

### Scheda tab
- Mostra mini-profilo compatto
- Pulsante "Entra in Casa" se si ha un'abitazione
- Tap → apre finestra Scheda (modal full-screen su mobile)

### SMS tab
- Lista conversazioni (come colonna sinistra desktop)
- Tap conversazione → thread full-screen
- Input 500 caratteri (limite mobile già attivo)

### Mappa tab
- Vista iniziale: mappa root con pin (compatta)
- Tap zona → lista chat della zona
- Tap chat → Chat full-screen (layout split semplificato)
- Pulsante "←" per tornare indietro

### Fetch tab
- Lista fetch disponibili (come widget destro desktop)
- Sezione "Le tue fetch concluse"
- Tap "Assegna a me" → azione come desktop

### Altro tab
- Griglia di pulsanti: Shop, Banca, Waza, Ordine, Bestiario, Presenti, Notifiche
- Logout in basso

---

## 4. Rilevamento Mobile

- `useIsMobile()`: `max-width: 768px` + touch/UA
- Se `isMobile` → render `DashboardMobileLayout`
- Se desktop → layout attuale (tre colonne + dock)

---

## 5. Limiti già attivi

- **500 caratteri** per messaggi da mobile (rate limiting)
- Nessun cambiamento alla logica backend

---

## 6. Riferimenti

- `useIsMobile` in `hooks/useIsMobile.ts`
- `GAME_LAYOUT_SPEC.md` per palette e stili
- `DashboardCenter`, `DashboardLeftCol`, `DashboardRightCol` come fonti componenti riutilizzabili
