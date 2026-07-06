# Roadmap Oyasumi 2.0

> **Ultimo aggiornamento:** Luglio 2026 (housing rent/locatario + Shakai UI Professione)  
> **Uso:** vista unica per stato progetto e priorità. Le regole di gioco restano nelle **spec** (non duplicate qui).

## Legenda

| Simbolo | Significato |
|---------|-------------|
| ✅ | Completato e in produzione / main |
| 🟡 | Parziale — funziona ma con gap noti |
| 🔲 | Da fare |
| 📄 | Solo contenuto / copy (nessun codice richiesto) |

## Spec di riferimento (fonte di verità meccaniche)

| Area | Documento |
|------|-----------|
| Contesto prodotto | `OYASUMI_CONTEXT.md` |
| Layout dashboard | `GAME_LAYOUT_SPEC.md` |
| Mappe & chat | `MAP_AND_CHAT_SPEC.md` |
| Combattimento | `COMBAT_SPEC.md`, `CHRONO_STACK.md`, `WAZA_CALCOLI.md` |
| Sōkaiju | `Oyasumi_Sokaiju_Spec_Cursor.md` |
| Economia oggetti | `ECONOMY_ITEMS_SPEC.md`, `ITEMS_IMPLEMENTATION_SPEC.md` |
| Shakai Kaikyū | `SHAKAI_KAIKYU_SPEC.md` |
| Quest & Fetch | `QUEST_AND_FETCH_SPEC.md` |
| Mobile | `OYASUMI_LITE_SPEC.md` |
| Gradi & livelli | `GRADI_SPEC.md`, `LEVELING_DESIGN.md` |

---

## 1. Piattaforma & infrastruttura

| Voce | Stato | Note |
|------|-------|------|
| Monorepo Bun + Elysia + Next.js | ✅ | `apps/server`, `apps/client`, `packages/domain` |
| PostgreSQL + Drizzle | ✅ | Neon in prod; `db:push` per schema |
| Deploy server (Render) + client (Vercel) | ✅ | API `o-prototype.onrender.com` |
| Email transazionale | ✅ | Resend in cloud, Gmail in locale; registrazione + reset password |
| Cloud / mobile worker Cursor | ✅ | `AGENTS.md`, `scripts/cloud-agent-*.sh` |
| CI verify dominio | ✅ | `scripts/cloud-agent-verify.sh`, vitest `packages/domain` |

---

## 2. Account, auth & onboarding

| Voce | Stato | Note |
|------|-------|------|
| Registrazione chat Yume-chan (copione v2) | ✅ | 12 step, rami novice/veteran, sessionStorage, auto-login |
| Preferenze iscrizione su profilo utente | ✅ | `users.player_preferences`; visibili in Gestione |
| Verifica unicità nome PG | ✅ | `GET /auth/check-character-name` |
| Login Nome PG + password | ✅ | Email solo per recupero |
| Reset password (token 1h) | ✅ | `/auth/forgot-password`, `/auth/reset-password` |
| Landing Dark Arcane | ✅ | Login, Guida, Ambientazione, Privacy, Principia Satirica |
| Scelta ordine al grado Hakyō | 🟡 | UI permette ordine subito; regola lore = solo a Hakyō — da allineare |
| Onboarding post-registrazione | 🟡 | Profilo in Scheda; niente wizard dedicato |

---

## 3. Dashboard UI & mobile (Oyasumi Lite)

| Voce | Stato | Note |
|------|-------|------|
| Layout tre colonne + dock finestre | ✅ | `GAME_LAYOUT_SPEC` |
| Mini-profilo, SMS, Media, News Visor | ✅ | Dati reali dove previsto |
| Mappe gerarchiche + chat per location | ✅ | `map-config` + admin map editor |
| Lista Presenti real-time | ✅ | WebSocket presence |
| Meteo per prefettura | ✅ | API `/meteo` |
| Calendario eventi | ✅ | CRUD Gestione → widget dashboard |
| Oyasumi Lite (mobile) | 🟡 | `DashboardMobileLayout`, bottom nav, limite 500 char chat |
| PWA / notifiche push | 🔲 | Non implementato |
| Audit visivo vs vecchio OYASUMI | 🔲 | Checklist gap residui (background, spaziature) |

---

## 4. Chat, narrazione & presenza

| Voce | Stato | Note |
|------|-------|------|
| WebSocket chat per room | ✅ | Persistenza `zone_messages` |
| Parser parlati / tag narrativi | ✅ | EXP da caratteri netti |
| Messaggi globali & masterscreen | ✅ | Stili Admin / Shinigami |
| Shadowban (chat + presence) | ✅ | Non persist/broadcast; presenti con indicatore ambra |
| Dadi in chat (`/d`, `/dado`, legacy `[dado:]`) | ✅ | `DICE_SPEC.md` |
| Rate limit & anti-spam | ✅ | 10 msg/60s, max 2000 char |
| Log chat (Gestione) | ✅ | Filtro room + data |
| Guida comandi in chat | ✅ | `ChatInfoPanel` |

---

## 5. Combattimento in chat

| Voce | Stato | Note |
|------|-------|------|
| Motore domain v3 (IR, CS, Tier, pipeline) | ✅ | `packages/domain/src/combat/` |
| Pannello lancio waza | ✅ | `WazaLaunchPanel`, tag `[waza]`, `[hit:1]`, CS automatico |
| Sōkaiju in combattimento | ✅ | Kongen, Gojū, Shōdō, Eiga, Chikō, Seimitsu, Hikan, Jikai |
| Status engine (17 status) | ✅ | Emotivi, elementali, atipici |
| Costrutti & scudi sul campo | ✅ | `field_constructs`, API Master |
| Automazione waza avanzate (Hadō, Naikan, …) | 🟡 | ~25 hook; Giurisdizione/Chokurei enforcement incompleti |
| Tracker quarti 4/4 in UI | ✅ | `QuarterTurnHud` (narrativo, non validato server) |
| Validazione CS/quarti lato server | 🔲 | Opzionale — oggi Master + giocatori |

---

## 6. Skiru, progressione & scheda PG

| Voce | Stato | Note |
|------|-------|------|
| Catalogo Skiru (54 nodi) + albero UI | ✅ | `SchedaSkiruPage`, rombi `SkiruTreeView` |
| API `GET/PATCH /characters/me/skiru` | ✅ | EXP spendibile, anti-cheat |
| Parametri derivati (HP, Mitigazione, Movimento) | ✅ | Da Dokusei, Itami, Konjou, Undō |
| Leveling 1–50 + Paragon | ✅ | Key da tabella, banner level-up, WS `level_up` |
| Slot passivi waza (2→6 con EXP) | ✅ | `passive-slots` |
| Esagono stili + sblocco Key | ✅ | `StyleHexagonPanel` |
| Milestone Jiga no Shihaisha | ✅ | Richiesta Premio → staff |
| Scheda pubblica / censura per ruolo | ✅ | `GET /characters/:id/public` |
| Migrazione stats legacy F/C/D/M/E | 🟡 | Script eseguito; colonne DB ancora presenti |
| Rimozione Gems UI/legacy | 🟡 | UI pulita; colonna DB deprecata |

---

## 7. Waza, stili, Madoshō & contenuto

| Voce | Stato | Note |
|------|-------|------|
| Pool Dō (6 vie, ~112 waza) | ✅ | Sync `sync-waza-manual` |
| Waza generiche (~34) | ✅ | Acquisto senza Esagono |
| Madoshō (6 lignaggi, ~66 waza) | ✅ | Scelta via Richieste staff |
| Ordine + Oni no Mori (starter) | ✅ | Pool + classifier |
| Meccaniche stile (Tōrō, Gosa, Tensione, …) | ✅ | Tracker in scheda + domain |
| Acquisto waza EXP + `WazaDoBrowser` | ✅ | Vincoli Esagono / keystone |
| Bestiario (Holic, Phobias, Muen) | ✅ | CRUD Gestione |
| Skill shop legacy `POST /me/skills` | 🟡 | Sostituito in gran parte da acquisto waza |
| Automazione contenuto batch 3+ generiche | 🟡 | Scudi avanzati, emanazioni extra |
| Meccaniche lignaggio (Gōkaon, Hataori, Ikiryō) | 🟡 | Lore + waza in pool; runtime narrativo parziale |
| Pannello authoring effetti unificato | 🔲 | Consolidare `WazaInsertionTool` + registry effetti |
| Tier esplicito in authoring (non da CS) | 🔲 | Oggi inferito in sync |

---

## 8. Economia oggetti & mercato

| Voce | Stato | Note |
|------|-------|------|
| Schema oggetti (6 categorie, integrità, firma) | ✅ | Domain + DB |
| Drop in chat (`/drop`, `/prendi`) | ✅ | `drop` module |
| Inventario 5 slot + zaini + housing | ✅ | |
| API mercato (Banco + Piazza 10%) | ✅ | `market` module |
| API smantellamento Artigiano | ✅ | Gate `social_class === shokunin` o Skiru `shokunin ≥ 1` (legacy) |
| UI scheda oggetto (categorie, integrità, origine) | ✅ | |
| UI sezione MARKET in inventario | ✅ | WS `inventory_updated` |
| **Pannello Mercato** (Banco + Piazza + Immobiliare) | ✅ | `MercatoPanel` nel dock |
| **Pannello Smantellamento** Artigiano | ✅ | Tab Officina in Mercato + sezione Strumento in Scheda Professione |
| Catalogo mercato da DB + CRUD Gestione | ✅ | `GET /market/catalog`, `MarketCatalogManagement` in Sviluppo |
| Baratto Piazza | 🔲 | Rimandato |

---

## 9. Shakai Kaikyū (classi sociali)

| Voce | Stato | Note |
|------|-------|------|
| Spec + catalogo 5×5 sottoclassi | ✅ | `SHAKAI_KAIKYU_SPEC.md`, domain |
| Blueprint catalog (~70 ricette) | ✅ | `blueprint-catalog.ts` |
| Schema DB (`social_class`, sheet, daily usage) | ✅ | `characters.social_class`, `social_subclass_sheet`, tabella `social_class_daily_usage`; `db:push` eseguito |
| API scelta classe + albero XP | ✅ | `GET/POST /characters/me/social-class`, `PATCH /characters/me/social-subclass`; `shakai.service` |
| UI scelta classe + sottoclassi in scheda | ✅ | Tab **Professione** in Scheda; `SocialClassChoiceBanner` + `SchedaProfessionePage` |
| Tool ×5 (Medico, Artigiano, Cacciatore, Politico, Sacerdote) | 🟡 | Medico + Artigiano + Cacciatore (battuta) ✅; Politico/Sacerdote placeholder |
| Sync blueprint in DB + craft generico | 🔲 | |
| Moderazione cambio classe (staff) | ✅ | `PATCH /admin/characters/:id/social-class` |

---

## 10. Quest, Fetch & Shinigami

| Voce | Stato | Note |
|------|-------|------|
| Creazione / pausa / premiazione quest | ✅ | `/shinigami`, chat tools |
| Fetch: bacheca, assegnazione, requisiti | ✅ | Widget + finestra Fetch |
| Premio auto >4 azioni, limiti frequenza | ✅ | |
| Responso Master + notifiche sistema | ✅ | `system_notifications`, WS |
| Classifica Master & Lore (pannello full) | ✅ | |
| Registra Giocata collegata a fetch | ✅ | `fetchId` su partecipante |

---

## 11. Housing & sim-life

| Voce | Stato | Note |
|------|-------|------|
| Daily tick stipendio (+20 REM) | ✅ | |
| Affitto mensile, solleciti, sfratto | ✅ | `housing-monthly-rent.service`, SMS Locatario (`rent-reminder`) |
| Catalogo immobiliare (formato Market) | ✅ | `housing-catalog.ts`, seed + tab Immobiliare |
| Entra in casa / chat privata abitazione | ✅ | Da scheda PG |
| Armadio casa + rubare (ospiti) | ✅ | |
| Gestione ospiti (inviti owner) | ✅ | |
| Richieste ospite (knock → approvazione) | 🔲 | Oggi solo inviti espliciti |
| Cap ospiti per casa | 🔲 | Illimitato |

---

## 12. Forum & community

| Voce | Stato | Note |
|------|-------|------|
| Forum (bacheche, topic, post, BBCode) | ✅ | Integrato dashboard |
| Moderazione (pin, lock, delete) | ✅ | Admin/Mod/Capo |
| Gestione sezioni/bacheche | ✅ | Pannello Gestione |
| News Visor ← ultimi topic | ✅ | |

---

## 13. Gestione staff

| Voce | Stato | Note |
|------|-------|------|
| Utenti (ruolo, ban, sanzioni, elimina) | ✅ | |
| Richieste PG (Madoshō, ordine, Tenkan, …) | ✅ | Tab Richieste |
| Mappe, eventi, banner, musica, log | ✅ | |
| Bestiario CRUD | ✅ | |
| Preferenze iscrizione Yume (lettura) | ✅ | Da `player_preferences` |
| Catalogo mercato (equip/junk Banco) | ✅ | `MarketCatalogManagement` in Sviluppo |

---

## 14. Prossimi step (ordine consigliato)

| # | Area | Task | Dipendenze |
|---|------|------|------------|
| 1 | Shakai | Tool **Politico** (Registro Patti) | Cacciatore battuta ✅ |
| 2 | Shakai | Tool **Sacerdote** (Reliquiario + Ofuda) | Politico |
| 3 | Shakai | Sync blueprint in DB + craft generico | Blueprint catalog domain ✅ |
| 4 | Combattimento | Enforcement Giurisdizione / Chokurei / Nagori completo | Domain |
| 5 | Onboarding | Bloccare ordine fino a grado Hakyō (se richiesto lore) | Gradi |
| 6 | Contenuto | Pannello authoring effetti (Fase 1 consolidamento) | Tester |
| 7 | Mobile | Notifiche push SMS/chat | Infrastruttura |

---

## 15. Debito tecnico & backlog

| Voce | Priorità | Note |
|------|----------|------|
| Colonne legacy `gems`, stats F/C/D/M/E | Bassa | Dopo migrazione completa PG a `skiru_sheet` |
| `DICE_SPEC.md` vs manuale (no dadi) | Bassa | Dadi restano feature chat; documentare convivenza |
| Tier waza inferito da CS in sync | Media | Allineare authoring a tier esplicito |
| Registry effetti unificato waza ↔ status | Media | Evitare logica sparsa in `waza-chat-automation` |
| Seed `levels`/`grades` a 60 livelli | Bassa | Se re-seed necessario |
| Dominio email `oyasumi.staff` su Resend | Bassa | Cambio `EMAIL_FROM` quando DNS verificato |

---

## Manutenzione

- Aggiornare questa roadmap quando si chiude un blocco significativo (commit/PR).
- Per implementare una regola di gioco: leggere la **spec** dell’area, poi il codice in `packages/domain`.
- Tester meccaniche: `apps/tester` + `bunx vitest run packages/domain/src/**/*.test.ts`.
