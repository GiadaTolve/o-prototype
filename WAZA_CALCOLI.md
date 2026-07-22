# Guida ai calcoli delle Waza — Ramo Dō (Le vie)

Questo documento spiega in modo chiaro come vengono calcolati i valori delle waza del primo ramo dei Dō (Le vie). Tutte le formule usano **arrotondamento per difetto** (es. 7,8 → 7).

*(Aggiungo man mano che escono nuove abbreviazioni. Per domande: canale dedicato, tag, ecc.)*

---

## Legenda

| Abbreviazione | Significato |
|---------------|-------------|
| **W** | Waza |
| **DBW** | Danno Base Waza |
| **M.G.** | Moltiplicatore di Grado |
| **B** | Bonus |
| **BO** | Bonus Oggetto |
| **BA** | Bonus Arma |

---

## Moltiplicatore di Grado (M.G.)

Il moltiplicatore di grado dona uno sprint minimo alla potenza e alla velocità delle waza, ponendo una differenza leggera fra il lancio fatto da un Nemuribito e il lancio fatto da un analista di livello superiore. Essendo i gradi il nostro unico indice meritocratico, il bonus verte su quello.

| Grado | VEL | DMG |
|-------|-----|-----|
| G1 Nemuribito | ×1.05 | ×1.10 |
| G2 Hakyō | ×1.10 | ×1.20 |
| G3 Bunsekikan | ×1.15 | ×1.30 |
| G4 Sentatsu Bunsekikan | ×1.20 | ×1.40 |
| G5 Kanteikan | ×1.25 | ×1.50 |
| G6 Shin'enkan | ×1.30 | ×1.60 |
| G7 Akumu Zankyō | ×1.35 | ×1.70 |

---

## Modalità anti-dio

**Potenza & Velocità** seguono un bilanciamento **mai mono-statistica**: in entrambi i casi c'è una statistica primaria [1STAT] e una secondaria [2STAT].

- **Velocità:** la criticità della "statistica dio" (se alzata, non vede confronti). Le tecniche veloci si gestiscono con alto costo Jigoka e danno stackabile basso. I confronti tecnica vs Reflexes devono essere competitivi, mai totalizzanti.
- **Danno:** gira attorno alla percentuale della statistica dichiarata (es. Empatia 70%), DBW e bonus (BA/BO/B).

---

## Formule generali

### Velocità Waza
```
[((DES × 0.6) + (MEN × 0.4)) + Bonus Waza] × M.G.
```
- DES = Destrezza (60%), MEN = Mente (40%) — destabilizza le mono-stat-build senza penalizzarle.

### Danno Waza
```
[(DBW + (EMP × 0.7)) + BA/BO/B] × M.G.
```
- EMP = Empatia (70%), sommata al danno base e agli eventuali bonus (arma, oggetto, varie).

---

## Simboli usati (statistiche)

| Simbolo | Significato | Esempio |
|---------|-------------|---------|
| **F** | Forza | 12 |
| **C** | Costituzione | 10 |
| **D** | Destrezza | 14 |
| **M** | Mente | 16 |
| **E** | Empatia | 10 |
| **LVL** | Rango Waza in scheda: **1** = Waza I, **2** = II, **3** = III | 3 |
| **Grado** | Grado Militare (1-7) | G2 = 2 |
| **floor(x)** | Arrotonda per difetto | floor(7,8) = 7 |

---

## Come leggere le formule

- **Costo** = punti di Jigoka (mana) che spendi per usare la tecnica
- **X** = un valore che scala con le tue statistiche e il livello della skill (es. gittata in metri, bonus danno)
- **Gittata** = distanza massima in metri

---

## Livelli Waza (I, II e III)

Ogni waza può salire di **due upgrade** oltre alla versione base, per un totale di **tre ranghi**. In scheda il giocatore vede il testo del **rango posseduto** (non le versioni intermedie slegate).

| Rango | Nome in scheda | **LVL** (nelle formule) | Testo |
|-------|------------------|-------------------------|--------|
| **Waza I** | Base | **1** | Solo la **descrizione base** |
| **Waza II** | 1° upgrade | **2** | Descrizione base **+** la **variazione** del primo upgrade |
| **Waza III** | 2° upgrade | **3** | Descrizione base **+** variazione II **+** **variazione** III |

Il simbolo **LVL** nelle formule (tabella [Simboli usati](#simboli-usati-statistiche)) è proprio questo rango: 1 = Waza I, 2 = Waza II, 3 = Waza III.

### Costo per ogni salita di rango

Ogni volta che si passa **Waza I → II** oppure **Waza II → III** si paga:

- **3 Gem** (valuta usata per potenziare le waza; distribuzione dei premi di livello in `LEVELING_DESIGN.md`)
- **Più** un **costo in EXP** proprio della tecnica (definito per ogni waza, oltre alle Gem)

Quindi: *un upgrade = 3 Gem + EXP di quell’upgrade*.

---

## Consistenze

La consistenza fa riferimento al **corpo** della waza lanciata: la waza può avere un corpo tangibile o meno. Classificazione:

| Consistenza | Definizione | Ruolo / caratteristiche |
|-------------|-------------|-------------------------|
| **Sonoro** | Onde sonore | Scout, molti danni. Vantaggio vs liquide. |
| **Elementale** | Proprietà che imitano gli elementi naturali | Status, versatilità. Possibile rottura. |
| **Liquido** | Corpo liquido | Maggiore gittata. Controllo, danni AOE. |
| **Gassoso** | Corpo gassoso | Ruolo hazard. Restano in campo per cambiare le regole della battaglia. |
| **Solido** | Corpo solido e tangibile | Danni ingenti, pochi colpi decisivi. Resistenza più bassa. |
| **Energetiche** | Emanazione energetica (aura, esplosiva, ecc.) | Tipo più comune, base facile da personalizzare. |
| **Nessuna** | Nessuna consistenza definita | Waza senza corpo tangibile proprio. |

---

## Categorie

La categoria divide le waza in base al **tipo di esecuzione** e alla **diffusione** del colpo dopo il rilascio:

| Categoria | Definizione |
|-----------|-------------|
| **Raggio** | Waza rappresentate da un raggio. |
| **Proiettile** | Waza che scagliano qualcosa contro un bersaglio. |
| **Propagazione conica** | Hanno origine dall'analista, proiettate in una direzione, si allargano a cono. |
| **Propagazione** | Waza che ricopre un'area. |
| **Emanazione** | Si dirama dall'analista in tutte le direzioni. |
| **Emanazione a distanza** | Si dirama in tutte le direzioni dal punto di impatto. |
| **Contatto** | Attacco mosso da un corpo fisico in carica verso il bersaglio. |
| **Potenziamento** | Waza che agiscono sull'analista (su sé stesso o su altri). |
| **Costrutti** | Waza che evocano entità/costrutti. |
| **Scudo** | Waza che creano protezioni momentanee. |
| **Irraggiamento** | La consistenza permane solo durante le [cs] di riferimento. *(Non ancora implementata)* |

---

## Tōka-dō: Via della Lanterna

Chi intraprende il Tōka-dō, si vedrà abile in waza di proiezione: la via infatti incanala ed infonde Jigoka attraverso l'ausilio di armi ed oggetti, potenziandone la resa. Si dice che chi intraprende la Via della Lanterna sia già un abile combattente — e che attraverso la propria arma si lasci guidare nella battaglia. È per questo che l'oggetto designato, o gli oggetti, prendono il nome di **Tōrō** (lanterna).

### Proiezione

Lo stile della proiezione permette di sfogare la propria Jigoka attraverso **oggetti ausiliari**. L'energia dell'analista viene trattata come un materiale grezzo che ha bisogno di passare attraverso un oggetto per essere lavorata e trovare la sua forma più adatta.

**Esempi:** Cacciare una tecnica attraverso una spada · Boostare un oggetto

---

### Passive [6]

#### 1. Tōrō <small>(Lanterna Incisa)</small>

**2J / turno** (attivabile).

L’analista, in grado d’incanalare Jigoka attraverso un’arma, sarà in grado di usufruire delle waza del Tōka-dō. Nel frangente in cui infonde il proprio potere nell’oggetto impugnato, quest’ultimo prende il nome di **Tōrō** (lanterna), a simboleggiare ciò che lo guida attraverso la battaglia. I Tōrō non possono essere bersagliati da waza di **[Manipolazione]** e **[Trasformazione]** finché l’analista ne è in contatto.

---

#### 2. Michishirube <small>(Ordine)</small>

L’analista trasforma le waza **[Energetiche][A contatto]** in **[Energetiche][Proiettile]** attraverso il proprio Tōrō. La nuova gittata è data da mente e destrezza.

**[Quadrante calcoli]**

**[Gittata]** — Calcolo della gittata.
```
Gittata = 2 + floor(M × 0,15) + floor(D × 0,1) + 2 × Grado
```
- **M** = Mente, **D** = Destrezza, **Grado** = Grado Militare (1-7)
- **Esempio:** M = 16, D = 14, Grado 2 → 2 + 2 + 1 + 4 = **9 metri**

---

#### 3. Shoka <small>(Ottimizzazione)</small>

L'analista, grazie alla sua predisposizione naturale, esegue waza attraverso il proprio Tōrō beneficiando di un consumo ridotto di Jigoka.

**[Effetto]** — Costo Waza -10%

---

#### 4. Nokuri-bi <small>(Traccia Elementale)</small>

L’analista, grazie alla sua predisposizione naturale, è in grado d'assorbire nel proprio Tōrō le tracce elementali residue date da waza di tipo [Elementale] proprie, o di terzi. Per farlo sarà necessario porre una parte dell'arma a contatto con l'elemento desiderato; aprendo il nodo di Emu, ad altezza della spalla — esso si imprigionerà nel Tōrō ed applicherà la condizione [Status] corrispondente all'attacco eseguito con l'arma già infusa di Jigoka.

---

#### 5. Kintsugi <small>(Legare i Frammenti)</small>

L’analista, grazie alla sua predisposizione naturale, è in grado d'espandere il nodo di Kashin — all'altezza della spalla destra — colando all'interno di un proprio [Costrutto] danneggiato nel turno precedente la propria Jigoka, ripristinandone momentaneamente la funzionalità. Il costrutto riparato durerà un turno aggiuntivo. Kintsugi non può esser eseguito su costrutti danneggiati da Jigoka né su costrutti che hanno raggiunto il termine della loro efficacia. Al termine del turno di Kintsugi, si potranno vedere le venature saldate dal proprio ego sciogliersi lentamente, e la waza non potrà esser riapplicata.

**Calcolo costo:**
```
Costo = 12 + floor(E × 1,2) + floor(M / 4)
```
- **Esempio:** E = 10, M = 16 → 12 + 12 + 4 = **28** J

---

#### 6. ! <small>(Impatto Jigoka)</small>

L'analista carica armi piccole con energia psichica. Si spendono **2 Jigoka per arma lanciata** (a decisione del giocatore, max 5). Ogni arma infligge **+X danni** aggiuntivi. Ogni arma dopo l'uso risulta **danneggiata**. Le armi brillano come piccole sfere luminose.

**[Quadrante calcoli]**

**[Costo Jigoka]** — 2 J per arma.
- Il giocatore decide quante armi caricare (1–5)
- Costo totale = 2 × n (es. 3 armi → 6 J)

**[X (bonus danno per arma)]** — Calcolo del danno aggiuntivo:
```
X = 1 + floor(M / 5) + Grado
```
- **M** = Mente, **Grado** = Grado Militare (1-7)
- Ogni arma infligge +X danni all'impatto

**[Armi max/turno]** — 5 (da [CHRONO_STACK.md](./CHRONO_STACK.md) — max mosse 1 cs)

- **Esempio:** M = 16, Grado 2 → X = 1 + 3 + 2 = **+6** danni per arma  
- 3 armi lanciate → 6 J costo, ogni arma dà +6 danni, poi risulta danneggiata

---

## Attive [6]

#### 1. Estensione

L’analista, grazie alla sua predisposizione per l’uso di oggetti, vedrà la sua Jigoka invadere l’arma che tiene tra le mani: l’energia psichica prende forma concreta attorno all’oggetto e durante l’esecuzione di un colpo d’arma la dimensione di quest’ultima aumenta di X metri. [Energetiche][Contatto]. Se l’arma è già un [Tōrō] la tecnica dura per l’intero turno. Le armi piccole (coltelli, ecc.) possono cambiare forma durante l’esecuzione, mantenendo lo stesso tipo di danno (da coltello a spada, da martello a martello da guerra, ecc.).

*Avanzando la skill di grado aumentano i bonus con la passiva di riferimento.*

**Costo:** **10J 1 CS**

**Calcolo estensione (metri):** *Tetto massimo 4 m.*
```
X = min(4, floor((1 + floor(M / 7) + LVL) / 2))
```

---

#### 2. Sfogo Jigoka

L’analista, grazie alla sua predisposizione, concentra la sua Jigoka nell’arma che tiene tra le mani. Quando viene sferrato un colpo, l’arma può rilasciare tutta la Jigoka immessa in un’esplosione di energia psichica in un cono di X metri davanti a sé. [Energetiche][Propagazione Conica]. Se l’arma è già un [Tōrō] i danni sono maggiori. Se l’arma è soggetta a [Batteria] i danni sono molto maggiori ma l’arma si disintegra.

*Avanzando la skill di grado aumenterà la gittata; [Batteria] non farà più disintegrare l’arma all’istante.*

**Calcolo gittata cono (metri):**
```
X = 3 + floor(M / 4) + LVL × 2
```

**Calcolo costo:**
```
Costo = 10 + floor(M / 2)
```
- **Esempio:** M = 16, LVL = 2 → Gittata = 3 + 4 + 4 = **11 metri** → Costo = **18** Jigoka

---

#### 3. Laser psichico

L’analista, grazie alla sua predisposizione, concentra la sua Jigoka nell’arma che tiene tra le mani; l’energia viene accumulata velocemente e l’arma deve essere tenuta con entrambe le mani. L’energia accumulata viene scaricata nella direzione puntata dando forma a un raggio energetico lungo X. [Energetiche][Raggio]. Se l’arma è già un [Tōrō] il danno è aumentato così come le dimensioni. Se l’arma è già [Tōrō] perde la condizione dopo l’uso; se non lo è, la guadagna.

*Avanzando la skill di grado si annulla il debuff.*

**Calcolo lunghezza raggio (metri):**
```
X = 5 + floor(M / 3) + LVL × 3
```

**Calcolo costo:**
```
Costo = 14 + floor(M × 0,8)
```
- **Esempio:** M = 16, LVL = 2 → Raggio = 5 + 5 + 6 = **16 metri** → Costo = 14 + 12 = **26** Jigoka

---

#### 4. Arma animata

L’analista, grazie alla sua predisposizione naturale, cede ulteriore Jigoka all’interno dell’arma che impugna, abbastanza da permettere all’arma di levitare diventando un [Costrutto]. L’arma agisce tramite ordine mentale, può muoversi solo entro una gittata X dall’analista altrimenti la connessione psichica si frantuma e l’oggetto cade. L’arma può levitare fino a due metri di altezza, attacca in maniera semplice seguendo i comandi mentali. Dopo X turni la Jigoka viene consumata e l’arma torna al suo stato originale. Se l’arma è già un [Tōrō] ha durata maggiore.

*Avanzando la skill aumentano i metri di levitazione e il numero di azioni possibili (es. cacciare una tecnica).*

**Calcolo gittata (metri):**
```
Gittata = 4 + floor(M / 4) + LVL × 2
```

**Calcolo durata (turni):**
```
Durata = 2 + floor(E / 5) + LVL
```

**Calcolo costo:**
```
Costo = 16 + floor(M / 2) + floor(E / 3)
```
- **Esempio:** M = 16, E = 10, LVL = 2  
- Gittata = 4 + 4 + 4 = **12 metri**  
- Durata = 2 + 2 + 2 = **6 turni**  
- Costo = 16 + 8 + 3 = **27** Jigoka

---

#### 5. Sorpresa

L’analista, grazie alla sua predisposizione naturale, sceglie una tecnica che conosce e ne concentra la Jigoka all’interno dell’arma, che brillerà e inizierà a vibrare (percepibile al tatto). La tecnica può essere liberata in due modi: con un impatto, oppure con un fendente che colpisce l’etere. Nel primo caso il colpo ha lo stesso danno della tecnica scelta; nel secondo un [Proiettile][Energetico] viene rilasciato dall’arma (dimensione X, gittata X, proprietà della tecnica originale). Al lancio va lanciata anche la tecnica scelta. La tecnica rimane nell’arma per X turni; se non eseguita entro la fine, l’arma si rompe rilasciando l’energia come [Energetica][Emanazione] per X metri, danno pari alla tecnica contenuta.

*Avanzando la skill aumentano metri e gittata del proiettile e diminuisce il costo in mana.*

**Calcolo dimensione proiettile (metri):**
```
Dimensione = 1 + floor(M / 8) + floor(LVL × 0,5)
```

**Calcolo gittata (metri):**
```
Gittata = 6 + floor(M / 3) + LVL × 3
```

**Calcolo costo (si aggiunge al costo della tecnica scelta):**
```
Costo extra = 8 + floor(M / 4)
```
- **Esempio:** M = 16, LVL = 2  
- Dimensione = 1 + 2 + 1 = **4 metri**  
- Gittata = 6 + 5 + 6 = **17 metri**  
- Costo extra = 8 + 4 = **12** Jigoka (più il costo della tecnica immagazzinata)

---

#### 6. Risonanza della lama

L’analista permea l’arma che impugna e i corrispettivi arti di energia psichica. Per un turno, durante ogni movimento l’arma trascina gli arti con sé cercando di colpire ogni nemico a gittata corpo a corpo durante il movimento, senza intralciarlo. Non è possibile mirare a punti vitali.

*Avanzando la skill si potrà mirare a zone più precise su più persone; aumento dei metri percorribili (boost velocità o riflessi).*

**Calcolo costo:**
```
Costo = 12 + floor(M / 3)
```
- **Esempio:** M = 16 → 12 + 5 = **17** Jigoka

---

## Ito-Do (Ramo Manipolazione)

### Manipolazione

Lo stile della manipolazione permette di usare la propria Jigoka per **controllare e alterare** oggetti creati dall'energia psichica e non. L'analista si impegna ad avere un controllo costante sul campo di battaglia.

**Esempi:** Modificare la direzione/categoria di una tecnica · Cambiare la posizione di costrutti

---

### Passive [6]

#### 1. Telecinesi

L'analista può alzare dal suolo un [Costrutto] di taglia [Media]; l'energia psichica ne ricopre l'intera superficie permettendo un vago controllo. L'oggetto può essere scagliato o semplicemente mosso. I parametri di movimento sono quelli dell'analista nel caso di taglia [Piccola]; in caso di taglia [Media] i parametri sono ×0,75.

#### 2. Mago della consistenza

L'analista può cambiare la [Consistenza] di X [Costrutti] che ha generato.

*Arcimago della consistenza:* l'analista può cambiare la [Consistenza] di X [Costrutti] altrui. *(Da capire se dare livelli alle passive o meno.)*

#### 3. Mago della forma

L'analista può cambiare la [Categoria] di una sua tecnica durante l'esecuzione. [Emanazione]/[Propagazione] ↔ [Propagazione Conica] e viceversa: nel primo caso la gittata diventa X (originale × 1,5), nel secondo Y (originale × 0,5). Il punto di origine resta sempre l'analista.

#### 4. Pieno controllo

L'analista può cambiare la direzione di una tecnica [Raggio] o [Proiettile] da lui eseguita di un massimo di 180° durante l'esecuzione.

#### 5. Scissione

**[Raggio]:** l'analista può dividere in due diramazioni la tecnica (bersagli diversi); il danno si riduce al 75%.  
**[Proiettile]:** l'analista può aumentare la quantità generata (×0,5; 1 proiettile → 2); il danno si riduce al 75%. I nuovi proiettili non hanno direzioni diverse.

---

### Attive [7]

#### 1. Furia Telecineta

L'analista sceglie un [Costrutto][Solido] sollevato con [Telecinesi]; l'energia psichica che lo avvolge si convoglia in un punto singolo per scagliare l'oggetto nella direzione opposta. L'oggetto viene lanciato con estrema forza in una direzione qualsiasi (solo dritto), viaggia per X metri di gittata massima prima che la forza perda potere. La forza del lancio determina i danni, pari a X.

*Avanzando la skill di grado aumenteranno danni e gittata.*

#### 2. Scambio

L'analista sceglie due [Costrutti][Solidi] evocati entro X gittata; i due costrutti si scambiano di posizione. Mantengono traiettorie e proprietà (es. un costrutto lanciato continua dalla nuova posizione).

*Avanzando la skill si potrà scambiare sé stessi; aumento della gittata.*

#### 3. Danni poco collaterali

L'analista sceglie un [Costrutto][Solido] evocato entro X gittata; il costrutto implode su sé stesso generando X [Proiettili][Solidi] indirizzati dal volere dell'analista verso un bersaglio a X metri dal punto di implosione.

*Avanzando la skill si potranno far scoppiare più costrutti.*

#### 4. Magnetismo

L'analista sceglie un [Costrutto][Solido] evocato entro X gittata; diventa [Positivo] per 2 turni. Poi sceglie altri Y [Costrutti][Solidi] entro Y gittata (max 2) rendendoli [Negativi]; al costo di +1 CS può rendere i nuovi [Costrutti] creati direttamente [Negativi]. Per tutta la durata, qualsiasi [Costrutto][Solido][Negativo] viene attratto verso il [Positivo].

*Avanzando la skill si potranno scegliere più costrutti negativi e eventualmente un effetto secondario.*

#### 5. Entanglement

L'analista sceglie un [Costrutto][Solido], poi un secondo. Per 4 turni, qualsiasi cosa accada a uno si ripete sull'altro.

*Possibilità di legare più costrutti tra di loro.*

#### 6. Contraffazione

L'analista sceglie un suo [Costrutto] e lo fa apparire come un altro [Costrutto] visibile o come un oggetto del suo inventario. L'effetto dura 4 turni. A meno di 4 metri di distanza si vede la vera forma.

#### 7. Inversione di Proprietà

L'analista tenta di strappare il controllo di un [Costrutto] nemico entro X metri. Se la Jigoka dell'analista supera quella del creatore, il controllo passa all'analista per Y turni. Il creatore può tentare di riprendere il controllo spendendo Jigoka. Funziona solo su costrutti di dimensioni medie o inferiori. [Nessuna]

*Avanzando la skill: aumenta la durata del controllo e la dimensione dei costrutti influenzabili.*

---

## Genzai-Do (Ramo Materializzazione)

### Materializzazione

Lo stile della materializzazione permette di usare la propria Jigoka per **creare oggetti** attraverso l'energia psichica. L'analista deve decidere costantemente quale sia l'opzione migliore del suo arsenale: un pessimo analista di questo ramo sarà di intralcio ai colleghi; un ottimo analista influenzerà il campo di battaglia in maniera decisiva.

**Esempi:** Creare costrutti, armi, barriere, ostacoli · Creare i 4 elementi con le proprie capacità psichiche

---

### Passive [7]

#### 1. Addio carne

L'analista può rimpiazzare parti del suo corpo con un [Costrutto][Solido] che prende la forma esatta della parte mancante. Il [Costrutto] segue la creazione facendo affidamento sulla memoria dell'analista. Quando si riceve un colpo, nonostante il corpo artificiale, si avverte dolore fantasma che pervade il corpo, incidendo sulla Jigoka anziché sulla vita. *(Da rivedere.)*

#### 2. Affinità elementale

L'analista sceglie un elemento (non si può più cambiare; ognuno applica uno status). Può infondere l'elemento nei suoi [Costrutti][Solidi] e nelle tecniche [Energetiche]. Nel primo caso il costrutto cambia in modo coerente alla descrizione e ottiene le proprietà dell'elemento. Nel secondo la tecnica cambia da [Energetica] ad [Elementale] con le relative proprietà.

#### 3. Potere della cognizione

L'analista vede i propri [Costrutti] e [Scudi] [Solidi] aumentare la resistenza di X.

#### 4. Piccolo arsenale

L'analista crea tra le sue mani X armi di piccole dimensioni (aghi, coltelli, ecc.). Sono [Costrutti][Energetici] che si infrangono al primo ostacolo fisico. Se si crea solo un'arma, può essere nascosta per 6 ore. Quando l'analista lancia una tecnica, tutte le armi create in questo modo spariscono.

#### 5. Inventore

L'analista crea oggetti di media grandezza [Costrutti][Solidi]. È possibile creare un solo oggetto per volta: una fusione di due armi (corpo di una, estremità dell'altra). Usando entrambe le estremità delle armi scelte, l'arma si rompe alla fine del secondo turno.

#### 6. Memoria della Forma

Quando l'analista crea un [Costrutto] già creato in precedenza (stessa forma, stesse dimensioni), il costo in Jigoka è ridotto del 20%. Può memorizzare fino a X forme; memorizzare una forma richiede di creare quel costrutto almeno 3 volte.

#### 7. Infusione Persistente

I [Costrutti] creati dall'analista durano 1 turno in più. Inoltre, quando un costrutto sta per dissolversi, l'analista può spendere Jigoka per estenderne la durata invece di ricrearlo (costo: 50% del costo di creazione per ogni estensione).

---

### Attive [5]

#### 1. Minaccia concreta

L'analista rende viva l'energia psichica che circola in lui, emanando la propria aura [Energetica] ben visibile e concreta. Due usi: **(1)** Formare un'armatura — l'aura diventa [Solida], [Costrutto]; la forma è univoca e resta fino a grandi cambiamenti nella psiche. L'armatura fornisce bonus X alle stat. *(Fabio: supporto su questo punto.)* **(2)** Concentrare l'aura attraverso uno o più arti e rilasciarla come [Proiettile][Energetico] con gittata X metri e dimensione Y (es. sfera 5×5).

*Avanzando la skill: effetto potenziato.*

#### 2. Dito divino

L'analista sceglie un punto entro X gittata. Dall'alto nella zona indicata cade un fulmine [Costrutto][Elementale] che colpisce per Y metri dal punto d'impatto. +2 CS per un secondo punto da colpire.

*Avanzando la skill: non proviene più dall'alto; diminuzione CS per target.*

#### 3. Alitosi dello Yokai

L'analista emette una nube [Emanazione][Gassosa] che si propaga per X metri attorno a lui e rimane per 2 turni. Dentro la nube i Riflessi vengono ridotti (REF -X). La nube è infiammabile: a contatto con Fuoco o Fulmine si incendia e sparisce lo stesso turno.

*Avanzando la skill: aumento gittata; annullamento malus su sé stessi; possibilità di scegliere se renderla incendiaria o meno.*

#### 4. Globo rancoroso

L'analista genera un [Costrutto][Energetico] che fluttua seguendolo per 4 turni. Il globo non può essere comandato: si lancia verso la prima fonte di danno arrecata dall'analista (nemico o fuoco amico). Raggiunto il bersaglio, esplode in [Emanazione a distanza] causando danni da fuoco in un'area di Y metri. Il globo percorre X metri/turno; superando la gittata diventa [Proiettile], non va più in automatico e si schianta nella direzione lanciata (danno e area maggiorati).

*Valutare due rami diversi.*

#### 5. Colonne pazienti

L'analista genera dal terreno due [Costrutti][Solidi] a colonna che crescono fino a X metri di altezza e Y metri di larghezza. La conformazione dipende dal terreno (pietra, cemento, detriti, ecc.). Le colonne permangono 3 turni, nascono distanti 1 metro l'una dall'altra, sulla stessa linea (non una avanti e una indietro).

*Avanzando la skill: possibile creare più colonne.*

---

## Hō-Do (Ramo Emissione)

### Emissione

Lo stile dell'emissione permette di sfogare la propria Jigoka attraverso **forti onde d'urto ed esplosioni**. L'emissione può avvenire anche in maniera più tradizionale, ma la mole e la velocità dell'energia psichica dell'utilizzatore la rendono invasiva anche negli approcci più leggeri.

**Esempi:** Far fluire la propria energia attraverso qualcosa · Liberare l'energia dalle mani generando un'esplosione

---

### Passive [6]

#### 1. Batteria

L'analista può far defluire la sua energia psichica attraverso [Costrutti] che ha generato, lasciando una quantità di Jigoka pari a X. L'energia permane 24 ore e può essere ripresa totalmente o in parte toccando il [Costrutto].

#### 2. Inversione

L'analista può richiamare a sé un [Costrutto] dove è presente la sua energia psichica. L'oggetto torna tra le sue mani seguendo la traiettoria più veloce; la velocità dipende dalla massa (armi piccole/medie tornano istantaneamente; altri oggetti in base alla distanza).

#### 3. Emissione a bassa frequenza

L'analista espande la sua energia psichica per brevi distanze. Una sfera di energia invisibile si espande per X metri attorno all'analista; l'energia rimbalza contro altra energia psichica rivelando ogni fonte nel raggio. Chi viene colpito avverte un lieve tepore. Usabile anche tramite un [Costrutto] permeato della sua energia entro X metri; con [Batteria] la gittata aumenta molto.

#### 4. Sicurezza avanzata

L'analista lascia una quantità di Jigoka pari a X in [Costrutti] generati. L'energia permane un paio d'ore. Chiudendo entrambi gli occhi ottiene il punto di vista del [Costrutto] scelto (udito e vista completi).

#### 5. Deflagrazione instabile

Al lancio di una tecnica, l'analista può consumare X Jigoka per un effetto extra:  
- **[Proiettile]:** all'impatto, esplosione con la stessa consistenza della tecnica, si dirama per X metri.  
- **[Raggio]:** all'impatto, colpo concatenato su un altro bersaglio entro X metri.  
- **[Emanazione], [Emanazione a distanza], [Propagazione], [Propagazione Conica]:** la tecnica aumenta di X gittata.

#### 6. Sovraccarico Controllato

Quando l'analista spende più del 30% della Jigoka massima in un singolo turno, la prossima tecnica [Emanazione] o [Propagazione] [Energetica] ha gittata e danni aumentati. Il bonus si accumula.

---

### Attive [6]

#### 1. Corto circuito

L'analista fa defluire con violenza la sua energia psichica in un [Costrutto] o oggetto fino a sovraccaricarlo. Tramite volere o impatto, il bersaglio esplode infliggendo X danni per Y metri. [Energetiche][Contatto]. Se il bersaglio ha [Batteria], l'esplosione aumenta di X metri. Se l'esplosione colpisce un oggetto con [Batteria], quest'ultimo esplode per X/2 metri.

*Avanzando la skill: uso su più bersagli contemporaneamente.*

#### 2. Lancio Jigoka

L'analista convoglia l'energia psichica nei palmi delle mani o nelle piante dei piedi. Estendendo un arto in avanti libera l'energia; può lanciare 2 [Proiettili][Energetici] per X metri.

*Avanzando la skill: aumento percentuali e numero di proiettili (es. da 2 a 16).*

#### 3. Impeto a rilascio

L'analista comprime la sua Jigoka per massimo 2 turni; l'impeto può essere rilasciato in qualsiasi momento. Al rilascio, una forza repulsiva [Emanazione][Energetica] per X metri. Rilascio turno 1: interrompe movimenti. Rilascio turno 2: arreca danno. Se colpiti mentre si carica, rilascio involontario e l'analista subisce i propri effetti.

*Avanzando la skill: aumento gittata e turni di carica.*

#### 4. Scarico di forza

L'analista accumula energia psichica in una parte del corpo. All'impatto scarica l'energia: un'onda d'urto psichica si propaga per X metri danneggiando e compromettendo la stabilità. Si possono sfondare pareti, costrutti e ossa. Se l'energia non viene dispersa in un turno, la parte del corpo subisce danno [Energetiche][Contatto].

#### 5. Famiglio onirico

L'analista scinde energia psichica per dar vita a un famiglio onirico [Costrutto][Energetico], taglia media, aspetto animale. Dura 3 turni; durante la permanenza l'analista non guadagna CS a inizio turno. Il famiglio percorre X metri e attacca una volta per turno. Se acquisisce un elemento, lo mantiene fino alla fine.

*Avanzando la skill: aumento taglia e azioni possibili.*

#### 6. Detonazione a Catena

L'analista seleziona fino a X [Costrutti] con [Batteria] in vista. Tutti esplodono simultaneamente come con [Corto circuito]. [Emanazione a distanza][Energetica]. Le zone di sovrapposizione subiscono danni aumentati.

*Avanzando la skill: aumenta il numero di costrutti; ogni esplosione innesca automaticamente altri [Costrutti] con [Batteria] nel raggio (vera reazione a catena).*

---

## Hensei-Do (Ramo Trasformazione)

### Trasformazione

Lo stile della trasformazione permette di usare la propria Jigoka per **alterare** oggetti creati dall'energia psichica e non. A differenza della Manipolazione, i trasformatori modificano la **consistenza** del mondo attorno a sé, non la categoria.

**Esempi:** Cambiare l'elemento di una tecnica · Cambiare la consistenza di una tecnica

*(Valutare se far pagare mana alle passive o meno.)*

---

### Passive [5]

#### 1. Volere

L'analista può cambiare la [Consistenza] di una sua tecnica durante l'esecuzione. La nuova consistenza non può essere [Nulla] o [Elementale]. Se la tecnica è [Elementale] può cambiare solo l'elemento.

#### 2. Cambio forzato

L'analista può cambiare la [Consistenza] di [Costrutti] entro X metri. La consistenza scelta non può essere [Nulla] o [Elementale]; la modifica dura X turni.

#### 3. Rinforzo elementale

L'analista può cambiare la [Consistenza] di una tecnica durante l'esecuzione in [Elementale]. L'elemento è a scelta. Non usabile su tecniche [Nulla] o [Elementale].

#### 4. Regole alchemiche

L'analista non può usare due volte consecutive tecniche con la stessa [Consistenza]. Ogni cambio concede effetti diversi: [Sonoro] -gittata +danni; [Elementale] aura X metri; [Liquido] +gittata -danni; [Gassoso] +gittata, +1 turno permanenza; [Solido] +resistenza; [Energetiche] +velocità.

#### 5. Pietra filosofale

L'analista sceglie un suo [Costrutto][Solido] a portata; esso muta in cristallo rosso sangue (trasformazione in X turni). La pietra può essere distrutta a contatto per bonus statistiche per X turni. *(Da definire.)*

---

### Attive [6]

#### 1. Trappola!

L'analista cambia la [Consistenza] di una sua tecnica già in campo da almeno 1 turno in [Elementale]. La modifica dura 1 turno. *Avanzando: durata maggiore; più tecniche modificabili.*

#### 2. Aberrazione

L'analista sostituisce un arto con un [Costrutto] brandito come arma per 4 turni. [Potenziamento][Nulla]. Se il costrutto si rompe, l'arto diventa inutilizzabile. *Avanzando: più parti del corpo; eventuali boost.*

#### 3. Jammer

L'analista modifica la sua Jigoka in un ronzio per X turni, propagantesi per X metri e interferendo con la Jigoka altrui. Ogni colpo a contatto riduce la Jigoka del bersaglio di Y. *Avanzando: più turni ed effetti; possibile status (vertigini).*

#### 4. Velo onirico

L'analista crea un velo invisibile largo X e lungo Y, posabile ovunque. Copre le proprietà di ciò che sta sotto; solo la Jigoka del proprietario può interagire. Dura 3 turni. *Avanzando: aumento dimensioni.*

#### 5. Sorpresa!

L'analista aumenta la dimensione di un [Costrutto] entro gittata X di una taglia per 1 turno; poi il costrutto si rompe. *Valutare: gittata/bersagli o annullamento malus.*

#### 6. Scambio di Proprietà

L'analista seleziona due oggetti o [Costrutti] entro X metri. Le loro [Consistenze] si scambiano per Y turni (es. muro [Solido] ↔ nube [Gassosa]). Non usabile su costrutti impugnati da terzi. [Nessuna] *Avanzando: gittata; costrutti non propri.*

---

## Naikan-Do (Ramo Supporto)

### Supporto

Lo stile del Supporto rappresenta la forma più "pura" e istintiva della manipolazione della Jigoka: l'energia psichica viene convogliata direttamente nel corpo, usa i propri nodi come camere di pressione. Ogni respiro, ogni battito, pompa energia nel fisico.

**Esempi:** Potenziare il proprio corpo tramite Jigoka · Lenire gli effetti di uno [Status]

---

### Passive [5]

#### 1. Ego smisurato

Con [Status] attivo: potenziamenti statistici durano 1 turno in più; l'arma diventa [Costrutto]. Con potenziamento: toccando un [Costrutto] lo potenzia; effetto fino a contatto + fine turno. Un solo [Costrutto] alla volta.

#### 2. Tutt'uno

Con depotenziamento: effetti negativi durano 1 turno in meno; l'arma diventa [Costrutto]. Toccando un [Costrutto] lo depotenzia; effetto fino a contatto + fine turno.

#### 3. Scelta del nucleo

Durante [Potenziamento], l'analista può cambiare una statistica potenziata con un'altra. La durata diminuisce di 2 turni.

#### 4. Adattamento psico-fisico

Dopo danno da una [Consistenza], l'analista riceve meno danni da quella stessa [Consistenza] finché non viene colpito da un'altra.

#### 5. Rinforzo psichico

L'analista immagazzina energia dalle tecniche che lo colpiscono. Bonus danni se la tecnica usata ha la [Consistenza] dell'ultima subita.

---

### Attive [6]

#### 1. La mia forza, il mio scudo

Rimuove ogni potenziamento statistico generando uno [Scudo][Energetico] con resistenza pari al valore delle statistiche perse. Il turno dopo non si possono ricevere potenziamenti.

#### 2. La mia forza, il mio arco

Rimuove ogni potenziamento statistico generando un [Proiettile][Energetico] per X metri, danno pari al valore delle statistiche perse. Il turno dopo non si possono ricevere potenziamenti.

#### 3. Fibre psichiche

Avvolge le fibre muscolari con Jigoka. [Potenziamento] 2 turni. Scelta: gambe, braccia o torace. **Fibre Bianche** +X% Forza; **Fibre Neuromuscolari** +X% Velocità; **Fibre Rosse** +X% Costituzione. *Avanzando: durata, boost; cambiare fibre.*

#### 4. Traslazione forzata

Carica energia in un colpo a contatto; colpendo un essere vivente può spostare uno [Status] da sé al bersaglio. [Potenziamento]

#### 5. Tensione

Carica energia nei muscoli per X turni. Il prossimo colpo a contatto ha +X Velocità e +X Forza. L'arto non è utilizzabile fino al compimento. *Avanzando: durata, boost, colpi.*

#### 6. Spinta Adrenalinica

Inietta Jigoka nel proprio sistema. Per X turni: velocità e riflessi aumentati. Al termine: ridotti per Y turni. [Potenziamento][Nessuna] *Avanzando: più bonus, meno malus.*

---

## Forma standard Waza

| Campo | Contenuto |
|-------|-----------|
| **Titolo** | Nome della waza |
| **Corpo** | Descrizione della waza |
| **Consistenza** | TAG delle consistenze |
| **Tipo** | TAG delle categorie |

---

## Skiru

Sezione dedicata alle **competenze e abilità** dei personaggi. Qui verranno elencate le Skiru con descrizioni, prerequisiti e eventuali formule.

*(Da popolare.)*

---

## Formule per i tiri (dadi)

Quando serve un tiro per colpire, resistere o controllare:

| Situazione | Formula |
|------------|---------|
| Colpo con Tōrō | `1d20 + floor(D/2) + floor(M/3)` |
| Resistenza a tecnica energetica | `1d20 + C` (fisica) o `1d20 + E` (spirituale) |
| Controllo Jigoka | `1d20 + M` |
| Precisione lancio | `1d20 + D + floor(M/4)` |

---

## Riepilogo variabili X

| Tipo di X | Formula generica |
|-----------|-------------------|
| Gittata | `3 + floor(M/4) + LVL×2` |
| Gittata Michishirube (M+D) | `2 + floor(M×0,15) + floor(D×0,1) + 2×Grado` |
| Estensione / bonus | `1 + floor(M/5) + LVL` |
| Durata (turni) | `2 + floor(E/5) + LVL` |
| Sconto costo | `1 + floor(M/6) + LVL` |

---

## Dove provare i calcoli

Apri il **Waza & Stats Tester** (`bun run dev:tester`) per inserire le tue statistiche e vedere i valori calcolati in tempo reale.

---

## Vedi anche

- **[CHRONO_STACK.md](./CHRONO_STACK.md)** — Sistema Chrono Stack [cs]: accumulo, Overheat, limiti mosse, combattimento.

---

## Legenda abbreviazioni

| Sigla | Significato |
|-------|-------------|
| **W** | Waza |
| **DBW** | Danno Base Waza |
| **M.G.** | Moltiplicatore di Grado |
| **B** | Bonus |
| **BO** | Bonus Oggetto |
| **BA** | Bonus Arma |

*Si aggiungono man mano nuove abbreviazioni. Per domande o chiarimenti, taggami sul canale.*

---

## Moltiplicatore di Grado (M.G.)

Il moltiplicatore di grado dona uno sprint minimo alla potenza e alla velocità delle waza, ponendo una differenza leggera fra il lancio fatto da un Nemuribito e quello di un analista di livello superiore. Essendo i gradi il nostro unico indice meritocratico, questo bonus verte su quello.

| Grado | Velocità (VEL) | Danno (DMG) |
|-------|----------------|-------------|
| **G1** | ×1.05 | ×1.10 |
| **G2** | ×1.10 | ×1.20 |
| **G3** | ×1.15 | ×1.30 |
| **G4** | ×1.20 | ×1.40 |
| **G5** | ×1.25 | ×1.50 |
| **G6** | ×1.30 | ×1.60 |



## Modalità anti-dio: Potenza & Velocità
Questi due valori seguono un bilanciamento **mai mono-statistica**: in entrambi i casi vi è una statistica primaria [1STAT] e una secondaria [2STAT].

### Velocità
La velocità presenta la criticità della “statistica dio” se alzata, non vede confronti degni di nota. 
Le “tecniche veloci” si gestiscono con alto costo di jigoka e impatto stackabile (dmg basso). 

I confronti tecnica vs reflexes devono restare competitivi, mai totalizzanti. 


**Formula Velocità Waza:**
```
Velocità = [((D × 0.6) + (M × 0.4)) + Bonus Waza] × M.G.
```

La velocità si basa al 60% sulla statistica primaria (Destrezza) e al 40% sulla secondaria (Mente). Questo calcolo destabilizza le mono-stat-build senza metterle in croce.

### Danno (DMG)

**Formula Danno Waza:**
```
DMG = [(DBW + (E × 0.7)) + BA/BO/B] × M.G.
```

Il danno gira attorno al 70% della statistica dichiarata (in questo caso Empatia), sommata al danno base, più eventuali bonus (arma, oggetti, vari). 
