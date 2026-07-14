# OYASUMI · Specifica — Pannello di Combattimento (vista Giocatore)
### Documento di riferimento per l'implementazione · da dare a Claude Code

> **Cos'è.** Una finestra in-game estendibile/riducibile, agganciata al doc di giocata esistente, che il giocatore apre quando la sua azione è una waza che interagisce col mondo. **Affianca la narrazione, non la sostituisce:** il giocatore scrive la sua azione nella text area della chat; il pannello serve a dichiarare i parametri della waza (Indice, Danno), mostrarli, e produrre la card d'esito in chat.
>
> **Principio-guida assoluto — registro vivo, non motore.** Le persone dichiarano e cliccano; il pannello **ricorda lo stato** (agganciato alla registrazione della giocata/quest) e **calcola i bonus/effetti al momento del lancio o dell'applicazione**. Il pannello NON osserva gli eventi di combattimento in tempo reale (quello è il motore automatico, feature futura).

---

## 0. LA LINEA NETTA — cosa fa il pannello, cosa resta al master

**Il pannello CALCOLA (in automatico, al lancio):**
- L'**Indice di Riuscita** (IR): media delle due Skiru papabili scelte + tutti i modificatori leggibili dallo stato (altre Skiru, combo, oggetti, status attivi, nodi Sōkaiju, milestone).
- Il **Danno lordo**: valore-tier + bonus/malus situazionali (+Tier, +Skiru, +CAC/CAD con varianti %, /X, e i loro malus).
- I **parametri derivati del costrutto** dalla taglia (Resistenza, Movimento, Danno, HP) via tabella Taglie.
- I **CS residui** dopo il lancio (costo waza + eventuale Batteria −5).
- Gli **effetti degli stack** che il giocatore/master ha inserito a mano (es. Emorragia ×3 = −6 HP a fine turno, persistente fino a scadenza stack).
- Lo **spegnimento** delle waza non lanciabili (CS insufficienti, condizione stack/grado non soddisfatta).

**Il pannello NON FA (resta al master / feature futura):**
- Non fa **salire gli stack** da solo. Li inserisce il giocatore/master a mano (+1 Pressione, +1 Emorragia). Il pannello ne legge il valore per i calcoli.
- Non decide se il **colpo entra**: il confronto IR attaccante vs difesa lo arbitra il master. (Eccezione futura: combattimento automatico coi PNG.)
- Non gestisce **macchie, zone, status altrui**: visibili e gestiti solo dal master (Tulpa Shinigami).

---

## 1. MECCANICHE MULTIPLE — il principio-cardine

Un PG può avere fino a **3 Dō + 1 Madoshō**, più waza d'ordine, generiche e premi. **Ogni Dō/Madoshō porta la sua meccanica di stile, e queste COESISTONO tutte attive insieme.** Il pannello deve mostrarle tutte nel cruscotto e far sì che ogni waza legga la meccanica del *suo* stile.

**Le meccaniche di stile (contatori/stati distinti, mai confusi):**
| Stile | Meccanica | Natura | Slug |
|---|---|---|---|
| Tōka-dō | **Tōrō** | oggetti dichiarati (lista) | — |
| Hadō-dō | **Kaden (荷電) — Carica** | soglia 20+Konjou, +tier a CS≥12, Overheat +2 tier, frattura −5HP/+tier | `kaden` |
| Itō-dō | **Tensione (緊張)** | stack, soglia 2+Fudōshin, cedimento oltre soglia | `tensione` |
| Gōkaon | **Pressione (圧)** + **Metamorfosi** (status) | stack fino a 12, soglie 2/5/9 | `pressione`, `metamorfosi` |
| Naikan-dō | **Junkan (循環)** | capacità 3+Itami di Potenziamenti simultanei | `junkan` |
| Rin'gai | **Macchie** (master) + **Macchiato** (status a stack) | macchie=nota master; Macchiato=counter spendibili | `macchiato` |
| Genzai-dō | **Gosa (誤差)** + **Mei** | max costrutti 2+Seimitsu | — |
| Hensei-dō | *(meccanica da definire)* | — | — |

> **CRITICO:** Kaden (Hadō) e Pressione圧 (Gōkaon) sono **due contatori diversi** con slug diversi. Un PG con entrambi gli stili ha ENTRAMBI nel cruscotto, separati. Non confonderli mai. (Rinomina già applicata: Hadō = Kaden, non più "Pressione/Atsuryoku".)

**Ordine e Premio NON aggiungono meccaniche** — contribuiscono solo waza al catalogo.

**Caso di riferimento (da dare per scontato nel design):** un PG con 3 Dō + 1 Madoshō + ordine + premio ha, nel cruscotto, fino a 4 meccaniche di stile attive insieme, e nel catalogo waza da 5 fonti. Il pannello deve reggere questo senza diventare caotico (vedi §3, navigazione).

---

## 2. STRUTTURA DEL PANNELLO — zone

### Zona 1 · Cruscotto (sempre visibile)
- **HP** (correnti/max, barra), **CS/Chronostack** (correnti, barra su max).
- **Parametri d'attacco:** IR base, CAC, CAD, Movimento.
- **Parametri di difesa (sempre a portata, evidenziati):** **Schivata**, **Parata**.
- **Meccaniche di stile attive:** tutte quelle dei suoi stili, come contatori/badge (Tōrō attivi, Kaden, Tensione, Pressione圧, Metamorfosi, ecc.), ognuna col suo valore. Con pulsante **+/−** per aggiornare a mano gli stack.
- **Status attivi** (a stack): badge con conteggio, aggiornabili a mano.
- Accesso alla **Zona Campo** (tab laterale).

### Zona 2 · Dichiarazione d'uso (cosa impugni / cos'è Tōrō ORA)
- L'equipaggiamento è **in scheda** (fuori dal pannello). Qui il giocatore dichiara solo **cosa sta usando in questo momento**.
- Lista delle armi impugnabili; per ciascuna il flag **"rendi Tōrō"**. **Più oggetti possono essere Tōrō insieme** (Tōrō liberi e multipli; il Giocattolaio ne accende molti).
- Vincolo armi impugnate: **max 1**, salvo **Ambidestria** (max 2).
- **Munizioni** (conteggio) per armi da fuoco: calano sugli **spari normali**; a secco non spari. **Le waza ignorano le munizioni.**

### Zona 3 · Lancio Waza (cuore)
Navigazione (regge 40+ waza da 5 fonti — vedi §3):
- **Barra di ricerca** (nome/stile).
- **Filtri per fonte** (Tutte/Stili/Madoshō/Ordine/Generiche/Premi) + filtro **"lanciabili ora"**.
- Fila **Preferiti** (waza più usate).
- **Elenco unico** (NON tab separati per fonte — sarebbe caos): ogni waza porta un badge-fonte colorato. Lanciabili in cima, **non-lanciabili spente in fondo** con il motivo (CS/stack/grado mancante).

Selezionata una waza → **Configurazione**:
- **Due Skiru papabili** per l'IR (menu con solo le papabili di quella waza).
- **Controlli condizionali** che compaiono SOLO se la waza li richiede (vedi §4).
- **Anteprima card** (Indice, Danno + [+] calcoli espandibili).
- **Bersaglio** + **Lancia**. Mostra CS residui.

### Zona 4 · Esito (per ora minimale)
- Selezioni il bersaglio → esce la **card in chat** (nome, IR, danno già ridotto da scudo/mitigazione, + [+] dettaglio). Il pannello **non decide** se entra (arbitrato master). La logica automatica "entra/non entra" è riservata alla feature futura (PNG).

### Zona 5 · Campo (tab laterale, si apre orizzontalmente al bisogno)
- **Costrutti attivi** e loro stato di vita (HP/Resistenza rimanente, taglia, sticker).
- Azione **"agisci sul costrutto già in campo"**: attaccare/rimuovere sticker, cambiare stato, cedere il controllo (campo *controllore* distinto dal *creatore* — per Ubaiito, Inversione di Proprietà, Dominazione Onirica).
- **Solo per il giocatore:** i propri costrutti. Macchie, zone, status altrui → solo master.

---

## 3. NAVIGAZIONE WAZA (regge il PG evoluto)

Le waza di tutte le fonti stanno in **un unico elenco** (non separato per tab). Tre strumenti combinati, il giocatore usa quello che preferisce:
1. **Ricerca** — per chi sa cosa vuole.
2. **Filtri** (fonte, lanciabili-ora) — per restringere.
3. **Preferiti** — accesso rapido alle più usate.
4. **Ordinamento** — lanciabili in cima, non-lanciabili spente in fondo (col motivo).

Ogni waza mostra: nome (rōmaji + IT), **badge-fonte** (Stile/Madoshō/Ordine/Generica/Premio, colorato), tag, tier, CS.

---

## 4. CONTROLLI CONDIZIONALI (i casi-limite del regolamento)

Il pannello è **guidato dai dati**: mostra un controllo SOLO se la waza ha la proprietà relativa. Come i controlli-costrutto appaiono solo se la waza evoca, così:

| Se la waza ha… | Compare il controllo… | Stili tipici |
|---|---|---|
| **evoca costrutto** | taglia + sticker (Batteria −5CS, Personale, Tōrō) + parametri derivati | Genzai, Tōka, Rin'gai, Itō |
| **requisito di grado** | (spegnimento se `grado < X`) | Giocattolo/Giocattolaio, Itō nuove |
| **condizione stack** | (spegnimento se `stack(X) < N`) | Gōkaon, Rin'gai |
| **intensità Kaden (Hadō)** | selettore "quanto trattieni": CS≥12 (+1 tier), Overheat (+2 tier), **frattura volontaria** (−5 HP → +1 tier, max +2) | Hadō |
| **multi-quarto a stadi** | selettore **quarti** (1/4 → 4/4), con effetto crescente per stadio | Rin'gai (Uzu), Itō (Rensa) |
| **trasforma i propri tag** | controllo "cambia consistenza/categoria durante il lancio" | Itō (Yugami, Someito), Genzai |
| **potenziamento a Skiru** | selettore "a quale Skiru applichi il buff" | Naikan |
| **spesa counter** | selettore "quanti stack spendi e per quale effetto" | Rin'gai (Yobimodoshi) |
| **effetto rimandato** | stato "in attesa" (waza caricata ora, parte dopo) | Tōka (Fuin no Hi), Itō (Rensa, Hikitome) |
| **tutta a nota master** | card **solo narrazione** (nessun numero IR/danno; testo per il master) | Rin'gai (macchie), Gōkaon (percezioni) |

---

## 5. I CALCOLI (formule che il pannello esegue)

**Indice di Riuscita:**
`IR = (Skiru A + Skiru B) / 2 + Σ modificatori`
- Modificatori: altre Skiru, combo, oggetti, status, nodi Sōkaiju (Meiju: +1,5%/punto IR della categoria), milestone (Erede +10-15% IR, ecc.).

**Danno lordo:**
`Danno = valore-tier + bonus/malus`
- Scala tier: T1=4, T2=8, T3=12, T4=17, T5=23.
- Bonus: [+1 Tier] (sale di gradino), [+CAC/CAD] (con varianti %, /X), [+Skiru] (con varianti). Nodi Sōkaiju (Shiju: +1,5%/punto danno). Milestone (+Danno).
- La base resta il tier fisso; lo scaling è solo bonus situazionale.

**Difesa (nel cruscotto, per il confronto arbitrato dal master):**
- `IR_schivata = Hansha + (0,5 × Chōkaku)`
- `IR_parata = Konjō + (0,5 × Kairiki)`

**Costrutto (parametri derivati dalla taglia):**
- `Resistenza = ⌊(rank Kongen + numero_tier) × mult_taglia⌋`
- `Movimento = ⌊movimento_base × mult_taglia⌋` (0 se statico)
- Danno: override (Tōrō/waza) vince; altrimenti tier + bonus taglia; Piccola/Media senza override = nessun danno.
- Tabella Taglie: Piccola ×0,5/×1/+0 · Media ×1/×0,75/+0 · Grande ×1,5/×0,5/+1tier · Enorme ×2/×0,25/+2tier. Arrotondamento sempre per difetto.

**Kaden (Hadō):**
- Soglia sicurezza = 20 + Konjou. A CS≥12: +1 tier alle emissioni. Overheat (oltre soglia): +2 tier + drain. Frattura volontaria: −5 HP → +1 tier (max +2/waza).

**Effetti stack (applicati dal pannello, stack inseriti a mano):**
- Es. Emorragia: −2 HP × stack a fine turno, finché le stack non scadono/si risolvono.
- Es. soglie Pressione圧 → conferiscono Metamorfosi (il pannello segnala, il giocatore applica).

---

## 6. PERSISTENZA DELLO STATO

- Lo stato di combattimento vive **agganciato alla registrazione della giocata/quest** (sistema già esistente: giocate normali, fetch quest, quest).
- **Pausa** = salva lo stato completo (Tōrō dichiarati, costrutti in campo, waza attive/in attesa, stack di status e meccaniche).
- **Pausa e fine sessione** = **reset di stack e status del PG**, ECCETTO gli **HP** (che persistono).

---

## 7. NOTE PER L'IMPLEMENTAZIONE

- Il pannello è **guidato dai dati/atomi**: non conosce le waza una per una, legge le loro proprietà (come l'editor). Aggiungere un controllo condizionale = leggere una proprietà della waza e mostrare il controllo relativo.
- **Mockup di riferimento** per l'estetica e il layout: `lancio-waza-mockup-v2.jsx` (cruscotto + dichiarazione d'uso + navigazione + controlli costrutto + card).
- **Due pannelli di pari importanza:** questo (Giocatore) e la **Tulpa Shinigami** (Master, vista completa: tutti i PG, tutti i costrutti, macchie/zone/status altrui, creazione/gestione PNG; nulla in chat, tutto reminder privato). La Tulpa Shinigami estende questo pannello con controllo totale e ordinato. (Spec a parte.)
- **Iter:** locale → test → la creatrice testa/controlla → la creatrice pubblica. NON toccare Neon senza deploy ordinato.

---

## 8. CHECKLIST DI COPERTURA (cosa il pannello deve saper mostrare)

- [ ] PG con 1 stile · con 3 Dō + Madoshō (meccaniche multiple coesistenti)
- [ ] Tōrō multipli e liberi
- [ ] Armi impugnate (1, o 2 con Ambidestria) + munizioni (spari normali)
- [ ] Waza da 5 fonti in elenco unico navigabile
- [ ] Waza spente per CS / stack / grado (col motivo)
- [ ] Waza che evoca costrutto (taglia, sticker, Batteria −5CS, parametri derivati)
- [ ] Waza Hadō con intensità Kaden (CS≥12 / Overheat / frattura)
- [ ] Waza multi-quarto (Uzu)
- [ ] Waza che trasforma i propri tag (Itō/Genzai)
- [ ] Waza con potenziamento a Skiru scelta (Naikan)
- [ ] Waza con spesa counter (Yobimodoshi)
- [ ] Waza a effetto rimandato (Fuin no Hi, Rensa)
- [ ] Waza tutta-nota-master (card solo narrazione)
- [ ] Costrutti in campo: agire, cedere controllo
- [ ] Difesa (Schivata/Parata) sempre visibile
- [ ] Persistenza su giocata; reset stack a fine sessione (tranne HP)
