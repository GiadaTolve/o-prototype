/** Waza Ordine — arsenale Mugen-Tai / Chisen-Tai (Sentō Senshi). */
import type { WazaDef } from '../wazaPool'
import { makeActive, makePassive } from './waza-pool-builders'

const B = 'ordine' as const

export const ORDINE_WAZA_POOL: WazaDef[] = [
  makePassive(
    B,
    'ordine-lama-disciplinata',
    'Lama Disciplinata',
    'L\'arsenale d\'ordine non insegna a colpire più forte: insegna a colpire dove l\'indice dell\'avversario è già spezzato dalla formazione.',
    'Passiva · CS 0. Mentre impugni un\'arma da mischia dichiarata, +1 all\'Indice nelle waza a [Contatto] se un alleato entro 4 m ha agito offensivamente contro lo stesso bersaglio in questo turno.',
  ),
  makeActive(
    B,
    'ordine-colpo-corda',
    'Colpo di Corda',
    'La corda dell\'equipaggiamento non è solo carico: nelle mani di chi ha giurato fedeltà all\'ordine diventa un laccio che cerca il polso prima ancora del colpo.',
    'Attiva · [Contatto][Solido] · Tier base 1 · CS 1 · 1/4. Colpo con corda o laccio (danno = tier). Se colpisci, il bersaglio subisce [Rallentato] per 1 turno.',
    { costCs: 1, hasDamage: true, dbw: 1 },
  ),
  makeActive(
    B,
    'ordine-formazione-spigolo',
    'Formazione a Spigolo',
    'Due analisti dell\'ordine non si sommano: si moltiplicano, chiudendo l\'angolo da cui il nemico non può più uscire senza pagare.',
    'Attiva · [Nessuna][Potenziamento] · CS 1 · 1/4. Fino a fine turno, se un alleato entro 4 m colpisce lo stesso bersaglio che stai ingaggiando, la sua waza ottiene +1 tier (una volta per alleato per turno).',
    { costCs: 1 },
  ),
  makeActive(
    B,
    'ordine-mitragliatrice-psichica',
    'Mitragliatrice Psichica',
    'Raffiche corte e disciplinate: non la potenza del singolo colpo, ma la saturazione dello spazio davanti alla linea.',
    'Attiva · [Proiettile][Energetica] · Tier base 2 · CS 2 · 1/4. Tre dardi in linea retta per 15 m; ogni dardo = tier 1 (4) se a segno. Stesso bersaglio può essere colpito più volte.',
    { costCs: 2, hasDamage: true, dbw: 2 },
  ),
  makeActive(
    B,
    'ordine-scudo-interposto',
    'Scudo Interposto',
    'Il soldato dell\'ordine impara a mettersi tra il compagno e la linea di fuoco — non per gloria, ma perché il reggimento sopravvive solo se qualcuno accetta di essere muro.',
    'Attiva · [Scudo][Energetica] · CS 2 · 1/4. Generi uno [Scudo] su un alleato entro 3 m: Resistenza = valore-tier 2 (8). Finché regge, i colpi diretti all\'alleato colpiscono prima lo scudo.',
    { costCs: 2, dbw: 2 },
  ),
  makeActive(
    B,
    'ordine-carica-coordinata',
    'Carica Coordinata',
    'Un grido, un passo, lo stesso slancio: il corpo intero diventa proiettile e la formazione non si rompe finché qualcuno resta in piedi.',
    'Attiva · [Contatto][Solido] · Tier base 2 · CS 2 · 1/4. Carica in linea retta per 8 m (danno = tier a ogni bersaglio sul percorso). Se un alleato ha usato Formazione a Spigolo su di te questo turno, +1 tier al danno.',
    { costCs: 2, hasDamage: true, dbw: 2 },
  ),
  makeActive(
    B,
    'ordine-ordine-di-fuoco',
    'Ordine di Fuoco',
    'Non è incitamento: è comando. Chi lo riceve sa esattamente quando alzare la mano e quando smettere di risparmiare Jigo-Ka.',
    'Attiva · [Nessuna][Potenziamento] · CS 2 · 1/4. Un alleato entro 8 m ottiene +1 tier alla prossima waza offensiva dichiarata entro questo turno.',
    { costCs: 2 },
  ),
  makeActive(
    B,
    'ordine-riflusso-tattico',
    'Riflusso Tattico',
    'Recuperare terreno non è fuga: è riposizionamento. L\'ordine premia chi sa tornare indietro senza rompere la linea.',
    'Attiva · [Movimento][Nessuna] · CS 1 · 1/4. Ti sposti fino a 6 m senza provocare attacchi reattivi gratuiti; rigeneri +1 CS.',
    { costCs: 1 },
  ),
]
