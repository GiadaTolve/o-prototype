/**
 * Applica il canone Tōka-dō (testi definitivi) su Neon.
 * EXP/CS da sistema (Passiva/T1=15 EXP · CS 2/4/6/8/10). Ignora EXP/CS nel testo narrativo.
 * Marca le attive narrative (is_narrativa).
 *
 * Uso: cd apps/server && bun run scripts/apply-toka-canon.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '../../.env') })

import { eq, inArray } from 'drizzle-orm'
import { db } from '../src/plugins/db'
import { skills } from '../src/db/schema'
import { resolveDefaultWazaCostExp } from '@domain/progression/waza-cost-exp'
import {
  appendReqGradeMarker,
  type AnalystGradeName,
  WAZA_REQUIRED_GRADE_BY_POOL_ID,
} from '@domain/progression/waza-grade-req'

type CanonRow = {
  poolId: string
  name: string
  flavor: string
  effect: string
  isPassive: boolean
  isNarrativa?: boolean
  rank: string | null
  createIfMissing?: boolean
}

/** Pool attive narrative Tōka (niente IR/danno in chat). */
const TOKA_NARRATIVA_POOL_IDS = new Set([
  'kakucho-espansione-della-luce',
  'kaeribi-fiamma-del-ritorno',
  'fuin-no-hi-sigillo-della-fiamma',
  'omocha-il-giocattolo',
  'gangushi-il-giocattolaio',
])

const CANON: CanonRow[] = [
  {
    poolId: 'toro-lanterna-incisa',
    name: 'Tōrō · Lanterna Incisa (灯籠)',
    flavor:
      "L'analista chiude la mano attorno all'arma e smette di stringerla come si stringe uno strumento — la tiene come si tiene una lanterna. La Jigo-Ka scende dal terzo occhio fino al palmo e penetra nella materia: il Tōrō diventa il punto in cui Meiju e Shiju si toccano, e nessuno può strapparglielo via finché lo regge.",
    effect:
      "L'analista designa un'arma impugnata come [Tōrō]. Finché la mantiene a contatto diretto, non può essere bersaglio di waza di [Manipolazione] o [Trasformazione] altrui e funge da punto di origine per tutte le proprie waza.",
    isPassive: true,
    rank: null,
  },
  {
    poolId: 'michishirube-luce-guida',
    name: 'Michishirube · Luce Guida (道標)',
    flavor:
      "Il Tōrō puntato verso un bersaglio traccia nell'aria una linea invisibile agli altri — l'analista la vede, e la segue. I colpi che normalmente richiederebbero il contatto fisico diretto percorrono quella traiettoria come se il Tōrō stesso li proiettasse verso la destinazione già segnata.",
    effect:
      "Impugnando il [Tōrō], tutte le waza dell'analista con tag [Energetica][Contatto] diventano [Energetica][Proiettile] con origine dal Tōrō. La gittata è pari a 8 m + 1 m per ogni punto di Seimitsu dell'analista.",
    isPassive: true,
    rank: null,
  },
  {
    poolId: 'shoka-fiamma-docile',
    name: 'Shōka · Addomesticata (消火)',
    flavor:
      "Quando l'analista conosce perfettamente il proprio Tōrō, ogni tecnica attraverso di esso scorre senza attrito. Non è risparmio — è che non c'è niente da sprecare quando la via è già aperta.",
    effect: 'Ogni waza lanciata attraverso il [Tōrō] costa −1 CS (minimo 1 CS).',
    isPassive: true,
    rank: null,
  },
  {
    poolId: 'nokuribi-fuoco-residuo',
    name: 'Nokuribi · Cenere Rimasta (残り火)',
    flavor:
      "L'impronta di un elemento non sparisce nel momento in cui la tecnica si esaurisce: resta depositata sulle pareti del Tōrō come brina, come bruciatura, come carica statica. La tecnica successiva la porta con sé, anche se era pensata per essere qualcosa di diverso.",
    effect:
      "Il [Tōrō] trattiene il residuo dell'ultima waza [Elementale] lanciata fino alla fine del turno successivo. Durante questo periodo, la prima waza [Energetica] lanciata dal Tōrō acquisisce l'elemento trattenuto e ne applica lo status di riferimento al bersaglio. Dopo il primo utilizzo, il residuo si consuma.",
    isPassive: true,
    rank: null,
  },
  {
    poolId: 'kintsugi-legame-dei-frammenti',
    name: 'Kintsugi · Legame dei Frammenti (金継ぎ)',
    flavor:
      "Un'arma rotta è ancora un'arma finché l'analista non rinuncia a tenerla. La Jigo-Ka che aveva già impregnato la materia non è andata da nessuna parte — basta richiamarla, e le crepe si riempiono di qualcosa che non è il materiale originale ma regge lo stesso.",
    effect:
      "Se nel turno precedente un'arma impugnata o un [Costrutto] dell'analista è stato distrutto, l'analista può richiamare la Jigo-Ka residua e ricrearlo. L'oggetto ricreato dura fino alla fine del turno successivo. Non applicabile a ciò che è stato distrutto da energia puramente psichica.",
    isPassive: true,
    rank: null,
  },
  {
    poolId: 'kakucho-espansione-della-luce',
    name: 'Kakuchō · Espansione (拡張)',
    flavor:
      "La Jigo-Ka forza la struttura del Tōrō oltre la sua forma. Un coltello che si allunga in spada lo fa in modo grezzo — il profilo si distende, non si rifà da capo. L'arma porta i segni di quella tensione per tutto il tempo che dura.",
    effect:
      'Per 1 turno, il [Tōrō] sale di una taglia (mantiene il tipo di danno originale). I colpi a [Contatto] inflitti con esso ottengono +1 tier di danno e +1 m di gittata.',
    isPassive: false,
    isNarrativa: true,
    rank: 'T1',
  },
  {
    poolId: 'kaeribi-fiamma-del-ritorno',
    name: 'Kaeribi · Richiamo (返し火)',
    flavor:
      "Il Tōrō scagliato o perduto sul campo non è uno strumento abbandonato — è ancora suo. Basta aprire la mano nella sua direzione perché la Jigo-Ka rimasta nell'oggetto risponda, riportandolo.",
    effect:
      "L'analista richiama a sé un'arma entro 8 m, a patto che sia ancora un proprio [Costrutto] integro. L'arma vola direttamente in mano. Se l'arma è un [Tōrō] attivo, la gittata massima sale a 16 m.",
    isPassive: false,
    isNarrativa: true,
    rank: 'T1',
  },
  {
    poolId: 'fuin-no-hi-sigillo-della-fiamma',
    name: 'Fuin no Hi · Sigillo (封印の火)',
    flavor:
      "L'analista comprime una tecnica dentro il Tōrō invece di lanciarla. L'arma non fa nulla di visibile — vibra appena, come se contenesse qualcosa di trattenuto. Poi arriva il momento in cui non la contiene più.",
    effect:
      "L'analista sigilla una waza a scelta dentro il [Tōrō] (la tecnica viene comunque pagata al momento del sigillo). La waza rimane dormiente per un massimo di 3 turni e può essere rilasciata in tre modi: all'impatto fisico del Tōrō su un bersaglio; a comando dell'analista come [Proiettile][Energetico] con le proprietà della waza sigillata; oppure si libera automaticamente allo scadere dei 3 turni come [Emanazione] centrata sul Tōrō. In tutti i casi il danno è quello della waza originale.",
    isPassive: false,
    isNarrativa: true,
    rank: 'T2',
  },
  {
    poolId: 'tomoshibi-no-ato-traccia-della-luce',
    name: 'Tomoshibi no Ato · Traccia (灯火の跡)',
    flavor:
      "Il fendente del Tōrō non finisce dove finisce il colpo. Nello spazio attraversato rimane qualcosa di teso, una linea che non si vede bene ma che si sente attraversando — come toccare un filo nel buio che non sapevi fosse lì.",
    effect:
      "L'analista sferra un fendente con il [Tōrō], tracciando una linea di energia lunga 8 m che permane in campo per 3 turni. Chiunque la attraversi subisce danno pari al T2 [Energetico]. L'analista può mantenere attiva una sola traccia alla volta — una seconda traccia cancella la precedente.",
    isPassive: false,
    rank: 'T2',
  },
  {
    poolId: 'kyomei-risonanza-della-fiamma',
    name: 'Kyōmei · Risonanza (共鳴)',
    flavor:
      "Durante il movimento, l'analista non smette di usare il Tōrō — lo usa continuamente, senza separare lo spostamento dal combattimento. L'arma trascina gli arti, non il contrario.",
    effect:
      'Per 1 turno, durante qualsiasi movimento effettuato, il [Tōrō] colpisce automaticamente ogni nemico che si trova a gittata corpo a corpo lungo il percorso, infliggendo danno pari al T2 per ogni colpo. Si ottiene 1 colpo ogni 2 m percorsi. Non è possibile mirare a punti specifici del corpo.',
    isPassive: false,
    rank: 'T2',
  },
  {
    poolId: 'hoshutsu-rilascio-della-fiamma',
    name: 'Hōshutsu · Scarica (放出)',
    flavor:
      "Il Tōrō non viene brandito — viene aperto. La Jigo-Ka compressa al suo interno si riversa fuori in una direzione sola, un'onda che parte dall'arma e si allarga davanti all'analista senza chiedere il permesso a nessuno.",
    effect:
      "L'analista scarica la Jigo-Ka del [Tōrō] in un cono di 6 m davanti a sé, infliggendo danno pari al T2 [Energetico] a tutti i bersagli nell'area. Se il Tōrō aveva [Batteria] attiva, il danno sale a T3, ma il Tōrō si disintegra al termine. Dal grado [SB] in poi, la disintegrazione non avviene più anche con [Batteria] attiva.",
    isPassive: false,
    rank: 'T2',
  },
  {
    poolId: 'ukabu-toro-lanterna-fluttuante',
    name: 'Ukabu Tōrō · Lanterna Abbandonata (浮かぶ灯籠)',
    flavor:
      "L'analista apre la mano e non trattiene. Il Tōrō si stacca e resta lì — non cade, si sostiene da solo, come se avesse trovato una corrente che solo esso riesce a percepire. Obbedisce ancora, ma non ha bisogno di essere tenuto per farlo.",
    effect:
      'Il [Tōrō] si stacca dalla mano e levita come [Costrutto] di taglia Media per un massimo di 3 turni. Può elevarsi fino a 2 m dal suolo e risponde ai comandi dell\'analista entro 8 m, infliggendo danno pari al T2 per ogni attacco. Se supera gli 8 m di distanza, precipita e torna un oggetto inerte.',
    isPassive: false,
    rank: 'T2',
  },
  {
    poolId: 'toro-nagashi-lanterna-alla-corrente',
    name: 'Tōrō Nagashi · Alla Corrente (灯籠流し)',
    flavor:
      "Il Tōrō viene lanciato e non recuperato. Come le lanterne lasciate andare sul pelo dell'acqua durante i riti funebri — ci si congeda, ma la luce resta accesa. L'arma conficcata in un muro o in un corpo continua a essere un punto da cui l'analista può agire.",
    effect:
      "L'analista lancia il proprio [Tōrō] in linea retta fino a 12 m, infliggendo danno pari al T2 al primo bersaglio colpito. Il Tōrō si conficca nella prima superficie solida incontrata e, finché rimane conficcato, conta come [Costrutto] attivo dell'analista. Le waza possono essere lanciate originandole dalla posizione del Tōrō anziché dall'analista.",
    isPassive: false,
    rank: 'T2',
  },
  {
    poolId: 'hi-o-tsumugu-filatura-della-fiamma',
    name: 'Hi o Tsumugu · Carica Trattenuta (火を紡ぐ)',
    flavor:
      "L'analista si ferma. Non è indecisione — è accumulo. Il Tōrō assorbe pressione per ogni istante di immobilità, e chi sa leggere il campo capisce che l'analista fermo è più pericoloso di quello in movimento.",
    effect:
      "L'analista sferra un colpo a [Contatto][Energetico] che infligge danno pari al T2 (T3 se il [Tōrō] è designato con la passiva Lanterna Incisa). Può scegliere di caricare prima del colpo restando immobile: ogni quarto speso in carica aggiunge +1 tier al danno, fino a un massimo di +2 tier (2 quarti). Dopo aver scaricato il colpo, il Tōrō non può essere usato per lanciare waza per 1 turno.",
    isPassive: false,
    rank: 'T2',
  },
  {
    poolId: 'omocha-il-giocattolo',
    name: 'Bannō · Qualunque Cosa (万能)',
    flavor:
      "Un tubo di ferro. Un manico di legno. La gamba rotta di una sedia. Niente di tutto questo è un'arma, ma nelle mani dell'analista che ha raggiunto questa soglia non fa differenza — la Jigo-Ka non chiede materiale nobile, chiede solo una presa. L'oggetto regge finché può, poi cede di schianto.",
    effect:
      "Per 3 turni, qualsiasi oggetto fisico impugnato dall'analista diventa [Tōrō], anche senza la passiva Tōrō. L'oggetto mantiene le sue proprietà fisiche ma funge da medium per le waza. Se l'analista cambia oggetto durante il turno, il precedente perde lo status di [Tōrō] e viene distrutto. Ogni waza lanciata attraverso questo Tōrō improvvisato accumula carica: al successivo impatto o lancio, l'oggetto esplode in una sfera [Propagazione][Energetica] di 3 m che infligge danno T3 a tutti i bersagli nell'area, e l'oggetto si distrugge.",
    isPassive: false,
    isNarrativa: true,
    rank: 'T3',
  },
  {
    poolId: 'gangushi-il-giocattolaio',
    name: 'Kishin no Tō · Il Fuoco che Porti Addosso (器心の灯)',
    flavor:
      "Non è più necessario stringere nulla. La Jigo-Ka riconosce ciò che appartiene all'analista per Ego, non per contatto — ogni oggetto portato addosso è già suo quanto la propria ombra, e il vincolo lo trova da solo.",
    effect:
      "Per 4 turni, ogni oggetto nell'inventario dell'analista o indossato prima dell'inizio del combattimento acquisisce lo status di [Tōrō] senza necessità di essere impugnato. È sufficiente che l'oggetto resti a contatto con il corpo o nell'equipaggiamento dell'analista.",
    isPassive: false,
    isNarrativa: true,
    rank: 'T4',
  },
  {
    poolId: 'tomurai-no-to-rito-funebre',
    name: 'Tomurai no Tō · Rito Funebre (弔いの灯)',
    flavor:
      "L'atto ultimo si traduce in una festa di lanterne, dove il concetto di lanterna è ormai da tempo labile per l'analista. Ciò che impugna, già dichiarato Tōrō, muta la sua forma in una lanterna di ferro da rito funebre. Gli basterà sollevarla e lasciarla oscillare. Dalla lanterna scivolerà un fumo denso — nero se i nodi favoriti dall'analista sono di Shiju, rosso se sono di Meiju — che dilaga sul campo inghiottendo ogni suono. Nel silenzio che segue, appaiono lanterne di carta sospese a un metro da terra, una per ogni stack di status presente nell'area. Ognuna brucia ciò che ha trovato.",
    effect:
      "Il [Tōrō] dell'analista assume la forma di una lanterna di ferro da rito funebre. Un fumo denso si propaga coprendo un raggio di 10 m attorno all'analista per 5 turni: l'area diventa muta, annullando ogni waza [Sonoro]. Nell'area compaiono lanterne di carta sospese a 1 m da terra ([Costrutto][Tōrō]), in numero pari al totale delle stack di status presenti su tutti i soggetti nell'area. Ogni lanterna consuma 1 stack di status in campo e la converte in danno pari al T5 per lanterna, suddiviso equamente tra tutti i bersagli colpiti. Se la stack appartiene a un avversario non consenziente, è necessario superare un confronto tra l'IR dell'analista e la Fermezza del bersaglio.",
    isPassive: false,
    rank: 'T5',
    createIfMissing: true,
  },
]

function buildDescription(flavor: string, poolId: string): string {
  const req = WAZA_REQUIRED_GRADE_BY_POOL_ID[poolId] as AnalystGradeName | undefined
  if (!req) return flavor.trim()
  return appendReqGradeMarker(flavor, req)
}

async function main() {
  let updated = 0
  let created = 0

  for (const row of CANON) {
    const costExp = resolveDefaultWazaCostExp({
      isPassive: row.isPassive,
      rank: row.rank,
    })
    const description = buildDescription(row.flavor, row.poolId)
    const isNarrativa = !row.isPassive && (row.isNarrativa || TOKA_NARRATIVA_POOL_IDS.has(row.poolId))
    const existing = await db.query.skills.findFirst({
      where: eq(skills.poolId, row.poolId),
      columns: { id: true },
    })

    if (!existing) {
      if (!row.createIfMissing) {
        console.warn(`✗ mancante (skip): ${row.poolId}`)
        continue
      }
      await db.insert(skills).values({
        poolId: row.poolId,
        name: row.name,
        description,
        effect: row.effect,
        type: 'WAZA',
        rank: row.rank,
        isPassive: row.isPassive,
        isNarrativa,
        styleId: 'toka',
        costExp,
        costKeys: 0,
        costJigoka: 0,
      })
      created += 1
      console.log(`+ creato ${row.poolId}${isNarrativa ? ' [narrativa]' : ''}`)
      continue
    }

    await db
      .update(skills)
      .set({
        name: row.name,
        description,
        effect: row.effect,
        rank: row.rank,
        isPassive: row.isPassive,
        isNarrativa,
        styleId: 'toka',
        costExp,
      })
      .where(eq(skills.id, existing.id))
    updated += 1
    console.log(`✓ ${row.poolId}${isNarrativa ? ' [narrativa]' : ''}`)
  }

  // Assicura flag narrativa anche se già presenti fuori CANON loop edge cases
  const narrativaIds = [...TOKA_NARRATIVA_POOL_IDS]
  await db
    .update(skills)
    .set({ isNarrativa: true })
    .where(inArray(skills.poolId, narrativaIds))

  console.log(`\nFatto: ${updated} aggiornate, ${created} create.`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
