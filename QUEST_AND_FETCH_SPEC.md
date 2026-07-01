# Quest, Fetch e Pannello Shinigami — Specifica

> **Obiettivo:** Definire **Registrazione Quest**, **Chiusura Quest**, **Pannello Shinigami** (Classifica Master, Lore, Fetch) e il **sistema Fetch** (missioni, requisiti, premiazione, collegamento con Registrazione giocata).

---

## 1. Registrazione Quest (per Master / Shinigami)

### 1.1 Modulo obbligatorio

- **Nome della Quest:** campo obbligatorio.
- **Chat:** compilata **automaticamente** in base al luogo/room in cui la quest viene **avviata** (dove il master è quando clicca “Registra Quest”).
- **Tipo di Quest:** scelta obbligatoria tra:
  - **Ambient**
  - **Trama**
  - **Battle**
  - **One-shot**

### 1.2 Avvio e conferma

- Una volta avviata la quest con successo deve apparire una **spia viola** (indicatore di conferma) **nella chat, accanto al titolo room**.
- **Da quel momento la chat viene registrata**: **log completo** dei messaggi (oltre al collegamento room↔quest per azioni/statistiche). Vale per **Quest registrata** e **Giocata registrata**.

### 1.3 Strumento in chat

- **Registra Quest** (solo Shinigami) è uno strumento **contestuale** nella chat (v. MAP_AND_CHAT_SPEC §4.4).
- Apre un modulo/modal con Nome, Chat (auto), Tipo; non è il **Pannello Shinigami** (che ha contenuto diverso).

---

## 2. Chiusura Quest

- **Azione:** **1 azione = 1 messaggio con >500 caratteri totali** (ogni carattere del messaggio, compreso parlato e tag).
- **Selezione partecipanti:** solo chi ha effettuato **più di due azioni** nella chat registrata può essere selezionato come partecipante.
- **Tabellario premi:** assegnazione di:
  - **EXP**
  - **REM**
  - **Drop** (materiali: Common, Uncommon, Rare, Epic, Legendary; lista da definire)
- **Voto segreto “Let this character shine!”:**
  - Lo **Shinigami** indica **un solo** partecipante e gli assegna **un punto**.
  - Il punto è **visibile solo ad Admin e Moderatori**. Gli altri **non vedono nulla** (punteggio segretissimo).

---

## 3. Pannello Shinigami

Il **Pannello Shinigami** (link in header, es. `/shinigami`) ha **contenuto distinto** dallo strumento “Registra Quest” in chat. Comprende:

### 3.1 Classifica Master

- **Visibilità:** solo **Admin** e **Moderatori**.
- **Statistiche automatiche** (sulle **registrazioni quest** soltanto):
  - Azioni eseguite
  - Numero di quest mensili
  - Nomi e frequenza dei partecipanti
  - Punti **“shine”** assegnati
- **Lista dei Master:** consultazione di tutti questi dati nel dettaglio per ogni master.
- **Classifica automatica:** determina il **miglior master del mese**.
- **Classifica utenti:** punti shine collezionati dai giocatori (sempre in questa sezione).

### 3.2 Sezione Lore

- **Trama** = insieme di **quest con lo stesso tema**.
- **Sfogliare:** trame in corso, durata stimata, quest inerenti alla trama, fetch eseguite inerenti.
- **Nuove proposte:** possibilità di **inserire proposte** visionabili dai **vertici gestionali**.
- **Visione e accettazione:** **Admin**, **Moderatore**, **Capo Shinigami** possono visionare le “nuove proposte” e **accettarle**.

### 3.3 Fetch Quest (Missioni)

- **Bacheca interna** di missioni (tipo “giornaliere”):
  - **Le creano gli Shinigami**; i **superiori le approvano**.
- **Requisiti** (esempi):
  - **Livello** del personaggio (v. §7.1)
  - Partecipazione a trame precedenti
  - **Grado** personaggio (v. §7.2)
  - Ordine del personaggio (Mugen-tai, Chisen-tai)
- **Limiti di frequenza:** es. una al giorno, tre a settimana.
- **Fetch completate in attesa di responso:** stato *completata, in attesa di premio + commento Shinigami*.
- **UI dashboard:** le fetch sono **visionabili a scorrimento** sulla dashboard, **sotto al widget del calendario** (col. destra). Si **aprono in window-modality** e si **abbassano** nel dock (come SMS, Shop, ecc.).

---

## 4. Come funzionano le Fetch

### 4.1 Assegnazione

- Se il giocatore ha i **requisiti**, può **assegnarsi** una Fetch.
- **Una sola fetch alla volta**: il giocatore può avere assegnata solo una fetch per volta. Per assegnarne un’altra deve attendere il responso (COMPLETED) della fetch corrente.
- Una volta **assegnata a un giocatore**, la Fetch **non è più fruibile** dagli altri.

### 4.1b Lettura giocate e responso

- **Una volta completata** (giocata pubblicata), la fetch passa **in mano al Master** (stato AWAITING_REWARD).
- La giocata può essere **riletta dal giocatore solo dalla propria Scheda**, nella sezione **Registrazioni** (Journal / Registrazioni).
- Il Master legge la giocata dal **Pannello Shinigami** (sezione “Fetch in attesa di responso”) prima di dare il responso.
- Quando il Master **completa il responso** (Completa + commento opzionale), la **risposta arriva automaticamente** al giocatore come **notifica di sistema** (messaggio real-time via WebSocket).

### 4.2 Collegamento con Registrazione giocata (in chat)

- La **Registrazione giocata** (strumento “Registra Giocata” in chat) è **collegata al sistema Fetch**.
- Quando si apre una registrazione si può **segnalare che è una Fetch** → appare automaticamente la **Fetch assegnata** (al personaggio).
- Quando la **giocata è conclusa e pubblicata**:
  - Vengono **premiati i partecipanti** che hanno fatto **più di quattro azioni** nella registrazione.

### 4.3 Azioni

- **1 azione** = 1 messaggio con **> 500 caratteri totali** (v. §2).
- **Chiusura Quest:** partecipanti selezionabili se **> 2 azioni**.
- **Premio Fetch (post-pubblicazione):** partecipanti premiati se **> 4 azioni**.

---

## 5. Finestre e dock

- **Fetch:** come SMS, Shop, Scheda, Presenti Estesi: apribile in **window-modality** (area centrale), **abbassabile** nel dock.
- **Widget Fetch** in colonna destra: **sotto al calendario**, **a scorrimento**; click → apre finestra Fetch.

---

## 6. Q&A (domande risolte)

| # | Punto | Domanda | Risposta |
|---|--------|--------|----------|
| 1 | **Spia viola** | Dove appare esattamente? (es. nella chat accanto al titolo room, in header, nel dock, altro?) | Nella chat accanto al titolo room. 
| 2 | **Chat registrata** | “Registrata” = solo collegamento room↔quest per conteggio azioni, o anche log completo messaggi “quest” separato? | Anche log completo dei messaggi, questo vale per la **Quest registrata** e per la **Giocata registrata**.
| 3 | **Azione** | 1 azione = 1 messaggio in chat? Caratteri netti o totali? | **Caratteri totali** (ogni carattere, compreso parlato e tag). **1 azione** = 1 messaggio con **>500 caratteri**. |
| 4 | **Drop** | Nel tabellario: “Drop” = tipo **ITEM** esistente o tipo nuovo distinto da ITEM/CUSTOM? | Per Drop si intende una serie di oggetti (materiali). La lista dei materiali la stileremo assieme e saranno suddivisi in categorie: **Common**, **Uncommon**, **Rare**, **Epic**, **Legendary**.
| 5 | **Shine** | Il voto “Let this character shine!” assegna 1 punto; solo Admin/Mod vedono *chi* lo ha ricevuto. Gli altri vedono solo totale “shine” per quest o niente? | Niente. Questo punteggio è estremamente segreto.
| 6 | **Livello / Grado** | “Livello personaggio” e “grado personaggio”: sono già definiti nello schema (stats, ordine) o vanno introdotti? | Da definire; v. tabelle **Livelli** e **Gradi** (§7) da compilare. Usati per requisiti Fetch.
| 7 | **Trama** | “Partecipazione a trame precedenti”: come si definisce una “trama”? (es. insieme di quest con stesso tag/tema?) | Sì: una **trama** è un insieme di quest con lo stesso tema. 
| 8 | **Fetch – chi crea** | Le Fetch sono create dai vertici e gli Shinigami le “richiedono” per sé, o le creano gli Shinigami e i superiori le “approvano”? | Le creano gli shinigami e i superiori le approvano.
| 9 | **Responso Fetch** | “Fetch completate che hanno bisogno di un responso”: significa stato “completata, in attesa di premio + commento Shinigami”? | Sì, esatto. 

---

## 7. Gradi e Livelli

Usati per **requisiti Fetch** (e eventualmente altrove).

- **Livello:** numero 1–50. **Tutti iniziano dal livello 1**, con **25 punti statistica** da distribuire a piacimento. Progressione tramite **EXP cumulativa** (v. tabella).
- **Grado:** titolo di carriera (§7.2). Ogni grado ha un range **Livelli Guida** (min–max); il grado si ricava dal livello.

**Tabella Livelli:** **Exp Δ** = EXP per passare al livello *successivo*; **Exp tot.** = EXP cumulativa per essere a quel livello; **Stat.** = 25 al liv. 1 (da distribuire) e poi +5 per livello; **Tot. stat.** = totale cumulativo statistiche alle soglie indicate.

### 7.1 Livelli

| Liv. | Exp Δ | Exp tot. | Stat. | Tot. stat. | Fase |
|------|-------|----------|-------|------------|------|
| 1 | — | — | 25 (da distribuire) | — | EARLY-GAME |
| 2 | 50 | 50 | +5 | — | |
| 3 | 89 | 139 | +5 | — | |
| 4 | 128 | 267 | +5 | — | |
| 5 | 167 | 434 | +5 | 45 | |
| 6 | 206 | 640 | +5 | — | |
| 7 | 245 | 885 | +5 | — | MID-GAME |
| 8 | 284 | 1.169 | +5 | — | |
| 9 | 323 | 1.492 | +5 | — | |
| 10 | 362 | 1.854 | +5 | 70 | |
| 11 | 401 | 2.255 | +5 | — | |
| 12 | 440 | 2.695 | +5 | — | |
| 13 | 479 | 3.174 | +5 | — | |
| 14 | 518 | 3.692 | +5 | — | |
| 15 | 557 | 4.249 | +5 | 95 | |
| 16 | 596 | 4.845 | +5 | — | |
| 17 | 635 | 5.480 | +5 | — | |
| 18 | 674 | 6.154 | +5 | — | |
| 19 | 713 | 6.867 | +5 | — | |
| 20 | 752 | 7.619 | +5 | 120 | |
| 21 | 791 | 8.410 | +5 | — | |
| 22 | 830 | 9.240 | +5 | — | |
| 23 | 869 | 10.109 | +5 | — | |
| 24 | 908 | 11.017 | +5 | — | |
| 25 | 947 | 11.964 | +5 | 145 | |
| 26 | 986 | 12.950 | +5 | — | CORE (Molto lento) |
| 27 | 1.025 | 13.975 | +5 | — | |
| 28 | 1.064 | 15.039 | +5 | — | |
| 29 | 1.103 | 16.142 | +5 | — | |
| 30 | 1.142 | 17.284 | +5 | 170 | |
| 31 | 1.181 | 18.465 | +5 | — | |
| 32 | 1.220 | 19.685 | +5 | — | |
| 33 | 1.259 | 20.944 | +5 | — | |
| 34 | 1.298 | 22.242 | +5 | — | |
| 35 | 1.337 | 23.579 | +5 | 195 | |
| 36 | 1.376 | 24.955 | +5 | — | |
| 37 | 1.415 | 26.370 | +5 | — | |
| 38 | 1.454 | 27.824 | +5 | — | |
| 39 | 1.493 | 29.317 | +5 | — | |
| 40 | 1.532 | 30.849 | +5 | 210 | |
| 41 | 1.571 | 32.420 | +5 | — | |
| 42 | 1.610 | 34.030 | +5 | — | |
| 43 | 1.649 | 35.679 | +5 | — | |
| 44 | 1.688 | 37.367 | +5 | — | |
| 45 | 1.727 | 39.094 | +5 | 235 | |
| 46 | 1.766 | 40.860 | +5 | — | |
| 47 | 1.805 | 42.665 | +5 | — | |
| 48 | 1.844 | 44.509 | +5 | — | |
| 49 | 1.883 | 46.392 | +5 | — | |
| 50 | 1.922 | 48.314 | +5 | 260 | |

I **Livelli Guida** dei Gradi (§7.2) usano questa scala (1–50). *Fasi:* EARLY-GAME 1–6, MID-GAME 7–25, CORE 26–50.

### 7.2 Gradi — Carriera Militare Analisti

| Grado | Definizione | Livelli Guida |
|-------|-------------|---------------|
| **Nemuribito** | Sognatore. Ha appena aperto il terzo occhio e non ha idea di come si manipoli l’ego con successo. Ha ottenuto la vista onirica; deve ancora destreggiarsi fra ordini e potenzialità. | 1–3 |
| **Hakyō** (Hakyou) | Lo specchio infranto. Cadetto: ha superato la soglia del sognatore, ha scelto l’ordine e si è iniziato allo studio accademico della manipolazione dell’Ego. | 3–10 |
| **Bunsekikan** | Analista. Affermato, riconosciuto come abile nella manipolazione. Corrispettivo del soldato. | 11–18 |
| **Sentatsu Bunsekikan** | Analista Superiore. Specializzato in almeno un ramo, spicca per talento o intelletto. In grado di grandi cose nel proprio settore. | 18–28 |
| **Kanteikan** | Analista Esecutivo. Alle vette della carriera; conoscono quel che possono offrire (esperienza e maestria nell’ego). Spesso a capo di settori o battaglioni. | 28–38 |
| **Shin’enkan** | Guardiano dell’Abisso. Ufficiali per cui il mondo onirico non ha più segreti. Comandano legioni, capitanano guerre e manovre vincenti; molteplici assi nella manica oltre il potenziale d’ego. | 38–48 |
| **Akumu Zankyō** (Zankyou) | L’eco dell’Incubo. Non più considerato Analista né persona; parte del cosmo onirico. Chi si salva dal delirio diventa one-man-army, arma senziente; il grado militare decade a favore di un titolo unico, riconoscibile con il nome di una psicopatologia. | 48+ |

*(Eventuali altre carriere — es. non Analisti — da aggiungere in tabelle separate.)*

---

*Ultimo aggiornamento: Gennaio 2026*
