### ROADMAP DI SVILUPPO - OYASUMI 2.0

### ✅ FASE 0: Fondamenta (COMPLETATA)
- [x] **Setup Monorepo:** Configurazione Workspace (Bun, Elysia, PostgreSQL).
- [x] **Autenticazione:** Register/Login, gestione JWT e Security Services.
- [x] **DB Schema Base:** Tabella `Users`, `characters` e connessione Drizzle.
- [x] **Login Nome PG + Password:** Utente = PG; auth tramite nome personaggio (email solo per recupero).
- [x] **Recupero password:** Tramite email (`POST /auth/forgot-password`); placeholder, TODO invio reale.

### ✅ FASE 1: L'Origine (Identità & Grimoire) — COMPLETATA
*Obiettivo: Scheda Personaggio Completa, Motore Matematico e UI Base.*

- [x] **DB Update "Analista":** Schema `characters` con Stats (F, C, D, M, E), Valute (REM, EXP, Keys, Gems), UI Metadata (Avatar, Mini-Avatar, icone).
- [x] **Domain Math (Il Grimoire):** Formule "Quadro Momentaneo" (Body, Reflexes, Velocità, Jigoka) e moltiplicatore Y (`@domain/stats/calculator`).
- [x] **Layout "Dark Arcane":** Palette nero/oro/viola (#050508), font Cinzel + Inter, Header neon dorato, tre colonne, News Visor CRT (placeholder).
- [x] **Layout di Gioco (GAME_LAYOUT_SPEC):** Dashboard con Header (titolo + motto, Guida/Ambientazione/Forum/Gestione/Shinigami, Logout), colonna sinistra (Mini-Profilo, SMS, Media, News Visor), area centrale, colonna destra (Weather, Calendario, Lista Presenti), dock inferiore (solo finestre abbassate). Finestre: Scheda (da Mini-Profilo), Presenti Estesi (da Lista Presenti), Shop (da Media). Abbassare → dock; click dock → rialza.
- [x] **Onboarding Flow:** Transizione "Grezzo" → "Attivo" (create-character, update personaggio con stats + avatar).
- [x] **Mini-Profilo dati reali:** Nome, cognome, avatar da `/characters/me`; finestra Scheda con stats (F,C,D,M,E), valute (REM, EXP, Keys, Gems), eventuale Quadro momentaneo (computed).
- [x] **Area centrale:** **Mappe gerarchiche** (MAP_AND_CHAT_SPEC): root `map.png` + pin → mappe di gioco (Ogon, Izayoi, …); Ogon → sottomappe (Kessen, Edo, Kotowari, Hamanachi); click sottomappa → [zona] + lista chat; click chat → interfaccia narrativa. Config in `map-config.ts`.
- [x] **Lista Presenti (mock):** Colonna destra con lista presenti (tu + mock); finestra Presenti Estesi con elenco esteso. WebSocket real-time in seguito.
- [x] **Weather (mock):** Prefettura Tokyo, 18°C, Sereno; icona sole.
- [x] **News Visor (mock):** Ticker viola CRT anni '80, marquee con news mock (zone, quest, eventi). Hover = pausa.
- [x] **Calendario (mock):** Nascosto. Icona calendario nel widget Meteo; click → box sotto. Box popolato **solo se evento in corso**; gestione eventi/calendario da **mod/admin** (pannello gestionale).
- [x] **Prefetture Ogon:** Edo (Tokyo), Kessen (Fuji), Kotowari (Sendai). **Meteo collegato alla zona:** Edo/Kessen/Kotowari → meteo automatico; Sogno/Limbo/Altrove → N/D. Mappa zone = Edo, Kessen, Kotowari, Sogno, Limbo, Altrove. Modificabile in **creazione mappe** (admin).
- [x] **Pixel-icon vs icon (spec):** Pixel-icon = 20×20, decorano il nome (ruolo, ordine, premio speciale). icon = Font Awesome UI. Categorie: ruolo (admin, mod, capo shinigami, shinigami), ordine (mugen-tai, chisen-tai), premio speciale (da definire). V. `pixel-icons.ts`, GAME_LAYOUT_SPEC §4.
- [x] **Refinements:** SMS da placeholder a dati reali. DB `private_messages`, API `/sms` (conversations, thread, send, read, unread-count), finestra SMS stile WhatsApp (liste conversazioni, Nuova conversazione, thread con bolle), blocco in colonna sinistra con icona + badge non letti.

### ✅ FASE 2: L'Etere (Narrativa & Shinigami Tools) — COMPLETATA
*Obiettivo: Core del Play-by-Chat, WebSocket e Strumenti Master.*

- [x] **WebSocket Engine (presence):** Route `/ws`, auth via token. Join/leave **room** (chat location); broadcast presenza per room. Client: `useRealtime(roomId)`. Lista Presenti = mock (futuro: tutti online); Presenti in chat = chi è in quella room.
- [x] **WebSocket Engine (chat):** Chat **per location** (room Id). Persistenza in `zone_messages` (colonna `zone` = roomId). GET `/chat/:roomId`, WS `type: 'chat'` → persist + broadcast. Interfaccia narrativa: layout split (immagine/desc/note Master | messaggi), Tag luogo, strumenti (Global Message, Registra Quest, Registra Giocata, Hunt futuri). V. MAP_AND_CHAT_SPEC.
- [x] **Parsing Narrativo:** Riconoscimento automatico parlati («...»), tag narrativi [ ... ] e calcolo EXP basato sui caratteri netti (senza parlati). Parser backend (`narrative-parser.ts`) estrae parlati/tag, calcola caratteri netti, EXP = netChars/10 (min 1). UI formatta messaggi con stili CSS (parlati oro, tag viola). Anti-spam: rate limiting (10 msg/60s), validazione lunghezza (max 2000). EXP aggiunto automaticamente a `experienceTotal` e `experienceSpendable`.
- [x] **Shinigami Suite (base):** Modulo creazione Quest, tabellario premi, voto "Let this character shine!". Pagina `/shinigami`, dettaglio quest. In chat: "Registra Quest" → modal (Nome, Chat auto, **Tipo** AMBIENT|TRAMA|BATTLE|ONE_SHOT); "Registra Giocata" → dropdown quest OPEN/IN_PROGRESS, Partecipa (con **fetchId** se fetch assegnata). **Spia viola** in chat accanto al titolo room quando quest attiva (`GET /quests/by-room/:roomId`). Tabellario: premio **DROP**; azioni = messaggi >500 **caratteri totali** (`zone_messages.total_chars`, `getActionsPerCharacter`).
- [x] **Gradi e Livelli:** Tabelle `grades` (Analisti §7.2) e `levels` (1–50, Exp Δ/tot., fasi). Seed `bun run seed-grades-levels`. Usati per requisiti Fetch.
- [x] **Banner Level Up:** Mostra premi (Statistiche, Key, Gem) al salire di livello. Bottoni **Aumenta** (modifica statistiche, punti usabili in seguito) e **Salta** (nasconde banner, riproposto al login). V. LEVELING_DESIGN §Banner Level Up.
- [x] **Fetch sistema (base):** Schema `fetches`, `fetch_assignments`; Shinigami crea, Admin/Mod/Capo approvano. Bacheca `GET /fetches`, `GET /fetches/my`, `POST /fetches/:id/assign`. Requisiti (level, grade, order), `meetsRequirements`. **Widget Fetch** in colonna destra (sotto calendario), finestra Fetch (window-modality + dock). Registra Giocata collegata a Fetch assegnata (`quest_participants.fetch_id`).
- [x] **Widget Interattivi:** SMS (fatto), Meteo Prefettura live (API `/meteo`, modificabile da admin/mod), Note Master live (modificabili in chat dai Shinigami).

### ✅ FASE 3: Sim-Life (Economia & Ciclo Vitale) — COMPLETATA
*Obiettivo: Routine quotidiana, Housing e Gestione Risorse.*

- [x] **Daily Tick System:** Stipendio (+20 REM) con Ledger centrale (No debito). Scheduler automatico alle 00:00 UTC.
- [x] **Housing & Tasse:** Logica Affitto Stanza (-5 REM/die), Scadenze (15 del mese) e Sfratto Esecutivo (Giorno 8). UI completa con gestione affitti.
- [x] **Gestione Inventario:** Sistema a 5 Slot base (Body) espandibili tramite Zaini (senza calcolo KG). Calcolo totale slot (base + bag + housing).
- [x] **Pannello Shinigami (full):** Classifica Master (solo Admin/Mod; stats su registrazioni quest, shine, miglior master mese, classifica utenti), Sezione Lore (trame, proposte, accettazione da vertici), Fetch Quest (bacheca, richiesta Shinigami, approvazione superiori, requisiti, limiti frequenza). V. **QUEST_AND_FETCH_SPEC** §3.
- [x] **Fetch sistema (base):** V. Fase 2. Restano: premio >4 azioni su giocata pubblicata, limiti frequenza, responso Fetch (completata in attesa premio/commento).
- [x] **Shop:** Compravendita oggetti. UI completa per acquisto e vendita.
- [x] **Banca:** Sistema di ritiro stipendio giornaliero e scelta lavoro.
- [x] **Lista Presenti:** Implementata con dati reali (tutti gli utenti online).

### ✅ FASE 1.1: Scheda Pubblica & Journal Personaggio — COMPLETATA
*Obiettivo: permettere di aprire la scheda di un altro personaggio da "Presenti", con visibilità limitata per ruolo.*

- [x] **Endpoint pubblico personaggio:** `GET /characters/:id/public` che restituisce un profilo "read-only" (nome, cognome, avatar/mini-avatar, background/bio, stats base, alcune derivate, backgroundImage, themeMusicUrl) senza dati sensibili.
- [x] **Regole ruolo/visibilità:** calcolo lato backend di permessi (giocatore, Shinigami, Capo Shinigami, Admin/Mod) con flag tipo `canSeeBackground`, `canSeeJournal` inclusi nella risposta.
- [x] **Finestra "Profilo Personaggio":** Scheda unificata con `profileCharacterId`: quando si apre la Scheda con ID altrui, mostra profilo censurato; quando è la propria Scheda, mostra dati completi/editabili.
- [x] **Click da Presenti / Presenti Estesi:** nome personaggio cliccabile in DashboardRightCol e PresentiEstesiContent → apre Scheda con profilo pubblico da `/characters/:id/public` (evento `openProfileWindow`).

### ✅ FASE 1.2: Miglioramenti Chat & UI — COMPLETATA
*Obiettivo: Rendere la formattazione chat identica al vecchio progetto OYASUMI e migliorare il layout.*

- [x] **Formattazione messaggi chat:** Header con timestamp|nome (oro)|tag luogo (viola), avatar 100x100px float left, testo giustificato, stili identici al vecchio progetto.
- [x] **Parsing narrativo migliorato:** Supporto per `<parlati>` oltre a `«parlati»`, colori identici (parlati viola #60519b, tag grigio chiaro #bfc0d1).
- [x] **Layout ChatWindow:** Layout split migliorato con sinistra (immagine luogo 140px, descrizione, note master, presenti) | destra (messaggi con background darkstone, input area con stile OYASUMI).
- [x] **Stili messaggi globali e masterscreen:** Implementati stili speciali per messaggi globali (Admin) e masterscreen (Shinigami).
- [x] **Background images:** Integrati cloudy.png (header/intestazioni) e darkstone.png (aree contenuto) dal vecchio progetto. Frames copiati in public/frames.

### ✅ FASE 1.3: Media Player & Forum — COMPLETATA
*Obiettivo: Implementare lettore multimediale e sistema forum dal vecchio progetto.*

- [x] **Music Player:** Implementato MusicPlayer nella colonna sinistra (sezione Media) con playlist, cover art, controlli play/pause/prev/next/mute, dropdown selezione playlist. Background cloudy.png con velo scuro.
- [x] **Sistema Forum:** Implementato Forum completo con:
  - Routing `/forum`, `/forum/bacheca/:bachecaId`, `/forum/topic/:topicId`
  - Componenti: Forum (lista bacheche), BachecaPage (lista topic), TopicPage (lista post)
  - Stile Dark Arcane con header cloudy.png, sezioni con bordi viola
  - BBCode parser per formattazione post
  - News Visor collegato agli ultimi topic della bacheca principale
  - Funzionalità admin: Pin/Lock topic, Delete topic/post (solo Admin/Mod/Capo)
  - Like post, Quote post, Form creazione topic/post con toolbar BBCode
  - Integrazione nell'area centrale del dashboard (come Shinigami)

### ⏳ FASE 4: Espansione (Mobile & Optimization)
*Obiettivo: Accessibilità e rifiniture.*

- [ ] **Oyasumi Lite:** Interfaccia Mobile-Specific (SMS, Mini-scheda, Bacheca, Chat Mobile, Chat personale se posseduta.).
- [x] **Mobile Constraints:** Blocco azioni a 500 caratteri per utenti da smartphone. Rilevamento automatico dispositivo mobile, limite dinamico, feedback visivo.

### ✅ FASE 1.4: Miglioramenti Gestione & Shinigami — COMPLETATA
*Obiettivo: Completare il pannello Gestione e migliorare il pannello Shinigami come nel vecchio progetto.*

#### Gestione Utenti:
- [x] **Tab Gestione Utenti:** Lista utenti con ID, Nome PG, Email, Permesso, Azioni (modifica/elimina).
- [x] **Modal Modifica Utente:** Modifica Nome PG, Email, Permesso (PLAYER/MASTER/MOD/ADMIN), Password (opzionale).
- [x] **Click sul nome utente:** Aprire la scheda personaggio dell'utente cliccando sul nome nella tabella (come da richiesta utente).
- [x] **Sistema Sanzioni:** Visualizzazione log sanzioni per utente (ban, shadowban, warning). Tabella `sanctions` creata, endpoint `/admin/users/:id/sanctions` e `/admin/sanctions` (POST) implementati.

#### Gestione Forum:
- [x] **Gestione Sezioni:** CRUD completo per sezioni forum (nome, descrizione, ordine).
- [x] **Gestione Bacheche:** CRUD completo per bacheche forum (nome, descrizione, ordine, sezione).

#### Gestione Mondo:
- [x] **Gestione Playlist:** CRUD completo per playlist e canzoni, selezione file locali.
- [x] **Log Viewer:** Visualizzazione log chat per room e data specifica. Tabella con Ora, Autore, Tipo, Testo. Filtri per Chat Room e Data.
- [x] **Banner Management:** CRUD completo per banner del sito (titolo, contenuto, attivo/inattivo, ordine di visualizzazione).
- [x] **Map Management:** Editor per mappe gerarchiche (MAP/CHAT). Creazione/modifica/eliminazione location con posizione (pos_x, pos_y), immagine, descrizione, prefettura. Supporto per struttura ad albero (parent_id). Script di migrazione da map-config.ts disponibile.
- [x] **Eventi Giornalieri:** CRUD in Gestione, endpoint GET /admin/daily-events/today, calendario dashboard popolato con eventi reali.

#### Miglioramenti Shinigami:
- [x] **Form Creazione Quest migliorato:** 
  - Selezione partecipanti con checkbox (tutti i presenti in chat)
  - Selezione filone narrativo per quest TRAMA (dropdown con trame esistenti + opzione "Nuova Trama")
  - Supporto per quest GLOBALE (solo Admin)
  - Status PAUSED aggiunto allo schema e supportato nel backend
- [x] **Gestione Quest in Pausa:** Visualizzazione lista quest in pausa nel pannello Shinigami, possibilità di riprendere, concludere o eliminare una quest in pausa. Endpoint `/quests/paused` implementato.
- [x] **Schermata Premiazione migliorata:** Form dettagliato per assegnazione premi (EXP, REM, ITEM, CUSTOM, DROP) ai partecipanti nella pagina di dettaglio quest e nel modal di gestione quest in chat.
- [x] **Ritocchi UI Shinigami:** Pannello Shinigami con stile Dark Arcane, gestione quest in pausa con interfaccia intuitiva, bottoni per mettere in pausa/riprendere/concludere quest.

### ✅ FASE 1.5: Funzionalità Avanzate dal Vecchio Progetto (COMPLETATA)
*Obiettivo: Implementare funzionalità avanzate presenti nel vecchio progetto OYASUMI.*

#### Messaggistica:
- [x] **Live Search Utenti:** Barra di ricerca con debounce (300ms) per trovare utenti nel DB o filtrare chat esistenti. Backend: `GET /characters/search?q=` con `ILIKE` su name/surname. Frontend: filtra conversazioni client-side, cerca personaggi via API.
- [x] **Local Storage Cache:** Se il server risponde con errore (500) nel recupero conversazioni, il frontend carica l'ultima lista salvata in `localStorage`.
- [x] **Apertura Diretta Chat:** Cliccando un utente dalla lista "Presenti", viene forzata l'apertura della chat (settando lo stato `targetUser`) e la conversazione viene aperta direttamente. Icona "Vedi scheda" per aprire la scheda personaggio.

#### Housing System Completo:
- [x] **Chat privata (Entra in Casa):** Accesso alla chat della propria casa dalla **Scheda personaggio** (come nel vecchio OYASUMI). Pulsante "Entra in Casa" visibile solo se si ha un'abitazione; apre direttamente la chat privata.
- [x] **Armadio Casa:** Visualizzazione inventario della casa nel pannello sinistro della chat quando si è nella propria abitazione (roomId `housing_*`). Pulsante "Prendi" per spostare oggetti dall'armadio allo zaino.
- [x] **Rubare Oggetti:** Tasto "Ruba" per rubare oggetti dall'armadio di un'altra casa (solo ospiti). API `/housing/steal-item`, `stealFromHousing` in inventory.service.
- [x] **Gestione Ospiti:** Inviti/rimozione ospiti da chat casa. API `/housing/guests`, UI in ChatWindow (solo owner).

#### Fetch System (completamento):
- [x] **Requisiti in form creazione:** Form "Crea Fetch" (pagina Shinigami + ShinigamiContent) con campi: Liv. min/max, Ordine (Mugen-Tai/Chisen-Tai), Max/giorno, Max/settimana.
- [x] **Premi in form creazione:** Configurazione premi (min azioni, REM, EXP) in form creazione fetch.
- [x] **Requisiti e premi in bacheca:** La bacheca fetch mostra requisiti e premi automatici prima dell'assegnazione.
- [x] **Fetch concluse rimosse dalla bacheca:** Le fetch con completionStatus COMPLETED non compaiono nella lista disponibili.
- [x] **Concluse con Partecipanti:** Sezione "Le tue fetch concluse" con "Conclusa da: [nomi partecipanti]". Endpoint `GET /fetches/my/concluded`.
- [x] **Notifica di sistema al responso:** Al completamento del responso Master, `createSystemNotification` persiste la notifica; WebSocket `fetch_responso` + Toast per feedback real-time.

#### Altri Miglioramenti:
- [x] **Background Images:** cloudy.png, darkstone.png, frames in uso. Cartella sample OYASUMI rimossa.
- [x] **Stili Chat:** Colori parlati (#60519b) e tag (#bfc0d1) allineati al vecchio progetto.

---

## AREE VUOTE (DA POPOLARE)

*Sezioni con UI/endpoint placeholder o assenti. Per ognuna: domande da porsi prima di procedere.*

### 1. Sistema Combattimento & Uso Waza In-Game
**Stato:** Combattimento **in chat** con pannello lancio waza, automazione parziale (CS, status, danno su `[hit:1]`), Sōkaiju wired su Kongen/Gojū/Shōdō/Eiga. Master arbitra narrato e scambi IR non ancora automatici.

| Domande da porsi |
|------------------|
| Il combattimento è **a turni in chat** (Master arbitra, PG dichiara Waza nel messaggio) o **schermata dedicata** (come il tester)? |
| I tiri di dado sono **embedded nella chat** (sintassi tipo `[dado: 1d20+M]`) o gestiti da un pannello separato? |
| Chi risolve le formule (danno, costo Jigoka): **Master manualmente** o **sistema automatico** che valida e applica? |
| Le Waza sono **pre-definite** (pool `wazaPool.ts`) o **dinamiche da DB** (tabella `skills`)? O ibrido? |
| Combattimento PvP, PvE o solo narrativo con arbitraggio Master? |

- [x] **Spec Combattimento:** COMBAT_SPEC.md — flusso in chat, iniziativa Reflexes, CS, Overheat, Waza (CS+Jigoka), dadi su richiesta.
- [x] **Integrazione Waza in Chat:** Tag `[waza:nome]`, `[cs:X]`, `[skiru:id]`, `[target:…]`; **pannello lancio** (`WazaLaunchPanel`) con Skiru/CS/bersaglio/colpo a segno; `/waza` slash.
- [x] **Danno semi-auto:** `[hit:1]` + tier + bersaglio → pipeline danno (Kongen, rider Skiru, Itami) via WebSocket HP.
- [x] **Sōkaiju in combattimento:** spec `Oyasumi_Sokaiju_Spec_Cursor.md`; formule in scheda + hook chat (vedi MECHANICS_ROADMAP §2.7 Sōkaiju).
- [x] **Rider Seimitsu:** −2 IR difensore se l'attacco dichiara `[skiru:seimitsu]` (`resolveCombatConfrontationBetween`).
- [x] **Cap Chikō costrutti:** evocazione bloccata oltre `1 + chiko` attivi sul campo.
- [x] **Confronto IR automatico** attaccante vs difesa indicativa prima di applicare danno su `[hit:1]`.
- [x] **Tiri di dado:** DICE_SPEC.md; sintassi `[dado:1d20]`, `[dado:1d20+M]`; risoluzione server-side; shadowban non broadcast.

---

### 2. Bestiario — Base completata
**Stato:** Catalogo globale di **tutti i PNG** esistenti e persistenti. Categorie: **Holic**, **Phobias**, **Muen**. Non traccia incontri per personaggio.

- [x] **Schema DB:** Tabella `creatures` con `category` (HOLIC | PHOBIAS | MUEN).
- [x] **API:** `GET /bestiario` → PNG raggruppati per categoria.
- [x] **UI:** Lista raggruppata per Holic, Phobias, Muen.
- [x] **Admin:** CRUD PNG in Gestione (tab Bestiario).

---

### 3. Acquisto Waza/Skiru con EXP (Skill Tree) — Base completata
**Stato:** Endpoint `POST /characters/me/skills`; UI Acquista in finestra Waza; seed-skills con 6 skill da WAZA_CALCOLI.

- [x] **Endpoint:** `POST /characters/me/skills` (acquista), validazione costi EXP/Keys.
- [x] **UI:** Sezione Acquista skill in finestra Waza (acquistabili / bloccate).
- [x] **Seed skills:** Popolate 6 skill (Skiru + Waza).
- [ ] **Admin CRUD skills:** Gestione pool skill da pannello (futuro).

---

### 4. Rubare Oggetti (Housing) — COMPLETATO
**Stato:** Implementato. Solo ospiti possono rubare dall'armadio di casa altrui.

- [x] **Endpoint + logica:** `POST /housing/steal-item`, `stealFromHousing()` in inventory.service.
- [x] **UI:** Pulsante "Ruba" in ArmadioCasa (visibile solo per ospiti in chat casa altrui).

---

### 5. Gestione Ospiti (Housing) — Base completata
**Stato:** `housing_guests` + API + UI in chat casa (owner invita/rimuove). Modello attuale: solo inviti espliciti (owner → ospite).

| Domande per eventuali miglioramenti |
|------------------------------------|
| Serve modello **richieste in entrata** (ospite chiede, owner approva)? |
| Numero massimo di ospiti per casa? (attualmente illimitato) |
| Gli ospiti vedono anche l'armadio con permessi (prestito/uso) o solo chat? |
| Se l'owner viene bannato (OYASUMI_CONTEXT): "ospiti mantengono accesso finché non scade affitto" — già garantito da `housing_guests`? |

---

### 6. Oyasumi Lite (Mobile)
**Stato:** Solo limite 500 caratteri per mobile. Nessuna UI dedicata.

| Domande da porsi |
|------------------|
| **PWA** o **app nativa** (React Native / Capacitor) o solo **responsive** migliorato? |
| Funzionalità prioritarie su mobile: SMS, Mini-scheda, Bacheca, Chat, Chat casa — tutte o subset? |
| Il dock desktop diventa **bottom nav** su mobile? Layout a tab o stack? |
| Notifiche push per SMS/chat? |

- [x] **Spec Oyasumi Lite:** OYASUMI_LITE_SPEC.md — tab Scheda, SMS, Mappa, Fetch, Altro.
- [x] **Implementazione:** DashboardMobileLayout con bottom nav, layout condizionale su useIsMobile().

---

### 7. Recupero Password (Invio Reale)
**Stato:** `POST /auth/forgot-password` esiste; invio email è placeholder.

| Domande da porsi |
|------------------|
| Provider email: **Resend**, **SendGrid**, **SMTP custom**? |
| Template email: testo, link reset, scadenza link (es. 1h)? |
| `POST /auth/reset-password` con token usa un token **JWT** o **token one-time** nel DB? |

- [x] **Integrazione email:** Resend, variabili RESEND_API_KEY, APP_URL, EMAIL_FROM.
- [x] **Endpoint reset:** POST /auth/reset-password, token one-time in DB (password_reset_tokens), validità 1h.
- [x] **UI:** Pagina /auth/forgot-password + /auth/reset-password?token=xxx.

---

### 8. Tiri di Dado — Base completata
**Stato:** DICE_SPEC.md; sintassi `[dado:1d20]`, `[dado:1d20+M]` in chat; risoluzione server-side; shadowban non broadcast.

- [x] **Spec dadi:** DICE_SPEC.md.
- [x] **Parser + risolutore:** Server-side, sostituisce con risultato prima di persist.
- [x] **Shadowban:** Messaggi (e tiri) shadowbannati non persistiti né broadcast.

---

## AREE DA RIVEDERE

*Funzionalità implementate ma con gap rispetto a OYASUMI_CONTEXT, spec o coerenza.*

### 1. Scelta Ordine (Mugen-Tai / Chisen-Tai) — CHIARITO
**Decisione:** La scelta avviene all'assegnazione del grado **Hakyō** (può essere in qualsiasi momento). OYASUMI_CONTEXT aggiornato.

⚠️ **Da allineare:** `create-character` e Scheda permettono di scegliere l'ordine subito. La regola prevede scelta al grado Hakyō. Se serve coerenza: bloccare scelta ordine fino ad assegnazione Hakyō; implementare flusso assegnazione grado.

---

### 2. Shadowban Enforcement — COMPLETATO
**Situazione attuale:** WS `chat` verifica `banState === 'SHADOW'` prima di persist/broadcast; GET `/chat/:roomId` esclude messaggi da utenti shadowbannati. **Presence shadowban:** gli shadowbannati **appaiono** nella lista Presenti con colore ambra e icona occhio chiuso per segnalare il ban; restano connessi e ricevono messaggi.

---

### 3. Fetch System — COMPLETATO
**Situazione attuale:** Sistema completo. Premio automatico >4 azioni, limiti frequenza (per-fetch), responso Fetch con UI, notifiche di sistema.

- [x] **Premio >4 azioni:** `rewardFetchParticipants()` in `closeGameSession()`, rewardConfig (minActions, remReward, expReward).
- [x] **Limiti frequenza:** `limitPerDay`, `limitPerWeek` in requirements, `checkFrequencyLimits()` in `assignFetchToSelf`.
- [x] **Responso:** Stato AWAITING_REWARD → COMPLETED, sezione UI in Shinigami, commento opzionale.
- [x] **Requisiti e premi in form creazione:** Liv. min/max, Ordine, limiti frequenza, premi (min azioni, REM, EXP).
- [x] **Fetch concluse rimosse dalla bacheca:** `listApprovedFetches()` esclude completionStatus COMPLETED.
- [x] **Notifica sistema:** `system_notifications` + `createSystemNotification()` al responso; WebSocket `fetch_responso` + Toast.

---

### 4. Login Bonus vs Stipendio — CHIARITO
**Decisione:** Non esiste un login bonus REM. Solo lo stipendio da job (20 REM/24h). OYASUMI_CONTEXT aggiornato.

---

### 5. Background Images & Stili Chat
**Situazione attuale:** cloudy.png, darkstone.png, frames in uso. Roadmap: "tutte le background images", "stili completamente allineati".

| Domande da porsi |
|------------------|
| ~~Inventario OYASUMI~~ — Cartella sample rimossa. Asset principali (cloudy, darkstone, frames) già integrati. |
| Differenze residue: colori parlati (#60519b), tag (#bfc0d1), spaziature — checklist da vecchio progetto? |

- [ ] **Audit:** Confronto visivo vecchio vs nuovo, lista gap.
- [ ] **Task puntuali:** Per ogni differenza, fix mirato.


| NUOVE WAZA CON RICHIESTE GRADO |

TOKA-DO

Omocha · Il Giocattolo — 玩具
Il pugno si chiude su un tubo di ferro, una sedia, un coccio — non importa cosa. La Jigo-Ka cola dal terzo occhio e affonda nell'oggetto, che si accende di brace interna verso l'estremità: il metallo resta metallo, il legno resta legno, ma ora è il vaso in cui Meiju e Shiju condividono un'unica fiamma. E un vaso troppo pieno, prima o poi, si crepa.
Tipo: Attiva · [Nessuna][Potenziamento] · Tier base 4 · CS 5 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]

Effetto: per 3 turni, qualunque oggetto fisico che impugni diventa [Arma Psichica] — anche se non possiedi la passiva Tōrō · Lanterna Incisa. L'oggetto conserva le sue proprietà fisiche e funge da [Tōrō] per le tue waza. Puoi cambiare oggetto durante il turno: il precedente perde all'istante lo status e si distrugge.

↳ Sovraccarico: quando lanci una waza attraverso il [Toro], la sua punta diventa [Instabile]. Al primo impatto successivo oppure al lancio della waza seguente attraverso di essa, l'oggetto esplode in una [Propagazione][Energetica] di raggio 3 m — danno = tier (17) a ogni bersaglio nell'area — e viene consumato.

Gangushi · Il Giocattolaio — 玩具師
Non serve più stringere nulla. La Jigo-Ka risale fino a ciò che porta addosso da sempre — la cintura, gli anelli, le monete in tasca — e ognuno di quegli oggetti, legato all'Ego come una vena d'oro, si accende di una luce propria. L'analista cammina al centro di un cerchio di lanterne che obbediscono al suo pensiero: ha smesso di impugnare un'arma, ed è diventato il punto da cui tutte le armi partono.
Tipo: Attiva · [Nessuna][Potenziamento] · CS 7 · 1/4 · grado richiesto: Kanteikan [K]

Effetto: per 3 turni, ogni oggetto che possedevi da prima dello scontro (indossato, in tasca, nell'inventario) diventa [Toro] simultaneamente, senza bisogno di impugnarlo, finché resta addosso a te. Ognuno funge da [Tōrō]: per ogni waza scegli liberamente da quale oggetto-origine parte (angoli e direzioni multiple). Se un oggetto lascia il tuo corpo — lanciato, strappato, fatto cadere — perde lo status.

--Ito-do
Kankatsu · Giurisdizione — 管轄
L'analista tende un filo e lo pianta nell'aria attorno a sé, tracciando un cerchio invisibile di cui si dichiara padrone. Ogni colpo nemico che varca quel confine viene afferrato a metà volo da capi di filo che lo intingono del colore della sua Jigo-Ka: per un istante la corda di Retsuja lo trattiene, poi la mano che lo guida non è più quella che l'ha lanciato.
Tipo: Attiva · [Nessuna][Potenziamento] · CS 4 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]

Effetto: dichiari Giurisdizione su una [Categoria] a scelta tra [Proiettile] e [Raggio]. Per 3 turni, una volta per turno, quando una waza nemica di quella Categoria entra entro 8 m da te, puoi spendere +2 CS per reclamarla: dall'istante in cui entra nel cerchio è considerata come appena lanciata da te. Bersaglio e gittata restano gli originali, ma ora la waza è tua — le tue passive Itō possono agire su di essa (redini, sdoppiamento, consistenza, trattenuta…) e le tue passive di consistenza/danno la leggono come propria.

↳ Ogni waza reclamata che stai manipolando genera 1 Tensione finché la tieni.
Chokurei · Decreto — 勅令
L'analista non muove più la marionetta: muove la legge che la regge. Un filo di luce scrive nell'aria un'unica sentenza, breve come un nodo, e il campo è costretto a obbedirle — perché ogni cosa, anche la più libera, era già legata al filo del destino di Meiju.
Tipo: Attiva · [Nessuna] · CS 6 · 1/4 · grado richiesto: Kanteikan [K]

Effetto: imponi un singolo Decreto, un comando che viola le regole naturali del combattimento. Si applica a un evento specifico, in corso o che avverrà entro 2 turni, in una gittata di 12 m. Un solo Decreto per turno.

Il Decreto non può: cambiare [Consistenze], creare materia, potenziare un corpo, far esplodere energia. Può solo agire su movimento, direzione, posizione, [Categoria]. Esempi:

— "Quella [Proiettile] torna al mittente." → la waza inverte la direzione.

— "Quei due [Costrutti] si scambiano di posto." → scambio istantaneo (come Irekae, forzato).

— "Quella waza si ferma." → si congela sul posto; riparte al tuo prossimo turno sulla stessa traiettoria (come Hikitome, forzata su waza nemica).

— "Quel bersaglio non può muoversi in quella direzione." → un bersaglio entro gittata ha quella direzione di movimento negata per il turno.
Mugen-Shihai · Dominazione Onirica — 夢幻支配
L'analista pianta i piedi e apre tutti i fili insieme: una cupola sottile di corde si stende sopra il campo, e ogni cosa che vive là sotto sente un peso impercettibile sulle spalle. Non muove più le marionette a una a una — è il centro a cui tutti i fili tornano. Finché regge il cerchio, dentro di esso non accade nulla che la sua mano non senta, e quasi nulla che non possa reclamare. Ma chi tiene mille fili non può camminare.
Tipo: Attiva · [Emanazione][Nessuna] · CS 8 + mantenimento · 1/4 · grado richiesto: Shin'enkan [S]

Effetto: estendi il tuo dominio in un cerchio di raggio 10 m centrato su di te, per 4 turni (o fino a rottura). Entro la zona:

— ogni [Costrutto] presente conta te come co-proprietario (puoi manipolarlo come tuo, senza strapparne la proprietà al creatore);

— hai piena coscienza di ogni waza generata nella zona o che la attraversa;

— al costo di 1/4, tratti 1 waza (qualsiasi Categoria, tua o altrui) come appena generata da te; gittata e direzione iniziali restano gli originali. Nessun limite di una-per-turno: sei limitato solo dai quarti.

Vincolo del centro: per mantenere la Dominazione puoi muoverti al massimo di metà Movimento a turno. Se percorri più metri (per scelta o forzato) o subisci più di 12 danni (tier 3) da un singolo colpo, la Dominazione si spezza e decade.

↳ Ogni waza che reclami nella zona genera 1 Tensione (la cupola è un'unica ragnatela: più tiri, più vicino al Cedimento).

Genzai-do

Meisaku · Opera Prima — 銘作
L'analista non scrive una frase: scrive la frase. Le linee si tracciano fitte e lente, geometria precisa e caotica insieme, finché il sigillo si chiude su sé stesso e non sbiadisce più. È il gesto di Tenkan, la Corona che nomina, portato fino in fondo: una cosa dichiarata esistente che il mondo non riesce più a dimenticare. Finché la regge, Shiju non ha presa su di lei.
Tipo: Attiva · [Costrutto][Solido] · CS 6 · 2/4 (scrittura precisa) · grado richiesto: Sentatsu Bunsekikan [SB]

Effetto: materializzi la tua Opera Prima, un [Costrutto][Solido] permanente e unico (una sola attiva alla volta). Resistenza tier 5 (23); forma a tua scelta, fissata alla creazione; taglia fino a [Grande]. Il suo Mei è inviolabile: non conta nel limite Gosa e non è mai il sigillo che si incrina. Non si dissolve col tempo. Se distrutta, puoi ri-dichiararla — stessa Opera Prima — dedicando un turno intero e pagandone di nuovo il costo.
Shinryaku · Invasione — 侵略
Non un disegno paziente, ma uno strappo. L'analista punta un dito e la realtà, in quel punto, è costretta a far spazio: una massa solida si scrive tutta in una volta, con un suono secco, scaraventando via ciò che occupava il posto. È creazione oltre l'umano — non si chiede permesso al mondo, lo si occupa.
Tipo: Attiva · [Costrutto][Solido] · Tier base 5 · CS 7 · 1/4 · grado richiesto: Kanteikan [K]

Effetto: materializzi istantaneamente un [Costrutto][Solido] di taglia [Grande] in un punto visibile entro 12 m. Tutto ciò che occupa il punto è investito dall'apparizione: i bersagli a contatto subiscono danno = tier (23) e sono sbalzati di 4 m; ogni [Costrutto] di taglia inferiore alla [Grande] nel punto viene distrutto. Il costrutto generato dura 3 turni, ha Resistenza tier 4 (17), forma a tua scelta.
Rakuen · Eden — 楽園
L'analista smette di scrivere sul mondo e comincia a scrivere il mondo. Imprime il proprio Ego sulla realtà attorno a sé: il suolo si riveste della sua geometria, ogni superficie si incide del suo Mei, la luce prende il colore della sua Jigo-Ka. Dentro questo cerchio non esiste più il margine d'errore — ciò che traccia non scivola verso Shiju, perché qui Shiju non è mai stato invitato.
Tipo: Attiva · [Emanazione][Nessuna] · CS 8 + mantenimento · 1/4 · grado richiesto: Shin'enkan [S]

Effetto: per 4 turni, l'area in raggio 10 m attorno a te (ti segue) diventa il tuo mondo interiore reso tangibile. Entro l'Eden:

— i tuoi [Costrutti] non si dissolvono (permangono oltre la scadenza normale finché l'Eden regge) e il limite Gosa è sospeso — nessun Mei si incrina;

— ogni tuo [Costrutto] distrutto viene rigenerato all'inizio del tuo turno successivo al costo di 2 CS ciascuno;

— hai percezione continua della posizione di ogni essere vivente nell'Eden.

Hado-do

Tōshi · Investimento Energetico — 投資
L'analista smette di spendere e comincia a versare. Ogni gesto, ogni colpo, lascia una parte di sé in un serbatoio che porta sotto la pelle: le venature di luce si moltiplicano, il respiro si fa corto, il corpo si gonfia di una pressione che non scarica — la trattiene, la conserva, la fa fruttare. Poi, in un solo istante scelto, riscuote tutto in un'unica onda nera.
Tipo: Attiva · [Nessuna][Potenziamento] · CS 2 (apertura) · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]

Effetto: apri un [Investimento] su di te. Per 3 turni, ogni quarto e a ogni lancio di waza puoi spostare CS dal tuo serbatoio nell'Investimento (riserva separata: non conta verso l'Overheat). In qualsiasi momento entro la durata puoi riscuotere rilasciando tutto l'Investimento insieme a una singola waza: questa ottiene +2 danno (piatto) e +1 m di gittata per ogni CS investito.

↳ Se vieni reso incosciente, o passi un intero turno senza versare nell'Investimento, lo perdi.
Shakkin · Indebitazione — 借金
L'analista posa il palmo sul bersaglio e gli inietta ciò che nessuno ha chiesto: un prestito forzato di Jigo-Ka nera che si annida nella carne e marchia la pelle del suo simbolo. Il debito non sta fermo — cresce a ogni alba, come ogni debito fa. L'unico modo per estinguerlo è restituirlo all'usuraio, colpo su colpo. Ma se l'analista decide di riscuotere, ciò che era stato prestato torna indietro tutto insieme, e l'interesse si paga in fuoco.
Tipo: Attiva · [Contatto] → [Emanazione a Distanza][Energetica] · CS 5 · 1/4 · grado richiesto: Kanteikan [K]

Effetto: colpisci un bersaglio a [Contatto] e gli imponi un [Debito] (status): inietti 2 stack iniziali. Per 3 turni:

— Interessi: all'inizio di ogni tuo turno, il Debito cresce di +1 stack (max 6);

— Restituzione: ogni volta che il bersaglio ti colpisce con una waza a [Contatto], il Debito cala di 1 stack.

Riscossione (a comando, 1/4, oppure automatica alla scadenza): tutte le stack si convertono in un'esplosione [Energetico][Emanazione a Distanza] centrata sul bersaglio, raggio 3 m, danno = 5 per stack. Massimo un Debito per bersaglio. Se l'analista è reso incosciente, il Debito si dissolve.

Hensei-dō

Nagori · Principio di Instabilità — 名残
L'analista non lascia mai del tutto uno stato: ogni forma che abbandona resta aggrappata alla successiva come un'ombra che il corpo non ha finito di scrollarsi di dosso. La waza si smantella e si ricostruisce, imperfetta, attraversata da tensioni visibili — e nel passaggio trascina con sé un residuo di ciò che era un istante prima, il respiro doppio di Retsuja, ciò che è e ciò che ha appena smesso di essere.
Tipo: Attiva · [Nessuna][Potenziamento] · CS 3 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]

Effetto: attivi il Principio di Instabilità su di te. Per 3 turni, ogni volta che cambi la [Consistenza] di una tua waza, questa guadagna un effetto collaterale basato sulla consistenza di partenza (quella che abbandona) — in aggiunta all'effetto alchemico Yuragi della consistenza in arrivo:

— [Solido] → +1 tier di danno

— [Liquido] → +4 m di gittata

— [Gassoso] → +1 turno di permanenza (se ha durata)

— [Sonoro] → ignora 1 tier di Resistenza e di [Scudi]

— [Elementale] → applica +1 stack dello status elementale abbandonato

— [Energetico] → la waza ottiene priorità (vince gli scambi in parità d'Indice)
Igyō-Rensei · Insegnamenti di Tucker — 異形錬成
L'analista posa la mano su una forma e la costringe a tradire sé stessa. Non un cambio docile: una trasmutazione aberrante, dove il costrutto si smantella con violenza e si ricompone nel nuovo stato portando il marchio di chi l'ha rifatto. Ciò che era saldo si liquefà e cola, ciò che aveva forma si disperde in nube, ciò che taceva esplode. È l'alchimia che non ripara: deforma.
Tipo: Attiva · [Contatto] · CS 5 · 1/4 · grado richiesto: Kanteikan [K]

Effetto: tocchi un [Costrutto] o [Scudo] (tuo o nemico) e ne forzi la [Consistenza]: il bersaglio assume istantaneamente quella consistenza con tutte le proprietà associate. La transizione è violenta e produce un effetto diverso secondo la trasformazione:

— → [Solido]: +2 tier di Resistenza, ma diventa [Immobile] (non spostabile da Telecinesi/Furia — Ayatsuri, Hajiki, Hikiyose) per 1 turno.

— → [Liquido]: perde metà Resistenza e si espande, coprendo una zona [Liquido] a terra di raggio 4 m.

— → [Gassoso]: perde forma e si disperde in una nube di raggio 4 m per 2 turni.

— → [Elementale]: esplode in raggio 4 m applicando lo status elementale affine dell'analista (2 stack) a ogni bersaglio nell'area; il costrutto/scudo originale è distrutto.

Naikan-dō

Shokushin · Lettura del Corpo — 触診
L'analista non colpisce per ferire: colpisce per leggere. Nel punto di contatto la sua Jigo-Ka risale sotto la pelle del bersaglio come una mano che tasta un meccanismo al buio, e per un istante sente dove il corpo è pieno e dove è vuoto, dove la forza si accumula e dove il flusso s'inceppa. È l'introspezione della Via rivolta verso un altro — l'occhio interno che si apre nella carne di chi gli sta davanti.
Tipo: Attiva · [Nessuna][Contatto] · CS 3 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]

Effetto: colpisci un bersaglio a [Contatto] e ne leggi il corpo. Ottieni:

— la Skiru più alta e la più bassa;

— se ha [Potenziamenti] attivi e su quale Skiru;

— quali Status possiede;

— una stima sommaria della Jigo-Ka (CS) residua;

— gli Stili di appartenenza e alcune passive (non tutte — quante, lo decide il fato/master).

Un solo bersaglio letto alla volta: leggerne un altro sovrascrive. Il tuo prossimo colpo contro il bersaglio letto infligge +1 tier di danno; il prossimo colpo che subisci da lui approfondisce la Lettura (rivela una passiva in più).
Kōmei · Chi lo ha Deciso? — 抗命
L'analista guarda ciò che lo affligge e si rifiuta di subirlo. La Jigo-Ka inverte la corrente nei nodi: il fuoco che lo bruciava ora gli riveste i pugni, il peso che lo inchiodava diventa slancio, le vertigini si fanno furia. Il dolore non viene sopportato e nemmeno solo bruciato come carburante — viene ribaltato, costretto a lavorare per chi avrebbe dovuto piegare.
Tipo: Attiva · [Nessuna][Potenziamento] · CS 6 · 1/4 · grado richiesto: Kanteikan [K]

Effetto: lanciabile solo se hai almeno uno Status negativo attivo. Rimuovi immediatamente tutti i tuoi Status negativi: ognuno si converte nel suo opposto per 3 turni (atto singolo, non mantenimento):

— [Incendiato] / [Emorragia] → il corpo si fa rovente: ogni tuo colpo a [Contatto] applica [Incendiato] (1 stack).

— [Sovraccarico] → l'eccesso diventa carburante: +2 CS rigenerati per turno.

— [Torpore] → la rigidità diventa armatura: +10% mitigazione.

— [Appesantimento] → il peso diventa potenza: i colpi a [Contatto] infliggono +1 tier di danno.

— [Vertigini] → l'instabilità diventa ferocia: ottieni 2 stack di [Ira].

Hōgō · Sutura dell'Ego — 縫合
L'analista, che ha imparato a ricucire i propri flussi mentre combatte, posa la mano sul nemico e fa l'opposto: infila la propria Jigo-Ka estranea nei suoi percorsi e li cuce chiusi. Il bersaglio sente un filo che non è suo bloccare ciò che prima scorreva — un punto di sutura nell'Ego, che terrà finché non avrà la forza di strapparlo via.
Tipo: Attiva · [Nessuna][Contatto] · CS 7 · 1/4 · grado richiesto: Shin'enkan [S]

Effetto: colpisci un bersaglio a [Contatto] e applichi una Sutura a scelta (max una per bersaglio), per 3 turni:

— Sutura Offensiva: sigilli la Skiru più alta del bersaglio: −3 a quella Skiru (riduce Indice e danno delle azioni che la usano). Non può essere potenziata; se lo era, perde il [Potenziamento] e non può acquisirne per la durata.

— Sutura di Stile: sigilli una passiva del bersaglio (a tua scelta fra quelle rivelate dalla Lettura): non può usarla per la durata.

— Sutura Elementale: congeli tutti gli Status attivi sul bersaglio: non possono essere rimossi né decadere, restano bloccati al livello di stack attuale.

Rottura: il bersaglio può spezzare la Sutura spendendo 4 CS e dedicando 1 Quarto intero alla purificazione. Finché non lo fa, l'effetto persiste.

-- GENERICHE

Le Generiche sono l'insieme delle capacità fondamentali di ogni Analista, indipendenti dallo Stile, dalla scuola, dalla discendenza. Sono l'espressione più pura del rapporto con la Jigo-Ka: movimenti istintivi, raggi d'energia, difese elementari, percezione e concentrazione. Sono waza aperte, a cui tutti possono attingere — anche il neofita ne possiede almeno alcune.




Status introdotto: [Rallentato] — il bersaglio subisce −2 m al Movimento per la durata indicata. Nessun altro malus. (Formalizzato in `@domain/combat/status`.)

**Batch 1 (in pool + DB):** Kajiba, Kazari, Yasuragi, Yakudō, Iai, Kehai · Shoken, Shōheki, Shikigami, Shinya — v. `apps/tester/src/pools/generiche-waza-pool.ts`.

**Batch 2 (in pool + DB):** Ippuku, Ukenagashi, Shukuchi, Chōyaku, Kaginawa, Nenwa · Fūjin, Gashō, Meidan · Rasui, Funki, Suishin, Fukyōon, Hibana · Sandan, Bakufū, Nenmō, Kyōkan · Kyōshin, Dendō, Hankyō · Kihō, Suimaku · Funshutsu — v. `apps/tester/src/pools/generiche-waza-pool.ts`.

Note di design (chat, non vanno nel manuale):

Status [Rallentato] (per Ragnatela di Mercurio): formalizzato in `@domain/combat/status` — solo −2 m Movimento, distinto da [Torpore].
Valori-standard per famiglia (proiettili 15 m/T1·CS1; raggi 20 m/T2·CS2 — con eccezioni motivate: trivella 8 m perché "cresce", getto di gas 10 m; coni 6 m/T2·CS2; sbalzi 4 m). Sono ancore di coerenza, tutte tarabili in fase di playtest.
Velo Liquido: ho reso "−W danni / −X velocità" come −4 danno e −5 m di gittata rimanente sui proiettili in transito. Numeri da sentire al tavolo.

Eruzione dell'Ego: l'ho messa te escluso dall'area (era ambiguo nell'originale). Se la volevi davvero indiscriminata anche sull'analista, tolgo l'esclusione — più rischiosa, più "disperazione".
Frequenza Disarmante: "+X costo" → +2 CS; il danno da mancata scarica → = tier. 

---

### 🔲 FASE PENDING: Shakai Kaikyū — Classi Sociali

> **Spec:** [`SHAKAI_KAIKYU_SPEC.md`](./SHAKAI_KAIKYU_SPEC.md) · **Roadmap meccaniche:** `MECHANICS_ROADMAP.md` § Shakai Kaikyū · **Domain:** `@domain/shakai-kaikyu`

**Obiettivo:** scelta unica di classe → tag invisibile → tool dedicata + albero sottoclassi (5 / 10 / 20 XP) + blueprint per tag.

**Già pronto**
- [x] Q1–Q4, Q10, Q12 (Skiru gate, XP condiviso, sentiero unico, reset UTC, capstone blueprint)
- [x] Spec + catalogo 5×5 sottoclassi + `blueprint-catalog.ts` + `tool-ux.ts`
- [x] Economia oggetti Fasi 1–4 (drop, inventario, smantellamento Artigiano, mercato) — v. tabella sotto

---

## Tabella di marcia — Prossimi step (Luglio 2026)

Ordine consigliato: **deploy → UI economia giocabile → fondamenta Shakai → tool per classe**.

| Step | Blocco | Cosa | Output | Dipendenze | Stato |
|------|--------|------|--------|------------|-------|
| **0** | Deploy | Merge PR stack economia (#3→#9), `db:push`, `seed-item-catalog`, smoke API | DB + server allineati | Mac con `DATABASE_URL` | ✅ cloud + main |
| **1** | UI economia | Scheda oggetto: categorie, integrità, firma, origine, `isBroken` | Inventario leggibile in gioco | Step 0 | ✅ |
| **2** | UI economia | Sezione `MARKET` + slot; refresh su WS `inventory_updated` | Oggetti in vendita visibili | Step 1 | [~] sezione MARKET ✅, WS 🔲 |
| **3** | UI economia | Pannello **Mercato** (Banco vendi/compra + Piazza inserzioni/feed) | Loop junk→Rem giocabile | Step 0 | 🔲 |
| **4** | UI economia | Pannello **Smantellamento** Artigiano (gate Shokunin temporaneo) | Junk → materiali in UI | Step 0, API ✅ | 🔲 |
| **5** | Shakai DB | `social_class`, `social_subclass_sheet`, `social_daily_usage` | Schema + migrazione | Step 0 | 🔲 |
| **6** | Shakai domain | `assignSocialClass`, `unlockSocialSubclass`, budget giornaliero + test | `@domain/shakai-kaikyu` completo | Step 5 | 🔲 |
| **7** | Shakai API | `POST /social-class`, `PATCH /social-subclass`, espansione `GET /characters/me` | Scelta classe via API | Step 6 | 🔲 |
| **8** | Shakai UI | Scelta classe (una tantum) + albero sottoclassi XP in scheda | PG con classe visibile | Step 7 | 🔲 |
| **9** | Tool Medico | 5.1 Cura HP (target, budget giornaliero, log chat) | Prima tool Shakai | Step 8 | 🔲 |
| **10** | Tool Medico | 5.2 Preparati da blueprint `#Medico` → inventario | Craft consumabili medico | Step 9 + blueprint DB | 🔲 |
| **11** | Tool Artigiano | 5.3 Ripara integrità + 5.4 Costruisce da blueprint | Completa loop craft | Step 8; smantellamento ✅ | 🔲 |
| **12** | Tool Cacciatore | 5.5 Traccia/preda + raccolta (budget) | Terza classe | Step 8 | 🔲 |
| **13** | Tool Politico | 5.6 Patti + richiamo favori | Quarta classe | Step 8; Q politico | 🔲 |
| **14** | Tool Sacerdote | 5.7 Ofuda (potere, attivi max) | Quinta classe | Step 8 | 🔲 |
| **15** | Blueprint | Sync `blueprint-catalog` in DB + API craft generica | Ricette giocabili oltre Medico | Step 10 | 🔲 |
| **16** | Integrazione | HP, costrutti materiali, patti, ofuda collegati a combattimento/inventario | Shakai end-to-end | Step 11–14 | 🔲 |
| **17** | Staff | Moderazione cambio classe + audit | Pannello gestione | Step 7 | 🔲 |

**Rimandato (non blocca la marcia):** baratto Piazza; drop UI Master; `social_class` derivata solo da Skiru senza colonna DB; Q5–Q11 in `SHAKAI_KAIKYU_SPEC.md`.

**PR aperti (economia + Shakai design):** #3–#9 — mergiare prima dello Step 0.

**Step corrente consigliato:** **1** (UI scheda oggetto).

**Step 0 completato (2026-07-02):** PR #3–#9 mergiate in `main`; `db:push` + seed (34 voci catalogo); smoke `/health`, `/market/banco/catalog`, `/inventory/me`, `/drop/ground`.