# Combat UI — Asset per interfaccia combattimento

## Progress Bars

Tutte le barre hanno `viewBox="0 0 240 32"`. Il fill di progresso va da `x=12` a `x=12 + width`, con `width` massimo `204` (228 - 12).

| File | Uso | Colore fill |
|------|-----|--------------|
| `progress-bar-etched.svg` | Base / generica | Viola (#7c3aed) |
| `progress-bar-life.svg` | Lifepoints / HP | Cremisi (#8a1c1c) |
| `progress-bar-mana.svg` | Jigoka / mana | Viola (#7c3aed) |
| `progress-bar-stack.svg` | Chronostack | Segmenti oro (#d4af37) — 6 blocchi |

### Uso dinamico

Per **life** e **mana**: sovrascrivere il `<rect>` del fill con `width` calcolato da `(current / max) * 204`.

Per **chronostack**: mostrare `N` segmenti pieni su 6; ogni segmento: `rect` con `x = 14 + (i * 34)` (gap 4px).

### Path

```
/combat-ui/progress-bar-life.svg
/combat-ui/progress-bar-mana.svg
/combat-ui/progress-bar-stack.svg
/combat-ui/progress-bar-etched.svg
```
