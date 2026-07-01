# 🎮 OYASUMI 2.0 — Specifica Layout di Gioco

> **Obiettivo:** Definire **come funziona il sito** (Login, Dashboard, Footer) prima dell’implementazione.
> **Stile di riferimento:** Nero / Oro / Viola. Font Cinzel + Inter (da OYASUMI_CONTEXT).

---

## 1. Pagina Login

- **Box di accesso:** Login tramite **Nome PG** + **Password**.
  - **Nome Utente = Nome PG.** L’utente è il personaggio (Utente = PG).
- **Recupero password:** Tramite **email**. Link “Password dimenticata?” → inserimento email → invio link/token di reset.

---

## 2. Dashboard (post-login)

La Dashboard è la **schermata principale di gioco**. Struttura: **Header** + **Tre Colonne** + **Footer**.

### 2.1 Header

- **Titolo:** Neon dorato + **Motto**.
- **Link di navigazione:**
  - Guida
  - Ambientazione
  - Forum
  - Gestione
  - **Pannello Shinigami** — v. **QUEST_AND_FETCH_SPEC** §3 (Classifica Master, Lore, Fetch Quest). **Diverso** dallo strumento “Registra Quest” in chat.
- **Logout** (link/bottone in header).

---

### 2.2 Colonna Sinistra

| Blocco | Descrizione |
|--------|-------------|
| **Mini-Profilo** | Avatar Chat, Nome PG, Cognome PG (se presente), Icone pixel (se presenti). |
| **SMS** | Icona notifiche (luce + suono). Interfaccia stile **WhatsApp**. |
| **Media** | **Player YouTube** + Pulsanti: **Banca**, **Shop**, **Waza**, **Ordine**. |
| **News Visor** | Stile **arcade anni ’80**, testo viola scorrevole a righe **CRT**. |

---

### 2.3 Area Centrale

- **Mappe gerarchiche** (v. **MAP_AND_CHAT_SPEC**): root `map.png` + pin → mappe di gioco (Ogon, Izayoi, …); click sottomappa → [zona] + lista chat; click chat → interfaccia narrativa (split: immagine/desc/note | messaggi, Tag luogo, strumenti).
- Qui carica **tutto ciò che non è “window-modality”** (contenuto principale: mappe, chat per location, ecc.).

---

### 2.4 Colonna Destra

| Widget | Descrizione |
|--------|-------------|
| **Weather Widget** | **Meteo collegato alla zona attuale.** Edo → Edo, Kessen → Kessen, Kotowari → Kotowari. Sogno/Limbo/Altrove → meteo N/D. Icona calendario: click → box sotto con **evento in corso** (popolato solo se in corso). Eventi gestiti da **mod/admin**. |
| **Calendario** | Icona nel widget meteo; box sotto popolato **solo se è in corso un evento**. |
| **Fetch (Missioni)** | **Sotto al calendario.** Bacheca fetch a **scorrimento**. Click → apre **finestra Fetch** in **window-modality** (come SMS, Shop). Finestra **abbassabile** nel dock. V. **QUEST_AND_FETCH_SPEC** §3.3, §4. |
| **Lista Presenti** | **Real-time** (chi è nella zona/sessione). |
- **Prefetture e meteo:** Ogni prefettura = meteo di un’area del Giappone (inventato). **Meteo = zona in cui giochi** (mappa). Regione **Ogon**: Edo (Tokyo), Kessen (Fuji), Kotowari (Sendai). In **creazione mappe** modificabile da admin.

---

### 2.5 Dock inferiore (Footer)

- Il **dock** ospita le finestre **solo quando abbassate**. Non si aprono da qui.
- **Apertura (window modality):**
  - **Scheda:** click su **nome/immagine** nel **Mini-Profilo** (col. sinistra).
  - **Presenti Estesi:** click su **Lista Presenti** (col. destra); quando abbassata va nel dock.
  - **Shop:** click su **Shop** nel menu Media (col. sinistra); quando abbassata va nel dock.
  - **Fetch (Missioni):** widget a scorrimento sotto calendario (col. destra); click → finestra Fetch; abbassabile nel dock. V. **QUEST_AND_FETCH_SPEC**.
- Le finestre si aprono **sull'area centrale** (overlay). In finestra: **_ (abbassa)** → va nel dock; **× (chiudi)** → chiude e rimuove dal dock. Click sull’icona nel dock → si rialza (riapre).

**Finestre previste:** Scheda, Presenti Estesi, Shop, **Fetch**.

---

## 3. Riepilogo struttura

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER: Titolo neon + Motto │ Guida │ Ambientazione │ Forum …  │
├──────────────┬──────────────────────────────┬───────────────────┤
│ COL. SINISTRA│      AREA CENTRALE            │   COL. DESTRA     │
│              │                              │                   │
│ • Mini-Profilo│  Mappe cliccabili            │ • Weather+Calend. │
│ • SMS        │  (zona / chat)                │ • Fetch (scroll)  │
│ • Media      │  Contenuto non window-modal   │ • Lista Presenti  │
│ • News Visor │                              │   (real-time)     │
├──────────────┴──────────────────────────────┴───────────────────┤
│  FOOTER: nav bar – Finestre abbassabili: [Scheda] [Presenti] [Shop] [Fetch] │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Pixel-icon vs Icon

### Definizioni

- **pixel-icon** = icone piccole **20×20 px** che decorano il **nome del possessore** e ne definiscono i ruoli. Come medagliette, visibili **ovunque sia visibile il nome** (Mini-Profilo, Lista Presenti, Scheda, chat, ecc.).
- **icon** = icone UI standard (es. Font Awesome) per pulsanti, widget, layout. *Non* decorano il nome.

### Categorie pixel-icon (per ora)

| Categoria | Valori | Note |
|-----------|--------|------|
| **ruolo** | admin, moderatore, capo shinigami, shinigami | Ruoli di gestione / Shinigami. |
| **ordine** | mugen-tai, chisen-tai | Ordini di appartenenza. |
| **premio speciale** | *(da definire)* | Medagliette premi speciali. |

Le pixel-icon sono associate al personaggio e mostrate accanto al nome (es. `Nome PG [admin][mugen-tai]`). Formato grafico e asset 20×20 da definire in seguito.

---

## 5. Note per l’implementazione

- **Login:** **Nome Utente = Nome PG.** Utente = PG. Login con nome personaggio + password (email solo per recupero).
- **Recupero password:** Tramite email (endpoint `POST /auth/forgot-password`). Per ora risposta generica; TODO: token + invio email.
- **Dock:** Solo finestre abbassate; apertura da Mini-Profilo / Lista Presenti / Shop (vedi sopra).

### Specifiche correlate

- **QUEST_AND_FETCH_SPEC:** Registrazione Quest, Chiusura Quest, Pannello Shinigami (Classifica Master, Lore, Fetch), sistema Fetch, collegamento con Registrazione giocata.

### Implementato (Gen 2026)

- Layout base: font Cinzel + Inter, palette nero/oro/viola.
- Pagina Login: Nome PG + Password, link “Password dimenticata?” → `/auth/forgot-password`.
- Backend: login per `nomePg` + password; `POST /auth/forgot-password` (placeholder).
- Dashboard: Header (titolo neon + motto, link Guida/Ambientazione/Forum/Gestione/Shinigami, **Logout**), tre colonne, dock inferiore (solo finestre abbassate).
- **Finestre:** Scheda (da Mini-Profilo), Presenti Estesi (da Lista Presenti), Shop (da Media). Si aprono sull'area centrale (overlay); barra titolo con **_ (abbassa)** e **× (chiudi)**. Abbassa → dock; chiudi → chiude e rimuove dal dock; click dock → rialza.
- **Meteo + Calendario:** Calendario nascosto. Icona calendario nel widget Prefettura; box sotto (toggle) popolato solo se evento in corso. **Meteo collegato alla zona:** Edo/Kessen/Kotowari → meteo prefettura; Sogno/Limbo/Altrove → N/D. Modificabile in creazione mappe. Eventi gestiti da mod/admin.

---

*Ultimo aggiornamento: Gennaio 2026*
