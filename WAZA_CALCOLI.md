# Guida ai calcoli delle Waza — Ramo Dō (Le vie)

Questo documento spiega in modo chiaro come vengono calcolati i valori delle waza del primo ramo dei Dō (Le vie). Tutte le formule usano **arrotondamento per difetto** (es. 7,8 → 7).

---

## Simboli usati

| Simbolo | Significato | Esempio |
|---------|-------------|---------|
| **F** | Forza | 12 |
| **C** | Costituzione | 10 |
| **D** | Destrezza | 14 |
| **M** | Mente | 16 |
| **E** | Empatia | 10 |
| **LVL** | Livello della skill (1-3) | 3 |
| **floor(x)** | Arrotonda per difetto | floor(7,8) = 7 |

---

## Come leggere le formule

- **Costo** = punti di Jigo-ka (mana) che spendi per usare la tecnica
- **X** = un valore che scala con le tue statistiche e il livello della skill (es. gittata in metri, bonus danno)
- **Gittata** = distanza massima in metri

---

## Passive [6]

### 1. Arma psichica

**Cosa fa:** La tua Jigo-ka invade l’arma che impugni. L’arma non può essere bersagliata da tecniche di Manipolazione/Trasformazione di terzi finché la tocchi. Puoi usarla per lanciare tecniche.

**Calcolo costo attivazione:**
```
Costo = 5 + floor(M / 4)
```
- **Esempio:** M = 16 → 5 + 4 = **9** Jigo-ka per attivare

---

### 2. Ordine!

**Cosa fa:** Trasforma le tue tecniche [Energetiche][A contatto] in [Energetiche][Proiettile] quando impugni un’arma. La gittata dipende da Mente e Destrezza.

**Calcolo gittata (metri):**
```
Gittata = 2 + floor(M × 0,15) + floor(D × 0,1) + LVL × 2
```
- **Esempio:** M = 16, D = 14, LVL = 2 → 2 + 2 + 1 + 4 = **9 metri**

---

### 3. Ottimizzazione

**Cosa fa:** Lanci tecniche attraverso l’[Arma psichica] pagando **meno** Jigo-ka. Lo sconto è X.

**Calcolo sconto:**
```
X = 1 + floor(M / 6) + LVL
```
- **Esempio:** M = 16, LVL = 2 → 1 + 2 + 2 = **5** Jigo-ka di sconto  
- Se una tecnica costa 12, la paghi **7** (12 − 5)

---

### 4. Traccia elementale

**Cosa fa:** Mantieni i residui di una tecnica [Elementale] sull’arma fino alla fine del turno successivo. Le tecniche [Energetiche] lanciate dall’arma diventano [Elementali].

**Calcolo costo:**
```
Costo = 8 + floor(M / 3)
```
- **Esempio:** M = 16 → 8 + 5 = **13** Jigo-ka

---

### 5. Legare i frammenti

**Cosa fa:** Richiami l’energia psichica da un oggetto rotto o da un [Costrutto] distrutto e lo ricrei per un turno.

**Calcolo costo:**
```
Costo = 12 + floor(E × 1,2) + floor(M / 4)
```
- **Esempio:** E = 10, M = 16 → 12 + 12 + 4 = **28** Jigo-ka

---

### 6. Impatto Jigo-ka

**Cosa fa:** Carichi X armi piccole con energia psichica. Ogni arma infligge **+X danni** e si distrugge al colpo.

**Calcolo X (n° armi e bonus danno):**
```
X = 1 + floor(M / 5) + LVL
```

**Calcolo costo totale:**
```
Costo = X × (4 + floor(M / 5))
```
- **Esempio:** M = 16, LVL = 2 → X = 1 + 3 + 2 = **6** armi  
- Costo = 6 × (4 + 3) = **42** Jigo-ka  
- Ogni arma dà **+6** danni

---

## Attive [5]

### 1. Estensione

**Cosa fa:** Estendi l’arma di X metri durante un colpo (o per tutto il turno se è già [Arma psichica]). Le armi piccole possono cambiare forma.

**Calcolo estensione (metri):**
```
X = 1 + floor(M / 5) + LVL
```

**Calcolo costo:**
```
Costo = 6 + X × 2
```
- **Esempio:** M = 16, LVL = 2 → X = 6 metri → Costo = 6 + 12 = **18** Jigo-ka

---

### 2. Sfogo Jigo-ka

**Cosa fa:** Esplosione di energia psichica in un cono davanti a te. I danni aumentano se l’arma è [Arma psichica] o [Batteria].

**Calcolo gittata cono (metri):**
```
X = 3 + floor(M / 4) + LVL × 2
```

**Calcolo costo:**
```
Costo = 10 + floor(M / 2)
```
- **Esempio:** M = 16, LVL = 2 → Gittata = 3 + 4 + 4 = **11 metri** → Costo = **18** Jigo-ka

---

### 3. Laser psichico

**Cosa fa:** Raggio energetico lungo X metri. Il danno aumenta se l’arma è già [Arma psichica].

**Calcolo lunghezza raggio (metri):**
```
X = 5 + floor(M / 3) + LVL × 3
```

**Calcolo costo:**
```
Costo = 14 + floor(M × 0,8)
```
- **Esempio:** M = 16, LVL = 2 → Raggio = 5 + 5 + 6 = **16 metri** → Costo = 14 + 12 = **26** Jigo-ka

---

### 4. Arma animata

**Cosa fa:** L’arma diventa un [Costrutto] che levita e attacca su comando. Ha una gittata X e dura X turni.

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
- Costo = 16 + 8 + 3 = **27** Jigo-ka

---

### 5. Sorpresa

**Cosa fa:** Immagazzini una tecnica nell’arma. Puoi rilasciarla con un impatto o con un fendente. Il proiettile ha dimensione X e gittata X.

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
- Costo extra = 8 + 4 = **12** Jigo-ka (più il costo della tecnica immagazzinata)

---

### 6. Risonanza della lama

**Cosa fa:** Per un turno, durante il movimento l’arma trascina gli arti e colpisce ogni nemico a gittata corpo a corpo.

**Calcolo costo:**
```
Costo = 12 + floor(M / 3)
```
- **Esempio:** M = 16 → 12 + 5 = **17** Jigo-ka

---

## Formule per i tiri (dadi)

Quando serve un tiro per colpire, resistere o controllare:

| Situazione | Formula |
|------------|---------|
| Colpo con arma psichica | `1d20 + floor(D/2) + floor(M/3)` |
| Resistenza a tecnica energetica | `1d20 + C` (fisica) o `1d20 + E` (spirituale) |
| Controllo Jigo-ka | `1d20 + M` |
| Precisione lancio | `1d20 + D + floor(M/4)` |

---

## Riepilogo variabili X

| Tipo di X | Formula generica |
|-----------|-------------------|
| Gittata | `3 + floor(M/4) + LVL×2` |
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
Le “tecniche veloci” si gestiscono con alto costo di kotodama e impatto stackabile (dmg basso). 

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
