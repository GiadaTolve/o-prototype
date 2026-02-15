/**
 * Pool di tecniche Waza — Ramo Dō (Le vie) e altri rami
 * Ogni tecnica ha: costo Jigo-ka, eventuale costo CS, formule Velocità e Danno
 *
 * Formule (WAZA_CALCOLI.md):
 * Velocità = [((D × 0.6) + (M × 0.4)) + Bonus Waza] × M.G.
 * DMG = [(DBW + (E × 0.7)) + BA/BO/B] × M.G.
 */

const floor = Math.floor

export type WazaType = 'passive' | 'active'
export type WazaBranch = 'do' | 'manipolazione' | 'materializzazione' | 'emissione' | 'trasformazione' | 'supporto'

export interface WazaStats {
  D: number
  M: number
  E: number
  LVL: number
}

export interface WazaDef {
  id: string
  name: string
  type: WazaType
  branch: WazaBranch
  description?: string
  /** Costo Jigo-ka (mana) */
  costJigo: (stats: WazaStats) => number
  /** Costo Chrono Stack (0 = non consuma) */
  costCs: number
  /** Bonus Waza per formula velocità (default 0) */
  velBonus: number
  /** Danno Base Waza (numero o funzione che ritorna da stats) */
  dbw: number | ((stats: WazaStats) => number)
  /** Ha formula velocità applicabile */
  hasVelocity: boolean
  /** Ha formula danno applicabile */
  hasDamage: boolean
}

/** Ramo Dō (Le vie) — Passive [6] + Attive [6] */
export const WAZA_POOL_DO: WazaDef[] = [
  // ─── PASSIVE [6] ───
  {
    id: 'arma-psichica',
    name: 'Arma psichica',
    type: 'passive',
    branch: 'do',
    description: "L'analista grazie alla sua predisposizione per l'uso di oggetti vedrà la sua Jigo-ka invadere l'arma che tiene tra le mani. L'arma non può essere bersagliata da tecniche di Manipolazione e Trasformazione di terzi finché l'analista la tocca. L'arma psichica può essere usata per lanciare tecniche.",
    costJigo: (s) => 5 + floor(s.M / 4),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'ordine',
    name: 'Ordine!',
    type: 'passive',
    branch: 'do',
    description: "L'analista trasforma le tecniche [Energetiche][A contatto] in [Energetiche][Proiettile] quando impugna un'arma. La gittata dipende da Mente e Destrezza.",
    costJigo: () => 0,
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: true,
    hasDamage: false,
  },
  {
    id: 'ottimizzazione',
    name: 'Ottimizzazione',
    type: 'passive',
    branch: 'do',
    description: "L'analista lancia tecniche attraverso l'[Arma psichica] pagando meno Jigo-ka. Lo sconto scala con Mente e livello skill.",
    costJigo: () => 0,
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'traccia-elementale',
    name: 'Traccia elementale',
    type: 'passive',
    branch: 'do',
    description: "L'analista mantiene i residui di una tecnica [Elementale] sull'arma fino alla fine del turno successivo. Le tecniche [Energetiche] lanciate dall'arma diventano [Elementali].",
    costJigo: (s) => 8 + floor(s.M / 3),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'legare-frammenti',
    name: 'Legare i frammenti',
    type: 'passive',
    branch: 'do',
    description: "L'analista richiama l'energia psichica da un oggetto rotto o da un [Costrutto] distrutto e lo ricrea per un turno. Non è possibile ricostruire oggetti distrutti dall'energia psichica.",
    costJigo: (s) => 12 + floor(s.E * 1.2) + floor(s.M / 4),
    costCs: 0,
    velBonus: 0,
    dbw: 0,
    hasVelocity: false,
    hasDamage: false,
  },
  {
    id: 'impatto-jigoka',
    name: 'Impatto Jigo-ka',
    type: 'passive',
    branch: 'do',
    description: "L'analista carica X armi piccole con energia psichica. Ogni arma infligge +X danni e si distrugge al colpo. Le armi brillano come piccole sfere luminose.",
    costJigo: (s) => {
      const x = 1 + floor(s.M / 5) + s.LVL
      return x * (4 + floor(s.M / 5))
    },
    costCs: 0,
    velBonus: 0,
    dbw: (s) => 1 + floor(s.M / 5) + s.LVL,
    hasVelocity: false,
    hasDamage: true,
  },
  // ─── ATTIVE [6] ───
  {
    id: 'estensione',
    name: 'Estensione',
    type: 'active',
    branch: 'do',
    description: "L'analista estende l'arma di X metri durante un colpo. Se l'arma è già [Arma psichica] la tecnica dura per l'intero turno. Le armi piccole possono cambiare forma (da coltello a spada, da martello a martello da guerra, ecc.).",
    costJigo: (s) => 6 + (1 + floor(s.M / 5) + s.LVL) * 2,
    costCs: 2,
    velBonus: 0,
    dbw: 5,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'sfogo-jigoka',
    name: 'Sfogo Jigo-ka',
    type: 'active',
    branch: 'do',
    description: "Esplosione di energia psichica in un cono davanti all'analista. I danni aumentano se l'arma è [Arma psichica] o [Batteria]. Con [Batteria] l'arma si disintegra.",
    costJigo: (s) => 10 + floor(s.M / 2),
    costCs: 3,
    velBonus: 0,
    dbw: 8,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'laser-psichico',
    name: 'Laser psichico',
    type: 'active',
    branch: 'do',
    description: "Raggio energetico lungo X metri. Il danno aumenta se l'arma è già [Arma psichica]. L'arma perde o guadagna la condizione [Arma psichica] dopo l'uso.",
    costJigo: (s) => 14 + floor(s.M * 0.8),
    costCs: 5,
    velBonus: 0,
    dbw: 10,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'arma-animata',
    name: 'Arma animata',
    type: 'active',
    branch: 'do',
    description: "L'arma diventa un [Costrutto] che levita e attacca su comando mentale. Ha gittata X e dura X turni. Può levitare fino a 2 metri di altezza.",
    costJigo: (s) => 16 + floor(s.M / 2) + floor(s.E / 3),
    costCs: 3,
    velBonus: 0,
    dbw: 6,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'sorpresa',
    name: 'Sorpresa',
    type: 'active',
    branch: 'do',
    description: "Immagazzina una tecnica nell'arma. Puoi rilasciarla con un impatto o con un fendente. Il proiettile ha dimensione e gittata X. Se non eseguita in tempo l'arma si rompe rilasciando l'energia come [Emanazione].",
    costJigo: (s) => 8 + floor(s.M / 4),
    costCs: 2,
    velBonus: 0,
    dbw: 7,
    hasVelocity: true,
    hasDamage: true,
  },
  {
    id: 'risonanza-lama',
    name: 'Risonanza della lama',
    type: 'active',
    branch: 'do',
    description: "Per un turno, durante il movimento l'arma trascina gli arti e colpisce ogni nemico a gittata corpo a corpo. Non è possibile mirare a punti vitali.",
    costJigo: (s) => 12 + floor(s.M / 3),
    costCs: 5,
    velBonus: 0,
    dbw: 9,
    hasVelocity: true,
    hasDamage: true,
  },
]

/** Manipolazione — Passive [6] + Attive [6] */
const WAZA_POOL_MANIPOLAZIONE: WazaDef[] = [
  { id: 'telecinesi', name: 'Telecinesi', type: 'passive', branch: 'manipolazione', description: "L'analista può alzare un [Costrutto] di taglia [Media], ricoprirlo di energia psichica e scagliarlo o muoverlo. Parametri di movimento: taglia Piccola = analista, taglia Media = x0,75.", costJigo: (s) => 8 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'mago-consistenza', name: 'Mago della consistenza', type: 'passive', branch: 'manipolazione', description: "L'analista può cambiare la [Consistenza] di X [Costrutti] che ha generato.", costJigo: (s) => 6 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'mago-forma', name: 'Mago della forma', type: 'passive', branch: 'manipolazione', description: "L'analista può cambiare la [Categoria] di una sua tecnica durante l'esecuzione. [Emanazione]/[Propagazione] ↔ [Propagazione Conica]. Il punto di origine resta l'analista.", costJigo: (s) => 10 + floor(s.M / 3), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'pieno-controllo', name: 'Pieno controllo', type: 'passive', branch: 'manipolazione', description: "L'analista può cambiare la direzione di una tecnica [Raggio] o [Proiettile] di max 180° durante l'esecuzione.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'scissione', name: 'Scissione', type: 'passive', branch: 'manipolazione', description: "[Raggio]: divide in due diramazioni (danno 75%). [Proiettile]: aumenta quantità x0,5 (danno 75%).", costJigo: (s) => 5 + floor(s.M / 6), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'furia-telecineta', name: 'Furia Telecineta', type: 'active', branch: 'manipolazione', description: "Sceglie un [Costrutto][Solido] sollevato con [Telecinesi] e lo scaglia con estrema forza. Gittata e danni pari a X.", costJigo: (s) => 12 + floor(s.M / 3) + floor(s.E / 4), costCs: 3, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'scambio', name: 'Scambio', type: 'active', branch: 'manipolazione', description: "Sceglie due [Costrutti][Solidi] evocati entro X gittata: si scambiano di posizione mantenendo traiettorie e proprietà.", costJigo: (s) => 10 + floor(s.M / 4), costCs: 2, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'danni-collaterali', name: 'Danni poco collaterali', type: 'active', branch: 'manipolazione', description: "Un [Costrutto][Solido] implode generando X [Proiettili][Solidi] indirizzati verso un bersaglio a X metri.", costJigo: (s) => 14 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 9, hasVelocity: true, hasDamage: true },
  { id: 'magnetismo', name: 'Magnetismo', type: 'active', branch: 'manipolazione', description: "Un [Costrutto] diventa [Positivo] per 2 turni. Altri Y [Costrutti] diventano [Negativi]. I [Negativi] vengono attratti verso il [Positivo].", costJigo: (s) => 16 + floor(s.M / 2) + floor(s.E / 3), costCs: 5, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'entanglement', name: 'Entanglement', type: 'active', branch: 'manipolazione', description: "Sceglie due [Costrutti][Solidi]: per 4 turni tutto ciò che accade a uno si ripete sull'altro.", costJigo: (s) => 18 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'contraffazione', name: 'Contraffazione', type: 'active', branch: 'manipolazione', description: "Un [Costrutto] appare come un altro [Costrutto] visibile o oggetto dell'inventario. Dura 4 turni. Sotto 4m si vede la forma vera.", costJigo: (s) => 12 + floor(s.M / 3), costCs: 3, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'inversione-proprieta', name: 'Inversione di Proprietà', type: 'active', branch: 'manipolazione', description: "Tenta di strappare il controllo di un [Costrutto] nemico entro X metri. Se la Jigo-ka supera quella del creatore, il controllo passa all'analista per Y turni. Solo costrutti medi o inferiori.", costJigo: (s) => 20 + floor(s.M * 0.8), costCs: 5, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
]

/** Materializzazione — Passive [5] + Attive [5] */
const WAZA_POOL_MATERIALIZZAZIONE: WazaDef[] = [
  { id: 'addio-carne', name: 'Addio carne', type: 'passive', branch: 'materializzazione', description: "L'analista può rimpiazzare parti del corpo con un [Costrutto][Solido] che prende la forma esatta. Dolore fantasma riduce Jigo-ka invece della vita.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'affinita-elementale', name: 'Affinità elementale', type: 'passive', branch: 'materializzazione', description: "L'analista sceglie un elemento (non si può cambiare). Può infondere l'elemento nei [Costrutti][Solidi] e nelle tecniche [Energetiche].", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'potere-cognizione', name: 'Potere della cognizione', type: 'passive', branch: 'materializzazione', description: "I [Costrutti] e [Scudi] [Solidi] dell'analista aumentano la resistenza di X.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'piccolo-arsenale', name: 'Piccolo arsenale', type: 'passive', branch: 'materializzazione', description: "Crea X armi piccole [Costrutti][Energetici] che si infrangono al primo ostacolo. Una sola arma può essere nascosta per 6 ore.", costJigo: (s) => 6 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'inventore', name: 'Inventore', type: 'passive', branch: 'materializzazione', description: "Crea un oggetto [Costrutto][Solido] di media grandezza: fusione di due armi (corpo di una, estremità dell'altra). Un solo oggetto attivo.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'memoria-forma', name: 'Memoria della Forma', type: 'passive', branch: 'materializzazione', description: "Ricreare un [Costrutto] già creato costa 20% in meno. Si possono memorizzare fino a X forme (creare 3 volte per memorizzare).", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'infusione-persistente', name: 'Infusione Persistente', type: 'passive', branch: 'materializzazione', description: "I [Costrutti] durano 1 turno in più. Si può spendere Jigo-ka per estendere la durata invece di ricreare (50% costo creazione).", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'minaccia-concreta', name: 'Minaccia concreta', type: 'active', branch: 'materializzazione', description: "Emana aura [Energetica] visibile. Due usi: armatura [Solida] (bonus stat) o [Proiettile][Energetico] a distanza (gittata X, dimensione Y).", costJigo: (s) => 15 + floor(s.M / 2) + floor(s.E / 3), costCs: 4, velBonus: 0, dbw: 10, hasVelocity: true, hasDamage: true },
  { id: 'dito-divino', name: 'Dito divino', type: 'active', branch: 'materializzazione', description: "Sceglie un punto entro X gittata: dall'alto cade un fulmine [Costrutto][Elementale] che colpisce per Y metri. +2 Cs per un secondo punto.", costJigo: (s) => 18 + floor(s.M * 0.7), costCs: 5, velBonus: 0, dbw: 12, hasVelocity: true, hasDamage: true },
  { id: 'alitosi-yokai', name: 'Alitosi dello Yokai', type: 'active', branch: 'materializzazione', description: "Nube [Emanazione][Gassosa] per X metri, dura 2 turni. Riduce Riflessi. Infiammabile: a contatto con Fuoco/Fulmine si incendia e sparisce.", costJigo: (s) => 12 + floor(s.M / 3), costCs: 3, velBonus: 0, dbw: 6, hasVelocity: false, hasDamage: true },
  { id: 'globo-rancoroso', name: 'Globo rancoroso', type: 'active', branch: 'materializzazione', description: "[Costrutto][Elementale] di fuoco che segue l'analista 4 turni. Si lancia verso la prima fonte di danno (nemico o fuoco amico). Esplode in [Emanazione a distanza].", costJigo: (s) => 14 + floor(s.M / 2) + floor(s.E / 4), costCs: 4, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'colonne-pazienti', name: 'Colonne pazienti', type: 'active', branch: 'materializzazione', description: "Due [Costrutti] colonne che crescono fino a X metri, larghe Y. Conformazione dal terreno. Distanti 1m, permangono 3 turni.", costJigo: (s) => 20 + floor(s.M / 2) + floor(s.E / 3), costCs: 5, velBonus: 0, dbw: 7, hasVelocity: false, hasDamage: true },
]

/** Emissione — Passive [5] + Attive [5] */
const WAZA_POOL_EMISSIONE: WazaDef[] = [
  { id: 'batteria', name: 'Batteria', type: 'passive', branch: 'emissione', description: "L'analista lascia X Jigo-ka in un [Costrutto]. L'energia permane 24h, recuperabile toccando il costrutto.", costJigo: (s) => 8 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'inversione', name: 'Inversione', type: 'passive', branch: 'emissione', description: "Richiama a sé un [Costrutto] con la propria energia. Torna tra le mani seguendo la traiettoria più veloce. Velocità dipende dalla massa.", costJigo: (s) => 6 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'emissione-bassa-freq', name: 'Emissione a bassa frequenza', type: 'passive', branch: 'emissione', description: "Sfera di energia invisibile per X metri. Rivela fonti di Jigo-ka. Chi viene colpito avverte un lieve tepore. Usabile tramite [Costrutto] con [Batteria] per gittata maggiore.", costJigo: (s) => 5 + floor(s.M / 6), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'sicurezza-avanzata', name: 'Sicurezza avanzata', type: 'passive', branch: 'emissione', description: "Lascia X Jigo-ka in un [Costrutto] per un paio d'ore. Chiudendo entrambi gli occhi si ottiene il punto di vista del costrutto (udito e vista).", costJigo: (s) => 10 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'deflagrazione-instabile', name: 'Deflagrazione instabile', type: 'passive', branch: 'emissione', description: "Consuma X Jigo-ka per effetto extra: [Proiettile]→esplosione; [Raggio]→colpo concatenato; [Emanazione]/[Propagazione]→+X gittata.", costJigo: (s) => 7 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'sovraccarico-controllato', name: 'Sovraccarico Controllato', type: 'passive', branch: 'emissione', description: "Spendendo >30% Jigo-ka in un turno, la prossima [Emanazione]/[Propagazione] [Energetica] ha gittata e danni aumentati. Si accumula.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'corto-circuito', name: 'Corto circuito', type: 'active', branch: 'emissione', description: "Sovraccarica un [Costrutto] o oggetto fino a farlo esplodere: X danni per Y metri [Energetiche][Contatto]. Con [Batteria] esplosione maggiore.", costJigo: (s) => 14 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 11, hasVelocity: true, hasDamage: true },
  { id: 'lancio-jigoka', name: 'Lancio Jigo-ka', type: 'active', branch: 'emissione', description: "Convolge energia nei palmi o nelle piante dei piedi. Lancia 2 [Proiettili][Energetici] per X metri.", costJigo: (s) => 10 + floor(s.M / 3), costCs: 2, velBonus: 0, dbw: 7, hasVelocity: true, hasDamage: true },
  { id: 'impeto-rilascio', name: 'Impeto a rilascio', type: 'active', branch: 'emissione', description: "Comprime Jigo-ka per max 2 turni. Rilascio: [Emanazione][Energetica] repulsiva per X metri. Turno 1: interrompe movimenti. Turno 2: arreca danno. Colpiti mentre carica: rilascio involontario.", costJigo: (s) => 16 + floor(s.M * 0.6), costCs: 5, velBonus: 0, dbw: 9, hasVelocity: true, hasDamage: true },
  { id: 'scarico-forza', name: 'Scarico di forza', type: 'active', branch: 'emissione', description: "Accumula energia in una parte del corpo. All'impatto scarica: onda d'urto per X metri, danneggia e compromette stabilità. Si può sfondare pareti. Se non dispersa in un turno: danno [A contatto][Energetica].", costJigo: (s) => 18 + floor(s.M / 2), costCs: 5, velBonus: 0, dbw: 12, hasVelocity: true, hasDamage: true },
  { id: 'famiglio-onirico', name: 'Famiglio onirico', type: 'active', branch: 'emissione', description: "[Costrutto][Energetico] animale, taglia media, dura 3 turni. L'analista non guadagna CS a inizio turno. Percorre X metri, attacca 1/turno. Può acquisire elemento.", costJigo: (s) => 22 + floor(s.M / 2) + floor(s.E / 3), costCs: 6, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'detonazione-catena', name: 'Detonazione a Catena', type: 'active', branch: 'emissione', description: "Seleziona fino a X [Costrutti] con [Batteria] in vista. Esplodono simultaneamente. Sovrapposizioni: danni aumentati. [Emanazione a distanza][Energetica].", costJigo: (s) => 25 + floor(s.M * 0.8), costCs: 8, velBonus: 0, dbw: 15, hasVelocity: true, hasDamage: true },
]

/** Trasformazione — Passive [5] + Attive [5] */
const WAZA_POOL_TRASFORMAZIONE: WazaDef[] = [
  { id: 'volere', name: 'Volere', type: 'passive', branch: 'trasformazione', description: "Cambia [Consistenza] di una tecnica durante l'esecuzione. Non [Nulla] o [Elementale]. Se [Elementale] può cambiare solo l'elemento.", costJigo: (s) => 8 + floor(s.M / 4), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'cambio-forzato', name: 'Cambio forzato', type: 'passive', branch: 'trasformazione', description: "Cambia [Consistenza] di [Costrutti] entro X metri. Non [Nulla] o [Elementale]. Dura X turni.", costJigo: (s) => 10 + floor(s.M / 3), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'rinforzo-elementale', name: 'Rinforzo elementale', type: 'passive', branch: 'trasformazione', description: "Cambia [Consistenza] di una tecnica in [Elementale] durante l'esecuzione. Elemento a scelta. Non su [Nulla] o già [Elementale].", costJigo: (s) => 7 + floor(s.M / 5), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'regole-alchemiche', name: 'Regole alchemiche', type: 'passive', branch: 'trasformazione', description: "Non si può usare due volte consecutive la stessa [Consistenza]. Ogni cambio dà effetti: [Sonoro]→-gittata +danno; [Elementale]→aura Xm; [Liquido]→+gittata -danno; [Gassoso]→+gittata, +1 turno; [Solido]→+resistenza; [Energetiche]→+velocità.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'pietra-filosofale', name: 'Pietra filosofale', type: 'passive', branch: 'trasformazione', description: "Trasforma un [Costrutto][Solido] in cristallo rosso sangue. Richiede X turni. Distrutto a contatto: bonus statistiche per X turni.", costJigo: (s) => 20 + floor(s.M / 2), costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'trappola', name: 'Trappola!', type: 'active', branch: 'trasformazione', description: "Cambia [Consistenza] di una tecnica già in campo (da almeno 1 turno) in [Elementale]. Dura 1 turno.", costJigo: (s) => 12 + floor(s.M / 3), costCs: 3, velBonus: 0, dbw: 6, hasVelocity: false, hasDamage: true },
  { id: 'aberrazione', name: 'Aberrazione', type: 'active', branch: 'trasformazione', description: "Sostituisce un arto con un [Costrutto] brandito come arma per 4 turni. [Potenziamento][Nulla]. Se rotto: arto inutilizzabile.", costJigo: (s) => 16 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 8, hasVelocity: true, hasDamage: true },
  { id: 'jammer', name: 'Jammer', type: 'active', branch: 'trasformazione', description: "Ronzio che interferisce con la Jigo-ka altrui per X turni, X metri. Ogni colpo a contatto riduce Jigo-ka del bersaglio di Y.", costJigo: (s) => 14 + floor(s.M / 3), costCs: 4, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'velo-onirico', name: 'Velo onirico', type: 'active', branch: 'trasformazione', description: "Velo invisibile largo X, lungo Y. Copre le vere proprietà di ciò che sta sotto. Solo la Jigo-ka del proprietario può interagire. Dura 3 turni.", costJigo: (s) => 15 + floor(s.M / 2), costCs: 4, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'sorpresa-trasf', name: 'Sorpresa!', type: 'active', branch: 'trasformazione', description: "Aumenta la dimensione di un [Costrutto] entro X gittata di una taglia per 1 turno. Poi il costrutto si rompe.", costJigo: (s) => 10 + floor(s.M / 4), costCs: 2, velBonus: 0, dbw: 5, hasVelocity: false, hasDamage: true },
  { id: 'scambio-proprieta', name: 'Scambio di Proprietà', type: 'active', branch: 'trasformazione', description: "Scambia le [Consistenze] di due oggetti/[Costrutti] entro X metri per Y turni. Es: muro [Solido] e nube [Gassosa] si scambiano. Non su costrutti impugnati da terzi.", costJigo: (s) => 22 + floor(s.M * 0.7), costCs: 6, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
]

/** Supporto — Passive [5] + Attive [5] */
const WAZA_POOL_SUPPORTO: WazaDef[] = [
  { id: 'ego-smisurato', name: 'Ego smisurato', type: 'passive', branch: 'supporto', description: "Con [Status] i potenziamenti stat durano 1 turno in più; l'arma diventa [Costrutto]. Con potenziamento, toccando un [Costrutto] lo potenzia (1 alla volta, fino a contatto + fine turno).", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'tuttuno', name: "Tutt'uno", type: 'passive', branch: 'supporto', description: "Con depotenziamento stat: effetti negativi durano 1 turno in meno; l'arma diventa [Costrutto]. Toccando un [Costrutto] lo depotenzia.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'scelta-nucleo', name: 'Scelta del nucleo', type: 'passive', branch: 'supporto', description: "Durante una tecnica [Potenziamento] si può cambiare una stat potenziata con un'altra. La durata diminuisce di 2 turni.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'adattamento-psicofisico', name: 'Adattamento psico-fisico', type: 'passive', branch: 'supporto', description: "Subito danno da una [Consistenza]: si ricevono meno danni da quella [Consistenza] finché non si viene colpiti da un'altra.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'rinforzo-psichico', name: 'Rinforzo psichico', type: 'passive', branch: 'supporto', description: "Immagazzina energia delle tecniche che colpiscono. Bonus danni se la tecnica usata ha la [Consistenza] dell'ultima subita.", costJigo: () => 0, costCs: 0, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'forza-scudo', name: 'La mia forza, il mio scudo', type: 'active', branch: 'supporto', description: "Rimuove ogni potenziamento stat e genera uno [Scudo][Energetico] con resistenza pari al valore delle stat perse. Il turno dopo non si può ricevere potenziamenti.", costJigo: () => 0, costCs: 3, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'forza-arco', name: 'La mia forza, il mio arco', type: 'active', branch: 'supporto', description: "Rimuove ogni potenziamento stat e genera un [Proiettile][Energetico] per X metri. Danno = valore stat perse. Il turno dopo non si può ricevere potenziamenti.", costJigo: () => 0, costCs: 3, velBonus: 0, dbw: 10, hasVelocity: true, hasDamage: true },
  { id: 'fibre-psichiche', name: 'Fibre psichiche', type: 'active', branch: 'supporto', description: "[Potenziamento] 2 turni. Fibre gambe/braccia/torace: Bianche (+X% Forza), Neuromuscolari (+X% Velocità), Rosse (+X% Costituzione).", costJigo: (s) => 12 + floor(s.M / 3) + floor(s.E / 4), costCs: 2, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'traslazione-forzata', name: 'Traslazione forzata', type: 'active', branch: 'supporto', description: "Carica energia in un colpo a contatto. Colpendo un essere vivente si può spostare uno [Status] da sé al bersaglio. [Potenziamento].", costJigo: (s) => 10 + floor(s.M / 4), costCs: 3, velBonus: 0, dbw: 0, hasVelocity: false, hasDamage: false },
  { id: 'tensione', name: 'Tensione', type: 'active', branch: 'supporto', description: "Carica energia nei muscoli per X turni. Il prossimo colpo a contatto ha +X Velocità e +X Forza. L'arto scelto non è utilizzabile fino al compimento.", costJigo: (s) => 8 + floor(s.M / 5), costCs: 2, velBonus: 0, dbw: 6, hasVelocity: true, hasDamage: true },
  { id: 'spinta-adrenalinica', name: 'Spinta Adrenalinica', type: 'active', branch: 'supporto', description: "Per X turni: velocità e riflessi aumentati. Al termine: velocità e riflessi ridotti per Y turni. [Potenziamento][Nessuna].", costJigo: (s) => 14 + floor(s.M / 2), costCs: 3, velBonus: 0, dbw: 0, hasVelocity: true, hasDamage: false },
]

/** Tutte le waza disponibili (tutti i rami Dō) */
export const WAZA_POOL: WazaDef[] = [
  ...WAZA_POOL_DO,
  ...WAZA_POOL_MANIPOLAZIONE,
  ...WAZA_POOL_MATERIALIZZAZIONE,
  ...WAZA_POOL_EMISSIONE,
  ...WAZA_POOL_TRASFORMAZIONE,
  ...WAZA_POOL_SUPPORTO,
]

/** Nomi rami per UI */
export const BRANCH_LABELS: Record<WazaBranch, string> = {
  do: 'Le vie',
  manipolazione: 'Manipolazione',
  materializzazione: 'Materializzazione',
  emissione: 'Emissione',
  trasformazione: 'Trasformazione',
  supporto: 'Supporto',
}

/** Calcola velocità waza: [((D×0.6)+(M×0.4))+Bonus] × M.G. */
export function calcVelocity(
  D: number,
  M: number,
  velBonus: number,
  velMult: number
): number {
  const base = floor(D * 0.6) + floor(M * 0.4) + velBonus
  return Math.floor(base * velMult)
}

/** Risolve DBW (numero o funzione) */
export function resolveDbw(
  dbw: number | ((s: WazaStats) => number),
  stats: WazaStats
): number {
  return typeof dbw === 'function' ? dbw(stats) : dbw
}

/** Calcola danno waza: [(DBW+(E×0.7))+BA/BO/B] × M.G. */
export function calcDamage(
  E: number,
  dbw: number,
  bonus: number,
  dmgMult: number
): number {
  const base = dbw + floor(E * 0.7) + bonus
  return Math.floor(base * dmgMult)
}
