# Mappe, Chat e Presenza — Specifica

## 1. Mappe

### 1.1 Root map (Giappone interattivo)

- **Componente:** `apps/client/src/components/dashboard/map/JapanInteractiveMap.tsx` (Leaflet + GeoJSON)
- **GeoJSON:** `public/maps/geo/japan-prefectures.geojson` (prefetture, semplificato; fonte `dataofjapan/land`)
- **Regioni di gioco:** mappate in `japan-regions.ts` (Ogon←Tokyo hub, Izayoi←Kyoto/Kansai, Onimori, Ezochi, Altrove)
- **Rollback asset statico:** `public/maps/map-legacy.png` / `worldmap.png`
- **Clic regione / prefettura** → zoom `fitBounds` + pannello «Entra» → mappa di gioco.

### 1.2 Mappa di gioco (es. Ogon)

- **Sottomappe** (zone): **Kessen**, **Edo**, **Kotowari**, **Hamanachi**
- **Clic su sottomappa** → schermata **[Nome zona]** + **lista chat** (luoghi con chat).

### 1.3 Zona → Lista chat

- **Kessen**
  - **cosmicon-complex** (contenitore) → dentro: **junk town**, **arcade palace**, **milky way** (ogni uno con chat)
- **Edo**
  - **paradise** (chat), **Ginza o' Clock** (chat)
- **Kotowari**
  - **astrolabio** (chat), **Osservatorio** (chat)
- **Hamanachi**
  - **Casa da tè** (chat), **Ospedale** (chat)

**Clic su una chat** → si apre l’**interfaccia narrativa** (chat) per quel luogo.

---

## 2. Meteo

- **Prefetture** (Edo, Kessen, Kotowari): meteo legato alla **prefettura**.
- **Qualsiasi chat** all’interno di quella prefettura **usa quel meteo**.
- **Hamanachi** non è prefettura → meteo N/D nelle chat di Hamanachi.

---

## 3. Presenza

| Concetto | Descrizione |
|----------|-------------|
| **Lista Presenti** | **Chi è online** (tutti i connessi). |
| **Presenti Estesi** | Chi è online **+ dove si trova** (mappa/zona/chat), quando si sta giocando. |
| **Presenti in chat** | Chi è **in quella specifica chat** (room). |

- Lista presenti: sempre “tutti online”.
- Presenti estesi: stessi + “dove”.
- In chat: solo chi ha aperto quella chat (entrato in quella room).

---

## 4. Interfaccia Chat (Interfaccia narrativa)

### 4.1 Layout

- **Sinistra**
  - Immagine del luogo
  - Descrizione ambientale
  - **Note Master** (modificabili solo da Shinigami)
- **Destra**
  - Flusso messaggi
  - Input + strumenti

### 4.2 Formato messaggi

- Testo **giustificato**
- **Intestazione** (per messaggio):
  - Mini-avatar
  - Nome e cognome
  - Icone pixel (ruolo / ordine)
  - **Tag del luogo** (es. `[Ginza o' Clock]`)

### 4.3 Parsing e regole

- **Parlato** → `« … »`
- **Tag narrativi** → `[ … ]`
- **Contatore caratteri:** base per EXP **(non visibile)**; meccanismo anti-spam implicito.

### 4.4 Input e strumenti

- **Tag Luogo:** compilato **dal giocatore** (indica la sua posizione all’interno del luogo/chat, es. «bancone», «ingresso»). Ogni messaggio può avere un tag luogo.
- **Campo di testo** per il messaggio
- **Strumenti contestuali:**
  - **Global Message** (Admin)
  - **Registra Quest** (Shinigami) — modulo in-chat (Nome, Chat auto, Tipo: Ambient/Trama/Battle/One-shot). **Non** è il Pannello Shinigami. V. **QUEST_AND_FETCH_SPEC** §1.
  - **Registra Giocata** (Tutti) — partecipa a una quest aperta; collegato al sistema Fetch (si può segnalare "è una Fetch" → appare fetch assegnata). V. **QUEST_AND_FETCH_SPEC** §4.
  - **Modalità Hunt** (futuro)
  - **Pulisci chat** (Shinigami/Admin/Mod) — icona scopa; nasconde i messaggi dalla vista (restano nel Log).
- **In futuro:** tool per lanciare in chat **waza**, **skiru**, **oggetti equipaggiati**.

### 4.5 Quest attiva e chat registrata

- Quando una **Quest** è **avviata** dalla chat (Registra Quest), appare una **spia viola** di conferma.
- **Da quel momento** i messaggi nella room sono **registrati** per quella quest (azioni, partecipanti, premi). V. **QUEST_AND_FETCH_SPEC** §1–2.

### 4.6 Durata messaggi in chat

- **Qualsiasi azione** (normale, shinigami, globale) **dura in chat 1h30** dal momento dell’invio.
- Dopo 1h30 le azioni **scadono automaticamente** (non sono più visibili in chat, restano nel Log).
- **Pulisci chat**: pulsante (Shinigami/Admin/Mod) che “fa scadere” subito tutte le azioni visibili; la chat diventa vuota, ma le azioni restano nel Log.

---

*Ultimo aggiornamento: Gennaio 2026*
