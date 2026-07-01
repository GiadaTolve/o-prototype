# Stato Priorità e Fetch System

> **Ultimo aggiornamento:** Marzo 2026

---

## Priorità Alta (Fase 1.5)

| Task | Stato |
|------|-------|
| **Rubare oggetti** | ✅ Fatto — API `/housing/steal-item`, pulsante "Ruba" per ospiti in ArmadioCasa |
| **Background images** | ✅ cloudy.png, darkstone.png in uso. Cartella OYASUMI (vecchio progetto) rimossa. |
| **Stili chat** | ✅ Colori allineati (#60519b parlati, #bfc0d1 tag) |

---

## Fetch System

| Componente | Stato |
|------------|-------|
| Premio automatico >4 azioni | ✅ `rewardFetchParticipants()` in `closeGameSession()` |
| Limiti frequenza (limitPerDay/Week) | ✅ `checkFrequencyLimits()` in `assignFetchToSelf()` |
| Responso Fetch | ✅ Stato AWAITING_REWARD → COMPLETED, UI + commento Shinigami |
| Requisiti in form creazione | ✅ Liv. min/max, Ordine, limiti frequenza (pagina Shinigami + ShinigamiContent) |
| Premi in form creazione | ✅ min azioni, REM, EXP |
| Requisiti e premi in bacheca | ✅ Visibili prima di "Assegna a me" |
| Fetch concluse rimosse | ✅ Escluse da `listApprovedFetches()` |
| Concluse con Partecipanti | ✅ Sezione "Le tue fetch concluse", `GET /fetches/my/concluded` |
| Notifica sistema al responso | ✅ `system_notifications`, WebSocket `fetch_responso`, Toast |
| gradeIds / plotIds nei requisiti | ✅ Form con selezione Gradi e Trame (Shinigami page + ShinigamiContent) |

---

## Notifiche di Sistema

- **Tabella:** `system_notifications` (schema Drizzle in `schema.ts`)
- **Creazione:** `createSystemNotification(characterId, "fetch_responso", { title, content })` al responso fetch
- **API:** `GET /notifications`, `POST /notifications/:id/read`
- **Migrazione:** `bun run scripts/add-system-notifications.ts` se tabella non esiste

---

## Riferimenti

- **QUEST_AND_FETCH_SPEC.md** — Specifica completa
- **ROADMAP_CONTEXT.md** — Roadmap generale
