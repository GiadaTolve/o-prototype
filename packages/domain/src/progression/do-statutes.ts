import type { StyleId } from './style-hexagon'

/** Fonte canonica catalogo Dō e statuti narrativi. */
export const MANUAL_SOURCE = 'docs/Oyasumi_Manuale_Completo.pdf' as const

/** Statuto narrativo di ogni Via — estratto da Oyasumi_Manuale_Completo.pdf. */
export const STYLE_STATUTES: Record<StyleId, string> = {
  toka: "Chi intraprende il Tōka-dō si vedrà abile in waza di proiezione: la via incanala e infonde Jigo-Ka attraverso armi e oggetti, potenziandone la resa. Si dice che chi percorre la Via della Lanterna sia già un abile combattente — e che attraverso la propria arma si lasci guidare nella battaglia. È per questo che l'oggetto designato prende il nome di Tōrō (lanterna). Ogni waza risuona con il Sōkaiju, il doppio albero: Meiju (灯, la Vita) e Shiju (闇, la Morte). La fiamma del Tōrō è la soglia in cui i due si toccano.",
  genzai: "Chi percorre questa Via non crea dal nulla, né richiama ciò che esiste altrove. Scrive. La Jigo- Ka viene tracciata nello spazio sotto forma di sigilli, simboli e formule che non brillano finché non sono completi — e nel momento in cui lo sono, la realtà è costretta ad adeguarsi. Un Costrutto non nasce: viene dichiarato esistente, vincolato da un ordine che lo obbliga a mantenere forma e funzione finché il sigillo regge. Il corpo stesso può diventare superficie di scrittura, inciso da segni che sostituiscono carne con struttura. Ma ogni sigillo è un vincolo, e ogni vincolo può cedere: quando la scrittura si incrina, ciò che esisteva smette semplicemente di essere. Chi eccelle in questa Via non è colui che crea di più, ma colui che scrive meglio. L'analista è uno scrivano del reale: ogni Costrutto porta il suo Mei ( 銘, sigillo-firma) e regge finché la scrittura tiene. Alla generazione di un Costrutto si produce un suono; le waza prendono forma come agglomerati geometrici precisi ma caotici, e la Jigo-Ka impallidisce la pelle e annerisce la sclera dell'analista, sempre più man mano che lancia waza.",
  ito: "Si dice che nulla, al mondo, sia davvero libero. Ogni cosa è legata a un'altra, anche quando sembra muoversi da sola. Chi percorre l'Itō-dō impara a vedere ciò che gli altri ignorano: non gli oggetti, ma i legami che li attraversano. Fili sottili, invisibili, che uniscono movimento a conseguenza, gesto a destino. L'analista non impone la propria volontà sul mondo — la inserisce tra le tensioni già esistenti, imparando a tirare, allentare, deviare. Un colpo non viene fermato: viene trattenuto. Una traiettoria non viene cambiata: viene guidata. Un oggetto non viene mosso: viene richiamato lungo un filo che già lo lega. Ma ogni filo, per quanto sottile, esercita una pressione. E più il campo si riempie, più la tensione cresce. L'analista è un burattinaio: la Jigo-Ka è filata in Ito ( 糸), fili invisibili che afferrano oggetti e Costrutti. Un oggetto o Costrutto preso dai fili è un Kugutsu ( 傀儡, marionetta). I cambi di categoria avvengono tramite gesti di mano e dita; la waza subisce una deformazione, comprimendosi o espandendosi a velocità modesta fino alla nuova forma, mentre per un istante la Jigo-Ka dell'analista resta immobile.",
  naikan: "Chi percorre questa Via non proietta la propria Jigo-Ka all'esterno: la richiude dentro di sé e la costringe a circolare dove non dovrebbe, trasformando il corpo in un sistema di pressione costante. Ogni nodo diventa una camera, ogni battito un impulso. La forza non viene evocata: viene costruita istante dopo istante, accumulata nei movimenti più piccoli, trattenuta finché il corpo non reagisce, irrigidendosi, rispondendo alla violenza con nuova struttura. Ogni potenziamento è una riscrittura parziale del corpo, ogni scelta una rinuncia a qualcos'altro, perché nulla può essere sostenuto ovunque nello stesso momento. Il dolore non viene evitato: viene integrato, convertito, reso carburante. Chi eccelle non è colui che possiede il corpo più forte, ma colui che lo conosce abbastanza da modificarlo mentre combatte. I muscoli si ingrossano, venature del colore della Jigo-Ka affiorano sotto pelle, brillanti chiare o scure secondo l'emozione. Quando il flusso entra in waza o attacchi, la Jigo-Ka reagisce agli urti liberando particelle di breve durata, e ogni waza lascia un'impronta sul bersaglio. Naikan-dō è la Via dei Potenziamento. Ogni waza che dichiara “+X su una statistica” va letta come +X alla Skiru mappata: +X all'Indice (e al danno) delle azioni che usano quella Skiru, per la durata indicata. Mappa: Forza→Kairyoku, Velocità/Riflessi→Binshō, Costituzione→Nintai, Mente→Seishin Tanren, Empatia→Shakai Kaikyū.",
  hensei: "Chi percorre questa Via non altera ciò che vede, ne nega la stabilità. Ogni cosa esiste in uno stato preciso solo perché continua a mantenerlo, ma basta interrompere quell'equilibrio perché inizi a cedere. L'analista non crea e non controlla: interviene nel punto esatto in cui una forma smette di essere coerente con sé stessa. La Jigo-Ka non impone una nuova natura, ma costringe quella esistente a cambiare stato, come se fosse sempre stata instabile e solo ora lo stesse mostrando. Nulla si trasforma in modo pulito: ogni mutazione è imperfetta, attraversata da tensioni visibili, come se più stati cercassero di esistere nello stesso momento. Il mondo, sotto questa influenza, non si modifica: vacilla. Chi eccelle non è colui che cambia di più, ma colui che comprende quanto poco serva perché qualcosa smetta di essere ciò che era. Dove l'Itō-dō piega la Categoria, l'Hensei-dō costringe la Consistenza. È l'alchimista del campo: trova la crepa nello stato delle cose e la apre. I cambi di consistenza avvengono tramite gesti di mano e dita; al cambio, la waza subisce uno smantellamento e poi una ricostruzione, transizione visibile e imperfetta, mentre la Jigo-Ka dell'analista si accende. Le waza trasformate portano un marchio dell'analista, come una voglia.",
  hado: "Chi percorre questa Via non rilascia la propria Jigo-Ka: la trattiene, la costringe a restare dove non dovrebbe, comprimendola dentro di sé fino a farla diventare peso, pressione, presenza costante. L'analista accumula, e il corpo lo tradisce: i muscoli si tendono oltre il naturale, il respiro si spezza, sotto la pelle compaiono venature di luce che pulsano come crepe pronte a cedere. Il corpo diventa un contenitore imperfetto, una soglia sotto pressione, e quando cede non c'è gesto netto: c'è una frattura. L'energia non viene lanciata, esplode attraverso il corpo e lo spazio in onde sporche e irregolari, sfondando ciò che incontra. Chi eccelle non è colui che sprigiona più potenza, ma colui che sostiene più a lungo quella pressione, che conosce il momento esatto in cui il corpo inizierà a rompersi e decide comunque di arrivarci. L'analista è un contenitore sotto pressione: trattiene la Jigo-Ka oltre il limite, e la trasforma in detonazione. Nell'emettere, la Jigo-Ka si raccoglie sul nodo più vicino del Sōkaiju prima di erompere — la sua luce nera è quella di Kokuyō, il Sole Nero di Shiju. Lanciando una waza, l'energia esce letteralmente dal corpo: si accumula sul nodo più vicino, poi muove verso l'esterno con un bagliore del colore corrispondente, e dalla zona d'origine esce fumo. All'impatto le waza lasciano una bruciatura di Jigo-Ka sul bersaglio.",
}

export type StyleKeystoneDef = {
  poolId: string
  label: string
}

/** Dō passiva keystone per ramo (solo stili che la dichiarano nel manuale PDF). */
export const STYLE_KEYSTONE: Partial<Record<StyleId, StyleKeystoneDef>> = {
  toka: { poolId: 'toro-lanterna-incisa', label: 'Tōrō · Lanterna Incisa (灯籠)' },
  genzai: { poolId: 'honshitsu-essenza-affine', label: 'Honshitsu (本質) — Essenza Affine' },
  hensei: { poolId: 'ishi-volere', label: 'Ishi (意志) — Volere' },
  hado: { poolId: 'chikuden-batteria', label: 'Chikuden (蓄電) — Batteria' },
}

/** Elenco poolId waza per Dō — ordine e membership dal PDF (Parte III). */
export const MANUAL_WAZA_POOL_IDS: Record<StyleId, readonly string[]> = {
  toka: ['toro-lanterna-incisa', 'michishirube-luce-guida', 'shoka-fiamma-docile', 'nokuribi-fuoco-residuo', 'kintsugi-legame-dei-frammenti', 'kakucho-espansione-della-luce', 'hoshutsu-rilascio-della-fiamma', 'ukabu-toro-lanterna-fluttuante', 'fuin-no-hi-sigillo-della-fiamma', 'kyomei-risonanza-della-fiamma', 'omocha-il-giocattolo', 'gangushi-il-giocattolaio'],
  genzai: ['nikutai-mei-carne-iscritta', 'honshitsu-essenza-affine', 'kochiku-struttura-salda', 'bugusho-arsenale-scritto', 'kaihen-forgia-ibrida', 'kioku-mei-sigillo-mnemonico', 'eizoku-sigillo-persistente', 'kaju-sovraccarico-geometrico', 'hakai-mei-marchio-del-disfacimento', 'irekogo-sigillo-annidato', 'toki-aura-dichiarata', 'raimei-fu-sigillo-del-fulmine', 'yoki-no-iki-soffio-yokai', 'onnen-dama-globo-rancore', 'hashira-colonne-incise', 'utsushi-copia-conforme', 'shogeki-te-palmo-elementale', 'genso-ya-dardo-elementale', 'kessho-mei-memento-mori', 'jiban-terreno-ostile', 'meisaku-opera-prima', 'shinryaku-invasione', 'rakuen-eden'],
  ito: ['ayatsuri-filo-burattinaio', 'someito-filo-tinto', 'yugami-filo-deforme', 'tazuna-redini', 'wakeito-filo-sdoppiato', 'hikitome-trattenuta', 'hajiki-fionda-filo', 'irekae-scambio-fili', 'mayu-wari-bozzolo-squarciato', 'hikiyose-richiamo-fili', 'musubi-nodo-gemello', 'mayakashi-inganno-filo', 'ubaiito-filo-rubato', 'unari-ronzio-filo', 'shime-stretta-filo', 'rensa-catena-fili', 'kankatsu-giurisdizione', 'chokurei-decreto', 'mugen-shihai-dominazione-onirica'],
  naikan: ['junno-pelle-apprende', 'hibiki-gaeshi-eco-risposta', 'jiga-hoki-ego-traboccante', 'ittai-un-solo-corpo', 'naka-kae-scambio-nucleo', 'tobi-kake-slancio-carica', 'datsui-tate-scudo-spogliato', 'datsui-yumi-arco-spogliato', 'hari-tsume-carico-trattenuto', 'seni-gake-avvolgimento-fibre', 'geki-ryu-corrente-violenta', 'hada-yuzuri-cessione-pelle', 'tsubo-uchi-colpo-punto', 'shoka-sublimazione', 'shokushin-lettura-corpo', 'komei-chi-lo-ha-deciso', 'hogo-sutura-ego'],
  hensei: ['ishi-volere', 'kyosei-hen-mutazione-imposta', 'genso-ka-elementalizzazione', 'renkin-soku-regole-alchemiche', 'kenja-no-ishi-pietra-filosofale', 'roei-scia-incontrollata', 'hanno-reattivita-consistenza', 'wana-trappola', 'ihen-aberrazione', 'bogai-disturbo', 'oboro-velo-onirico', 'bocho-espansione-instabile', 'kokan-scambio-consistenza', 'sokotsu-fusione-instabile', 'shoku-corrosione', 'tenka-dalla-padella-alla-brace', 'shokubai-catalisi', 'nagori-principio-instabilita', 'igyo-rensei-insegnamenti-tucker'],
  hado: ['chikuden-batteria', 'gyakuryu-riflusso', 'teishuha-onda-bassa', 'kanshi-occhio-remoto', 'fuantei-deflagrazione-instabile', 'kaatsu-sovrapressione', 'kantsu-calibro-pesante', 'sorashi-deviazione', 'howa-saturazione', 'fukitobashi-spinta-urto', 'tanraku-corto-circuito', 'hosha-raffica-psichica', 'tameru-impeto-trattenuto', 'hoden-scarica-impatto', 'mugen-no-tsukai-famiglio-onirico', 'rensa-baku-detonazione-catena', 'kasan-carica-detonante', 'byo-ancora-psionica', 'maikomi-innesto-forzato', 'kunou-baku-implosione-sofferenza', 'toshi-investimento-energetico', 'shakkin-indebitamento'],
}

export function getStyleKeystone(styleId: StyleId): StyleKeystoneDef | null {
  return STYLE_KEYSTONE[styleId] ?? null
}

export function hasKeystoneOwned(styleId: StyleId, ownedPoolIds: ReadonlySet<string>): boolean {
  const ks = STYLE_KEYSTONE[styleId]
  if (!ks) return true
  return ownedPoolIds.has(ks.poolId)
}

export function checkKeystoneForWaza(
  styleId: StyleId,
  skillPoolId: string | null | undefined,
  ownedPoolIds: ReadonlySet<string>,
): { ok: boolean; error?: string } {
  const ks = STYLE_KEYSTONE[styleId]
  if (!ks) return { ok: true }
  if (skillPoolId === ks.poolId) return { ok: true }
  if (ownedPoolIds.has(ks.poolId)) return { ok: true }
  return { ok: false, error: `Richiede la Dō passiva keystone: ${ks.label}` }
}

