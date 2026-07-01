/** Tōka-dō (灯火道) — Parte III Oyasumi_Manuale_Completo.pdf + waza avanzate ROADMAP (12 waza). */
import type { WazaDef } from '../wazaPool'
import { makeActive, makePassive } from './waza-pool-builders'

const B = 'proiezione' as const

export const TOKA_WAZA_POOL: WazaDef[] = [
  makePassive(
    B,
    'toro-lanterna-incisa',
    'Tōrō (灯籠) — Lanterna Incisa',
    "La Jigo-Ka cola dal terzo occhio fino al palmo e affonda nell'oggetto stretto in pugno: legno, acciaio o vetro si accendono di una brace interna che solo l'analista vede. La lanterna è la soglia in cui Meiju e Shiju condividono un'unica fiamma — l'oggetto smette di essere tale e diventa il vaso che la custodisce.",
    "Passiva · CS 0. Designi un'arma o un oggetto impugnato come Tōrō. Finché lo tocchi, non può essere bersaglio di waza di Manipolazione o Trasformazione altrui, e funge da origine per lanciare le tue waza.",
    { weaponTagsOnLaunch: ['toro'], costJigo: () => 0 },
  ),
  makePassive(
    B,
    'michishirube-luce-guida',
    'Michishirube (道標) — Luce Guida',
    'La fiamma non scalda soltanto: indica. Punti il Tōrō e la luce traccia nell\'aria la via che il colpo dovrà percorrere, limpida come la corona dell\'albero della Vita. È Meiju che parla: la chiarezza che precede il gesto.',
    'Passiva · CS 0. Impugnando il Tōrō, le tue waza Energetiche a Contatto diventano Energetiche a Proiettile, con origine dal Tōrō che usi per mirare. Gittata = 8 m + 1 m per punto di Seimitsu.',
  ),
  makePassive(
    B,
    'shoka-fiamma-docile',
    'Shōka (小火) — Fiamma Docile',
    "Chi conosce la propria fiamma non la spreca. L'analista la piega, la addomestica, la fa bruciare lenta. Ciò che prima costava, ora basta sussurrarlo.",
    'Passiva · CS 0. Ogni waza lanciata attraverso il Tōrō costa −1 CS, minimo 1.',
  ),
  makePassive(
    B,
    'nokuribi-fuoco-residuo',
    'Nokuribi (残り火) — Fuoco Residuo',
    "Quando la fiamma elementale si spegne, qualcosa resta aggrappato al vetro: una brace che non vuole morire, il residuo indesiderato di Shiju che sopravvive a sé stesso. E ciò che la lanterna trattiene oltre la propria morte, lo restituisce.",
    "Passiva · CS 0. Il Tōrō trattiene il residuo dell'ultima tua waza Elementale fino alla fine del turno successivo. Finché l'elemento permane, ogni tua waza Energetica lanciata dal Tōrō diventa Elementale (e applica lo status di riferimento); applicato l'effetto, l'arma perde l'elemento.",
  ),
  makePassive(
    B,
    'kintsugi-legame-dei-frammenti',
    'Kintsugi (金継ぎ) — Legame dei Frammenti',
    "Nulla, sotto la mano dell'analista, è davvero rotto. Le crepe si riempiono d'oro-Ego e ciò che era spezzato torna intero lungo le sue stesse ferite: è Meiju, la Vita che ricuce, più bella perché ha conosciuto la frattura.",
    'Passiva · CS 0. Puoi richiamare la Jigo-Ka immessa in un oggetto rotto o in un Costrutto distrutto nel turno precedente, ricreandolo; dura fino alla fine del prossimo turno. Non è ricostruibile ciò che è stato distrutto da energia psichica.',
  ),
  makeActive(
    B,
    'kakucho-espansione-della-luce',
    'Kakuchō (拡張) — Espansione della Luce',
    'La luce non conosce confini di forma. Trabocca dal filo della lama e la fa crescere — il coltello si fa spada, la spada si fa zanna — come la gloria che dilaga sull\'albero della Vita.',
    'Attiva · [Potenziamento][Nessuna] · Tier base 1 · CS 1 · 1/4. Durante un colpo, il Tōrō sale di una taglia (mantenendo il tipo di danno). Per la durata, i colpi a Contatto con esso ottengono +1 tier di danno e +1 m di gittata. Se è già un Tōrō, dura l\'intero turno.',
    { costCs: 1, costJigo: () => 2, hasDamage: false },
  ),
  makeActive(
    B,
    'hoshutsu-rilascio-della-fiamma',
    'Hōshutsu (放出) — Rilascio della Fiamma',
    'Tutto ciò che la lanterna ha trattenuto, in un solo respiro, fuori. Il vetro si frantuma e la fiamma divampa in avanti: una luce di Shiju che non illumina, ma consuma.',
    'Attiva · [Propagazione Conica][Energetica] · Tier base 2 · CS 2 · 1/4. Scarichi la Jigo-Ka del Tōrō in un cono di 6 m davanti a te; danno = tier a ogni bersaglio nell\'area. Se il Tōrō ha accumulato carica propria, danno +1 tier ma l\'arma si disintegra — dal grado Sentatsu Bunsekikan, la disintegrazione non avviene più.',
    { costCs: 2, costJigo: () => 5, hasDamage: true },
  ),
  makeActive(
    B,
    'ukabu-toro-lanterna-fluttuante',
    'Ukabu Tōrō (浮かぶ灯籠) — Lanterna Fluttuante',
    "L'analista scioglie l'ormeggio. La lanterna si stacca dalla mano e galleggia come quelle affidate alla corrente per accompagnare i morti. Obbedisce solo al pensiero, e brucia per chi la guida.",
    'Attiva · [Costrutto] · Tier base 2 · CS 2 · 1/4 + mantenimento. Il Tōrō levita come Costrutto, guidato dalla mente entro 8 m da te (oltre, la connessione si spezza e cade). Sale fino a 2 m, attacca in modo semplice (danno = tier), segue i tuoi comandi. Dura 3 turni, poi torna oggetto.',
    { costCs: 2, costJigo: () => 8, hasDamage: true, durata: 'tre_turni' },
  ),
  makeActive(
    B,
    'fuin-no-hi-sigillo-della-fiamma',
    'Fuin no Hi (封印の火) — Sigillo della Fiamma',
    "Una fiamma chiusa nel vetro non muore: aspetta. L'analista la sigilla nel Tōrō, e il momento del suo rilascio sarà una sorpresa scritta nel silenzio.",
    'Attiva · setup · Tier base 2 · CS 2 · 1/4. Sigilli nel Tōrō una waza che conosci (la lanci anche ora). Per 3 turni può essere liberata: per impatto (stesso danno della waza sigillata) oppure per fendente nell\'etere, generando un Proiettile Energetico con le proprietà della waza. Se non liberata in tempo, il Tōrō si rompe in Emanazione, infliggendo comunque il danno della waza sigillata.',
    { costCs: 2, costJigo: () => 10, hasDamage: false, durata: 'tre_turni' },
  ),
  makeActive(
    B,
    'kyomei-risonanza-della-fiamma',
    'Kyōmei (共鳴) — Risonanza della Fiamma',
    "L'arma e le braccia vibrano sulla stessa nota. Ogni passo dell'analista diventa un fendente che non smette mai di cantare, e chi gli si para accanto viene reciso dal suono.",
    'Attiva · [Contatto] · Tier base 2 · CS 2 · 1/4. Per un turno, durante ogni tuo movimento il Tōrō trascina gli arti, colpendo ogni nemico a gittata corpo a corpo lungo il percorso (danno = tier). Non puoi mirare a punti vitali. Un colpo ogni 2 m percorsi — scala col Movimento.',
    { costCs: 2, costJigo: () => 6, hasDamage: true, durata: 'un_turno' },
  ),
  makeActive(
    B,
    'omocha-il-giocattolo',
    'Omocha (玩具) — Il Giocattolo',
    "Il pugno si chiude su un tubo di ferro, una sedia, un coccio — non importa cosa. La Jigo-Ka cola dal terzo occhio e affonda nell'oggetto, che si accende di brace interna verso l'estremità: il metallo resta metallo, il legno resta legno, ma ora è il vaso in cui Meiju e Shiju condividono un'unica fiamma. E un vaso troppo pieno, prima o poi, si crepa.",
    "Attiva · [Nessuna][Potenziamento] · Tier base 4 · CS 5 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Per 3 turni, qualunque oggetto fisico che impugni diventa [Arma Psichica] — anche senza Tōrō · Lanterna Incisa. L'oggetto conserva le proprietà fisiche e funge da [Tōrō] per le tue waza. Puoi cambiare oggetto durante il turno: il precedente perde all'istante lo status e si distrugge.\n\n↳ Sovraccarico: quando lanci una waza attraverso il [Tōrō], la sua punta diventa [Instabile]. Al primo impatto successivo oppure al lancio della waza seguente attraverso di essa, l'oggetto esplode in una [Propagazione][Energetica] di raggio 3 m — danno = tier (17) a ogni bersaglio nell'area — e viene consumato.",
    { costCs: 5, costJigo: () => 10, hasDamage: true, durata: 'tre_turni', prereqGradoMin: 4 },
  ),
  makeActive(
    B,
    'gangushi-il-giocattolaio',
    'Gangushi (玩具師) — Il Giocattolaio',
    "Non serve più stringere nulla. La Jigo-Ka risale fino a ciò che porta addosso da sempre — la cintura, gli anelli, le monete in tasca — e ognuno di quegli oggetti, legato all'Ego come una vena d'oro, si accende di una luce propria. L'analista cammina al centro di un cerchio di lanterne che obbediscono al suo pensiero: ha smesso di impugnare un'arma, ed è diventato il punto da cui tutte le armi partono.",
    "Attiva · [Nessuna][Potenziamento] · CS 7 · 1/4 · grado richiesto: Kanteikan [K]. Per 3 turni, ogni oggetto che possedevi da prima dello scontro (indossato, in tasca, nell'inventario) diventa [Tōrō] simultaneamente, senza bisogno di impugnarlo, finché resta addosso a te. Ognuno funge da [Tōrō]: per ogni waza scegli liberamente da quale oggetto-origine parte (angoli e direzioni multiple). Se un oggetto lascia il tuo corpo — lanciato, strappato, fatto cadere — perde lo status.",
    { costCs: 7, costJigo: () => 14, hasDamage: false, durata: 'tre_turni', prereqGradoMin: 5 },
  ),
]
