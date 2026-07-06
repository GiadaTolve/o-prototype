# Sistema Chrono Stack [cs]

> **Allineato a v3** — UltimateManual.docx, Giugno 2026.
> Breaking vs legacy: Overheat aggiornato a **−2 HP/stack** oltre 20, max **3 turni** prima del Defaticamento (−50% stack); tabella limiti waza aggiornata.

Il **Chrono Stack System** è un sistema che valorizza i movimenti in azione basandosi su unità definite, tipiche dei JRPG. Le stack si accumulano automaticamente e sono usabili tramite l'interfaccia di gioco, seguendo il regolamento base e le eventuali skill di accumulo o effetti.

---

## Cosa sono le Chrono Stack?

- **Livello "off" (fuori dal ruolo):** le stack sono una risorsa che determina cosa puoi fare in un'unica azione.
- **Livello "on" (in ruolo):** le chrono stack non esistono con questo nome, ma come riconoscimento della **potenza** di una skill.
- Le chrono stack (per le skill) indicano la **potenza impiegata**, non il tempo. Se non indicato diversamente, il tempo delle skill è lo stesso indipendentemente dalle stack usate.

---

## Regole base

- **Ogni movimento** che interagisce fisicamente con scenario, personaggi o PNG ha un **costo [cs]**, salvo indicazione contraria.
- Va dichiarato in azione nell'apposito tag e descritto in modo appropriato con i movimenti del personaggio.
- L'automatismo è un'agevolazione; il master può annullare un movimento mal descritto o non descritto.

> ⚠️ **Attenzione:** Tutto è da intendersi "salvo specifica differente". Le regole possono variare in base a skill o altri effetti.

---

## Accumulare Chrono Stack

La pool di stack è una risorsa da gestire con pianificazione: è cumulativa ma **volatile**. Le stack consumate non tornano indietro; una cattiva gestione può portare alla sconfitta.

| Modo | Stack ottenute |
|------|-----------------|
| **A turno** (dal turno d'iniziativa) | +3 cs |
| **Ogni colpo a segno subito** | +1 cs al difensore |
| **Skill** (accumulo, bonus, ecc.) | Varie (vedi albero skill) |
| **Skill** (decremento avversario) | Riduce le stack nemiche |
| **Skill** (aumento alleati) | Aumenta le stack degli alleati |

---

## Condizione di Overheat

### Capacità naturale

- **Capacità di carica:** 20 stack — ciò che il corpo dell'analista può sopportare senza ripercussioni.
- È possibile accumulare **oltre 20 stack**, ma si entra in **Overheat**.

### Effetto Overheat

- **Ogni stack oltre le 20** causa **−2 HP per turno** all'utilizzatore.
- Esempio: 24 stack → 4 in esubero → **−8 HP/turno** finché non si scaricano le stack.
- La fase di sovraccarico è uno slancio di frenesia/adrenalina: il corpo è visibilmente danneggiato ma il PG non sente dolore né fatica.
- Dopo **3 turni** continuativi in Overheat scatta il **Defaticamento** (vedi sotto).

### Defaticamento (dopo 3 turni in Overheat)

Dopo **3 turni consecutivi** sopra 20 stack (ancora in Overheat):
- Le stack rimanenti sono ridotte del **50%** (per difetto), **oppure**
- Si resta **fermi per un turno** (salta turno).

Il Defaticamento è gestito dal motore `resolveChronoStackEndOfTurn` in `packages/domain/src/combat/chrono-stack.ts`.

---

## Esempio pratico

> **Junpei** ha 20 cs per la mossa finale [Caduta Cosmica], ma vuole temporeggiare per schivare i colpi di Hanzo e fargli consumare stack. In un turno d'attesa arriva a **24 cs**, entrando volutamente in Overheat.
>
> - Subisce **−8 HP/turno** (4 stack × 2 HP)
> - Ha 24 cs totali: 20 per "Caduta Cosmica" e 4 per muoversi, avvicinarsi o colpire
> - Se rimane in Overheat per **3 turni** senza scaricare, scatta il Defaticamento: **−50%** stack rimanenti (es. 24 → 12) o salta il turno

---

## Limiti per azione

Nonostante la concatenazione sia libera, c'è un limite a ciò che si può fare in modo "repentino", per bilanciare azioni con stack corte rispetto a quelle con stack medio-lunghe.

| Costo CS della waza | Massimo waza concesse per turno |
|---------------------|---------------------------------|
| 1–2 cs | Nessun limite extra (tempo narrato) |
| 3 cs | 3 |
| 5 cs | 2 |
| 10 cs | 2 |
| 20 cs | 1 |

> Regola costo misto: vale il limite del **CS più alto** usato nel turno.

- **Il movimento** (spostamento) non ha limiti di [cs].
- **Gli oggetti** consumano [cs] in modo situazionale (indicato nella scheda oggetto) e rispettano le stesse regole.

---

## Tipologie di combattimento

### Quest

- La presenza di uno **Shinigami** libera parzialmente il giocatore dal rigore delle regole: è lo Shinigami a decretare l'esito delle azioni tramite **IR (Indice di Riuscita)**.
- La libertà narrativa dello Shinigami è assoluta, purché segua il regolamento.
- La **Descrizione comanda**: inventiva e interazione con lo scenario valgono più di un tiro favorevole.
- La richiesta d'iniziativa viene dallo Shinigami, dando inizio al combattimento.
- Usare sempre il **condizionale** nei tag chrono stack per rendere l'azione intenzionale e mai autoconclusiva.

### PvP e Hunt

- Variabilità minima rispetto alla Quest, ma necessaria per lo scenario affrontato.
- L'IR determina la priorità in caso di azioni simultanee.

---

## Riepilogo numerico

| Parametro | Valore |
|-----------|--------|
| Stack a turno | +3 |
| Stack per colpo subito | +1 (al difensore) |
| Capacità naturale | 20 |
| Danno Overheat | **−2 HP** per stack oltre 20, per turno |
| Max turni Overheat prima del Defaticamento | **3** (−50% stack) |
| Max waza da 1–2 cs | Nessun limite extra |
| Max waza da 3 cs | 3 |
| Max waza da 5 cs | 2 |
| Max waza da 10 cs | 2 |
| Max waza da 20 cs | 1 |

---

## Tester

Nel **Combat Tester** (`bun run dev:tester` → tab "Combat Tester") trovi:
- **Simulazione automatica** fra due build senza Master
- IR + tier + CS (motore `packages/domain`) — leggi `apps/tester/src/combatSimulator.ts`
- Pool Waza (attive con danno) — AI usa la tecnica con maggior danno disponibile

> Il tester è allineato al sistema v3 (IR + 4/4 + Tier). Stato: [ROADMAP.md](./ROADMAP.md) §5–§7.

---

## Vedi anche

- **[COMBAT_SPEC.md](./COMBAT_SPEC.md)** — Flusso combattimento v3, iniziativa, IR.
- **[ROADMAP.md](./ROADMAP.md)** — Stato Chronostack e combattimento §5.
- `packages/domain/src/combat/chrono-stack.ts` — Motore CS (costanti, Overheat, Defaticamento).
