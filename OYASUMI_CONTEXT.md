# 🌑 OYASUMI 2.0 — CONTEXT FILE

> **Versione:** 2.2 (Master Ruleset)
> **Ultimo Aggiornamento:** Gennaio 2026
> **Stato:** 🟢 Attivo

Questo documento descrive **cos’è Oyasumi**, **come funziona**, e **quali regole NON devono essere violate**, indipendentemente dallo stack tecnologico.
È la **Single Source of Truth** per lo sviluppo.

---

## 1. FILOSOFIA DEL MONDO

Oyasumi è un **Dark Fantasy** moderno.
È un mondo:
- **Coerente, ma non punitivo.**
- **Narrativo, ma con conseguenze reali (matematiche).**
- **Dove le regole esistono, ma non schiacciano il gioco.**

👉 **Principio Base:** La storia viene prima, ma **le regole non si piegano arbitrariamente**.

---

## 2. STACK TECNICO (OYASUMI 2.0)

### 🛠️ Backend Core
- **Runtime:** Bun (Performance & Tooling)
- **Framework:** Elysia (HTTP Server & WebSocket)
- **Linguaggio:** TypeScript (Strict Typing)
- **Database:** PostgreSQL
- **ORM:** Drizzle

### 🏗️ Architettura Monorepo
- `apps/server` → API & Runtime
- `packages/domain` → **Logica pura (Regole di gioco)**
- `packages/shared` → Tipi e Utilità comuni
- `packages/config` → Configurazioni ambientali

📌 **Regola Fondamentale (Architettura):**
La logica di gioco ("Domain") **non deve dipendere** da:
- HTTP (Request/Response)
- Database specifico (SQL query dirette nel dominio)
- Framework (Elysia)

---

## 3. MECCANICHE DI GIOCO (CORE MECHANICS)

### 📊 Statistiche Primarie
Il sistema si basa su 5 attributi che definiscono l'Analista:

1.  **Forza [F]:** Potenza bruta e impegno muscolare.
2.  **Costituzione [C]:** Resistenza ai danni (fisici/mentali/spirituali) e capacità di incassare.
3.  **Destrezza [D]:** Rapidità e precisione (offensiva e reazione).
4.  **Mente [M]:** Capacità di analisi (tecnica, terreno, avversari).
5.  **Empatia [E]:** Affinità mistica e capacità di manipolare la *Jiko-ka*.

### 🧮 Formule Derivate ("Quadro Momentaneo")
Le statistiche secondarie sono calcolate automaticamente dal sistema in base alle percentuali definite nel manuale.
*(Nota: Y = Moltiplicatore di Rango/Tier, default 1)*

| Statistica | Descrizione | Formula (da Manuale PDF) |
| :--- | :--- | :--- |
| **Body (HP)** | Resistenza fisica totale. | `[20% F + 80% C] * Y` |
| **Reflexes** | Capacità di reazione. | `[40% M + 60% D] * Y` |
| **Velocità** | Rapidità di spostamento. | `[30% F + 70% D] * Y` |
| **Jigoka** | Riserva spirituale. | `[30% M + 70% E] * Y` |

### ⚔️ Combattimento
Il combattimento avviene **in chat**, a turni alternati. Il **Master/Shinigami** arbitra e dà feedback.
- **Iniziativa:** Reflexes più alto agisce per primo.
- **Chrono Stack (CS):** +3/turno, +1 al difensore per colpo subito. Capacità 20; oltre → Overheat (-1 PV/turno per stack in eccesso).
- **Waza:** costano **CS + Jigoka**.
- **Dadi:** solo su richiesta del Master; tira il giocatore.
- Vedi **COMBAT_SPEC.md** e **CHRONO_STACK.md**.

### 🎒 Inventario (Slot System)
Il sistema abbandona il peso in Kg in favore degli **Slot**.

* **Logica:** L'inventario è una griglia di slot limitati.
* **Base:** Ogni PG inizia con **5 Slot** (corpo libero / tasche).
* **Espansione:**
    * **Equipaggiamento:** Zaini, Tattici, Borse possono aggiungere slot passivi.
    * **Housing:** Le abitazioni fungono da storage, ogni appartamento ha dei bonus relativi agli slot inventario e un bonus sul body (hp).

---

## 4. PROGRESSIONE E SKILL TREE (IL GRIMOIRE)

Il sistema di crescita è ispirato ai videogiochi ("Skill Tree ampio").

### 🌳 Struttura Abilità
- **Skiru:** Abilità passive, requisiti, basi (es. "Padronanza Spade").
- **Waza:** Abilità attive, tecniche, incantesimi (es. "Palla di Fuoco").
- **Path / Eredità:** Patti speciali o percorsi unici (non considerati Waza comuni).

### 💎 Valute di Crescita
Oltre ai soldi (REM), esistono valute specifiche per la crescita (Regole da PDF "Miscellanous"):

1.  **EXP Totale:** Determina il **Livello** (Leveling Table). Non si spende mai.
2.  **EXP Spendibile:** Accumulata scrivendo/questando. Serve per **comprare** Waza e Skill generiche.
3.  **Keys:** Si sbloccano i rami dello Skill Tree. Ogni livello fornisce 1 Key (+ eventuali da quest/acquisti).
4.  **Gems:** Si potenziano le Waza attive (Livello Skill). Ogni livello fornisce 1 Gem; ogni 5 livelli (5, 10, 15…) forniscono 3 Gem.

### 📋 Identità & Creazione
* **Razze:** NON ESISTONO. Tutti gli Analisti sono umani (o alterati, ma meccanicamente omogenei).
* **Ordini:** Scelta obbligatoria tra **Mugen-Tai** o **Chisen-Tai**, all'assegnazione del grado **Hakyō** (può avvenire in qualsiasi momento). ⚠️ Implementazione attuale: scelta permessa in create-character; allineare a Hakyō se serve coerenza.
* **Lavoro (Job):** Ruolo lavorativo (scelto tramite pannello). Garantisce la paga fissa. La paga fissa è di 20 REM ogni 24 ore. 

### 🌊 Flusso Creazione (Onboarding)
L'utente non crea tutto subito. Si registra tramite il nome del personaggio, e dopo essersi ambientato, può compilare la sua scheda personaggio con tranquillità.

1.  **Registrazione:** Email, Password, **Nome PG**. -> *Stato: "Grezzo"* (Stats a 0).
2.  **Setup Iniziale (UI):** L'utente compila tramite la scheda personaggio:
    * Cognome
    * Distribuzione 5 Statistiche Base
    * Upload Avatar (400x350) e Mini-Avatar (100x100)
    * Stesura Background
3.  **A seguito:** In seguito, dopo del tempo di gioco, potrà scegliere l'ordine a cui associarsi, potrà prendere casa in affitto (non obbligatorio), potrà eseguire side-quest o quest, prendere nuove waza / nuove skiru e vivere la sua vita di gioco. 

---

## 5. REGOLE DI DOMINIO (ECONOMIA & HOUSING)

### 💰 Economia (REM)
- **Regola Aurea:** I REM non possono mai andare sotto 0. Non esiste debito.
- **Tracciabilità:** Ogni transazione passa da un *Ledger* centrale.
- **Nessun login bonus:** Non esiste un bonus REM al login; solo lo stipendio da job.

#### Stipendio & Affitto Giornaliero ("Daily Tax")
- Lo stipendio proviene da entità fittizie (Gilda/Ordine/Job).
- **Cooldown:** Riscattabile ogni 24h reali.
- **Tassazione Automatica:** Al momento del ritiro, il sistema **detrae 5 REM** se si ha una **STANZA** dell'Ordine in affitto. 

- *Esempio:* Se stipendio è 50 REM -> Utente riceve 45 REM.
- *Eccezione:* Se (Stipendio < Affitto), il saldo va a 0, mai in negativo.

### 🏠 Housing (Affitti Immobiliari)
Le case vere e proprie seguono regole diverse dalla tassa giornaliera, che viene scalata unicamente se si è scelto di stare nella **STANZA**. La casa infatti, oltre ad avere bonus migliori, conferisce una chat personalizzata (la casa, per l'appunto), a cui è possibile accedere tramite la propria **scheda**.

- **Scadenza:** Pagamento richiesto ogni **15 del mese**.
- **Mancato Pagamento:**
    1.  Il sistema invia 1 avviso al giorno per 7 giorni.
    2.  **Giorno 8 (Sfratto Esecutivo):**
        * Casa persa (torna libera sul mercato).
        * **Inventario Casa perso** (tutto ciò che era nell'armadio è distrutto/sequestrato).
        * Zaino personale (addosso al PG) salvato.
- **Ban & Proprietà:**
    * Se l'Owner viene bannato, gli ospiti **mantengono l'accesso** (le chiavi restano valide finché non scade l'affitto).

---

## 6. BAN SYSTEM

Il sistema di punizione è integrato nel motore di gioco.

#### 👻 Shadowban
Il giocatore gioca, ma è un fantasma.
- ✅ **Può:** Ricevere REM/EXP, spendere REM, muoversi.
- ❌ **Non può:** Influenzare altri utenti (chat invisibile agli altri, tiri di dado annullati silenziosamente).
- **UI:** Appare in lista Presenti con colore ambra e icona occhio chiuso per segnalare il ban.

#### 🚫 Full Ban (Temporaneo)
Il giocatore è bloccato fuori, ma il mondo va avanti.
- ✅ **Continua a:** Pagare affitti (se ha fondi nel conto), rischiare lo sfratto se moroso.
- ❌ **Non può:** Accumulare stipendio, accedere al gioco, chattare.

---

## 7. PRINCIPI DI SVILUPPO

1.  **Domain First:** La logica di gioco vince sulla tecnologia.
2.  **Controller Magri:** I file API gestiscono solo HTTP; la logica sta nei Services.
3.  **Testabilità:** Le formule (es. calcolo danno, stipendio netto) devono essere testabili senza database.
4.  **Coerenza:** Le feature non devono creare paradossi narrativi o matematici.
5.  **Robustezza:** Meglio una regola rigida (es. "non vai sotto zero") che una permissiva buggata.


---

## 8. DISCUSSIONI APERTE (DA DEFINIRE)

### 🎨 Layout & UI/UX
- **Mobile First:** Confermare dock app-like in basso.
- **Desktop:** Sidebar fisse o Floating Windows?
- **Stile:** Nero/Oro/Viola. Font Cinzel/Inter.

### 🎭 Ruoli & Permessi
- **Admin:** Potere assoluto (DB, Config).
- **Master:** Gestione Quest, PNG, Meteo, Tiri Nascosti.
- **Moderator:** (Da valutare se necessario o se accorpato a Master).

### 📜 Quest System (Il Master)
- Assegnazione Quest (Bacheca vs Diretta).
- Strumenti Master: Impersonare PNG, Ricompense rapide in chat.

---