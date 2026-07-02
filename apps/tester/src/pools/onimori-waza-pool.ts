/** Waza Oni no Mori — regione Onimori. Acquistabili con EXP senza Esagono. */
import type { WazaDef } from '../wazaPool'
import { makeActive, makePassive } from './waza-pool-builders'

const B = 'onimori' as const

export const ONIMORI_WAZA_POOL: WazaDef[] = [
  makePassive(
    B,
    'onimori-sentiero-perduto',
    'Sentiero Perduto',
    'Chi entra nel Mori senza invito sente la foresta spostarsi di mezzo passo: non è smarrimento, è rifiuto.',
    'Passiva · CS 0. Entro zone Onimori (dichiarate dal Master), +1,5 m al Movimento fuori combattimento e percezione vaga di presenze entro 10 m (direzione, non identità).',
  ),
  makeActive(
    B,
    'onimori-nebbia-rossa',
    'Nebbia Rossa',
    'La umidità del sottobosco si tinge di ferro: una nebbia bassa che non nasconde, ma affatica chi la respira troppo a lungo.',
    'Attiva · [Emanazione][Gassosa] · Tier base 2 · CS 2 · 1/4. Nebbia in raggio 6 m per 2 turni; chi la attraversa subisce danno = tier (una volta per turno) e [Rallentato] per 1 turno.',
    { costCs: 2, hasDamage: true, dbw: 2, durata: 'due_turni' },
  ),
  makeActive(
    B,
    'onimori-artiglio-yokai',
    'Artiglio dello Yokai',
    'Per un istante le unghie non sono carne: sono artigli troppo lunghi, troppo freddi, troppo affamati.',
    'Attiva · [Contatto][Energetica] · Tier base 2 · CS 2 · 1/4. Colpo a [Contatto] (danno = tier). In zona Onimori, +1 tier se il bersaglio non ti ha ancora colpito in questo combattimento.',
    { costCs: 2, hasDamage: true, dbw: 2 },
  ),
  makeActive(
    B,
    'onimori-echo-bosco',
    'Eco del Bosco',
    'Il Mori ripete i suoni con ritardo maligno: il colpo arriva due volte, la seconda dal lato sbagliato.',
    'Attiva · [Propagazione][Sonoro] · Tier base 2 · CS 2 · 1/4. Onda sonora in cerchio 4 m; danno = tier. Se il bersaglio è già [Rallentato], applica anche 1 stack di [Vertigini].',
    { costCs: 2, hasDamage: true, dbw: 2 },
  ),
  makeActive(
    B,
    'onimori-maschera-oni',
    'Maschera dell\'Oni',
    'Un volto di legno scuro copre il viso: non protegge, intimidisce — e per qualche istante il corpo dietro sembra più grande del vero.',
    'Attiva · [Potenziamento][Nessuna] · CS 2 · 1/4. Per 2 turni, +1 tier alle waza a [Contatto] e +1 all\'Indice difensivo. A fine durata, −1 CS (stanchezza).',
    { costCs: 2, durata: 'due_turni' },
  ),
  makeActive(
    B,
    'onimori-maledizione-radici',
    'Maledizione delle Radici',
    'Il terreno del Mori non è suolo: è memoria. Le radici afferrano chi vi poggia troppo a lungo.',
    'Attiva · [Emanazione][Solido] · Tier base 3 · CS 3 · 1/4. Raggio 4 m; danno = tier e [Rallentato] per 2 turni a chi non supera il confronto d\'Indice.',
    { costCs: 3, hasDamage: true, dbw: 3 },
  ),
  makeActive(
    B,
    'onimori-ruggito-confine',
    'Ruggito di Confine',
    'Non è un urlo di paura: è il confine stesso che risponde, dicendo a ciò che non appartiene al Mori di tornare indietro.',
    'Attiva · [Propagazione Conica][Sonoro] · Tier base 3 · CS 3 · 1/4. Cono 8 m; danno = tier e sbalzo 3 m indietro. In zona Onimori, i bersagli sbalzati oltre il bordo dichiarato della zona subiscono +1 tier aggiuntivo.',
    { costCs: 3, hasDamage: true, dbw: 3 },
  ),
]
