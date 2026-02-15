# Configurazione Livello, Grado e Punti Stat

Questo documento descrive come vengono calcolati i **punti stat distribuibili** (F, C, D, M, E) in base al **livello** e al **grado** del personaggio.

Il file di configurazione effettivo è: `apps/tester/src/statPointsConfig.ts`

---

## Gradi (carriera Analisti)

| Grado | Livelli | Bonus pt |
|-------|---------|----------|
| **Nemuribito** | 1–3 | +0 |
| **Hakyō** | 3–10 | +2 |
| **Bunsekikan** | 11–18 | +4 |
| **Sentatsu Bunsekikan** | 18–28 | +6 |
| **Kanteikan** | 28–38 | +8 |
| **Shin'enkan** | 38–48 | +10 |
| **Akumu Zankyō** | 48+ | +12 |

---

## Formula punti totali

```
Punti totali = 15 + (livello - 1) × 1 + bonus_grado
```

- **Base:** 15 pt a livello 1  
- **Per livello:** +1 pt per ogni livello  
- **Bonus grado:** vedi tabella sopra  

### Esempi

| Livello | Grado | Punti |
|---------|-------|-------|
| 1 | Nemuribito | 15 |
| 5 | Hakyō | 15 + 4 + 2 = **21** |
| 10 | Hakyō | 15 + 9 + 2 = **26** |
| 20 | Bunsekikan | 15 + 19 + 4 = **38** |
| 50 | Akumu Zankyō | 15 + 49 + 12 = **76** |

---

## Modifica

Per cambiare la formula o i valori, modifica `apps/tester/src/statPointsConfig.ts`:

- `BASE_STAT_POINTS` — punti a livello 1  
- `POINTS_PER_LEVEL` — punti aggiunti per livello  
- `GRADES[].statBonus` — bonus per ogni grado  
