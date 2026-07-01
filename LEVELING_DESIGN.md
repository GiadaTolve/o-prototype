# Leveling Design — Sistema di Leveling

> Fonte canonica per la scala livelli 1–50. Usato da `apps/tester` e `apps/server`.

---

## Tabella completa

| Liv. | Exp Δ | Exp Totale | Statistiche | Fase |
|------|-------|------------|-------------|------|
| **1** | — | — | 25 | EARLY-GAME |
| 2 | 50 | 50 | +5 | |
| 3 | 89 | 139 | +5 | |
| 4 | 128 | 267 | +5 | |
| 5 | 167 | 434 | +5 [45] | |
| 6 | 206 | 640 | +5 | |
| **7** | 245 | 885 | +5 | MID-GAME |
| 8 | 284 | 1.169 | +5 | |
| 9 | 323 | 1.492 | +5 | |
| 10 | 362 | 1.854 | +5 [70] | |
| 11 | 401 | 2.255 | +5 | |
| 12 | 440 | 2.695 | +5 | |
| 13 | 479 | 3.174 | +5 | |
| 14 | 518 | 3.692 | +5 | |
| 15 | 557 | 4.249 | +5 [95] | |
| 16 | 596 | 4.845 | +5 | |
| 17 | 635 | 5.480 | +5 | |
| 18 | 674 | 6.154 | +5 | |
| 19 | 713 | 6.867 | +5 | |
| 20 | 752 | 7.619 | +5 [120] | |
| 21 | 791 | 8.410 | +5 | |
| 22 | 830 | 9.240 | +5 | |
| 23 | 869 | 10.109 | +5 | |
| 24 | 908 | 11.017 | +5 | |
| 25 | 947 | 11.964 | +5 [145] | |
| **26** | 986 | 12.950 | +5 | CORE (Molto lento) |
| 27 | 1.025 | 13.975 | +5 | |
| 28 | 1.064 | 15.039 | +5 | |
| 29 | 1.103 | 16.142 | +5 | |
| 30 | 1.142 | 17.284 | +5 [170] | |
| 31 | 1.181 | 18.465 | +5 | |
| 32 | 1.220 | 19.685 | +5 | |
| 33 | 1.259 | 20.944 | +5 | |
| 34 | 1.298 | 22.242 | +5 | |
| 35 | 1.337 | 23.579 | +5 [195] | |
| 36 | 1.376 | 24.955 | +5 | |
| 37 | 1.415 | 26.370 | +5 | |
| 38 | 1.454 | 27.824 | +5 | |
| 39 | 1.493 | 29.317 | +5 | |
| 40 | 1.532 | 30.849 | +5 [210] | |
| 41 | 1.571 | 32.420 | +5 | |
| 42 | 1.610 | 34.030 | +5 | |
| 43 | 1.649 | 35.679 | +5 | |
| 44 | 1.688 | 37.367 | +5 | |
| 45 | 1.727 | 39.094 | +5 [235] | |
| 46 | 1.766 | 40.860 | +5 | |
| 47 | 1.805 | 42.665 | +5 | |
| 48 | 1.844 | 44.509 | +5 | |
| 49 | 1.883 | 46.392 | +5 | |
| 50 | 1.922 | 48.314 | +5 [260] | |

---

## Fasi

- **EARLY-GAME**: livelli 1–6
- **MID-GAME**: livelli 7–25
- **CORE (Molto lento)**: livelli 26–50

---

## Tot. Statistiche (Punti Statistica)

- **Livello 1**: 25 pt base
- **Per livello**: +5 pt (F, C, D, M, E)
- **Formula**: `25 + (livello - 1) × 5`

Totale alle soglie: 45 (liv.5), 70 (liv.10), 95 (liv.15), 120 (liv.20), 145 (liv.25), 170 (liv.30), 195 (liv.35), 210 (liv.40), 235 (liv.45), 260 (liv.50).

---

## Premi di livello (Keys & Gems)

| Valuta | Per livello | Uso |
|--------|-------------|-----|
| **Key** | 1 | Sbloccano i rami dello Skill Tree |
| **Gem** | 1 (oppure 3 ogni 5 livelli) | Potenziano le Waza |

- Ogni livello fornisce **1 Key**
- Ogni livello fornisce **1 Gem**, fatta eccezione per i livelli 5, 10, 15, 20, 25, 30, 35, 40, 45, 50 che forniscono **3 Gem**

Totale a livello 50: 50 Key, 70 Gem (10×3 + 40×1)

---

## Banner Level Up

Quando il personaggio sale di livello, viene mostrato un **banner Level Up** che riassume i premi ottenuti e propone due azioni.

### Quando appare

- Alla **soglia di livello** raggiunta (EXP totale ≥ soglia).
- In caso di **Salta** (v. sotto), il banner viene **nascosto** ma verrà **riproposto al successivo login** (persistenza lato backend: flag `pendingLevelUpBanner` o equivalente).

### Contenuto del banner

- **Livello** raggiunto
- **LEVEL UP** (etichetta)
- **EXP** attuale / necessario per prossimo livello (o MAX se livello 50)
- **HAI OTTENUTO:** Statistiche (+5 o +25 al liv. 1), Key, Gem (con icone stella)

### Bottoni (dentro il banner)

| Bottone | Azione |
|---------|--------|
| **Aumenta** | Apre la **modifica statistiche** (assegnazione punti). I punti rimanenti possono essere usati in seguito. |
| **Salta** | Nasconde il banner. Verrà mostrato di nuovo al prossimo login. |

### Implementazione

- **Componente:** `LevelUpBanner` in `apps/tester/src/LevelUpBanner.tsx` (usato dal tester e riutilizzabile nel client).
- **Stile:** forma ad arco in alto, palette oro/ambra (#b8a078), bottoni sottili e croccanti (stile Dark Arcane).
- **Props:** `level`, `expCurrent`, `expNeeded`, `statPoints`, `keys`, `gems`, `onAumenta?`, `onSalta?`.
