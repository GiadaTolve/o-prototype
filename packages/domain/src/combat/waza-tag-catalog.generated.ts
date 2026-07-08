/** Auto-generated — non modificare a mano. Fonte: wazaPool + Oyasumi_Manuale_Completo.pdf */
import type { WazaTagCatalogEntry } from './waza-tag-preview.ts'

export const WAZA_TAG_CATALOG: readonly WazaTagCatalogEntry[] = [
  {
    "name": "Kajiba (火事場) — Adrenalina",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "C'è una soglia oltre la quale il corpo smette di risparmiarsi. La prima ferita che conta davvero spalanca i nuclei oltre la misura abituale: la Jigo-Ka affluisce in eccesso, più di quanta a freddo se ne potrebbe contenere, e la tecnica successiva la scarica tutta in una volta.",
    "poolId": "generiche-kajiba-adrenalina",
    "effect": "Passiva · CS 0. La prima volta che scendi sotto il 50% degli HP in uno scontro, la tua prossima waza sale di 1 tier di danno."
  },
  {
    "name": "Kazari (飾り) — Monile",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "L'analista solidifica una piccola quantità di Jigo-Ka in un ornamento da portare addosso: un pendente, un anello, una fibbia — indistinguibile da un gioiello vero finché non gli si chiede di essere altro.",
    "poolId": "generiche-kazari-monile",
    "effect": "Passiva · CS 0. Generi un piccolo [Costrutto][Solido] (pendente, anello…). Una volta per combattimento può ingrandirsi fino a 1 m; a fine scontro torna normale se intatto."
  },
  {
    "name": "Yasuragi (安らぎ) — Balsamo dell'Anima",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Forzare i nuclei a produrre senza sosta li lascia vuoti; concedere loro anche un solo turno di quiete li lascia ricostituire la riserva con calma.",
    "poolId": "generiche-yasuragi-balsamo",
    "effect": "Passiva · CS 0. Se concludi il turno senza usare waza, rigeneri +1 CS oltre ai 3 base."
  },
  {
    "name": "Yakudō (躍動) — Psico-Atleta",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "L'analista impara a scaricare parte della propria Jigo-Ka nei muscoli invece che nelle tecniche, usandola come spinta pura. Non è una tecnica da attivare: è un modo costante di abitare il corpo.",
    "poolId": "generiche-yakudo-psico-atleta",
    "effect": "Passiva · CS 0. +1,5 m al Movimento per quarto (cumulativo con Undō) e +2 m all'altezza/distanza di salto."
  },
  {
    "name": "Iai (居合) — Incombenza",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "L'analista che ha passato un intero turno senza agire accumula una tensione pronta a scaricarsi in un gesto solo. Basta una seconda tecnica, o un danno anticipato sul bersaglio, perché la condizione si spezzi.",
    "poolId": "generiche-iai-incombenza",
    "effect": "Passiva · CS 0. Se (a) il turno scorso non hai usato waza, (b) questo turno ne lanci una sola, (c) il bersaglio non ha ancora subìto tuoi danni → quella waza sale di 1 tier."
  },
  {
    "name": "Kehai (気配) — Lettura del Flusso",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Ogni fonte di Jigo-Ka lascia nell'aria una traccia che la pelle dell'analista impara a riconoscere prima degli occhi. Entro otto metri percepisce direzione e intensità — non la posizione esatta.",
    "poolId": "generiche-kehai-lettura-flusso",
    "effect": "Passiva · CS 0. Percepisci direzione e intensità della Jigo-Ka entro 8 m (presenza di altri analisti o creature psichiche)."
  },
  {
    "name": "Shoken (初拳) — Eco del Pugno",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "La prima tecnica insegnata in accademia: muovere la Jigo-Ka, raccoglierla in un punto, farla erompere. Rudimentale e diretta, ma è la base su cui ogni Via costruisce le proprie meraviglie.",
    "poolId": "generiche-shoken-eco-pugno",
    "effect": "Attiva · [Contatto][Energetica] · Tier base 1 · CS 1 · 1/4. Rivesti una parte del corpo di Jigo-Ka [Energetica] e colpisci a [Contatto]. Danno = tier. Va a segno se prevali nello scambio d'Indice."
  },
  {
    "name": "Shōheki (障壁) — Barriera",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Invece di concentrare la Jigo-Ka in un punto, distribuirla uniforme su tutto il corpo. Ne nasce un velo d'energia aderente alla pelle che resta inerte fino all'impatto e brilla soltanto nell'istante in cui assorbe il colpo.",
    "poolId": "generiche-shoheki-barriera",
    "effect": "Attiva · [Scudo][Energetica] · Tier base 1 · CS 1 · 1/4. Veli il corpo di Jigo-Ka e generi uno [Scudo] con Resistenza = valore-tier."
  },
  {
    "name": "Shikigami (式神) — Forma dello Spirito",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Tenere la Jigo-Ka coesa e stabile una volta uscita dal corpo. L'analista la modella nella sagoma di un piccolo animale trasparente che si stacca da lui e avanza per conto proprio.",
    "poolId": "generiche-shikigami-forma-spirito",
    "effect": "Attiva · [Costrutto][Energetico] · Tier base 1 · CS 2 · 1/4. Emani un famiglio fantasma (taglia piccola) per 2 turni. Percorre fino a 8 m e attacca una volta per turno in linea retta (danno = tier)."
  },
  {
    "name": "Shinya (心矢) — Dardo Psichico",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista concentra la Jigo-Ka in un punto davanti a sé e la rilascia come un piccolo proiettile compatto e veloce. Il dardo viaggia in linea retta finché non incontra il primo bersaglio.",
    "poolId": "generiche-shinya-dardo-psichico",
    "effect": "Attiva · [Proiettile][Energetica] · Tier base 1 · CS 1 · 1/4. Proietti un dardo in linea retta per 15 m; danno = tier al primo bersaglio colpito."
  },
  {
    "name": "Ippuku (一服) — Gestione della Pressione",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "I nuclei rendono di più quando il corpo non è in tensione. L'analista compie un gesto che lo allenti anche solo per un istante — una boccata di fumo, uno stiramento, le dita che scrocchiano — e in quella breve tregua la Jigo-Ka torna ad affluire più in fretta del normale. Ma riempire i nuclei oltre la loro capienza ha un prezzo: se il recupero supera la soglia, l'energia ristagna e si rivolta contro chi la trattiene.",
    "poolId": "generiche-ippuku-gestione-pressione",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 0 · 1/4. Compi un gesto rilassante: rigeneri +3 CS. Se questo ti porta oltre la soglia di Overheat (20), ottieni lo status [Sovraccarico]."
  },
  {
    "name": "Ukenagashi (受け流し) — Parata Perfetta",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista smette di pensare all'attacco e si concentra sull'arma, pronto a intercettare ciò che sta per arrivare. Non si tratta di bloccare di forza, ma di incontrare il colpo con l'angolo giusto e scostarlo di lato, lasciandolo proseguire oltre il bersaglio. Riuscirci richiede di prevalere su chi attacca; riuscirci bene scopre la sua guardia, e il contraccolpo che segue trova un varco già aperto.",
    "poolId": "generiche-ukenagashi-parata-perfetta",
    "effect": "Attiva · [Contatto][Nessuna] · CS 1 · 1/4 (reattiva). Ti prepari a deviare un attacco fisico o un [Proiettile] in arrivo: confronto d'Indice (le tue Skiru di parata, es. Hansha, contro Indice/tier dell'attacco). Se prevali, lo devii — ⚠️ la deviazione non annulla i danni se vieni comunque colpito — e la tua prossima offensiva contro quel bersaglio sale di 1 tier. Richiede un'arma impugnata."
  },
  {
    "name": "Shukuchi (縮地) — Scatto Potenziato",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista scarica la Jigo-Ka nelle gambe in un'unica spinta e copre la distanza prima che l'occhio riesca a seguirlo. Non è teletrasporto: è uno scatto tanto rapido da lasciare, per una frazione di secondo, un'immagine residua nel punto da cui è partito. La materia solida resta un limite — muri e ostacoli vanno aggirati, non attraversati.",
    "poolId": "generiche-shukuchi-scatto-potenziato",
    "effect": "Attiva · [Movimento][Nessuna] · CS 1 · 1/4. Ti sposti istantaneamente di (Movimento × 2) m nella direzione scelta, lasciando un'immagine residua. Non attraversa muri o ostacoli solidi."
  },
  {
    "name": "Chōyaku (跳躍) — Salto Potenziato",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista infonde la Jigo-Ka nelle gambe e la libera in un balzo che nessun muscolo da solo potrebbe sostenere, raggiungendo tetti, cornicioni e distanze altrimenti impossibili. La stessa energia avvolge la ricaduta e ne dissipa l'urto: un salto che si chiude senza pagare il prezzo dell'atterraggio. Le cadute lievi non lasciano segno, quelle gravi pesano la metà.",
    "poolId": "generiche-choyaku-salto-potenziato",
    "effect": "Attiva · [Movimento][Nessuna] · CS 1 · 1/4. Salto potenziato fino a 4 m in verticale o 8 m in orizzontale. L'atterraggio è ammortizzato: annulla il danno da cadute lievi e dimezza quello da cadute gravi."
  },
  {
    "name": "Kaginawa (鉤縄) — Presa dell'Ego",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista solidifica la Jigo-Ka in un uncino collegato a sé da un filo d'energia e lo scaglia verso un punto in vista. Se il rampino morde una superficie salda, il filo si tende e all'analista resta la scelta di come usarlo: strapparsi verso l'appiglio, oppure tirare verso di sé ciò che vi è agganciato, purché di taglia piccola. Compiuto il suo lavoro, il costrutto si scioglie nell'aria.",
    "poolId": "generiche-kaginawa-presa-ego",
    "effect": "Attiva · [Costrutto][Energetico] · CS 1 · 1/4. Proietti un rampino verso un punto visibile entro 12 m. Se si aggancia a una superficie solida, tiri te stesso verso quel punto oppure trascini verso di te oggetti di taglia [Piccola]. Si dissolve dopo l'uso."
  },
  {
    "name": "Nenwa (念話) — Comunicazione Silenziosa",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista aggancia la propria Jigo-Ka a quella di un bersaglio che vede, o di cui conosce con esattezza la posizione, e vi fa passare le parole senza pronunciarle. Chi le riceve le avverte come un pensiero che non gli appartiene — estraneo, eppure chiaro e riconoscibile come la voce di chi lo invia. Il canale, però, è a senso unico: il bersaglio non può rispondere allo stesso modo, a meno che non padroneggi anch'egli la tecnica.",
    "poolId": "generiche-nenwa-comunicazione-silenziosa",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Apri una comunicazione mentale con un bersaglio a vista o di cui conosci la posizione esatta entro 20 m. Parli, lui ti percepisce come un pensiero esterno riconoscibile. Non è telepatia piena: non può risponderti con lo stesso mezzo, a meno che non conosca anch'egli questa tecnica."
  },
  {
    "name": "Fūjin (風刃) — Lama d'Aria",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista comprime l'aria attorno alla mano e la libera con un gesto tagliente, scagliando una lama che corre in linea retta. È quasi invisibile a occhio nudo — un'increspatura nell'aria più che un oggetto — ma chi ha sensibilità alla Jigo-Ka la percepisce arrivare. Ferisce di taglio chiunque incontri per primo lungo la traiettoria.",
    "poolId": "generiche-fujin-lama-aria",
    "effect": "Attiva · [Proiettile][Gassosa] · Tier base 1 · CS 1 · 1/4. Lanci una lama d'aria in linea retta per 15 m; danno = tier al primo bersaglio. Difficile da vedere (percepibile da chi sente la Jigo-Ka)."
  },
  {
    "name": "Gashō (我晶) — Ego Cristallino",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista solidifica un frammento di Jigo-Ka in un cristallo traslucido e lo scaglia contro il bersaglio. La punta è dura e affilata, e ferisce perforando. Se manca il bersaglio e incontra una superficie, vi si conficca e resta lì, un cristallo piantato nel terreno o nel muro, prima di dissolversi col tempo: finché regge, è materia a tutti gli effetti.",
    "poolId": "generiche-gasho-ego-cristallino",
    "effect": "Attiva · [Proiettile][Solida] · Tier base 1 · CS 1 · 1/4. Scagli un cristallo in linea retta per 15 m; danno = tier (perforante) al primo bersaglio. Se colpisce una superficie invece di un bersaglio, si conficca e per 3 turni conta come [Costrutto][Solido], poi si dissolve."
  },
  {
    "name": "Meidan (鳴弾) — Sibilo Proiettile",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista concentra la Jigo-Ka mentre produce un suono ben udibile — uno schiocco delle dita, della lingua, dell'acciaio — e su quel segnale acustico la libera. Dal suono nasce un proiettile che parte nella direzione scelta e corre dritto fino al bersaglio. L'innesco sonoro lo rende difficile da anticipare: quando lo si sente, è già partito.",
    "poolId": "generiche-meidan-sibilo-proiettile",
    "effect": "Attiva · [Proiettile][Sonoro] · Tier base 1 · CS 1 · 1/4. Su un suono che produci, lanci un proiettile per 15 m nella direzione scelta; danno = tier al primo bersaglio."
  },
  {
    "name": "Rasui (螺錐) — Trivella Psionica",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista materializza un'asta di materia compressa che si allunga rapidamente in avanti ruotando su sé stessa come una punta da trapano. La trivella cresce nella direzione scelta, fora il primo bersaglio che incontra e poi si dissolve. È il raggio più meccanico del repertorio: non brucia né lacera, perfora.",
    "poolId": "generiche-rasui-trivella-psionica",
    "effect": "Attiva · [Raggio][Solido] · Tier base 2 · CS 2 · 1/4. Una trivella rotante si estende per 8 m in linea retta; danno = tier (perforante) al primo bersaglio, poi scompare."
  },
  {
    "name": "Funki (噴気) — Bollore Onirico",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista rilascia un'eruzione istantanea di gas ad altissima pressione in una direzione a scelta. Il getto si estende in linea retta come un soffio violento, investe ciò che incontra e lo respinge per la forza stessa con cui esce. Più che ferire, sfonda e allontana.",
    "poolId": "generiche-funki-bollore-onirico",
    "effect": "Attiva · [Raggio][Gassoso] · Tier base 2 · CS 2 · 1/4. Getto di gas in linea retta per 10 m; danno = tier e sbalzo di 4 m indietro al primo bersaglio (lungo la direzione del getto)."
  },
  {
    "name": "Suishin (水針) — Acupressione Liquida",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista proietta un getto di liquido ultra-concentrato ad altissima pressione, sottile e preciso come un ago. Non è un'ondata: è un filo d'acqua tagliente che incide il primo bersaglio lungo la linea di tiro. La ferita che lascia continua a sanguinare.",
    "poolId": "generiche-suishin-acupressione-liquida",
    "effect": "Attiva · [Raggio][Liquido] · Tier base 2 · CS 2 · 1/4. Filo di liquido in linea retta per 15 m; danno = tier al primo bersaglio e applica lo status [Emorragia]."
  },
  {
    "name": "Fukyōon (不協音) — Dissonanza",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista emette un fascio di onde sonore concentrate a una frequenza distruttiva, indirizzandolo in linea retta. Il fascio non è un punto ma una colonna di suono che investe il primo bersaglio e tutto ciò che gli sta stretto attorno. Dove passa, l'aria stessa vibra fino a far male.",
    "poolId": "generiche-fukyoon-dissonanza",
    "effect": "Attiva · [Raggio][Sonoro] · Tier base 2 · CS 2 · 1/4. Fascio sonoro in linea retta per 15 m, raggio 2 m; danno = tier al primo bersaglio investito."
  },
  {
    "name": "Hibana (火花) — Scintilla d'Ego",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista proietta un fascio elementale concentrato in linea retta, lanciato ad alta velocità verso il bersaglio. Veste la Jigo-Ka del proprio elemento e la spara come un dardo di luce densa. Veloce e lineare, è il raggio elementale di base da cui partono le varianti più elaborate.",
    "poolId": "generiche-hibana-scintilla-ego",
    "effect": "Attiva · [Raggio][Energetico] · Tier base 2 · CS 2 · 1/4. Fascio elementale in linea retta per 20 m; danno = tier al primo bersaglio."
  },
  {
    "name": "Sandan (散弾) — Shrapnel Psichico",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista materializza un ventaglio di schegge solide e lo libera tutto in una volta in un cono davanti a sé. Le schegge si aprono a raggiera coprendo l'intero arco frontale e colpiscono chiunque vi si trovi. È una tecnica d'area grezza, fatta per saturare lo spazio vicino più che per centrare un singolo nemico.",
    "poolId": "generiche-sandan-shrapnel-psichico",
    "effect": "Attiva · [Propagazione Conica][Solido] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio nell'area."
  },
  {
    "name": "Bakufū (爆風) — Decompressione Onirica",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista rilascia di colpo il gas compresso accumulato nel corpo, scaricandolo in un cono frontale. L'onda di pressione investe tutta l'area davanti a lui, colpendo e spingendo via chiunque ne sia preso. Pulisce lo spazio immediato tanto quanto lo danneggia.",
    "poolId": "generiche-bakufu-decompressione-onirica",
    "effect": "Attiva · [Propagazione Conica][Gassoso] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio nell'area e sbalzo di 4 m indietro."
  },
  {
    "name": "Nenmō (粘網) — Ragnatela di Mercurio",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista proietta un ventaglio di liquido viscoso e denso, simile a una rete lanciata in un cono davanti a sé. Il liquido investe i bersagli e ne impasta i movimenti, poi ricade a terra restando come una pozza appiccicosa che continua a intralciare chi vi cammina. Non uccide: rallenta, blocca, tiene fermo abbastanza a lungo.",
    "poolId": "generiche-nenmo-ragnatela-mercurio",
    "effect": "Attiva · [Propagazione Conica][Liquido] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio e applica [Rallentato] (−2 m Movimento) per 2 turni. Il liquido resta a terra come zona viscosa per 2 turni: chi la tocca o vi termina il turno subisce lo stesso rallentamento."
  },
  {
    "name": "Kyōkan (叫喚) — Urlo del Lobo Frontale",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista emette un'onda sonora concentrata in un cono frontale, un urlo psichico che non passa per la gola ma direttamente per la Jigo-Ka. Il suono investe tutti i bersagli davanti a lui, e chi lo incassa perde l'equilibrio e l'orientamento. Più che ferire la carne, scuote la mente.",
    "poolId": "generiche-kyokan-urlo-lobo-frontale",
    "effect": "Attiva · [Propagazione Conica][Sonoro] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio e applica [Vertigini] (1 stack)."
  },
  {
    "name": "Kyōshin (共振) — Frequenza Disarmante",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista fa vibrare le proprie ossa a una frequenza precisa e la trasmette al bersaglio attraverso il contatto fisico. La vibrazione si annida nel corpo altrui e ne disturba il flusso: la prossima tecnica gli costerà più fatica del dovuto. E se il bersaglio non la scarica usando una waza, la frequenza trattenuta finisce per ferirlo da sola.",
    "poolId": "generiche-kyoshin-frequenza-disarmante",
    "effect": "Attiva · [Contatto][Sonoro] · CS 2 · 1/4. A contatto, impianti una vibrazione: la prossima waza del bersaglio costa +2 CS. La vibrazione svanisce quando il bersaglio usa una waza; se passa un suo intero turno senza usarne, subisce danno = tier."
  },
  {
    "name": "Dendō (伝導) — Propagazione Acustica",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista scarica un'onda sonora non nell'aria ma nella materia solida su cui poggia — pavimento, muro, soffitto — e la fa correre lungo la superficie in un cerchio che si allarga. Chiunque sia in contatto con quella superficie lungo il percorso viene raggiunto dalla vibrazione. Chi si è staccato da terra, invece, non sente nulla.",
    "poolId": "generiche-dendo-propagazione-acustica",
    "effect": "Attiva · [Emanazione][Sonoro] · Tier base 2 · CS 2 · 1/4. Un'onda si propaga lungo una superficie solida per 8 m in cerchio; danno = tier a ogni bersaglio a contatto con la superficie lungo il percorso. Non si propaga nell'aria."
  },
  {
    "name": "Hankyō (反響) — Eco dell'Astio",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista sceglie un punto a distanza e vi fa detonare un'esplosione sonora che si diffonde in ogni direzione. Non parte da lui ma dal punto designato, raggiungendo bersagli che un cono frontale non toccherebbe. Chi ne è investito incassa il colpo e ne esce stordito.",
    "poolId": "generiche-hankyo-eco-astio",
    "effect": "Attiva · [Emanazione a distanza][Sonoro] · Tier base 2 · CS 2 · 1/4. Scegli un punto entro 12 m: esplosione sonora in tutte le direzioni, raggio 4 m; danno = tier e [Vertigini] (1 stack) a ogni bersaglio nell'area."
  },
  {
    "name": "Kihō (気泡) — Bolla Pressurizzata",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista comprime gas psichico in una bolla sferica davanti a sé, una membrana tesa che fa da scudo finché regge. Quando cede, però, non si limita a rompersi: il gas trattenuto si libera di colpo in un'esplosione di pressione che respinge tutto ciò che le sta intorno. Una difesa che, nel rompersi, contrattacca.",
    "poolId": "generiche-kiho-bolla-pressurizzata",
    "effect": "Attiva · [Scudo][Gassoso] · CS 2 · 1/4. Generi una bolla (∅ ~2 m) con Resistenza = valore-tier. Quando viene distrutta, il gas si rilascia sbalzando di 4 m indietro tutto ciò che si trova entro 3 m dal punto di rottura."
  },
  {
    "name": "Suimaku (水幕) — Velo Liquido",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista genera davanti a sé una cortina di liquido psichico denso, una lastra d'acqua sospesa che frena ciò che la attraversa. I proiettili che la perforano ne escono più lenti e più deboli, avendo speso parte della loro spinta nel liquido. Se la cortina sopravvive al colpo, resta su fino alla fine del turno.",
    "poolId": "generiche-suimaku-velo-liquido",
    "effect": "Attiva · [Scudo][Liquido] · CS 2 · 1/4. Crei una cortina (~3×3 m) con Resistenza = valore-tier. I [Proiettili] che la attraversano subiscono −4 danno e −5 m di gittata rimanente. Se il velo sopravvive al colpo, permane fino alla fine del tuo turno."
  },
  {
    "name": "Funshutsu (噴出) — Eruzione dell'Ego",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista lascia erompere la propria Jigo-Ka da tutto il corpo in una volta sola, scaricandola in ogni direzione come un'onda elementale. Non sceglie un bersaglio: colpisce tutto ciò che gli sta vicino, amici e nemici senza distinzione. È la tecnica della disperazione e dello spazio da liberare a ogni costo.",
    "poolId": "generiche-funshutsu-eruzione-ego",
    "effect": "Attiva · [Energetica][Emanazione] · Tier base 3 · CS 3 · 1/4. Esplosione elementale in tutte le direzioni, raggio 5 m; danno = tier a ogni bersaglio nell'area (te escluso)."
  },
  {
    "name": "Tōrō (灯籠) — Lanterna Incisa",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "La Jigo-Ka cola dal terzo occhio fino al palmo e affonda nell'oggetto stretto in pugno: legno, acciaio o vetro si accendono di una brace interna che solo l'analista vede. La lanterna è la soglia in cui Meiju e Shiju condividono un'unica fiamma — l'oggetto smette di essere tale e diventa il vaso che la custodisce.",
    "poolId": "toro-lanterna-incisa",
    "effect": "Passiva · CS 0. Designi un'arma o un oggetto impugnato come Tōrō. Finché lo tocchi, non può essere bersaglio di waza di Manipolazione o Trasformazione altrui, e funge da origine per lanciare le tue waza."
  },
  {
    "name": "Michishirube (道標) — Luce Guida",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "La fiamma non scalda soltanto: indica. Punti il Tōrō e la luce traccia nell'aria la via che il colpo dovrà percorrere, limpida come la corona dell'albero della Vita. È Meiju che parla: la chiarezza che precede il gesto.",
    "poolId": "michishirube-luce-guida",
    "effect": "Passiva · CS 0. Impugnando il Tōrō, le tue waza Energetiche a Contatto diventano Energetiche a Proiettile, con origine dal Tōrō che usi per mirare. Gittata = 8 m + 1 m per punto di Seimitsu."
  },
  {
    "name": "Shōka (小火) — Fiamma Docile",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "Chi conosce la propria fiamma non la spreca. L'analista la piega, la addomestica, la fa bruciare lenta. Ciò che prima costava, ora basta sussurrarlo.",
    "poolId": "shoka-fiamma-docile",
    "effect": "Passiva · CS 0. Ogni waza lanciata attraverso il Tōrō costa −1 CS, minimo 1."
  },
  {
    "name": "Nokuribi (残り火) — Fuoco Residuo",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "Quando la fiamma elementale si spegne, qualcosa resta aggrappato al vetro: una brace che non vuole morire, il residuo indesiderato di Shiju che sopravvive a sé stesso. E ciò che la lanterna trattiene oltre la propria morte, lo restituisce.",
    "poolId": "nokuribi-fuoco-residuo",
    "effect": "Passiva · CS 0. Il Tōrō trattiene il residuo dell'ultima tua waza Elementale fino alla fine del turno successivo. Finché l'elemento permane, ogni tua waza Energetica lanciata dal Tōrō diventa Elementale (e applica lo status di riferimento); applicato l'effetto, l'arma perde l'elemento."
  },
  {
    "name": "Kintsugi (金継ぎ) — Legame dei Frammenti",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "Nulla, sotto la mano dell'analista, è davvero rotto. Le crepe si riempiono d'oro-Ego e ciò che era spezzato torna intero lungo le sue stesse ferite: è Meiju, la Vita che ricuce, più bella perché ha conosciuto la frattura.",
    "poolId": "kintsugi-legame-dei-frammenti",
    "effect": "Passiva · CS 0. Puoi richiamare la Jigo-Ka immessa in un oggetto rotto o in un Costrutto distrutto nel turno precedente, ricreandolo; dura fino alla fine del prossimo turno. Non è ricostruibile ciò che è stato distrutto da energia psichica."
  },
  {
    "name": "Kakuchō (拡張) — Espansione della Luce",
    "rank": "T1",
    "styleId": "toka",
    "isPassive": false,
    "description": "La luce non conosce confini di forma. Trabocca dal filo della lama e la fa crescere — il coltello si fa spada, la spada si fa zanna — come la gloria che dilaga sull'albero della Vita.",
    "poolId": "kakucho-espansione-della-luce",
    "effect": "Attiva · [Potenziamento][Nessuna] · Tier base 1 · CS 1 · 1/4. Durante un colpo, il Tōrō sale di una taglia (mantenendo il tipo di danno). Per la durata, i colpi a Contatto con esso ottengono +1 tier di danno e +1 m di gittata. Se è già un Tōrō, dura l'intero turno."
  },
  {
    "name": "Hōshutsu (放出) — Rilascio della Fiamma",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "Tutto ciò che la lanterna ha trattenuto, in un solo respiro, fuori. Il vetro si frantuma e la fiamma divampa in avanti: una luce di Shiju che non illumina, ma consuma.",
    "poolId": "hoshutsu-rilascio-della-fiamma",
    "effect": "Attiva · [Propagazione Conica][Energetica] · Tier base 2 · CS 2 · 1/4. Scarichi la Jigo-Ka del Tōrō in un cono di 6 m davanti a te; danno = tier a ogni bersaglio nell'area. Se il Tōrō ha accumulato carica propria, danno +1 tier ma l'arma si disintegra — dal grado Sentatsu Bunsekikan, la disintegrazione non avviene più."
  },
  {
    "name": "Ukabu Tōrō (浮かぶ灯籠) — Lanterna Fluttuante",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "L'analista scioglie l'ormeggio. La lanterna si stacca dalla mano e galleggia come quelle affidate alla corrente per accompagnare i morti. Obbedisce solo al pensiero, e brucia per chi la guida.",
    "poolId": "ukabu-toro-lanterna-fluttuante",
    "effect": "Attiva · [Costrutto] · Tier base 2 · CS 2 · 1/4 + mantenimento. Il Tōrō levita come Costrutto, guidato dalla mente entro 8 m da te (oltre, la connessione si spezza e cade). Sale fino a 2 m, attacca in modo semplice (danno = tier), segue i tuoi comandi. Dura 3 turni, poi torna oggetto."
  },
  {
    "name": "Fuin no Hi (封印の火) — Sigillo della Fiamma",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "Una fiamma chiusa nel vetro non muore: aspetta. L'analista la sigilla nel Tōrō, e il momento del suo rilascio sarà una sorpresa scritta nel silenzio.",
    "poolId": "fuin-no-hi-sigillo-della-fiamma",
    "effect": "Attiva · setup · Tier base 2 · CS 2 · 1/4. Sigilli nel Tōrō una waza che conosci (la lanci anche ora). Per 3 turni può essere liberata: per impatto (stesso danno della waza sigillata) oppure per fendente nell'etere, generando un Proiettile Energetico con le proprietà della waza. Se non liberata in tempo, il Tōrō si rompe in Emanazione, infliggendo comunque il danno della waza sigillata."
  },
  {
    "name": "Kyōmei (共鳴) — Risonanza della Fiamma",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "L'arma e le braccia vibrano sulla stessa nota. Ogni passo dell'analista diventa un fendente che non smette mai di cantare, e chi gli si para accanto viene reciso dal suono.",
    "poolId": "kyomei-risonanza-della-fiamma",
    "effect": "Attiva · [Contatto] · Tier base 2 · CS 2 · 1/4. Per un turno, durante ogni tuo movimento il Tōrō trascina gli arti, colpendo ogni nemico a gittata corpo a corpo lungo il percorso (danno = tier). Non puoi mirare a punti vitali. Un colpo ogni 2 m percorsi — scala col Movimento."
  },
  {
    "name": "Omocha (玩具) — Il Giocattolo",
    "rank": "T3",
    "styleId": "toka",
    "isPassive": false,
    "description": "Il pugno si chiude su un tubo di ferro, una sedia, un coccio — non importa cosa. La Jigo-Ka cola dal terzo occhio e affonda nell'oggetto, che si accende di brace interna verso l'estremità: il metallo resta metallo, il legno resta legno, ma ora è il vaso in cui Meiju e Shiju condividono un'unica fiamma. E un vaso troppo pieno, prima o poi, si crepa.",
    "poolId": "omocha-il-giocattolo",
    "effect": "Attiva · [Nessuna][Potenziamento] · Tier base 4 · CS 5 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Per 3 turni, qualunque oggetto fisico che impugni diventa [Arma Psichica] — anche senza Tōrō · Lanterna Incisa. L'oggetto conserva le proprietà fisiche e funge da [Tōrō] per le tue waza. Puoi cambiare oggetto durante il turno: il precedente perde all'istante lo status e si distrugge.\n\n↳ Sovraccarico: quando lanci una waza attraverso il [Tōrō], la sua punta diventa [Instabile]. Al primo impatto successivo oppure al lancio della waza seguente attraverso di essa, l'oggetto esplode in una [Propagazione][Energetica] di raggio 3 m — danno = tier (17) a ogni bersaglio nell'area — e viene consumato."
  },
  {
    "name": "Gangushi (玩具師) — Il Giocattolaio",
    "rank": "T4",
    "styleId": "toka",
    "isPassive": false,
    "description": "Non serve più stringere nulla. La Jigo-Ka risale fino a ciò che porta addosso da sempre — la cintura, gli anelli, le monete in tasca — e ognuno di quegli oggetti, legato all'Ego come una vena d'oro, si accende di una luce propria. L'analista cammina al centro di un cerchio di lanterne che obbediscono al suo pensiero: ha smesso di impugnare un'arma, ed è diventato il punto da cui tutte le armi partono.",
    "poolId": "gangushi-il-giocattolaio",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 7 · 1/4 · grado richiesto: Kanteikan [K]. Per 3 turni, ogni oggetto che possedevi da prima dello scontro (indossato, in tasca, nell'inventario) diventa [Tōrō] simultaneamente, senza bisogno di impugnarlo, finché resta addosso a te. Ognuno funge da [Tōrō]: per ogni waza scegli liberamente da quale oggetto-origine parte (angoli e direzioni multiple). Se un oggetto lascia il tuo corpo — lanciato, strappato, fatto cadere — perde lo status."
  },
  {
    "name": "Nikutai-Mei (肉体銘) — Carne Iscritta",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Dove c'era carne, l'analista incide struttura: l'arto perduto torna come sigillo, fedele alla memoria di ciò che era.",
    "poolId": "nikutai-mei-carne-iscritta",
    "effect": "Passiva · CS 0. Rimpiazzi parti del corpo con un Costrutto Solido dalla forma esatta della parte mancante. Quando quella parte viene colpita, il dolore fantasma drena CS invece di HP."
  },
  {
    "name": "Honshitsu (本質) — Essenza Affine",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Un solo elemento è inscritto nell'analista, per sempre, e da lui sgorga in ogni cosa che scrive.",
    "poolId": "honshitsu-essenza-affine",
    "effect": "Passiva · CS 0, keystone elementale. Scegli un elemento, immutabile. Puoi infonderlo nei tuoi Costrutti Solidi (ne assumono le proprietà) e nelle tue waza Energetiche (diventano Elementali col relativo status). È il presupposto delle waza elementali dello Stile."
  },
  {
    "name": "Kōchiku (構築) — Struttura Salda",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Le linee del sigillo, tracciate fitte, reggono più peso.",
    "poolId": "kochiku-struttura-salda",
    "effect": "Passiva · CS 0. I tuoi Costrutti e Scudi Solidi ottengono +1 tier di Resistenza."
  },
  {
    "name": "Bugusho (武具書) — Arsenale Scritto",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Tre frasi affilate, tracciate tra le dita, pronte a infrangersi su ciò che colpiscono.",
    "poolId": "bugusho-arsenale-scritto",
    "effect": "Passiva · CS 0. Crei tra le mani 3 armi piccole, Costrutti Energetici (aghi, coltelli...), che si infrangono al primo ostacolo fisico. Una sola può restare nascosta 6 ore; lanciando una waza, tutte spariscono."
  },
  {
    "name": "Kaihen (改編) — Forgia Ibrida",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Due armi, una sola sentenza: corpo dell'una, morso dell'altra.",
    "poolId": "kaihen-forgia-ibrida",
    "effect": "Passiva · CS 0. Crei un oggetto di media taglia, Costrutto Solido, fusione di due armi (corpo di una, estremità dell'altra). Una per quest; usando entrambe le estremità, si rompe a fine secondo turno."
  },
  {
    "name": "Kioku-Mei (記憶銘) — Sigillo Mnemonico",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Ciò che si è scritto bene una volta, si riscrive senza fatica.",
    "poolId": "kioku-mei-sigillo-mnemonico",
    "effect": "Passiva · CS 0. Ricreare un Costrutto già creato (stessa forma e dimensione) costa −1 CS. Memorizzi fino a 3 forme; memorizzarne una richiede di averla creata almeno 3 volte."
  },
  {
    "name": "Eizoku (永続) — Sigillo Persistente",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Un sigillo ben tracciato non sbiadisce in fretta.",
    "poolId": "eizoku-sigillo-persistente",
    "effect": "Passiva · CS 0. I tuoi Costrutti durano +1 turno. Quando uno sta per dissolversi, puoi spendere metà del suo costo in CS per estenderne la durata invece di ricrearlo."
  },
  {
    "name": "Kajū (過重) — Sovraccarico Geometrico",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "L'analista calca la scrittura finché trafigge ciò che dovrebbe fermarla.",
    "poolId": "kaju-sovraccarico-geometrico",
    "effect": "Passiva · CS 0 (+1 CS opzionale). Lanciando una waza Solida, paghi +1 CS per ignorare il 25% della Resistenza del primo ostacolo (dimezzato, 12,5%, sui viventi). Cumulabile per ogni CS speso."
  },
  {
    "name": "Hakai-Mei (破壊銘) — Marchio del Disfacimento",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Chi scrive il reale sa anche cancellarlo: contro l'opera altrui, la sua mano è più dura.",
    "poolId": "hakai-mei-marchio-del-disfacimento",
    "effect": "Passiva · CS 0. +1 tier di danno contro i Costrutti."
  },
  {
    "name": "Irekogo (入れ子) — Sigillo Annidato",
    "rank": null,
    "styleId": "genzai",
    "isPassive": true,
    "description": "Un guscio scritto attorno a un altro: il primo cade, e sotto attende ciò che era nascosto.",
    "poolId": "irekogo-sigillo-annidato",
    "effect": "Passiva · CS 0. \"Rivesti\" un tuo Costrutto Solido con un altro tuo Costrutto: il guscio esterno fa da scudo finché regge, poi si dissolve rivelando l'interno già pronto."
  },
  {
    "name": "Tōki (闘気) — Aura Dichiarata",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "L'analista rende visibile ciò che gli circola dentro: l'aura si fa materia, scudo o lancia.",
    "poolId": "toki-aura-dichiarata",
    "effect": "Attiva · [Energetica] · Tier base 2 · CS 2 · 1/4. Armatura: l'aura diventa un Costrutto Solido avvolgente, fisso fino a morte o grande mutamento psichico; conta come Scudo con Resistenza scala-tier e concede +5% di mitigazione finché regge. Proiettile, in alternativa: l'aura defluisce in un arto e si libera in un Proiettile Energetico (sfera 5×5), gittata 15 m, danno = tier."
  },
  {
    "name": "Raimei-Fu (雷鳴符) — Sigillo del Fulmine",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Un punto segnato a terra, e il cielo è costretto a rispondere.",
    "poolId": "raimei-fu-sigillo-del-fulmine",
    "effect": "Attiva · [Costrutto][Elementale] · Tier base 3 · CS 3 · 1/4. Scegli un punto entro 12 m: un fulmine cade colpendo entro 3 m dall'impatto (danno = tier, applica status). +2 CS per un secondo punto."
  },
  {
    "name": "Yōki no Iki (妖気の息) — Soffio dello Yōkai",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Dal respiro dell'analista esala una nebbia che annebbia i sensi e attende solo una scintilla.",
    "poolId": "yoki-no-iki-soffio-yokai",
    "effect": "Attiva · [Emanazione][Gassosa] · Tier base 2 · CS 2 · 1/4. Nube per 4 m attorno a te, permane 2 turni. Dentro, i bersagli subiscono −3 all'Indice delle azioni di Riflessi (Hansha). Infiammabile: a contatto con Fuoco o Fulmine s'incendia e sparisce nel turno."
  },
  {
    "name": "Onnen-dama (怨念玉) — Globo del Rancore",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Una sfera di astio fluttua accanto all'analista, e si avventa su chiunque osi colpirlo.",
    "poolId": "onnen-dama-globo-rancore",
    "effect": "Attiva · [Costrutto][Energetico] · Tier base 2 · CS 2 · 1/4 + mantenimento. Generi un globo che ti segue per 4 turni; si lancia automaticamente verso la prima fonte di danno subìta, poi esplode in Emanazione a distanza (area 3 m, danno = tier). Si muove a 6 m a turno; oltre la gittata diventa Proiettile e si schianta dritto, con danno e area maggiorati."
  },
  {
    "name": "Hashira (柱) — Colonne Incise",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Due colonne si scrivono dal suolo, pazienti come pilastri di un tempio.",
    "poolId": "hashira-colonne-incise",
    "effect": "Attiva · [Costrutto] · Tier base 2 · CS 2 · 1/4. Due colonne emergono dal terreno (pietra, cemento, detriti...), alte 5 m, larghe 1 m, distanti 1 m fra loro e sulla stessa linea; permangono 3 turni."
  },
  {
    "name": "Utsushi (写し) — Copia Conforme",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "L'analista riscrive la stessa frase due volte: due realtà identiche, una appena più breve.",
    "poolId": "utsushi-copia-conforme",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4. Copia un tuo Costrutto (stessa consistenza, taglia, forma e Resistenza; eredita effetti e status attivi). Durata = quella base meno 1 turno. Usabile anche durante una creazione: la copia appare entro 3 m dall'originale."
  },
  {
    "name": "Shōgeki-Te (衝撃手) — Palmo Elementale",
    "rank": "T1",
    "styleId": "genzai",
    "isPassive": false,
    "description": "La mano si vela di un liquido psichico denso e marchia ciò che tocca.",
    "poolId": "shogeki-te-palmo-elementale",
    "effect": "Attiva · [Contatto][Elementale] · Tier base 1 · CS 1 · 1/4. Colpisci a contatto: danno = tier, applica lo status dell'elemento affine. Richiede Honshitsu."
  },
  {
    "name": "Genso-Ya (元素矢) — Dardo Elementale",
    "rank": "T1",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Un dardo del proprio elemento, scritto e scoccato in un sol gesto.",
    "poolId": "genso-ya-dardo-elementale",
    "effect": "Attiva · [Proiettile][Elementale] · Tier base 1 · CS 1 · 1/4. Proiettile dell'elemento affine in linea retta, gittata 15 m: danno = tier al primo bersaglio, applica status. Richiede Honshitsu."
  },
  {
    "name": "Kesshō-Mei (結晶銘) — Memento Mori",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "L'analista solidifica il veleno che già scorre nel nemico, e lo trasforma in una lapide che lo insegue.",
    "poolId": "kessho-mei-memento-mori",
    "effect": "Attiva · [Contatto] → [Costrutto][Elementale] · Tier base 3 · CS 3 · 1/4. Tocchi un vivente con almeno 1 stack di status elementale: rimuovi tutte le stack e generi un Costrutto Elementale di taglia proporzionale (1-2 stack = Piccola, 3-4 = Media, 5+ = Grande). Il costrutto segue il bersaglio a 3 m; distrutto, esplode (danno = tier per taglia) e ridistribuisce le stack sui bersagli in gittata."
  },
  {
    "name": "Jiban (地盤) — Terreno Ostile",
    "rank": "T2",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Il suolo stesso viene riscritto: ciò che era terra diventa l'elemento dell'analista.",
    "poolId": "jiban-terreno-ostile",
    "effect": "Attiva · [Propagazione][Elementale] · Tier base 2 · CS 2 · 1/4. Ricopri il terreno in un'area di 4 m attorno a un punto entro 8 m col tuo elemento affine: zona Propagazione Elementale per 3 turni. Chi vi sta o la attraversa subisce lo status. L'analista è immune."
  },
  {
    "name": "Meisaku (銘作) — Opera Prima",
    "rank": "T4",
    "styleId": "genzai",
    "isPassive": false,
    "description": "L'analista non scrive una frase: scrive la frase. Le linee si tracciano fitte e lente, geometria precisa e caotica insieme, finché il sigillo si chiude su sé stesso e non sbiadisce più. È il gesto di Tenkan, la Corona che nomina, portato fino in fondo: una cosa dichiarata esistente che il mondo non riesce più a dimenticare. Finché la regge, Shiju non ha presa su di lei.",
    "poolId": "meisaku-opera-prima",
    "effect": "Attiva · [Costrutto][Solido] · CS 6 · 2/4 (scrittura precisa) · grado richiesto: Sentatsu Bunsekikan [SB]. Materializzi la tua Opera Prima, un [Costrutto][Solido] permanente e unico (una sola attiva alla volta). Resistenza tier 5 (23); forma a tua scelta, fissata alla creazione; taglia fino a [Grande]. Il suo Mei è inviolabile: non conta nel limite Gosa e non è mai il sigillo che si incrina. Non si dissolve col tempo. Se distrutta, puoi ri-dichiararla — stessa Opera Prima — dedicando un turno intero e pagandone di nuovo il costo."
  },
  {
    "name": "Shinryaku (侵略) — Invasione",
    "rank": "T4",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Non un disegno paziente, ma uno strappo. L'analista punta un dito e la realtà, in quel punto, è costretta a far spazio: una massa solida si scrive tutta in una volta, con un suono secco, scaraventando via ciò che occupava il posto. È creazione oltre l'umano — non si chiede permesso al mondo, lo si occupa.",
    "poolId": "shinryaku-invasione",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 5 · CS 7 · 1/4 · grado richiesto: Kanteikan [K]. Materializzi istantaneamente un [Costrutto][Solido] di taglia [Grande] in un punto visibile entro 12 m. Tutto ciò che occupa il punto è investito dall'apparizione: i bersagli a contatto subiscono danno = tier (23) e sono sbalzati di 4 m; ogni [Costrutto] di taglia inferiore alla [Grande] nel punto viene distrutto. Il costrutto generato dura 3 turni, ha Resistenza tier 4 (17), forma a tua scelta."
  },
  {
    "name": "Rakuen (楽園) — Eden",
    "rank": "T4",
    "styleId": "genzai",
    "isPassive": false,
    "description": "L'analista smette di scrivere sul mondo e comincia a scrivere il mondo. Imprime il proprio Ego sulla realtà attorno a sé: il suolo si riveste della sua geometria, ogni superficie si incide del suo Mei, la luce prende il colore della sua Jigo-Ka. Dentro questo cerchio non esiste più il margine d'errore — ciò che traccia non scivola verso Shiju, perché qui Shiju non è mai stato invitato.",
    "poolId": "rakuen-eden",
    "effect": "Attiva · [Emanazione][Nessuna] · CS 8 + mantenimento · 1/4 · grado richiesto: Shin'enkan [S]. Per 4 turni, l'area in raggio 10 m attorno a te (ti segue) diventa il tuo mondo interiore reso tangibile. Entro l'Eden:\n\n— i tuoi [Costrutti] non si dissolvono (permangono oltre la scadenza normale finché l'Eden regge) e il limite Gosa è sospeso — nessun Mei si incrina;\n\n— ogni tuo [Costrutto] distrutto viene rigenerato all'inizio del tuo turno successivo al costo di 2 CS ciascuno;\n\n— hai percezione continua della posizione di ogni essere vivente nell'Eden."
  },
  {
    "name": "Ayatsuri (操り) — Filo del Burattinaio",
    "rank": null,
    "styleId": "ito",
    "isPassive": true,
    "description": "L'analista tende un filo invisibile e ciò che tocca smette di appartenere alla terra: diventa Kugutsu, marionetta sospesa al suo volere.",
    "poolId": "ayatsuri-filo-burattinaio",
    "effect": "Passiva · CS 0, genera 1 Tensione finché attiva. Sollevi un Costrutto fino a taglia Media, controllandolo vagamente; puoi muoverlo o scagliarlo. Parametri di movimento = il tuo Movimento (Undō) per taglia Piccola, ×0,75 per Media."
  },
  {
    "name": "Someito (染め糸) — Filo Tinto",
    "rank": null,
    "styleId": "ito",
    "isPassive": true,
    "description": "Il filo si intinge della natura che l'analista sceglie, e la marionetta cambia sostanza lungo la corda.",
    "poolId": "someito-filo-tinto",
    "effect": "Passiva · CS 0. Cambi liberamente la Consistenza dei Costrutti che hai generato."
  },
  {
    "name": "Yugami (歪み) — Filo Deforme",
    "rank": null,
    "styleId": "ito",
    "isPassive": true,
    "description": "Un gesto delle dita e la forma cede: la waza si comprime o si dilata in silenzio, mentre per un battito la Jigo-Ka dell'analista resta immobile.",
    "poolId": "yugami-filo-deforme",
    "effect": "Passiva · CS 0. Cambi la Categoria di una tua waza durante l'esecuzione: Emanazione o Propagazione ↔ Propagazione Conica. Gittata ×1,5 nel primo caso, ×0,5 nel secondo. L'origine diventa l'analista."
  },
  {
    "name": "Tazuna (手綱) — Redini",
    "rank": null,
    "styleId": "ito",
    "isPassive": true,
    "description": "Il colpo non è mai libero: corre lungo redini che solo l'analista impugna. Può piegarlo a metà volo, o richiamarlo all'impatto perché prosegua altrove.",
    "poolId": "tazuna-redini",
    "effect": "Passiva · CS 0 (modalità Rimbalzo: +1 CS opzionale). Guida: cambi la direzione di una tua waza Raggio o Proiettile fino a 180° durante l'esecuzione. Rimbalzo: se la waza impatta prima di consumare la gittata, può rimbalzare nella direzione scelta e proseguire per i metri rimasti — vale anche per le waza Sonore ad area, con rimbalzo fino a 6 m; +1 CS per allungare il rimbalzo di 4 m."
  },
  {
    "name": "Wakeito (分け糸) — Filo Sdoppiato",
    "rank": null,
    "styleId": "ito",
    "isPassive": true,
    "description": "Un filo che si biforca: la stessa volontà, due capi, due destini.",
    "poolId": "wakeito-filo-sdoppiato",
    "effect": "Passiva · CS 0. Una tua waza Raggio può dividersi in due diramazioni verso bersagli diversi (danno ×0,75 ciascuna); una tua waza Proiettile può raddoppiare di numero (danno ×0,75, stessa direzione)."
  },
  {
    "name": "Hikitome (引き止め) — Trattenuta",
    "rank": null,
    "styleId": "ito",
    "isPassive": true,
    "description": "\"Un colpo non viene fermato: viene trattenuto.\" Il proiettile resta sospeso al filo, in attesa.",
    "poolId": "hikitome-trattenuta",
    "effect": "Passiva · CS 1, genera 1 Tensione mentre è sospesa. \"Congeli\" una tua waza Proiettile in un punto entro la sua gittata: resta sospesa 1 turno, poi riparte nella stessa direzione senza ulteriore costo. Il turno di sospensione conta come un rilancio."
  },
  {
    "name": "Hajiki (弾き) — Fionda del Filo",
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "Il filo si tende fino al limite, poi lascia: la marionetta vola via come una pietra dalla fionda.",
    "poolId": "hajiki-fionda-filo",
    "effect": "Attiva · [Proiettile][Solido] · Tier base 2 · CS 2 · 1/4. Scagli in linea retta un Costrutto Solido che stai sollevando con Ayatsuri, per 12 m; danno = tier."
  },
  {
    "name": "Irekae (入れ替え) — Scambio dei Fili",
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "Due marionette, due fili incrociati: ciò che era qui è là, e viceversa.",
    "poolId": "irekae-scambio-fili",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Due tuoi Costrutti Solidi entro 8 m invertono posizione, mantenendo le loro proprietà — un costrutto in volo prosegue la traiettoria dalla nuova posizione."
  },
  {
    "name": "Mayu-Wari (繭割り) — Bozzolo Squarciato",
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "Il bozzolo di filo si lacera dall'interno e sputa schegge guidate.",
    "poolId": "mayu-wari-bozzolo-squarciato",
    "effect": "Attiva · [Proiettile][Solido] · Tier base 2 · CS 2 · 1/4. Un tuo Costrutto Solido entro 8 m implode generando 4 Proiettili Solidi diretti a un bersaglio; danno = tier, ripartito tra le schegge che colpiscono."
  },
  {
    "name": "Hikiyose (引き寄せ) — Richiamo dei Fili",
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "Fili di carica opposta: ciò che respinge e ciò che attrae, intrecciati.",
    "poolId": "hikiyose-richiamo-fili",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4, genera 1 Tensione. Rendi un tuo Costrutto Solido entro 8 m Positivo per 2 turni; fino a 2 altri entro 8 m diventano Negativi (+1 CS per crearne di nuovi già Negativi). Ogni Solido Negativo viene attratto con forza verso il Positivo."
  },
  {
    "name": "Musubi (結び) — Nodo Gemello",
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "Due marionette annodate allo stesso filo: feriscine una, sanguina l'altra.",
    "poolId": "musubi-nodo-gemello",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4, genera 1 Tensione. Leghi due Costrutti Solidi entro 8 m: per 4 turni, ciò che accade a uno si ripete sull'altro."
  },
  {
    "name": "Mayakashi (まやかし) — Inganno del Filo",
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "Il filo veste la marionetta di un'altra pelle.",
    "poolId": "mayakashi-inganno-filo",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Fai apparire un tuo Costrutto come un altro Costrutto che vedi o un oggetto del tuo inventario, per 4 turni. Sotto i 4 m la vera forma è visibile."
  },
  {
    "name": "Ubaiito (奪い糸) — Filo Rubato",
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "L'analista afferra il filo altrui e lo strappa di mano al suo padrone.",
    "poolId": "ubaiito-filo-rubato",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4. Tenti di strappare il controllo di un Costrutto nemico entro 8 m: confronto d'Indice (Skiru mentali, es. Fudōshin o Kansatsu) contro l'Indice del creatore. Se prevali, il controllo passa a te per 2 turni; il creatore può ritentare lo strappo. Solo su costrutti di taglia Media o inferiore."
  },
  {
    "name": "Unari (唸り) — Ronzio del Filo",
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "Il filo teso non tace: vibra di una nota bassa che fa girare la testa a chi gli sta vicino.",
    "poolId": "unari-ronzio-filo",
    "effect": "Attiva · [Emanazione][Sonoro] · CS 2 · 1/4, genera 1 Tensione. Permei un tuo Costrutto entro 8 m di un'onda sonora costante: per 3 turni emette un ronzio in un'area di 4 m. Chi inizia il turno nell'area subisce lo status Vertigini."
  },
  {
    "name": "Shime (締め) — Stretta del Filo",
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "Il filo si avvolge e cinge, finché la marionetta si fa più piccola, più dura, più letale.",
    "poolId": "shime-stretta-filo",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Comprimi un tuo Costrutto Solido entro 8 m, riducendone la taglia di un livello (Grande→Media, Media→Piccola). Guadagna +1 tier di Resistenza, e +1 tier di danno se usato come Proiettile. Permanente."
  },
  {
    "name": "Rensa (連鎖) — Catena di Fili",
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "Due gesti, un'unica catena: quando il primo filo si spegne, il secondo è già teso.",
    "poolId": "rensa-catena-fili",
    "effect": "Attiva · [Nessuna] · CS = somma delle due waza · 1/4. Carichi due waza e ne paghi entrambi i costi, scegliendo l'ordine. Quando la prima finisce, la seconda si attiva automaticamente dal punto in cui era la prima. Entrambe nello stesso turno."
  },
  {
    "name": "Kankatsu (管轄) — Giurisdizione",
    "rank": "T3",
    "styleId": "ito",
    "isPassive": false,
    "description": "L'analista tende un filo e lo pianta nell'aria attorno a sé, tracciando un cerchio invisibile di cui si dichiara padrone. Ogni colpo nemico che varca quel confine viene afferrato a metà volo da capi di filo che lo intingono del colore della sua Jigo-Ka: per un istante la corda di Retsuja lo trattiene, poi la mano che lo guida non è più quella che l'ha lanciato.",
    "poolId": "kankatsu-giurisdizione",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 4 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Dichiari Giurisdizione su una [Categoria] a scelta tra [Proiettile] e [Raggio]. Per 3 turni, una volta per turno, quando una waza nemica di quella Categoria entra entro 8 m da te, puoi spendere +2 CS per reclamarla: dall'istante in cui entra nel cerchio è considerata come appena lanciata da te. Bersaglio e gittata restano gli originali, ma ora la waza è tua — le tue passive Itō possono agire su di essa (redini, sdoppiamento, consistenza, trattenuta…) e le tue passive di consistenza/danno la leggono come propria.\n\n↳ Ogni waza reclamata che stai manipolando genera 1 Tensione finché la tieni."
  },
  {
    "name": "Chokurei (勅令) — Decreto",
    "rank": "T4",
    "styleId": "ito",
    "isPassive": false,
    "description": "L'analista non muove più la marionetta: muove la legge che la regge. Un filo di luce scrive nell'aria un'unica sentenza, breve come un nodo, e il campo è costretto a obbedirle — perché ogni cosa, anche la più libera, era già legata al filo del destino di Meiju.",
    "poolId": "chokurei-decreto",
    "effect": "Attiva · [Nessuna] · CS 6 · 1/4 · grado richiesto: Kanteikan [K]. Imponi un singolo Decreto, un comando che viola le regole naturali del combattimento. Si applica a un evento specifico, in corso o che avverrà entro 2 turni, in una gittata di 12 m. Un solo Decreto per turno.\n\nIl Decreto non può: cambiare [Consistenze], creare materia, potenziare un corpo, far esplodere energia. Può solo agire su movimento, direzione, posizione, [Categoria]. Esempi:\n\n— «Quella [Proiettile] torna al mittente.» → la waza inverte la direzione.\n\n— «Quei due [Costrutti] si scambiano di posto.» → scambio istantaneo (come Irekae, forzato).\n\n— «Quella waza si ferma.» → si congela sul posto; riparte al tuo prossimo turno sulla stessa traiettoria (come Hikitome, forzata su waza nemica).\n\n— «Quel bersaglio non può muoversi in quella direzione.» → un bersaglio entro gittata ha quella direzione di movimento negata per il turno."
  },
  {
    "name": "Mugen-Shihai (夢幻支配) — Dominazione Onirica",
    "rank": "T4",
    "styleId": "ito",
    "isPassive": false,
    "description": "L'analista pianta i piedi e apre tutti i fili insieme: una cupola sottile di corde si stende sopra il campo, e ogni cosa che vive là sotto sente un peso impercettibile sulle spalle. Non muove più le marionette a una a una — è il centro a cui tutti i fili tornano. Finché regge il cerchio, dentro di esso non accade nulla che la sua mano non senta, e quasi nulla che non possa reclamare. Ma chi tiene mille fili non può camminare.",
    "poolId": "mugen-shihai-dominazione-onirica",
    "effect": "Attiva · [Emanazione][Nessuna] · CS 8 + mantenimento · 1/4 · grado richiesto: Shin'enkan [S]. Estendi il tuo dominio in un cerchio di raggio 10 m centrato su di te, per 4 turni (o fino a rottura). Entro la zona:\n\n— ogni [Costrutto] presente conta te come co-proprietario (puoi manipolarlo come tuo, senza strapparne la proprietà al creatore);\n\n— hai piena coscienza di ogni waza generata nella zona o che la attraversa;\n\n— al costo di 1/4, tratti 1 waza (qualsiasi Categoria, tua o altrui) come appena generata da te; gittata e direzione iniziali restano gli originali. Nessun limite di una-per-turno: sei limitato solo dai quarti.\n\nVincolo del centro: per mantenere la Dominazione puoi muoverti al massimo di metà Movimento a turno. Se percorri più metri (per scelta o forzato) o subisci più di 12 danno (tier 3) da un singolo colpo, la Dominazione si spezza e decade.\n\n↳ Ogni waza che reclami nella zona genera 1 Tensione (la cupola è un'unica ragnatela: più tiri, più vicino al Cedimento)."
  },
  {
    "name": "Junnō (順応) — Pelle che Apprende",
    "rank": null,
    "styleId": "naikan",
    "isPassive": true,
    "description": "La Jigo-Ka risale sotto la pelle e si raccoglie nelle venature del punto d'impatto, brillante come brace appena spenta. La carne ha imparato una sola lezione, e la dimentica appena gliene insegnano un'altra.",
    "poolId": "junno-pelle-apprende",
    "effect": "Passiva · CS 0. Quando subisci danno da una waza di una data Consistenza, fino al prossimo colpo di consistenza diversa la tua Resistenza verso quella consistenza aumenta di un valore pari al tier del colpo subìto. La nuova consistenza sovrascrive la precedente."
  },
  {
    "name": "Hibiki-Gaeshi (響き返し) — Eco di Risposta",
    "rank": null,
    "styleId": "naikan",
    "isPassive": true,
    "description": "Una parte della Jigo-Ka non si dissolve: resta sotto la pelle come l'eco di una campana, e si unirà con la prima nota simile rilasciata dall'analista.",
    "poolId": "hibiki-gaeshi-eco-risposta",
    "effect": "Passiva · CS 0. Finché l'ultima waza subìta ha una data Consistenza, ogni tua waza della medesima consistenza ottiene danno extra pari al tier del colpo subìto. Cambia automaticamente quando subisci una consistenza diversa."
  },
  {
    "name": "Jiga-Hōki (自我放棄) — Ego Traboccante",
    "rank": null,
    "styleId": "naikan",
    "isPassive": true,
    "description": "Quando uno status morde la pelle, la Jigo-Ka si muove con più forza nei nodi; l'arma, sotto la mano, diventa carne della sua carne.",
    "poolId": "jiga-hoki-ego-traboccante",
    "effect": "Passiva · CS 0. Mentre sei sotto almeno uno status, ogni tuo Potenziamento dura +1 turno. L'arma impugnata conta come tuo Costrutto. Puoi trasferire un tuo Potenziamento a un Costrutto (massimo 1) finché lo tocchi; al distacco, permane sul costrutto fino a fine turno."
  },
  {
    "name": "Ittai (一体) — Un Solo Corpo",
    "rank": null,
    "styleId": "naikan",
    "isPassive": true,
    "description": "Il corpo non respinge l'effetto negativo: lo accoglie, lo diluisce nei nodi finché smette di essere distinguibile dal resto.",
    "poolId": "ittai-un-solo-corpo",
    "effect": "Passiva · CS 0. Ogni Depotenziamento (malus di Skiru) su di te dura −1 turno. L'arma conta come tuo Costrutto. Mentre sei depotenziato, puoi estendere il malus a un Costrutto avversario (massimo 1) finché lo tocchi; poi permane fino a fine tuo turno. Tu mantieni comunque il tuo malus."
  },
  {
    "name": "Naka-Kae (中替え) — Scambio del Nucleo",
    "rank": null,
    "styleId": "naikan",
    "isPassive": true,
    "description": "La Jigo-Ka può essere trascinata da una camera all'altra prima che si saldi, ma brucia qualcosa di sé nel transito.",
    "poolId": "naka-kae-scambio-nucleo",
    "effect": "Passiva · CS 0. Durante una tua waza Potenziamento, puoi sostituire una Skiru potenziata con un'altra a scelta. La durata del Potenziamento si riduce di 2 turni."
  },
  {
    "name": "Tobi-Kake (飛び駆け) — Slancio in Carica",
    "rank": null,
    "styleId": "naikan",
    "isPassive": true,
    "description": "La Jigo-Ka delle gambe risale e si accumula nelle spalle, in attesa che lo slancio venga riversato. Al primo contatto, tutta la carica si scarica.",
    "poolId": "tobi-kake-slancio-carica",
    "effect": "Passiva · CS 0. Se hai percorso almeno il doppio del tuo Movimento in metri nel turno prima di colpire, la tua prossima waza a Contatto del turno guadagna +1 tier di danno. Una volta per turno; decade a fine turno."
  },
  {
    "name": "Datsui-Tate (脱衣盾) — Lo Scudo Spogliato",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista si spoglia di tutto ciò che si era costruito addosso e lo proietta appena oltre la pelle, come un samurai depone l'armatura davanti a un altare.",
    "poolId": "datsui-tate-scudo-spogliato",
    "effect": "Attiva · [Scudo][Energetico] · CS 2 · 1 turno. Rimuovi tutti i tuoi Potenziamento attivi e generi uno Scudo con Resistenza pari alla somma dei punti-boost sacrificati. Dura fino a fine prossimo turno o a esaurimento. Il turno seguente non puoi ricevere Potenziamento da alcuna fonte."
  },
  {
    "name": "Datsui-Yumi (脱衣弓) — L'Arco Spogliato",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "Invece di una freccia, l'analista incocca la propria armatura: la Jigo-Ka compressa diventa un dardo che fende l'aria col peso intero della forza appena rinunciata.",
    "poolId": "datsui-yumi-arco-spogliato",
    "effect": "Attiva · [Proiettile][Energetico] · CS 2 · istantanea. Lanciabile solo con almeno 1 Potenziamento attivo. Rimuovi tutti i Potenziamento e generi un proiettile per 15 m; danno = somma dei punti-boost sacrificati. Il turno seguente non puoi ricevere Potenziamento."
  },
  {
    "name": "Hari-Tsume (張り詰め) — Carico Trattenuto",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista spinge la Jigo-Ka contro l'osso come acqua forzata in un tubo già pieno. L'arto diventa una molla in attesa del rilascio.",
    "poolId": "hari-tsume-carico-trattenuto",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 turni. Scegli un arto. Il prossimo colpo a Contatto con quell'arto ottiene Potenziamento +3, ripartito su Binshō e Kairyoku (Indice e danno del colpo). Finché attiva, l'arto non può fare altro. Decade allo scarico o a fine durata."
  },
  {
    "name": "Sen'i-Gake (繊維掛け) — Avvolgimento delle Fibre",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "La Jigo-Ka scende lungo le fibre e le rinforza, avvolgendole come filo intorno a un'anima di legno; il resto del corpo perde lucentezza.",
    "poolId": "seni-gake-avvolgimento-fibre",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 turni. Scegli un settore (Gambe, Braccia o Torace) e un tipo di fibra. Per 2 turni, il Potenziamento si applica solo alle azioni di quel settore: Fibre Bianche → +2 Kairyoku; Fibre Neuromuscolari → +2 Binshō; Fibre Rosse → +2 Nintai."
  },
  {
    "name": "Geki-Ryū (激流) — Corrente Violenta",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista apre tutti i nodi e lascia che la Jigo-Ka li attraversi a una velocità non concepita per essere sostenuta. Poi le camere svuotate restano vuote.",
    "poolId": "geki-ryu-corrente-violenta",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 + 2 turni. Per 2 turni, +3 Binshō. Allo scadere, contraccolpo di −3 Binshō per altri 2 turni."
  },
  {
    "name": "Hada-Yuzuri (肌譲り) — Cessione attraverso la Pelle",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista apre i nodi verso l'esterno non per emettere ma per cedere: lo status trova un nuovo contenitore nella carne avversaria.",
    "poolId": "hada-yuzuri-cessione-pelle",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · istantanea. Colpendo un vivente a Contatto, scegli uno status attivo su di te e lo trasferisci al bersaglio (stessi stack, durata residua); viene rimosso da te."
  },
  {
    "name": "Tsubo-Uchi (壺打ち) — Colpo al Punto",
    "rank": "T1",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista deposita la Jigo-Ka in un singolo punto come un sigillo a freddo; ogni colpo che torna lì pesa più del precedente.",
    "poolId": "tsubo-uchi-colpo-punto",
    "effect": "Attiva · [Nessuna][Contatto] · CS 1 · persistente, decade dopo 2 turni. Colpisci e marchi una zona (Testa, Braccia, Busto o Gambe) con un Punto di Pressione. Ogni tuo colpo successivo sulla stessa zona infligge danno extra crescente: +2, poi +4, poi +6 (cap +6). Decade se la zona non viene colpita per 2 turni. Massimo 1 punto per bersaglio; cambiare zona resetta il contatore."
  },
  {
    "name": "Shōka (昇華) — Sublimazione",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista riconosce lo status che lo affligge non come ferita ma come materiale grezzo, e lo lavora dentro di sé: il dolore diviene forza, la sofferenza testardaggine.",
    "poolId": "shoka-sublimazione",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · persistente finché resta almeno 1 stack. Lanciabile con almeno 2 stack di uno status negativo. Consumi 1 stack; finché ne resta almeno 1, le tue waza Potenziamento ricevono un boost extra che supera la Capacità di Junkan — il dolore è carburante: Incendiato → +2 Kairyoku · Sovraccarico → +2 Binshō · Torpore → +2 Nintai · Appesantimento → +2 Seishin Tanren · Vertigini → +2 Shakai Kaikyū. Quando un Potenziamento così alimentato decade, consuma anche 1 stack residua."
  },
  {
    "name": "Shokushin (触診) — Lettura del Corpo",
    "rank": "T2",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista non colpisce per ferire: colpisce per leggere. Nel punto di contatto la sua Jigo-Ka risale sotto la pelle del bersaglio come una mano che tasta un meccanismo al buio, e per un istante sente dove il corpo è pieno e dove è vuoto, dove la forza si accumula e dove il flusso s'inceppa. È l'introspezione della Via rivolta verso un altro — l'occhio interno che si apre nella carne di chi gli sta davanti.",
    "poolId": "shokushin-lettura-corpo",
    "effect": "Attiva · [Nessuna][Contatto] · CS 3 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Colpisci un bersaglio a [Contatto] e ne leggi il corpo. Ottieni:\n\n— la Skiru più alta e la più bassa;\n\n— se ha [Potenziamenti] attivi e su quale Skiru;\n\n— quali Status possiede;\n\n— una stima sommaria della Jigo-Ka (CS) residua;\n\n— gli Stili di appartenenza e alcune passive (non tutte — quante, lo decide il fato/master).\n\nUn solo bersaglio letto alla volta: leggerne un altro sovrascrive. Il tuo prossimo colpo contro il bersaglio letto infligge +1 tier di danno; il prossimo colpo che subisci da lui approfondisce la Lettura (rivela una passiva in più)."
  },
  {
    "name": "Kōmei (抗命) — Chi lo ha Deciso?",
    "rank": "T4",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista guarda ciò che lo affligge e si rifiuta di subirlo. La Jigo-Ka inverte la corrente nei nodi: il fuoco che lo bruciava ora gli riveste i pugni, il peso che lo inchiodava diventa slancio, le vertigini si fanno furia. Il dolore non viene sopportato e nemmeno solo bruciato come carburante — viene ribaltato, costretto a lavorare per chi avrebbe dovuto piegare.",
    "poolId": "komei-chi-lo-ha-deciso",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 6 · 1/4 · grado richiesto: Kanteikan [K]. Lanciabile solo se hai almeno uno Status negativo attivo. Rimuovi immediatamente tutti i tuoi Status negativi: ognuno si converte nel suo opposto per 3 turni (atto singolo, non mantenimento):\n\n— [Incendiato] / [Emorragia] → il corpo si fa rovente: ogni tuo colpo a [Contatto] applica [Incendiato] (1 stack).\n\n— [Sovraccarico] → l'eccesso diventa carburante: +2 CS rigenerati per turno.\n\n— [Torpore] → la rigidità diventa armatura: +10% mitigazione.\n\n— [Appesantimento] → il peso diventa potenza: i colpi a [Contatto] infliggono +1 tier di danno.\n\n— [Vertigini] → l'instabilità diventa ferocia: ottieni 2 stack di [Ira]."
  },
  {
    "name": "Hōgō (縫合) — Sutura dell'Ego",
    "rank": "T4",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista, che ha imparato a ricucire i propri flussi mentre combatte, posa la mano sul nemico e fa l'opposto: infila la propria Jigo-Ka estranea nei suoi percorsi e li cuce chiusi. Il bersaglio sente un filo che non è suo bloccare ciò che prima scorreva — un punto di sutura nell'Ego, che terrà finché non avrà la forza di strapparlo via.",
    "poolId": "hogo-sutura-ego",
    "effect": "Attiva · [Nessuna][Contatto] · CS 7 · 1/4 · grado richiesto: Shin'enkan [S]. Colpisci un bersaglio a [Contatto] e applichi una Sutura a scelta (max una per bersaglio), per 3 turni:\n\n— Sutura Offensiva: sigilli la Skiru più alta del bersaglio: −3 a quella Skiru (riduce Indice e danno delle azioni che la usano). Non può essere potenziata; se lo era, perde il [Potenziamento] e non può acquisirne per la durata.\n\n— Sutura di Stile: sigilli una passiva del bersaglio (a tua scelta fra quelle rivelate dalla Lettura): non può usarla per la durata.\n\n— Sutura Elementale: congeli tutti gli Status attivi sul bersaglio: non possono essere rimossi né decadere, restano bloccati al livello di stack attuale.\n\nRottura: il bersaglio può spezzare la Sutura spendendo 4 CS e dedicando 1 Quarto intero alla purificazione. Finché non lo fa, l'effetto persiste."
  },
  {
    "name": "Ishi (意志) — Volere",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "Basta volerlo perché ciò che esce dalla mano cambi natura a metà volo.",
    "poolId": "ishi-volere",
    "effect": "Passiva · CS 1 per uso. Cambi la Consistenza di una tua waza durante l'esecuzione (non Nulla né Elementale). Se la waza è già Elementale, puoi cambiarne solo l'elemento."
  },
  {
    "name": "Kyōsei-Hen (強制変) — Mutazione Imposta",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "Il mondo intorno cede al tuo gesto: ciò che era duro si fa altro.",
    "poolId": "kyosei-hen-mutazione-imposta",
    "effect": "Passiva · CS 1 per uso. Cambi la Consistenza di Costrutti entro 8 m (non Nulla né Elementale); la modifica dura 3 turni."
  },
  {
    "name": "Genso-Ka (元素化) — Elementalizzazione",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "Un tocco di volontà e la tecnica si veste del tuo elemento.",
    "poolId": "genso-ka-elementalizzazione",
    "effect": "Passiva · CS 1 per uso. Cambi la Consistenza di una tua waza in esecuzione in Elementale, elemento a scelta. Non applicabile a waza Nulla o già Elementali."
  },
  {
    "name": "Renkin-Soku (錬金則) — Regole Alchemiche",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "La legge dell'oscillazione: nessuno stato due volte di fila.",
    "poolId": "renkin-soku-regole-alchemiche",
    "effect": "Passiva · CS 0, cuore di Yuragi. Non puoi usare due waza con la stessa Consistenza consecutivamente. Ogni cambio conferisce l'effetto alchemico della nuova consistenza."
  },
  {
    "name": "Kenja no Ishi (賢者の石) — Pietra Filosofale",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "Il costrutto si comprime, vibra, si crepa — e sotto le crepe affiora un cristallo rosso sangue.",
    "poolId": "kenja-no-ishi-pietra-filosofale",
    "effect": "Passiva · CS 1. Un tuo Costrutto Solido muta in 2 turni in un cristallo rosso sangue. Distrutto a contatto, concede +2 tier alla tua prossima waza."
  },
  {
    "name": "Rōei (漏洩) — Scia Incontrollata",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "Trasformare lascia residui: una scia del tuo elemento che avvelena il terreno.",
    "poolId": "roei-scia-incontrollata",
    "effect": "Passiva · CS 0. Quando cambi una tua waza Energetica in Elementale, lungo la sua gittata resta una scia gassosa dell'elemento (stesse dimensioni della waza) per 2 turni. Chi finisce il turno o passa 2 quarti nella scia subisce +1 stack dello status."
  },
  {
    "name": "Hannō (反応) — Reazione di Consistenza",
    "rank": null,
    "styleId": "hensei",
    "isPassive": true,
    "description": "Due nature che non dovrebbero toccarsi, e il campo reagisce.",
    "poolId": "hanno-reattivita-consistenza",
    "effect": "Passiva · CS 0. Quando una tua waza con Consistenza definita colpisce una zona di consistenza diversa (scia, zona, Costrutto), scatta la reazione corrispondente (Fuoco+Gassoso, Fulmine+Liquido, Acqua+Solido, Aria+Sonoro, Gravità+Energetico)."
  },
  {
    "name": "Wana (罠) — Trappola!",
    "rank": "T1",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Ciò che era già lì, all'improvviso, è qualcos'altro.",
    "poolId": "wana-trappola",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Cambi la Consistenza di una tua tecnica già in campo da almeno 1 turno in quella di un Elemento. La modifica dura 1 turno."
  },
  {
    "name": "Ihen (異変) — Aberrazione",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "L'arto cede il posto all'arma: carne che diventa costrutto.",
    "poolId": "ihen-aberrazione",
    "effect": "Attiva · [Potenziamento][Nulla] · Tier base 2 · CS 2 · 1/4. Sostituisci un tuo arto con un Costrutto brandito come arma per 4 turni (danno = tier). Se il costrutto viene rotto, l'arto resta inutilizzabile."
  },
  {
    "name": "Bōgai (妨害) — Disturbo",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "La tua energia si fa ronzio e acceca i sensi altrui.",
    "poolId": "bogai-disturbo",
    "effect": "Attiva · [Emanazione][Energetica] · CS 2 · 1/4. Rendi la tua Jigo-Ka un ronzio per 3 turni, propagato per 8 m: interferisce con la Jigo-Ka altrui, disturbando le abilità sensoriali basate su di essa. Finché ronzi, ogni tuo colpo a contatto riduce di 2 CS il bersaglio."
  },
  {
    "name": "Oboro (朧) — Velo Onirico",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Un velo invisibile, e ciò che vi sta sotto smette di mostrarsi al mondo.",
    "poolId": "oboro-velo-onirico",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4. Crei un velo invisibile di 4×8 m, posabile ovunque: nasconde le vere proprietà di ciò che copre completamente. Solo la tua Jigo-Ka può interagirvi. Permane 3 turni."
  },
  {
    "name": "Bōchō (膨張) — Espansione Instabile",
    "rank": "T1",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Cresce oltre il suo limite, e per questo si spezza.",
    "poolId": "bocho-espansione-instabile",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Un Costrutto entro 8 m sale di una taglia per 1 turno, poi si rompe."
  },
  {
    "name": "Kōkan (交換) — Scambio di Consistenza",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Il muro diventa nebbia, la nebbia diventa muro.",
    "poolId": "kokan-scambio-consistenza",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4. Due oggetti o Costrutti entro 8 m si scambiano la Consistenza per 3 turni (es. muro Solido ↔ nube Gassosa). Richiede consistenze definite; non applicabile a costrutti impugnati da terzi."
  },
  {
    "name": "Sōkotsu (相崩) — Fusione Instabile",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Due stati in un istante, e lo stress li fa esplodere.",
    "poolId": "sokotsu-fusione-instabile",
    "effect": "Attiva · [Emanazione a distanza] · Tier base 3 · CS 3 · 1/4. Forzi un Costrutto entro 8 m a oscillare rapidamente tra due stati (es. Solido→Gassoso→Solido): lo stress lo fa esplodere in un'area di 3 m, danno = tier a ogni bersaglio. I frammenti hanno la consistenza finale della transizione."
  },
  {
    "name": "Shoku (蝕) — Corrosione",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Lenta, inesorabile: la materia si arrende al tuo elemento.",
    "poolId": "shoku-corrosione",
    "effect": "Attiva · [Contatto] · CS 2 · 1/4. Tocchi un Costrutto o uno Scudo e ne forzi gradualmente la Consistenza verso Elementale: per 3 turni perde 1 tier di Resistenza a turno, poi diventa Elementale col tuo elemento. Se distrutto durante la transizione, rilascia lo status in 3 m."
  },
  {
    "name": "Tenka (転化) — Dalla Padella alla Brace",
    "rank": "T1",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Lo stesso male, un volto nuovo.",
    "poolId": "tenka-dalla-padella-alla-brace",
    "effect": "Attiva · [Nessuna][Contatto] · CS 1 · 1/4. Tocchi un bersaglio con almeno 1 stack di status elementale e ne trasmuti la natura: lo status scelto diventa un altro status a tua scelta, con lo stesso numero di stack."
  },
  {
    "name": "Shokubai (触媒) — Catalisi",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "Ogni mutazione, da ora, lascia il segno.",
    "poolId": "shokubai-catalisi",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 1/4. Per 3 turni, ogni volta che cambi la Consistenza di una tua waza in esecuzione (via Ishi, Genso-Ka, ecc.), la waza applica automaticamente +1 stack dello status della nuova consistenza."
  },
  {
    "name": "Nagori (名残) — Principio di Instabilità",
    "rank": "T2",
    "styleId": "hensei",
    "isPassive": false,
    "description": "L'analista non lascia mai del tutto uno stato: ogni forma che abbandona resta aggrappata alla successiva come un'ombra che il corpo non ha finito di scrollarsi di dosso. La waza si smantella e si ricostruisce, imperfetta, attraversata da tensioni visibili — e nel passaggio trascina con sé un residuo di ciò che era un istante prima, il respiro doppio di Retsuja, ciò che è e ciò che ha appena smesso di essere.",
    "poolId": "nagori-principio-instabilita",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 3 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Attivi il Principio di Instabilità su di te. Per 3 turni, ogni volta che cambi la [Consistenza] di una tua waza, questa guadagna un effetto collaterale basato sulla consistenza di partenza (quella che abbandoni) — in aggiunta all'effetto alchemico Yuragi della consistenza in arrivo:\n\n— [Solido] → +1 tier di danno\n\n— [Liquido] → +4 m di gittata\n\n— [Gassoso] → +1 turno di permanenza (se ha durata)\n\n— [Sonoro] → ignora 1 tier di Resistenza e di [Scudi]\n\n— [Elementale] → applica +1 stack dello status elementale abbandonato\n\n— [Energetico] → la waza ottiene priorità (vince gli scambi in parità d'Indice)"
  },
  {
    "name": "Igyō-Rensei (異形錬成) — Insegnamenti di Tucker",
    "rank": "T3",
    "styleId": "hensei",
    "isPassive": false,
    "description": "L'analista posa la mano su una forma e la costringe a tradire sé stessa. Non un cambio docile: una trasmutazione aberrante, dove il costrutto si smantella con violenza e si ricompone nel nuovo stato portando il marchio di chi l'ha rifatto. Ciò che era saldo si liquefà e cola, ciò che aveva forma si disperde in nube, ciò che taceva esplode. È l'alchimia che non ripara: deforma.",
    "poolId": "igyo-rensei-insegnamenti-tucker",
    "effect": "Attiva · [Contatto] · CS 5 · 1/4 · grado richiesto: Kanteikan [K]. Tocchi un [Costrutto] o [Scudo] (tuo o nemico) e ne forzi la [Consistenza]: il bersaglio assume istantaneamente quella consistenza con tutte le proprietà associate. La transizione è violenta e produce un effetto diverso secondo la trasformazione:\n\n— → [Solido]: +2 tier di Resistenza, ma diventa [Immobile] (non spostabile da Telecinesi/Furia — Ayatsuri, Hajiki, Hikiyose) per 1 turno.\n\n— → [Liquido]: perde metà Resistenza e si espande, coprendo una zona [Liquido] a terra di raggio 4 m.\n\n— → [Gassoso]: perde forma e si disperde in una nube di raggio 4 m per 2 turni.\n\n— → [Elementale]: esplode in raggio 4 m applicando lo status elementale affine dell'analista (2 stack) a ogni bersaglio nell'area; il costrutto/scudo originale è distrutto."
  },
  {
    "name": "Chikuden (蓄電) — Batteria",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "L'analista lascia parte di sé dentro un oggetto: una carica latente che aspetta solo di essere ripresa — o di esplodere.",
    "poolId": "chikuden-batteria",
    "effect": "Passiva · CS 0, applica il tag Batteria. Depositi fino a 5 CS in un tuo Costrutto, che le trattiene a lungo; le riprendi, in tutto o in parte, toccandolo. È la keystone di tutte le interazioni con il tag Batteria."
  },
  {
    "name": "Gyakuryū (逆流) — Riflusso",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Ciò che porta la tua energia, torna a te per la via più rapida.",
    "poolId": "gyakuryu-riflusso",
    "effect": "Passiva · CS 0. Richiami a te un Costrutto permeato della tua energia: torna in mano per la traiettoria più veloce. Armi piccole o medie tornano istantaneamente; oggetti più grandi a discrezione della distanza e delle circostanze."
  },
  {
    "name": "Teishūha (低周波) — Onda Bassa",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Una pulsazione invisibile esplora lo spazio e ti rivela ogni fonte d'energia.",
    "poolId": "teishuha-onda-bassa",
    "effect": "Passiva · CS 0. Espandi una sfera d'energia invisibile per 8 m: rivela ogni fonte di Jigo-Ka nel raggio (chi è investito sente un lieve tepore). Usabile attraverso un tuo Costrutto entro 8 m; se ha il tag Batteria, la gittata raddoppia."
  },
  {
    "name": "Kanshi (監視) — Occhio Remoto",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Chiudi gli occhi, e vedi da altrove.",
    "poolId": "kanshi-occhio-remoto",
    "effect": "Passiva · CS 0. Depositi energia in un tuo Costrutto, che la trattiene un paio d'ore; chiudendo entrambi gli occhi ottieni vista e udito completi dal punto di vista del Costrutto."
  },
  {
    "name": "Fuantei (不安定) — Deflagrazione Instabile",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Nessun colpo si limita a colpire: lascia dietro di sé un'eco che esplode.",
    "poolId": "fuantei-deflagrazione-instabile",
    "effect": "Passiva · CS 0 (+1 CS al lancio). Al lancio paghi +1 CS per un effetto aggiuntivo secondo la categoria: Proiettile → esplosione all'impatto (stessa consistenza, 3 m); Raggio → colpo concatenato a un altro bersaglio entro 6 m; Emanazione, Propagazione Conica o Emissione a distanza → +4 m di gittata."
  },
  {
    "name": "Kaatsu (加圧) — Sovrapressione",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Più trattieni, più ciò che esce fa male.",
    "poolId": "kaatsu-sovrapressione",
    "effect": "Passiva · CS 0. È l'innesco della meccanica Atsuryoku: quando sei in Pressione (CS ≥ 12), la prossima waza Emanazione, Propagazione o Energetica ottiene +1 tier. Cumulabile con altri bonus."
  },
  {
    "name": "Kantsū (貫通) — Calibro Pesante",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Il raggio non si ferma: trapassa e prosegue.",
    "poolId": "kantsu-calibro-pesante",
    "effect": "Passiva · CS 0. Una tua waza Raggio non si arresta al primo bersaglio: prosegue infliggendo −25% di danno a ogni bersaglio successivo."
  },
  {
    "name": "Sorashi (逸らし) — Deviazione",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "L'onda non para né schiva: scosta.",
    "poolId": "sorashi-deviazione",
    "effect": "Passiva · CS 0 (costo variabile). Su una tua Propagazione Conica o Emanazione, paghi +1 CS per deviare ogni oggetto di taglia Piccola incontrato, +3 CS per allontanare uno di taglia Media. Non è parata né schivata: è deviazione, con esiti variabili."
  },
  {
    "name": "Hōwa (飽和) — Saturazione",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Il secondo colpo trova la breccia aperta dal primo.",
    "poolId": "howa-saturazione",
    "effect": "Passiva · CS 0. Se colpisci lo stesso bersaglio con 2 waza nello stesso turno, la seconda ottiene +1 tier di danno."
  },
  {
    "name": "Fukitobashi (吹き飛ばし) — Spinta d'Urto",
    "rank": null,
    "styleId": "hado",
    "isPassive": true,
    "description": "Ogni proiettile è anche un pugno d'aria che spazza via.",
    "poolId": "fukitobashi-spinta-urto",
    "effect": "Passiva · CS 0. Le tue waza Proiettile creano all'impatto una zona di 3 m che spinge via di 4 m chiunque sia a gittata."
  },
  {
    "name": "Tanraku (短絡) — Corto Circuito",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'analista riversa la sua energia in un oggetto fino a renderlo una bomba.",
    "poolId": "tanraku-corto-circuito",
    "effect": "Attiva · [Energetiche][Contatto] · Tier base 2 · CS 2 · 1/4. Sovraccarichi un Costrutto o oggetto finché diventa instabile; a comando o per forte impatto esplode: danno = tier in 3 m. Se ha il tag Batteria, l'esplosione si allarga di 2 m; se colpisce un altro Batteria, quello esplode a metà raggio."
  },
  {
    "name": "Hōsha (放射) — Raffica Psichica",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "Dai palmi e dalle piante, l'energia erompe in una scarica di colpi.",
    "poolId": "hosha-raffica-psichica",
    "effect": "Attiva · [Proiettile][Energetico] · Tier base 2 · CS 2 · 1/4. Liberi 2 Proiettili Energetici per 15 m, danno = tier ciascuno."
  },
  {
    "name": "Tameru (溜め) — Impeto Trattenuto",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "Comprime, comprime ancora — e poi cede.",
    "poolId": "tameru-impeto-trattenuto",
    "effect": "Attiva · [Emanazione][Energetica] · Tier base 2 · CS 2 · 1/4 + carica. Comprimi la Jigo-Ka fino a 2 turni, rilasciabile in qualsiasi momento, in una forza repulsiva per 5 m. Nello stesso turno interrompe o compromette i movimenti attorno, senza danno; al secondo turno è più forte, danno = tier. Se vieni colpito mentre carichi, l'impeto si rilascia prematuramente e ne sei vittima anche tu."
  },
  {
    "name": "Hōden (放電) — Scarica d'Impatto",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'energia accumulata in un arto si scarica al contatto, sfondando tutto.",
    "poolId": "hoden-scarica-impatto",
    "effect": "Attiva · [Contatto][Energetica] · Tier base 2 · CS 2 · 1/4. Carichi una parte del corpo; all'impatto scarichi un'onda d'urto per 4 m che danneggia (= tier) e compromette la stabilità, sfondando pareti, costrutti, ossa. Se non scarichi entro il turno, quella parte del corpo subisce danno = tier."
  },
  {
    "name": "Mugen no Tsukai (夢幻の使い) — Famiglio Onirico",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'analista scinde da sé un frammento vivo della propria energia.",
    "poolId": "mugen-no-tsukai-famiglio-onirico",
    "effect": "Attiva · [Costrutto][Energetico] · Tier base 2 · CS 2 · 1/4. Dai vita a un famiglio (animale, taglia media) per 3 turni; durante, non guadagni CS a inizio turno. Percorre 8 m e attacca una volta per turno (danno = tier). Se acquisisce un elemento, lo mantiene fino a fine tecnica."
  },
  {
    "name": "Rensa-Baku (連鎖爆) — Detonazione a Catena",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "Tutto ciò che porta la sua firma esplode nello stesso istante.",
    "poolId": "rensa-baku-detonazione-catena",
    "effect": "Attiva · [Emanazione a distanza][Energetica] · Tier base 3 · CS 3 · 1/4. Selezioni fino a 3 tuoi Costrutti con tag Batteria a vista: esplodono simultaneamente, ognuno come Tanraku. Le zone sovrapposte subiscono danni aumentati."
  },
  {
    "name": "Kasan (加算) — Carica Detonante",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "Un colpo che non ferisce: aggrava.",
    "poolId": "kasan-carica-detonante",
    "effect": "Attiva · [Potenziamento][Nulla] · Tier base 2 · CS 2 · 1/4. La prossima waza dà al bersaglio +1 stack di uno status che già possiede, a tua scelta. Se il bersaglio ha almeno 5 stack di uno status, infliggi danno = tier."
  },
  {
    "name": "Byō (鋲) — Ancora Psionica",
    "rank": "T1",
    "styleId": "hado",
    "isPassive": false,
    "description": "Un punto fisso nello spazio a cui i tuoi colpi obbediscono.",
    "poolId": "byo-ancora-psionica",
    "effect": "Attiva · [Costrutto][Energetico] · CS 1 · 1/4. Imprimi su una superficie un piccolo Costrutto invisibile. Per 3 turni, le tue waza Proiettile o Raggio possono sceglierlo come bersaglio finale, aggirando gli ostacoli entro i limiti di gittata."
  },
  {
    "name": "Maikomi (埋め込み) — Innesto Forzato",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "Pianti una carica e scegli tu quando il mondo cede.",
    "poolId": "maikomi-innesto-forzato",
    "effect": "Attiva · [Emanazione a distanza][Energetica] · Tier base 3 · CS 3 · 1/4. Tocchi un bersaglio (vivente, Costrutto o superficie) e vi innesti una carica. Per 3 turni puoi detonarla, una sola volta: danno = tier in 3 m dal punto d'innesto. Se il bersaglio ha il tag Batteria, l'esplosione è +1 tier."
  },
  {
    "name": "Kunō-Baku (苦悩爆) — Implosione della Sofferenza",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "Tutto il dolore inflitto, restituito in un solo lampo.",
    "poolId": "kunou-baku-implosione-sofferenza",
    "effect": "Attiva · [Emanazione a distanza][Energetica] · Tier base 3 · CS 3 · 1/4. Scegli un bersaglio entro 8 m con almeno 3 stack di status, qualsiasi combinazione: rimuovi tutte le stack e le converti in un'esplosione centrata sul bersaglio, danno = tier per stack rimossa, area 3 m."
  },
  {
    "name": "Tōshi (投資) — Investimento Energetico",
    "rank": "T2",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'analista smette di spendere e comincia a versare. Ogni gesto, ogni colpo, lascia una parte di sé in un serbatoio che porta sotto la pelle: le venature di luce si moltiplicano, il respiro si fa corto, il corpo si gonfia di una pressione che non scarica — la trattiene, la conserva, la fa fruttare. Poi, in un solo istante scelto, riscuote tutto in un'unica onda nera.",
    "poolId": "toshi-investimento-energetico",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 (apertura) · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Apri un [Investimento] su di te. Per 3 turni, ogni quarto e a ogni lancio di waza puoi spostare CS dal tuo serbatoio nell'Investimento (riserva separata: non conta verso l'Overheat). In qualsiasi momento entro la durata puoi riscuotere rilasciando tutto l'Investimento insieme a una singola waza: questa ottiene +2 danno (piatto) e +1 m di gittata per ogni CS investito.\n\n↳ Se vieni reso incosciente, o passi un intero turno senza versare nell'Investimento, lo perdi."
  },
  {
    "name": "Shakkin (借金) — Indebitamento",
    "rank": "T3",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'analista posa il palmo sul bersaglio e gli inietta ciò che nessuno ha chiesto: un prestito forzato di Jigo-Ka nera che si annida nella carne e marchia la pelle del suo simbolo. Il debito non sta fermo — cresce a ogni alba, come ogni debito fa. L'unico modo per estinguerlo è restituirlo all'usuraio, colpo su colpo. Ma se l'analista decide di riscuotere, ciò che era stato prestato torna indietro tutto insieme, e l'interesse si paga in fuoco.",
    "poolId": "shakkin-indebitamento",
    "effect": "Attiva · [Contatto] → [Emanazione a Distanza][Energetica] · CS 5 · 1/4 · grado richiesto: Kanteikan [K]. Colpisci un bersaglio a [Contatto] e gli imponi un [Debito] (status): inietti 2 stack iniziali. Per 3 turni:\n\n— Interessi: all'inizio di ogni tuo turno, il Debito cresce di +1 stack (max 6);\n\n— Restituzione: ogni volta che il bersaglio ti colpisce con una waza a [Contatto], il Debito cala di 1 stack.\n\nRiscossione (a comando, 1/4, oppure automatica alla scadenza): tutte le stack si convertono in un'esplosione [Energetico][Emanazione a Distanza] centrata sul bersaglio, raggio 3 m, danno = 5 per stack. Massimo un Debito per bersaglio. Se l'analista è reso incosciente, il Debito si dissolve."
  }
] as const
