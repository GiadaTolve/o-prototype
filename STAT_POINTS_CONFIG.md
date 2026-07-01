# Configurazione Livello, Grado e Punti Stat

Questo documento descrive come vengono calcolati i **punti stat distribuibili** (F, C, D, M, E) in base al **livello**. Il **grado** è scelto liberamente (non vincolato al livello) e fornisce i moltiplicatori Vel/Dmg per le waza (vedi `WAZA_CALCOLI.md`).

Il file di configurazione effettivo è: `apps/tester/src/statPointsConfig.ts`

---

## Gradi (carriera Analisti)

I gradi sono assegnati dal Consiglio di gestione a sua discrezione. Non vincolati al livello. I moltiplicatori Vel/Dmg sono usati per Velocità e Danno delle waza.

| Grado | Velocità | Danno |
|-------|----------|-------|
| **G1** Nemuribito | ×1.05 | ×1.10 |
| **G2** Hakyō | ×1.10 | ×1.20 |
| **G3** Bunsekikan | ×1.15 | ×1.30 |
| **G4** Sentatsu Bunsekikan | ×1.20 | ×1.40 |
| **G5** Kanteikan | ×1.25 | ×1.50 |
| **G6** Shin'enkan | ×1.30 | ×1.60 |
| **G7** Akumu Zankyō | ×1.35 | ×1.70 |

---

## Formula punti totali

```
Punti totali = 25 + (livello - 1) × 5
```

- **Base:** 25 pt a livello 1  
- **Per livello:** +5 pt per ogni livello  

### Esempi

| Livello | Punti |
|---------|-------|
| 1 | 25 |
| 5 | 25 + 20 = **45** |
| 10 | 25 + 45 = **70** |
| 16 | 25 + 75 = **100** |
| 50 | 25 + 245 = **270** |

---

## Modifica

Per cambiare la formula o i valori, modifica `apps/tester/src/statPointsConfig.ts`:

- `BASE_STAT_POINTS` — punti a livello 1  
- `POINTS_PER_LEVEL` — punti aggiunti per livello  
- `GRADES[].velMult` / `GRADES[].dmgMult` — moltiplicatori Velocità e Danno Waza  
