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
    "rank": "T1",
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
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista materializza un'asta di materia compressa che si allunga rapidamente in avanti ruotando su sé stessa come una punta da trapano. La trivella cresce nella direzione scelta, fora il primo bersaglio che incontra e poi si dissolve. È il raggio più meccanico del repertorio: non brucia né lacera, perfora.",
    "poolId": "generiche-rasui-trivella-psionica",
    "effect": "Attiva · [Raggio][Solido] · Tier base 2 · CS 2 · 1/4. Una trivella rotante si estende per 8 m in linea retta; danno = tier (perforante) al primo bersaglio, poi scompare."
  },
  {
    "name": "Funki (噴気) — Bollore Onirico",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista rilascia un'eruzione istantanea di gas ad altissima pressione in una direzione a scelta. Il getto si estende in linea retta come un soffio violento, investe ciò che incontra e lo respinge per la forza stessa con cui esce. Più che ferire, sfonda e allontana.",
    "poolId": "generiche-funki-bollore-onirico",
    "effect": "Attiva · [Raggio][Gassoso] · Tier base 2 · CS 2 · 1/4. Getto di gas in linea retta per 10 m; danno = tier e sbalzo di 4 m indietro al primo bersaglio (lungo la direzione del getto)."
  },
  {
    "name": "Suishin (水針) — Acupressione Liquida",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista proietta un getto di liquido ultra-concentrato ad altissima pressione, sottile e preciso come un ago. Non è un'ondata: è un filo d'acqua tagliente che incide il primo bersaglio lungo la linea di tiro. La ferita che lascia continua a sanguinare.",
    "poolId": "generiche-suishin-acupressione-liquida",
    "effect": "Attiva · [Raggio][Liquido] · Tier base 2 · CS 2 · 1/4. Filo di liquido in linea retta per 15 m; danno = tier al primo bersaglio e applica lo status [Emorragia]."
  },
  {
    "name": "Fukyōon (不協音) — Dissonanza",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista emette un fascio di onde sonore concentrate a una frequenza distruttiva, indirizzandolo in linea retta. Il fascio non è un punto ma una colonna di suono che investe il primo bersaglio e tutto ciò che gli sta stretto attorno. Dove passa, l'aria stessa vibra fino a far male.",
    "poolId": "generiche-fukyoon-dissonanza",
    "effect": "Attiva · [Raggio][Sonoro] · Tier base 2 · CS 2 · 1/4. Fascio sonoro in linea retta per 15 m, raggio 2 m; danno = tier al primo bersaglio investito."
  },
  {
    "name": "Hibana (火花) — Scintilla d'Ego",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista proietta un fascio elementale concentrato in linea retta, lanciato ad alta velocità verso il bersaglio. Veste la Jigo-Ka del proprio elemento e la spara come un dardo di luce densa. Veloce e lineare, è il raggio elementale di base da cui partono le varianti più elaborate.",
    "poolId": "generiche-hibana-scintilla-ego",
    "effect": "Attiva · [Raggio][Energetico] · Tier base 2 · CS 2 · 1/4. Fascio elementale in linea retta per 20 m; danno = tier al primo bersaglio."
  },
  {
    "name": "Sandan (散弾) — Shrapnel Psichico",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista materializza un ventaglio di schegge solide e lo libera tutto in una volta in un cono davanti a sé. Le schegge si aprono a raggiera coprendo l'intero arco frontale e colpiscono chiunque vi si trovi. È una tecnica d'area grezza, fatta per saturare lo spazio vicino più che per centrare un singolo nemico.",
    "poolId": "generiche-sandan-shrapnel-psichico",
    "effect": "Attiva · [Propagazione Conica][Solido] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio nell'area."
  },
  {
    "name": "Bakufū (爆風) — Decompressione Onirica",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista rilascia di colpo il gas compresso accumulato nel corpo, scaricandolo in un cono frontale. L'onda di pressione investe tutta l'area davanti a lui, colpendo e spingendo via chiunque ne sia preso. Pulisce lo spazio immediato tanto quanto lo danneggia.",
    "poolId": "generiche-bakufu-decompressione-onirica",
    "effect": "Attiva · [Propagazione Conica][Gassoso] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio nell'area e sbalzo di 4 m indietro."
  },
  {
    "name": "Nenmō (粘網) — Ragnatela di Mercurio",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista proietta un ventaglio di liquido viscoso e denso, simile a una rete lanciata in un cono davanti a sé. Il liquido investe i bersagli e ne impasta i movimenti, poi ricade a terra restando come una pozza appiccicosa che continua a intralciare chi vi cammina. Non uccide: rallenta, blocca, tiene fermo abbastanza a lungo.",
    "poolId": "generiche-nenmo-ragnatela-mercurio",
    "effect": "Attiva · [Propagazione Conica][Liquido] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio e applica [Rallentato] (−2 m Movimento) per 2 turni. Il liquido resta a terra come zona viscosa per 2 turni: chi la tocca o vi termina il turno subisce lo stesso rallentamento."
  },
  {
    "name": "Kyōkan (叫喚) — Urlo del Lobo Frontale",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista emette un'onda sonora concentrata in un cono frontale, un urlo psichico che non passa per la gola ma direttamente per la Jigo-Ka. Il suono investe tutti i bersagli davanti a lui, e chi lo incassa perde l'equilibrio e l'orientamento. Più che ferire la carne, scuote la mente.",
    "poolId": "generiche-kyokan-urlo-lobo-frontale",
    "effect": "Attiva · [Propagazione Conica][Sonoro] · Tier base 2 · CS 2 · 1/4. Cono frontale di 6 m; danno = tier a ogni bersaglio e applica [Vertigini] (1 stack)."
  },
  {
    "name": "Kyōshin (共振) — Frequenza Disarmante",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista fa vibrare le proprie ossa a una frequenza precisa e la trasmette al bersaglio attraverso il contatto fisico. La vibrazione si annida nel corpo altrui e ne disturba il flusso: la prossima tecnica gli costerà più fatica del dovuto. E se il bersaglio non la scarica usando una waza, la frequenza trattenuta finisce per ferirlo da sola.",
    "poolId": "generiche-kyoshin-frequenza-disarmante",
    "effect": "Attiva · [Contatto][Sonoro] · CS 2 · 1/4. A contatto, impianti una vibrazione: la prossima waza del bersaglio costa +2 CS. La vibrazione svanisce quando il bersaglio usa una waza; se passa un suo intero turno senza usarne, subisce danno = tier."
  },
  {
    "name": "Dendō (伝導) — Propagazione Acustica",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista scarica un'onda sonora non nell'aria ma nella materia solida su cui poggia — pavimento, muro, soffitto — e la fa correre lungo la superficie in un cerchio che si allarga. Chiunque sia in contatto con quella superficie lungo il percorso viene raggiunto dalla vibrazione. Chi si è staccato da terra, invece, non sente nulla.",
    "poolId": "generiche-dendo-propagazione-acustica",
    "effect": "Attiva · [Emanazione][Sonoro] · Tier base 2 · CS 2 · 1/4. Un'onda si propaga lungo una superficie solida per 8 m in cerchio; danno = tier a ogni bersaglio a contatto con la superficie lungo il percorso. Non si propaga nell'aria."
  },
  {
    "name": "Hankyō (反響) — Eco dell'Astio",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista sceglie un punto a distanza e vi fa detonare un'esplosione sonora che si diffonde in ogni direzione. Non parte da lui ma dal punto designato, raggiungendo bersagli che un cono frontale non toccherebbe. Chi ne è investito incassa il colpo e ne esce stordito.",
    "poolId": "generiche-hankyo-eco-astio",
    "effect": "Attiva · [Emanazione a distanza][Sonoro] · Tier base 2 · CS 2 · 1/4. Scegli un punto entro 12 m: esplosione sonora in tutte le direzioni, raggio 4 m; danno = tier e [Vertigini] (1 stack) a ogni bersaglio nell'area."
  },
  {
    "name": "Kihō (気泡) — Bolla Pressurizzata",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista comprime gas psichico in una bolla sferica davanti a sé, una membrana tesa che fa da scudo finché regge. Quando cede, però, non si limita a rompersi: il gas trattenuto si libera di colpo in un'esplosione di pressione che respinge tutto ciò che le sta intorno. Una difesa che, nel rompersi, contrattacca.",
    "poolId": "generiche-kiho-bolla-pressurizzata",
    "effect": "Attiva · [Scudo][Gassoso] · CS 2 · 1/4. Generi una bolla (∅ ~2 m) con Resistenza = valore-tier. Quando viene distrutta, il gas si rilascia sbalzando di 4 m indietro tutto ciò che si trova entro 3 m dal punto di rottura."
  },
  {
    "name": "Suimaku (水幕) — Velo Liquido",
    "rank": "T1",
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
    "effect": "Il [Tōrō]: designi un'arma o un oggetto impugnato. Finché lo tocchi, non può essere bersaglio di waza di Manipolazione o Trasformazione altrui, e funge da origine per lanciare le tue waza."
  },
  {
    "name": "Michishirube (道標) — Luce Guida",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "La fiamma non scalda soltanto: indica. Punti il Tōrō e la luce traccia nell'aria la via che il colpo dovrà percorrere, limpida come la corona dell'albero della Vita. È Meiju che parla: la chiarezza che precede il gesto.",
    "poolId": "michishirube-luce-guida",
    "effect": "Impugnando il [Tōrō], le tue waza [Energetiche] a [Contatto] diventano [Energetiche] a [Proiettile], con origine dal Tōrō che usi per mirare. Gittata = 8 m + 1 m per punto di Seimitsu."
  },
  {
    "name": "Shōka (小火) — Fiamma Docile",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "Chi conosce la propria fiamma non la spreca. L'analista la piega, la addomestica, la fa bruciare lenta. Ciò che prima costava, ora basta sussurrarlo.",
    "poolId": "shoka-fiamma-docile",
    "effect": "Ogni waza lanciata attraverso il [Tōrō] costa −1 CS, minimo 1."
  },
  {
    "name": "Nokuribi · Cenere Rimasta (残り火)",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "L'impronta di un elemento non sparisce nel momento in cui la tecnica si esaurisce: resta depositata sulle pareti del Tōrō come brina, come bruciatura, come carica statica. La tecnica successiva la porta con sé, anche se era pensata per essere qualcosa di diverso.",
    "poolId": "nokuribi-fuoco-residuo",
    "effect": "Il [Tōrō] trattiene il residuo dell'ultima waza [Elementale] lanciata fino alla fine del turno successivo. Durante questo periodo, la prima waza [Energetica] lanciata dal Tōrō acquisisce l'elemento trattenuto e ne applica lo status di riferimento al bersaglio. Dopo il primo utilizzo, il residuo si consuma."
  },
  {
    "name": "Kintsugi · Legame dei Frammenti (金継ぎ)",
    "rank": null,
    "styleId": "toka",
    "isPassive": true,
    "description": "Un'arma rotta è ancora un'arma finché l'analista non rinuncia a tenerla. La Jigo-Ka che aveva già impregnato la materia non è andata da nessuna parte — basta richiamarla, e le crepe si riempiono di qualcosa che non è il materiale originale ma regge lo stesso.",
    "poolId": "kintsugi-legame-dei-frammenti",
    "effect": "Se nel turno precedente un'arma impugnata o un [Costrutto] dell'analista è stato distrutto, l'analista può richiamare la Jigo-Ka residua e ricrearlo. L'oggetto ricreato dura fino alla fine del turno successivo. Non applicabile a ciò che è stato distrutto da energia puramente psichica."
  },
  {
    "name": "Kakuchō · Espansione (拡張)",
    "rank": "T1",
    "styleId": "toka",
    "isPassive": false,
    "description": "La Jigo-Ka forza la struttura del Tōrō oltre la sua forma. Un coltello che si allunga in spada lo fa in modo grezzo — il profilo si distende, non si rifà da capo. L'arma porta i segni di quella tensione per tutto il tempo che dura.",
    "poolId": "kakucho-espansione-della-luce",
    "effect": "Per 1 turno, il [Tōrō] sale di una taglia (mantiene il tipo di danno originale). I colpi a [Contatto] inflitti con esso ottengono +1 tier di danno e +1 m di gittata."
  },
  {
    "name": "Kaeribi · Richiamo (返し火)",
    "rank": "T1",
    "styleId": "toka",
    "isPassive": false,
    "description": "Il Tōrō scagliato o perduto sul campo non è uno strumento abbandonato — è ancora suo. Basta aprire la mano nella sua direzione perché la Jigo-Ka rimasta nell'oggetto risponda, riportandolo.",
    "poolId": "kaeribi-fiamma-del-ritorno",
    "effect": "L'analista richiama a sé un'arma entro 8 m, a patto che sia ancora un proprio [Costrutto] integro. L'arma vola direttamente in mano. Se l'arma è un [Tōrō] attivo, la gittata massima sale a 16 m."
  },
  {
    "name": "Fuin no Hi · Sigillo (封印の火)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "L'analista comprime una tecnica dentro il Tōrō invece di lanciarla. L'arma non fa nulla di visibile — vibra appena, come se contenesse qualcosa di trattenuto. Poi arriva il momento in cui non la contiene più.",
    "poolId": "fuin-no-hi-sigillo-della-fiamma",
    "effect": "L'analista sigilla una waza a scelta dentro il [Tōrō] (la tecnica viene comunque pagata al momento del sigillo). La waza rimane dormiente per un massimo di 3 turni e può essere rilasciata in tre modi: all'impatto fisico del Tōrō su un bersaglio; a comando dell'analista come [Proiettile][Energetico] con le proprietà della waza sigillata; oppure si libera automaticamente allo scadere dei 3 turni come [Emanazione] centrata sul Tōrō. In tutti i casi il danno è quello della waza originale."
  },
  {
    "name": "Tomoshibi no Ato · Traccia (灯火の跡)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "Il fendente del Tōrō non finisce dove finisce il colpo. Nello spazio attraversato rimane qualcosa di teso, una linea che non si vede bene ma che si sente attraversando — come toccare un filo nel buio che non sapevi fosse lì.",
    "poolId": "tomoshibi-no-ato-traccia-della-luce",
    "effect": "L'analista sferra un fendente con il [Tōrō], tracciando una linea di energia lunga 8 m che permane in campo per 3 turni. Chiunque la attraversi subisce danno pari al T2 [Energetico]. L'analista può mantenere attiva una sola traccia alla volta — una seconda traccia cancella la precedente."
  },
  {
    "name": "Kyōmei · Risonanza (共鳴)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "Durante il movimento, l'analista non smette di usare il Tōrō — lo usa continuamente, senza separare lo spostamento dal combattimento. L'arma trascina gli arti, non il contrario.",
    "poolId": "kyomei-risonanza-della-fiamma",
    "effect": "Per 1 turno, durante qualsiasi movimento effettuato, il [Tōrō] colpisce automaticamente ogni nemico che si trova a gittata corpo a corpo lungo il percorso, infliggendo danno pari al T2 per ogni colpo. Si ottiene 1 colpo ogni 2 m percorsi. Non è possibile mirare a punti specifici del corpo."
  },
  {
    "name": "Hōshutsu · Scarica (放出)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "Il Tōrō non viene brandito — viene aperto. La Jigo-Ka compressa al suo interno si riversa fuori in una direzione sola, un'onda che parte dall'arma e si allarga davanti all'analista senza chiedere il permesso a nessuno.",
    "poolId": "hoshutsu-rilascio-della-fiamma",
    "effect": "L'analista scarica la Jigo-Ka del [Tōrō] in un cono di 6 m davanti a sé, infliggendo danno pari al T2 [Energetico] a tutti i bersagli nell'area. Se il Tōrō aveva [Batteria] attiva, il danno sale a T3, ma il Tōrō si disintegra al termine. Dal grado [SB] in poi, la disintegrazione non avviene più anche con [Batteria] attiva."
  },
  {
    "name": "Ukabu Tōrō · Lanterna Abbandonata (浮かぶ灯籠)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "L'analista apre la mano e non trattiene. Il Tōrō si stacca e resta lì — non cade, si sostiene da solo, come se avesse trovato una corrente che solo esso riesce a percepire. Obbedisce ancora, ma non ha bisogno di essere tenuto per farlo.",
    "poolId": "ukabu-toro-lanterna-fluttuante",
    "effect": "Il [Tōrō] si stacca dalla mano e levita come [Costrutto] di taglia Media per un massimo di 3 turni. Può elevarsi fino a 2 m dal suolo e risponde ai comandi dell'analista entro 8 m, infliggendo danno pari al T2 per ogni attacco. Se supera gli 8 m di distanza, precipita e torna un oggetto inerte."
  },
  {
    "name": "Tōrō Nagashi · Alla Corrente (灯籠流し)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "Il Tōrō viene lanciato e non recuperato. Come le lanterne lasciate andare sul pelo dell'acqua durante i riti funebri — ci si congeda, ma la luce resta accesa. L'arma conficcata in un muro o in un corpo continua a essere un punto da cui l'analista può agire.",
    "poolId": "toro-nagashi-lanterna-alla-corrente",
    "effect": "L'analista lancia il proprio [Tōrō] in linea retta fino a 12 m, infliggendo danno pari al T2 al primo bersaglio colpito. Il Tōrō si conficca nella prima superficie solida incontrata e, finché rimane conficcato, conta come [Costrutto] attivo dell'analista. Le waza possono essere lanciate originandole dalla posizione del Tōrō anziché dall'analista."
  },
  {
    "name": "Hi o Tsumugu · Carica Trattenuta (火を紡ぐ)",
    "rank": "T2",
    "styleId": "toka",
    "isPassive": false,
    "description": "L'analista si ferma. Non è indecisione — è accumulo. Il Tōrō assorbe pressione per ogni istante di immobilità, e chi sa leggere il campo capisce che l'analista fermo è più pericoloso di quello in movimento.",
    "poolId": "hi-o-tsumugu-filatura-della-fiamma",
    "effect": "L'analista sferra un colpo a [Contatto][Energetico] che infligge danno pari al T2 (T3 se il Tōrō è un [Arma Psichica]). Può scegliere di caricare prima del colpo restando immobile: ogni quarto speso in carica aggiunge +1 tier al danno, fino a un massimo di +2 tier (2 quarti). Dopo aver scaricato il colpo, il Tōrō non può essere usato per lanciare waza per 1 turno."
  },
  {
    "name": "Bannō · Qualunque Cosa (万能)",
    "rank": "T3",
    "styleId": "toka",
    "isPassive": false,
    "description": "Un tubo di ferro. Un manico di legno. La gamba rotta di una sedia. Niente di tutto questo è un'arma, ma nelle mani dell'analista che ha raggiunto questa soglia non fa differenza — la Jigo-Ka non chiede materiale nobile, chiede solo una presa. L'oggetto regge finché può, poi cede di schianto.",
    "poolId": "omocha-il-giocattolo",
    "effect": "Per 3 turni, qualsiasi oggetto fisico impugnato dall'analista diventa [Tōrō], anche senza la passiva Tōrō. L'oggetto mantiene le sue proprietà fisiche ma funge da medium per le waza. Se l'analista cambia oggetto durante il turno, il precedente perde lo status di [Tōrō] e viene distrutto. Ogni waza lanciata attraverso questo Tōrō improvvisato accumula carica: al successivo impatto o lancio, l'oggetto esplode in una sfera [Propagazione][Energetica] di 3 m che infligge danno T3 a tutti i bersagli nell'area, e l'oggetto si distrugge."
  },
  {
    "name": "Kishin no Tō · Il Fuoco che Porti Addosso (器心の灯)",
    "rank": "T4",
    "styleId": "toka",
    "isPassive": false,
    "description": "Non è più necessario stringere nulla. La Jigo-Ka riconosce ciò che appartiene all'analista per Ego, non per contatto — ogni oggetto portato addosso è già suo quanto la propria ombra, e il vincolo lo trova da solo.",
    "poolId": "gangushi-il-giocattolaio",
    "effect": "Per 4 turni, ogni oggetto nell'inventario dell'analista o indossato prima dell'inizio del combattimento acquisisce lo status di [Tōrō] senza necessità di essere impugnato. È sufficiente che l'oggetto resti a contatto con il corpo o nell'equipaggiamento dell'analista."
  },
  {
    "name": "Tomurai no Tō · Rito Funebre (弔いの灯)",
    "rank": "T5",
    "styleId": "toka",
    "isPassive": false,
    "description": "L'atto ultimo si traduce in una festa di lanterne, dove il concetto di lanterna è ormai da tempo labile per l'analista. Ciò che impugna, già dichiarato Tōrō, muta la sua forma in una lanterna di ferro da rito funebre. Gli basterà sollevarla e lasciarla oscillare. Dalla lanterna scivolerà un fumo denso — nero se i nodi favoriti dall'analista sono di Shiju, rosso se sono di Meiju — che dilaga sul campo inghiottendo ogni suono. Nel silenzio che segue, appaiono lanterne di carta sospese a un metr…",
    "poolId": "tomurai-no-to-rito-funebre",
    "effect": "Il [Tōrō] dell'analista assume la forma di una lanterna di ferro da rito funebre. Un fumo denso si propaga coprendo un raggio di 10 m attorno all'analista per 5 turni: l'area diventa muta, annullando ogni waza [Sonoro]. Nell'area compaiono lanterne di carta sospese a 1 m da terra ([Costrutto][Tōrō]), in numero pari al totale delle stack di status presenti su tutti i soggetti nell'area. Ogni lanterna consuma 1 stack di status in campo e la converte in danno pari al T5, suddiviso equamente tra tutti i bersagli colpiti. Se la stack appartiene a un avversario non consenziente, è necessario superare un confronto tra l'IR dell'analista e la Fermezza del bersaglio."
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
    "rank": "T1",
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
    "rank": "T1",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Dal respiro dell'analista esala una nebbia che annebbia i sensi e attende solo una scintilla.",
    "poolId": "yoki-no-iki-soffio-yokai",
    "effect": "Attiva · [Emanazione][Gassosa] · Tier base 2 · CS 2 · 1/4. Nube per 4 m attorno a te, permane 2 turni. Dentro, i bersagli subiscono −3 all'Indice delle azioni di Riflessi (Hansha). Infiammabile: a contatto con Fuoco o Fulmine s'incendia e sparisce nel turno."
  },
  {
    "name": "Onnen-dama (怨念玉) — Globo del Rancore",
    "rank": "T1",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Una sfera di astio fluttua accanto all'analista, e si avventa su chiunque osi colpirlo.",
    "poolId": "onnen-dama-globo-rancore",
    "effect": "Attiva · [Costrutto][Energetico] · Tier base 2 · CS 2 · 1/4 + mantenimento. Generi un globo che ti segue per 4 turni; si lancia automaticamente verso la prima fonte di danno subìta, poi esplode in Emanazione a distanza (area 3 m, danno = tier). Si muove a 6 m a turno; oltre la gittata diventa Proiettile e si schianta dritto, con danno e area maggiorati."
  },
  {
    "name": "Hashira (柱) — Colonne Incise",
    "rank": "T1",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Due colonne si scrivono dal suolo, pazienti come pilastri di un tempio.",
    "poolId": "hashira-colonne-incise",
    "effect": "Attiva · [Costrutto] · Tier base 2 · CS 2 · 1/4. Due colonne emergono dal terreno (pietra, cemento, detriti...), alte 5 m, larghe 1 m, distanti 1 m fra loro e sulla stessa linea; permangono 3 turni."
  },
  {
    "name": "Utsushi (写し) — Copia Conforme",
    "rank": "T1",
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
    "rank": "T1",
    "styleId": "genzai",
    "isPassive": false,
    "description": "Il suolo stesso viene riscritto: ciò che era terra diventa l'elemento dell'analista.",
    "poolId": "jiban-terreno-ostile",
    "effect": "Attiva · [Propagazione][Elementale] · Tier base 2 · CS 2 · 1/4. Ricopri il terreno in un'area di 4 m attorno a un punto entro 8 m col tuo elemento affine: zona Propagazione Elementale per 3 turni. Chi vi sta o la attraversa subisce lo status. L'analista è immune."
  },
  {
    "name": "Meisaku (銘作) — Opera Prima",
    "rank": "T3",
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
    "rank": "T1",
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
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "Il bozzolo di filo si lacera dall'interno e sputa schegge guidate.",
    "poolId": "mayu-wari-bozzolo-squarciato",
    "effect": "Attiva · [Proiettile][Solido] · Tier base 2 · CS 2 · 1/4. Un tuo Costrutto Solido entro 8 m implode generando 4 Proiettili Solidi diretti a un bersaglio; danno = tier, ripartito tra le schegge che colpiscono."
  },
  {
    "name": "Hikiyose (引き寄せ) — Richiamo dei Fili",
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "Fili di carica opposta: ciò che respinge e ciò che attrae, intrecciati.",
    "poolId": "hikiyose-richiamo-fili",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4, genera 1 Tensione. Rendi un tuo Costrutto Solido entro 8 m Positivo per 2 turni; fino a 2 altri entro 8 m diventano Negativi (+1 CS per crearne di nuovi già Negativi). Ogni Solido Negativo viene attratto con forza verso il Positivo."
  },
  {
    "name": "Musubi (結び) — Nodo Gemello",
    "rank": "T1",
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
    "rank": "T1",
    "styleId": "ito",
    "isPassive": false,
    "description": "L'analista afferra il filo altrui e lo strappa di mano al suo padrone.",
    "poolId": "ubaiito-filo-rubato",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4. Tenti di strappare il controllo di un Costrutto nemico entro 8 m: confronto d'Indice (Skiru mentali, es. Fudōshin o Kansatsu) contro l'Indice del creatore. Se prevali, il controllo passa a te per 2 turni; il creatore può ritentare lo strappo. Solo su costrutti di taglia Media o inferiore."
  },
  {
    "name": "Unari (唸り) — Ronzio del Filo",
    "rank": "T1",
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
    "rank": "T2",
    "styleId": "ito",
    "isPassive": false,
    "description": "L'analista tende un filo e lo pianta nell'aria attorno a sé, tracciando un cerchio invisibile di cui si dichiara padrone. Ogni colpo nemico che varca quel confine viene afferrato a metà volo da capi di filo che lo intingono del colore della sua Jigo-Ka: per un istante la corda di Retsuja lo trattiene, poi la mano che lo guida non è più quella che l'ha lanciato.",
    "poolId": "kankatsu-giurisdizione",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 4 · 1/4 · grado richiesto: Sentatsu Bunsekikan [SB]. Dichiari Giurisdizione su una [Categoria] a scelta tra [Proiettile] e [Raggio]. Per 3 turni, una volta per turno, quando una waza nemica di quella Categoria entra entro 8 m da te, puoi spendere +2 CS per reclamarla: dall'istante in cui entra nel cerchio è considerata come appena lanciata da te. Bersaglio e gittata restano gli originali, ma ora la waza è tua — le tue passive Itō possono agire su di essa (redini, sdoppiamento, consistenza, trattenuta…) e le tue passive di consistenza/danno la leggono come propria.\n\n↳ Ogni waza reclamata che stai manipolando genera 1 Tensione finché la tieni."
  },
  {
    "name": "Chokurei (勅令) — Decreto",
    "rank": "T3",
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
    "rank": "T1",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista si spoglia di tutto ciò che si era costruito addosso e lo proietta appena oltre la pelle, come un samurai depone l'armatura davanti a un altare.",
    "poolId": "datsui-tate-scudo-spogliato",
    "effect": "Attiva · [Scudo][Energetico] · CS 2 · 1 turno. Rimuovi tutti i tuoi Potenziamento attivi e generi uno Scudo con Resistenza pari alla somma dei Bun sacrificati. Dura fino a fine prossimo turno o a esaurimento. Il turno seguente non puoi ricevere Potenziamento da alcuna fonte."
  },
  {
    "name": "Datsui-Yumi (脱衣弓) — L'Arco Spogliato",
    "rank": "T1",
    "styleId": "naikan",
    "isPassive": false,
    "description": "Invece di una freccia, l'analista incocca la propria armatura: la Jigo-Ka compressa diventa un dardo che fende l'aria col peso intero della forza appena rinunciata.",
    "poolId": "datsui-yumi-arco-spogliato",
    "effect": "Attiva · [Proiettile][Energetico] · CS 2 · istantanea. Lanciabile solo con almeno 1 Potenziamento attivo. Rimuovi tutti i Potenziamento e generi un proiettile per 15 m; danno = somma dei Bun sacrificati. Il turno seguente non puoi ricevere Potenziamento."
  },
  {
    "name": "Hari-Tsume (張り詰め) — Carico Trattenuto",
    "rank": "T1",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista spinge la Jigo-Ka contro l'osso come acqua forzata in un tubo già pieno. L'arto diventa una molla in attesa del rilascio.",
    "poolId": "hari-tsume-carico-trattenuto",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 turni. Scegli un arto. Il prossimo colpo a Contatto con quell'arto ottiene Potenziamento +3, ripartito su Binshō e Kairyoku (Indice e danno del colpo). Finché attiva, l'arto non può fare altro. Decade allo scarico o a fine durata."
  },
  {
    "name": "Sen'i-Gake (繊維掛け) — Avvolgimento delle Fibre",
    "rank": "T1",
    "styleId": "naikan",
    "isPassive": false,
    "description": "La Jigo-Ka scende lungo le fibre e le rinforza, avvolgendole come filo intorno a un'anima di legno; il resto del corpo perde lucentezza.",
    "poolId": "seni-gake-avvolgimento-fibre",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 turni. Scegli un settore (Gambe, Braccia o Torace) e un tipo di fibra. Per 2 turni, il Potenziamento si applica solo alle azioni di quel settore: Fibre Bianche → +2 Kairyoku; Fibre Neuromuscolari → +2 Binshō; Fibre Rosse → +2 Nintai."
  },
  {
    "name": "Geki-Ryū (激流) — Corrente Violenta",
    "rank": "T1",
    "styleId": "naikan",
    "isPassive": false,
    "description": "L'analista apre tutti i nodi e lascia che la Jigo-Ka li attraversi a una velocità non concepita per essere sostenuta. Poi le camere svuotate restano vuote.",
    "poolId": "geki-ryu-corrente-violenta",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 2 · 2 + 2 turni. Per 2 turni, +3 Binshō. Allo scadere, contraccolpo di −3 Binshō per altri 2 turni."
  },
  {
    "name": "Hada-Yuzuri (肌譲り) — Cessione attraverso la Pelle",
    "rank": "T1",
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
    "rank": "T1",
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
    "rank": "T3",
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
    "rank": "T1",
    "styleId": "hensei",
    "isPassive": false,
    "description": "L'arto cede il posto all'arma: carne che diventa costrutto.",
    "poolId": "ihen-aberrazione",
    "effect": "Attiva · [Potenziamento][Nulla] · Tier base 2 · CS 2 · 1/4. Sostituisci un tuo arto con un Costrutto brandito come arma per 4 turni (danno = tier). Se il costrutto viene rotto, l'arto resta inutilizzabile."
  },
  {
    "name": "Bōgai (妨害) — Disturbo",
    "rank": "T1",
    "styleId": "hensei",
    "isPassive": false,
    "description": "La tua energia si fa ronzio e acceca i sensi altrui.",
    "poolId": "bogai-disturbo",
    "effect": "Attiva · [Emanazione][Energetica] · CS 2 · 1/4. Rendi la tua Jigo-Ka un ronzio per 3 turni, propagato per 8 m: interferisce con la Jigo-Ka altrui, disturbando le abilità sensoriali basate su di essa. Finché ronzi, ogni tuo colpo a contatto riduce di 2 CS il bersaglio."
  },
  {
    "name": "Oboro (朧) — Velo Onirico",
    "rank": "T1",
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
    "rank": "T1",
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
    "rank": "T1",
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
    "rank": "T1",
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
    "rank": "T1",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'analista riversa la sua energia in un oggetto fino a renderlo una bomba.",
    "poolId": "tanraku-corto-circuito",
    "effect": "Attiva · [Energetiche][Contatto] · Tier base 2 · CS 2 · 1/4. Sovraccarichi un Costrutto o oggetto finché diventa instabile; a comando o per forte impatto esplode: danno = tier in 3 m. Se ha il tag Batteria, l'esplosione si allarga di 2 m; se colpisce un altro Batteria, quello esplode a metà raggio."
  },
  {
    "name": "Hōsha (放射) — Raffica Psichica",
    "rank": "T1",
    "styleId": "hado",
    "isPassive": false,
    "description": "Dai palmi e dalle piante, l'energia erompe in una scarica di colpi.",
    "poolId": "hosha-raffica-psichica",
    "effect": "Attiva · [Proiettile][Energetico] · Tier base 2 · CS 2 · 1/4. Liberi 2 Proiettili Energetici per 15 m, danno = tier ciascuno."
  },
  {
    "name": "Tameru (溜め) — Impeto Trattenuto",
    "rank": "T1",
    "styleId": "hado",
    "isPassive": false,
    "description": "Comprime, comprime ancora — e poi cede.",
    "poolId": "tameru-impeto-trattenuto",
    "effect": "Attiva · [Emanazione][Energetica] · Tier base 2 · CS 2 · 1/4 + carica. Comprimi la Jigo-Ka fino a 2 turni, rilasciabile in qualsiasi momento, in una forza repulsiva per 5 m. Nello stesso turno interrompe o compromette i movimenti attorno, senza danno; al secondo turno è più forte, danno = tier. Se vieni colpito mentre carichi, l'impeto si rilascia prematuramente e ne sei vittima anche tu."
  },
  {
    "name": "Hōden (放電) — Scarica d'Impatto",
    "rank": "T1",
    "styleId": "hado",
    "isPassive": false,
    "description": "L'energia accumulata in un arto si scarica al contatto, sfondando tutto.",
    "poolId": "hoden-scarica-impatto",
    "effect": "Attiva · [Contatto][Energetica] · Tier base 2 · CS 2 · 1/4. Carichi una parte del corpo; all'impatto scarichi un'onda d'urto per 4 m che danneggia (= tier) e compromette la stabilità, sfondando pareti, costrutti, ossa. Se non scarichi entro il turno, quella parte del corpo subisce danno = tier."
  },
  {
    "name": "Mugen no Tsukai (夢幻の使い) — Famiglio Onirico",
    "rank": "T1",
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
    "rank": "T1",
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
    "rank": "T1",
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
  },
  {
    "name": "Zan'ei",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Una sagoma eterea di Jigo-Ka, lasciata indietro a ogni passo: segue l'analista, ma sempre un movimento in ritardo, come un'eco che non riesce a stare al passo col suono che l'ha generata.",
    "poolId": "zanei",
    "effect": "Passiva · CS 0. Ogni spostamento dell'analista lascia una sagoma residua — un Costrutto Energetico — nel punto di origine dello spostamento. Al movimento successivo, la sagoma si sposta seguendo l'ultimo movimento compiuto (resta sempre un passo indietro). Finché analista e sagoma occupano posizioni diverse, l'analista può lanciare waza solo attraverso la sagoma, non dal proprio corpo. La sagoma è immune ai danni che non siano di natura psichica. Interazione con Trance Onirica: la sagoma torna immediatamente alla posizione dell'analista, fondendosi con lui e perdendo le sue proprietà — inutili"
  },
  {
    "name": "Kegare",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Ogni tecnica lanciata lascia un'impronta che il terreno non riesce a smaltire: una macchia di impurità che si rifiuta di seguire le regole del mondo dei vivi.",
    "poolId": "kegare",
    "effect": "Passiva · CS 0. Ogni volta che l'analista lancia una waza, genera una macchia larga 1,5 m sotto i propri piedi (sotto la sagoma di Zan'ei, se attiva). La macchia dura 5 turni. L'analista non può lanciare waza finché resta sopra una macchia, eccetto Shoheki."
  },
  {
    "name": "Kokurui",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "La Jigo-Ka del Rin'gai si manifesta come il pianto del mondo onirico: un liquido denso e scuro che non scorre — si deposita.",
    "poolId": "kokurui",
    "effect": "Passiva · CS 0. Le waza Liquide dell'analista infliggono Torpore al bersaglio colpito, e ottengono +1 tier di Resistenza. Quando infliggono Torpore, riducono anche di 2 CS il bersaglio (o, se il bersaglio è un Costrutto, gli tolgono 1 tier di Resistenza). Attive"
  },
  {
    "name": "Handō",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un costrutto richiamato non si teletrasporta: torna, e basta — ad alta velocità, come un elastico tirato fino al punto di rottura.",
    "poolId": "hando",
    "effect": "Attiva · [Proiettile][Personale] · Tier base 2 · CS 2 · 1/4. Richiama verso di sé un proprio Costrutto entro 12 m. Il costrutto viaggia ad alta velocità danneggiando tutto ciò che attraversa lungo la traiettoria (danno = tier), e assume la consistenza del costrutto richiamato — se è Energetica, non subisce danni durante lo spostamento. Utilizzabile anche ignorando il vincolo di Zan'ei: può essere lanciata dal corpo anche se la sagoma è altrove. Una volta che il costrutto raggiunge l'analista, per il resto del turno ottiene +1 tier alla prossima azione ogni 4 metri percorsi dal costrutto, fino"
  },
  {
    "name": "Magai Jigoku",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Dal terreno sbocciano lame, lance, forconi e artigli lunghi come spade — informi, confusi, come se l'incubo non avesse ancora deciso che forma dare al proprio dolore.",
    "poolId": "magai-jigoku",
    "effect": "Attiva · [Liquido][Emanazione] · Tier base 3 · CS 3 · 1/4. Genera sotto i propri piedi una macchia di energia psichica che si espande per 6 m attorno all'analista, sviluppandosi in altezza per 3 m; colpisce con furia indistinta tutto ciò che è in gittata (danno = tier). Con una macchia di Kegare esistente entro 8 m, può usarla come punto di origine: in questo caso la macchia usata scompare."
  },
  {
    "name": "Hedo",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un fiotto di energia psichica liquida, vomitato attraverso un arto o la bocca: non è un colpo composto, è un cedimento controllato.",
    "poolId": "hedo",
    "effect": "Attiva · [Liquido][Raggio] · Tier base 2 · CS 2 · 1/4. Proietta un flusso di energia psichica liquida per 15 m (danno = tier al primo bersaglio); durante il turno, l'analista può muovere l'arto o la testa scelti per cambiare la direzione della tecnica in corso (verticale, orizzontale, dritta). Genera 1 macchia ogni 10 m di gittata percorsa, lungo il tragitto della tecnica."
  },
  {
    "name": "Tamashii no Hake",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'arma muta in un pennello dalla taglia media: non è fatto per colpire, è fatto per raccogliere ciò che l'analista stessa ha lasciato indietro.",
    "poolId": "tamashii-no-hake",
    "effect": "Attiva · [Solido][Costrutto] · Tier base 2 · CS 2 · 1/4, dura 3 turni. L'arma impugnata diventa un pennello, arma contundente di taglia media, Costrutto Solido. Può colpire le proprie macchie: farlo le fa sparire, e la punta del pennello si carica del colore appena assorbito. Mentre è carico, il pennello ottiene +1 tier al prossimo danno inflitto; dopo quel colpo, genera una nuova macchia a 2 m oltre il punto d'impatto, e torna scarico."
  },
  {
    "name": "Yobimodoshi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Ogni macchia lasciata indietro torna a casa in un solo richiamo: il corpo si riempie di tutto ciò che aveva scartato.",
    "poolId": "yobimodoshi",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4. Richiama a sé ogni macchia presente entro 10 m (non ne genera di nuove, anche con Kegare attiva). Le macchie assorbite riempiono il corpo dell'analista, che ottiene lo status Macchiato con counter pari al numero di macchie assorbite. Lo status decade dopo 3 turni o quando i counter si esauriscono. Spendendo counter Macchiato: – 1 counter: rigenera 2 CS. 55"
  },
  {
    "name": "Buttō",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "La Jigo-Ka liquida esplode in avanti in un cono di rabbia indistinta — non è un attacco mirato, è una pentola che ha smesso di reggere il proprio bollore.",
    "poolId": "butto",
    "effect": "Attiva · [Propagazione Conica][Liquido] · Tier base 2 · CS 2 · 1/4. Genera un cono di 4 m di apertura e 8 m di lunghezza davanti a sé; ogni bersaglio nell'area subisce danno = tier e viene sbalzato nella stessa direzione dell'attacco per 3 m. Con una macchia esistente entro 8 m, può usarla come punto di origine: la macchia usata scompare."
  },
  {
    "name": "Kugutsushi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Una copia di sé stessa, fatta di Jigo-Ka liquida: si lancia, colpisce una volta sola, e si scioglie — lasciando dietro di sé solo una macchia e un ordine compiuto.",
    "poolId": "kugutsushi",
    "effect": "Attiva · [Liquido][Costrutto] · Tier base 2 · CS 2 · 1/4. Genera una propria copia in Jigo-Ka liquida, pari dimensioni, Costrutto Liquido. La copia si lancia in una direzione scelta ed esegue un ordine semplice d'attacco (danno = tier), percorrendo fino a 10 m prima di dissolversi. Una volta colpito, il bersaglio ottiene 1 stack di Macchiato; la copia, dissolvendosi, genera una macchia sotto di sé. Con una macchia esistente entro 8 m, può originare da essa: la macchia usata scompare."
  },
  {
    "name": "Uzu",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un mulinello di Jigo-Ka liquida che si stringe attorno a sé, quarto dopo quarto, fino a esplodere — l'unica waza del lignaggio che non si esaurisce in un solo respiro.",
    "poolId": "uzu",
    "effect": "Attiva · [Emanazione][Liquido] · CS variabile, 1 per quarto investito · fino a 4/4. Genera un mulinello di Jigo-Ka liquida per 6 m attorno a sé. È l'unica waza del lignaggio pensata per durare più di un quarto: ogni quarto investito aggiunge un effetto, e ogni stadio richiede un Indice di Riuscita più alto del precedente per essere contrastato. – 1/4: attrae tutto verso l'origine per 2 m; danno tier 1 (4). – 2/4: sposta tutti i bersagli in senso orario o antiorario per 3 m; danno tier 2 (8). – 3/4: schiaccia tutti i bersagli; danno tier 3 (12) e applica Macchiato. – 4/4: il mulinello esplode,"
  },
  {
    "name": "Yasei",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "La Jigo-Ka del Gōkaon, quando lasciata libera di scorrere d'istinto, si fa scura e calda: il segno di una bestia che osserva prima di colpire.",
    "poolId": "yasei",
    "effect": "Passiva · CS 0, scelta reciprocamente esclusiva con Cuore Affamato. Mentre possiede almeno 1 stack di Pressione, la Jigo-Ka dell'analista assume una tonalità scura e produce calore percepibile a distanza ravvicinata. Guadagna Pressione così: 1 stack quando subisce danno (una volta a turno, non autoinflitto); 1 stack quando spende CS (una volta a turno); 1 stack quando un nemico entro 8 m usa una waza (una volta a turno); 1 stack quando compie un'azione di movimento (fino a due volte a turno); 2 stack quando scende sotto il 50% degli HP (una volta a quest)."
  },
  {
    "name": "Gashin",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "In altri, la stessa pressione non resta latente: preme contro la pelle dall'interno, finché qualcosa non cede.",
    "poolId": "gashin",
    "effect": "Passiva · CS 0, scelta reciprocamente esclusiva con Natura Ferina. Mentre possiede almeno 1 stack di Pressione, il corpo dell'analista mostra segni visivi di tensione: vene in rilievo, leggere screpolature sulla pelle, calore corporeo elevato. Guadagna Pressione così: 1 stack quando infligge danno (fino a due volte a turno); 1 stack quando recupera CS (una volta a turno); 1 stack quando riceve uno status negativo (una volta a turno); 1 stack quando conclude il turno con un attacco o una waza a Contatto (una volta a turno)."
  },
  {
    "name": "Oni no Kyūkaku",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "La Jigo-Ka del Gōkaon permea costantemente i recettori olfattivi dell'analista, alterandoli: il suo  naso  non  sente  più  odori,  ma  traduce  stimoli  chimici  in  informazioni  istintive  sulla condizione di chi lo circonda.",
    "poolId": "oni-no-kyukaku",
    "effect": "Passiva · CS 0, costante, non richiede attivazione. Entro 15 m (20 m mentre possiede almeno 1 stack di Pressione), l'analista può: – Percepire la presenza di esseri viventi con corpo biologico anche se non visibili — direzione generale e distanza approssimativa (vicino/medio/lontano); barriere fisiche sigillate bloccano la percezione. – Identificare se un essere vivente entro raggio è sotto il 50% dei propri HP — percezione binaria, non il valore esatto; se sotto soglia, la direzione è percepita con più precisione. – Riconoscere permanentemente individui con cui è stato a contatto ravvicinato"
  },
  {
    "name": "Oni no Mezame",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "La  Pressione  accumulata  forza  il  corpo  a  mutare.  Le  trasformazioni  si  attivano automaticamente al raggiungimento della soglia corrispondente, e non si possono rifiutare.",
    "poolId": "oni-no-mezame",
    "effect": "Passiva · CS 0, automatica alle soglie di Pressione. – Soglia 1 — Comunione (2+ stack): la pelle si ispessisce e cambia colore, le iridi si iniettano di sangue. +2 Nintai. Con Cuore Affamato: +1 Kairyoku, un corno appare sulla fronte. Con Natura Ferina: +1 Binshō, un occhio verticale appare sulla fronte. – Soglia 2 — Simbiosi (5+ stack): il colore si accentua, il volto si deforma, spuntano zanne. +3 Nintai. La gittata delle waza a Contatto sale a 3 m (artigli, corna, arti allungati). Con Cuore Affamato: +2 Kairyoku, +1 Binshō. Con Natura Ferina: +2 Binshō, +1 Kairyoku. – Soglia 3 — Rovina (9+"
  },
  {
    "name": "Oni no Ago",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista convoglia la Pressione nella propria mandibola: i denti si ispessiscono e si allungano in zanne irregolari, indurite dalla Jigo-Ka.",
    "poolId": "oni-no-ago",
    "effect": "Attiva · [Contatto][Solido] · Tier base 2 · CS 2 + 2 stack di Pressione · 1/4. Morso contro un singolo bersaglio in portata, danno = tier; se colpisce, l'analista recupera 2 CS. A 3+ Pressione: il morso ignora il 25% della Resistenza di Costrutti e barriere. A 5+ Pressione: la mandibola si espande e il morso colpisce in un cono di 4 m davanti all'analista — la categoria cambia da Contatto a Propagazione Conica Solida. 59"
  },
  {
    "name": "Jūshi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista concentra la trasformazione in una sola parte del corpo, e la spinge oltre ogni proporzione naturale.",
    "poolId": "jushi",
    "effect": "Attiva · [Potenziamento][Nessuna] · Tier base 2 · CS 2 · 1/4, un solo Arto Bestiale attivo alla volta. Scegli un'opzione: – Braccio: raddoppia di taglia; i colpi con quell'arto ottengono +1 tier di danno e gittata a Contatto +1 m. Può afferrare Costrutti Solidi di taglia Grande con una mano. – Gamba: salta fino a 4 m in verticale o orizzontale in un solo balzo; l'atterraggio infligge danno = tier in un'area di 2 m. – Testa: le waza che impiegano la testa ottengono +1 tier di danno; le testate diventano un attacco valido (danno = tier base). – Coda: un attacco extra a Contatto Solido (danno = t"
  },
  {
    "name": "Oni no Hōkō",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista apre la bocca, e l'aria stessa si piega sotto il peso del suono.",
    "poolId": "oni-no-hoko",
    "effect": "Attiva · [Propagazione Conica][Sonoro] · Tier base 2 · CS 2 · 1/4. Cono di 6 m davanti a sé: danno = tier a ogni bersaglio nell'area, che subisce anche Vertigini se perde il confronto d'Indice. I Costrutti nell'area subiscono +1 tier di danno bonus. A 3+ Pressione: il ruggito spinge indietro di 3 m ogni bersaglio colpito."
  },
  {
    "name": "Mōshin",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista si lancia in avanti senza più calcolare la distanza che lo separa dall'ostacolo.",
    "poolId": "moshin",
    "effect": "Attiva · [Contatto][Solido] · Tier base 2 · CS 2 · 1/4. Carica in linea retta per 10 m; ogni bersaglio sul percorso subisce danno = tier e viene sbalzato di lato di 2 m. L'analista non si ferma finché non raggiunge la distanza massima o un ostacolo inamovibile: se lo colpisce, subisce danno = tier ma l'ostacolo ne subisce il doppio. Se l'analista subisce danno durante la carica, ottiene 1 stack di Ira. A 5+ Pressione: la tecnica diventa Energetica e la gittata sale a 15 m."
  },
  {
    "name": "Kotsudan",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista spezza uno dei propri corni e lo scaglia, ancora caldo di Jigo-Ka.",
    "poolId": "kotsudan",
    "effect": "Attiva · [Proiettile][Solido] · Tier base 1 · CS 1 · 1/4, richiede almeno la Soglia 1 di Risveglio dell'Oni attiva. Scaglia un corno o spuntone per 12 m: danno = tier. Il corno si conficca nel punto d'impatto e diventa un Costrutto Solido con Resistenza scala-tier; se colpisce un bersaglio vivente, applica Emorragia. A 3+ Pressione: il proiettile può essere espulso da qualunque parte del corpo."
  },
  {
    "name": "Jiware",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il colpo non cerca un bersaglio: cerca il terreno, e lascia che sia il terreno a portare il colpo agli altri.",
    "poolId": "jiware",
    "effect": "Attiva · [Propagazione][Solido] · Tier base 2 · CS 2 · 1/4. Onda sismica che si espande lungo il suolo per 6 m in ogni direzione: danno = tier a ogni bersaglio a contatto col terreno. I Costrutti a contatto col terreno nell'area subiscono +1 tier di danno bonus. A 5+ Pressione: l'onda si sviluppa anche in altezza, come un'onda vera e propria, coprendo l'intera area."
  },
  {
    "name": "Dōka",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'analista afferra ciò che non gli appartiene e lo fa proprio, scomponendolo in qualcosa che il suo corpo può usare.",
    "poolId": "doka",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4 (+1/4 se il Costrutto è nemico, per afferrarlo prima). Afferra un Costrutto di taglia Piccola o Media (proprio o nemico) e lo assorbe, distruggendolo. Per 3 turni ottiene un effetto in base alla sua Consistenza: Solido → +1 tier di Resistenza ai danni; Liquido → rigenera 2 CS; Energetico → +1 tier di danno ai colpi a Contatto; Elementale → i colpi a Contatto applicano 1 stack dello status elementale del Costrutto assorbito. 61"
  },
  {
    "name": "Chi ni somaru",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Nel corpo di chi porta questa discendenza, sangue ed Ego si uniscono in comunione: un patrimonio psichico capace di infestare il sangue stesso, fino a renderlo la fonte delle proprie offensive.",
    "poolId": "chi-ni-somaru",
    "effect": "Passiva · CS 0, keystone. Ogni waza Liquida lanciata dal Nakigara (escluse le waza di questa Madoshō, che già la applicano di default) infligge 1 contatore di Emorragia quando colpisce un bersaglio, e assume le sfumature scarlatte che caratterizzano il sangue."
  },
  {
    "name": "Chi no Kehai",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Chiudendo gli occhi e restando immobile, lo spazio attorno a sé gli appare come una tela bianca schizzata di macchie rosse — sangue, tracce, ferite vecchie e nuove.",
    "poolId": "chi-no-kehai",
    "effect": "Passiva · CS 0, disattiva appena l'analista entra in combattimento. Chiudendo gli occhi e restando immobile, percepisce entro 15 m qualunque fonte o traccia di sangue presente — comprese le ferite su individui vivi o morti. È in grado di valutare la gravità di una ferita e se è di origine fisica o psichica, riconoscere se il sangue percepito è umano, distinguere fra loro tracce di sangue diverse, e seguire la scia che un individuo affetto da Emorragia lascia dietro di sé finché lo status non viene rimosso."
  },
  {
    "name": "Matsugo no Chi",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "L'ultimo sangue versato non va sprecato: chi sa raccoglierlo, eredita ciò che lascia indietro.",
    "poolId": "matsugo-no-chi",
    "effect": "Passiva · CS 0. Se un individuo affetto da Emorragia muore entro 10 m dal Nakigara, questi può trasferirne su di sé tutti i contatori al costo di 1/4 — solo entro 1 turno dalla morte; oltre, non sono più trasferibili. Attive"
  },
  {
    "name": "Ketsumyaku no Yaiba",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il Nakigara apre la propria pelle e lascia che il sangue prenda forma fra le dita: non un'arma qualunque, ma un'estensione di sé.",
    "poolId": "ketsumyaku-no-yaiba",
    "effect": "Attiva · [Contatto][Solido] · Tier base 2 · CS 2 + 1 contatore di Emorragia autoinflitto · 1/4. Plasma nella propria mano un'arma di sangue cristallizzato, taglia massima Media, Resistenza scala-tier: danno = tier. Ogni volta che porta a segno un colpo (una volta a turno) infligge 1 contatore di Emorragia al bersaglio. L'arma è più fragile del normale e svanisce dopo 3 turni se non si dissolve prima."
  },
  {
    "name": "Chi no Hōyō",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il sangue che esce non scorre via: si addensa contro la pelle, vetroso, e diventa scudo.",
    "poolId": "chi-no-hoyo",
    "effect": "Attiva · [Scudo][Solido] · Tier base 2 · CS 2 + 1 contatore di Emorragia autoinflitto · 1/4. Riveste una zona a scelta (testa, busto, schiena, braccia o gambe) di sangue cristallizzato, Resistenza scala-tier. Dura 3 turni, poi il sangue torna liquido e scivola via; spostare la zona protetta costa 1/4."
  },
  {
    "name": "Hirui",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Le proprie ferite diventano bocche da fuoco: grumi di sangue espulsi come proiettili, ciascuno una piccola parte di sé lanciata contro il nemico.",
    "poolId": "hirui",
    "effect": "Attiva · [Proiettile][Liquido] · Tier base 2 · CS 2 + 1 contatore di Emorragia autoinflitto · 1/4. Scaglia in linea retta, per 12 m, 2 Proiettili Liquidi per ogni contatore di Emorragia posseduto, fino a un massimo di 10 proiettili a 5 contatori; danno = tier ciascuno. I proiettili possono essere ripartiti su più bersagli, purché visibili."
  },
  {
    "name": "Chi no Kizuna",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un filamento di sangue addensato si allunga dalla ferita e si aggrappa a chi incontra: da quel momento, ciò che accade a uno scorre nelle vene dell'altro.",
    "poolId": "chi-no-kizuna",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 2 · CS 2 + 1 contatore di Emorragia autoinflitto · 1/4. Un filamento di sangue, Resistenza scala-tier, si protende per 8 m verso un essere vivente che il Nakigara può vedere; se lo raggiunge, gli infligge 1 contatore di Emorragia e lo lega a sé. Finché il legame regge, Nakigara e bersaglio non possono allontanarsi oltre 6 m l'uno dall'altro, e ogni contatore di Emorragia applicato al Nakigara si applica automaticamente anche al bersaglio."
  },
  {
    "name": "Yuketsu",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Non serve toccare per prendere: basta puntare la mano, e il sangue altrui sa già dove andare.",
    "poolId": "yuketsu",
    "effect": "Attiva · [Nessuna] · CS 1 · 1/4. Punta la mano verso un essere vivente che può vedere, entro 10 m: recupera 5 HP per ogni contatore di Emorragia presente sul bersaglio, fino a un massimo di 25 HP. Al termine della waza, il bersaglio guarisce completamente dallo status Emorragia."
  },
  {
    "name": "Kaketsu",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Per qualche istante, una parte del corpo smette di essere carne e diventa esattamente ciò che la regge: sangue, e niente altro.",
    "poolId": "kaketsu",
    "effect": "Attiva · [Nessuna] · CS 2 · 1/4, richiede almeno 1 contatore di Emorragia attivo, dura 3 turni. Trasmuta una parte del corpo a scelta (testa, busto, braccia o gambe) in sangue: assume le proprietà della Consistenza Liquida e ne eredita la debolezza al Sonoro. La parte trasmutata è immune alla maggior parte degli attacchi fisici convenzionali, che la attraversano, ma resta vulnerabile ai colpi permeati di Jigo-Ka; può allungarsi fino a 3 m. Impiegando 1/4, l'analista può ricomporre la parte trasmutata e sceglierne un'altra."
  },
  {
    "name": "Soketsu no Minamoto",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Dal petto, dove le ferite si sono fatte più fitte, emerge l'arma che si dice sia unica per ogni Nakigara: la forma che il proprio sangue assume quando gli viene chiesto tutto.",
    "poolId": "soketsu-no-minamoto",
    "effect": "Attiva · [Contatto][Solido] · Tier base 3 · CS 3 + 3 contatori di Emorragia autoinflitti · 1/4. Estrae dal proprio petto un'arma di sangue cristallizzato, taglia massima Grande, unica 64"
  },
  {
    "name": "Yume ga nijimu",
    "rank": "T3",
    "styleId": null,
    "isPassive": false,
    "description": "Il cuore e l'Ego entrano in perfetta sintonia, e ogni battito libera onde di Jigo-Ka tanto dense da essere visibili. Il cielo stesso, sotto le giuste condizioni, può tingersi di rosso.",
    "poolId": "yume-ga-nijimu",
    "effect": "Attiva · [Emanazione] · Tier base 4 · CS 5 · 1/4. Per 3 turni, ogni essere vivente entro 10 m deve vincere un confronto d'Indice (Konjou) o subisce immediatamente 5 contatori di Emorragia. Per la durata, lo status si estende anche a Costrutti e superfici normalmente immuni (edifici, armi, vegetazione), che perdono 1 tier di Resistenza a turno finché ne sono affetti; e il cap massimo di contatori di Emorragia ottenibili nella zona sale a 10 invece del consueto 5. Allo scadere, la scena collassa su sé stessa: ogni bersaglio nella zona d'influenza guarisce completamente dallo status Emorragia. 65"
  },
  {
    "name": "Kinu no Hada",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Il corpo dell'Hataori è un gomitolo, l'Ego che lo permea un ago: da questa unione nasce una discendenza stretta fra le trame di centinaia di fili e i capi di migliaia di corde.",
    "poolId": "kinu-no-hada",
    "effect": "Passiva · CS 0, keystone. Permeando la propria pelle con la Jigo-Ka, l'Hataori fa fuoriuscire fili, corde o funi a piacimento da ogni punto del corpo, nei colori e nelle decorazioni che preferisce. Tessendo con i movimenti giusti, compone Nodi — Costrutti Solidi di taglia Piccola — che, permeati dal proprio Ego, diventano Sigilli."
  },
  {
    "name": "Sokubakukan",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "C'è, nell'Hataori, una sensazione di costrizione mai del tutto sopita — e proprio per questo il suo Ego riconosce con facilità la stretta di un vincolo altrui.",
    "poolId": "sokubakukan",
    "effect": "Passiva · CS 0. Restando fermo e chiudendo gli occhi, l'Hataori dispiega i propri fili nell'ambiente entro 15 m, sondando alla ricerca di Sigilli o waza che impongano condizioni o regole sull'area circostante — rendendoli visibili anche se celati. Spendendo l'intero turno per studiare quanto trovato, può apprenderne gli effetti e il funzionamento."
  },
  {
    "name": "Nodoshibari",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Chi veste un suo Sigillo non è mai del tutto fuori portata: l'Hataori può ancora raggiungerlo, in silenzio, attraverso il filo che li lega.",
    "poolId": "nodoshibari",
    "effect": "Passiva · CS 0. L'Hataori può comunicare mentalmente con qualunque bersaglio affetto dallo status Sigillato (Portafortuna) entro 20 m. La comunicazione è unilaterale e, mentre è in atto, priva del tutto il bersaglio della capacità di parlare. Attive"
  },
  {
    "name": "Hishi-musubi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un piccolo portafortuna a forma di diamante, capace di proteggere chi lo veste — finché qualcuno non decide di reciderlo.",
    "poolId": "hishi-musubi",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 1 · CS 1 · 1/4. Tesse un Nodo a Diamante e lo lancia su un bersaglio visibile entro 8 m, oppure lo appende su di sé. Appeso a un'arma, ne previene l'usura. Appeso a un individuo (o le sue vesti), gli dona +1 tier di Resistenza verso una Consistenza a scelta dell'Hataori. Appeso ai confini di una stanza, ne rende le pareti +1 tier più 67"
  },
  {
    "name": "Kanmusubi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Una corona di filo che non incorona: comanda. Chi la porta si muove, per un istante, secondo un'altra volontà.",
    "poolId": "kanmusubi",
    "effect": "Attiva · [Emanazione] · Tier base 2 · CS 2 · 1/4. Tesse un Nodo a Corona che entra in risonanza con ogni bersaglio Sigillato (Portafortuna), taglia massima Media, entro 10 m. Con 1/4, l'Hataori può costringere uno di questi bersagli al movimento (una volta a turno, un bersaglio alla volta): se consenziente, lo sposta fino a 4 m in qualunque direzione senza opposizione; se non consenziente (oggetti inanimati inclusi), serve un confronto d'Indice a favore dell'Hataori."
  },
  {
    "name": "Jūji-musubi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Una croce di filo che non protegge soltanto: rispedisce al mittente ciò che la colpisce.",
    "poolId": "juji-musubi",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 2 · CS 2 · 1/4. Tesse un Nodo a Croce e lo lancia su un bersaglio visibile entro 8 m, oppure lo appende su di sé. Appeso a un'arma, la riveste di un alone Energetico che le permette di colpire waza di qualunque Categoria; se vince un confronto d'Indice, un colpo contro una waza Proiettile, Raggio o Propagazione la rispedisce al mittente. Appeso a un individuo, genera uno Scudo Energetico che respinge attacchi di una Categoria scelta tra Proiettile, Raggio o Propagazione — se l'Hataori vince il confronto d'Indice la devia altrove, altrimenti la barriera"
  },
  {
    "name": "Mitsuba-musubi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Due nodi, un solo filo: ciò che accade a uno, l'altro lo sente come fosse suo.",
    "poolId": "mitsuba-musubi",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 1 · CS 2 · 1/4. Tesse e appende un Nodo a Trifoglio su 2 individui visibili entro 10 m. Finché entrambi i Nodi reggono (Resistenza scala-tier ciascuno), i due bersagli condividono — dividendolo a metà fra loro — ogni danno, ogni stack di status, e ogni cura o rigenerazione che subiscono; nessun altro effetto è condiviso. Con 1/4 si scioglie uno o entrambi i Nodi. Se sopravvive un solo Nodo, resta dormiente finché un secondo non viene appeso altrove, riattivando subito la connessione. Massimo 2 Nodi a Trifoglio attivi insieme: quelli in eccesso si sciolg"
  },
  {
    "name": "Kiku-musubi",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Un nodo che non lega un bersaglio: lega lo spazio stesso, e lo svuota di ogni respiro.",
    "poolId": "kiku-musubi",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 3 · CS 3 · 1/4, richiede immobilità totale per mantenersi. Tesse un Nodo a Crisantemo e lo appende su una superficie inanimata entro 8 m: attiva una barriera Energetica di 6 m, Resistenza scala-tier +1 (più coriaceo degli altri Sigilli). Chi è dentro la barriera non può guadagnare o rigenerare HP né CS, né essere bersaglio di waza Potenziamento. Per mantenerla, l'Hataori resta immobile e non può lanciare altri Sigilli Portafortuna o di Confinamento; se la barriera o il Nodo vengono distrutti, parte del danno si 68"
  },
  {
    "name": "Sōsen-musubi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un cerchio di filo che premia chi già porta un suo segno: le tecniche di chi lo attraversa volano più dure, più veloci.",
    "poolId": "sosen-musubi",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 2 · CS 2 · 1/4. Tesse un Nodo a Doppia Moneta e lo appende su una superficie inanimata entro 8 m: attiva una barriera Energetica intangibile, taglia Media. Solo le waza lanciate da bersagli Sigillati (Portafortuna) che attraversano la barriera ottengono +1 tier di danno e velocità. Si scioglie con 1/4, oppure si rompe (Resistenza scala-tier)."
  },
  {
    "name": "Ai no Musubi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il legame fra l'Hataori e i propri Sigilli si fa così intenso da trascendere il semplice glifo: il Nodo dell'Amore pulsa contro il suo petto a ogni battito del cuore.",
    "poolId": "ai-no-musubi",
    "effect": "Attiva · [Costrutto][Solido] · Tier base 2 · CS 2 · 1/4, fino a 2 volte a turno. Tesse il Nodo dell'Amore al proprio petto (Resistenza scala-tier, dura 3 turni); finché intatto, permette di teletrasportarsi accanto a uno qualsiasi dei propri Sigilli presenti sul campo, entro 15 m. Se nei pressi di un bersaglio Sigillato (Portafortuna), può teletrasportarsi anche lì, lasciando comunque almeno 2 m di distanza dal bersaglio."
  },
  {
    "name": "Ori no Mohō",
    "rank": "T3",
    "styleId": null,
    "isPassive": false,
    "description": "La mente dell'Hataori proietta un filo verso il cielo — un'unica connessione, sufficiente a far insinuare il proprio Ego nelle trame stesse dell'incubo.",
    "poolId": "ori-no-moho",
    "effect": "Attiva · [Propagazione][Solido] · Tier base 4 · CS 5 · 1/4. Fa piovere fili e funi su un'area di 10 m, che si ancorano al terreno come arpioni diventando Costrutti Solidi (Resistenza scala- tier). Con 1/4, l'Hataori terraforma il campo strappando frammenti dallo scenario per creare fino a 3 piattaforme Costrutto Solido, sospese fino a 8 m d'altezza, taglia Media, Resistenza scala- tier; con un altro 1/4 può lanciarne una come Proiettile (danno = tier). Ogni bersaglio Sigillato (Portafortuna) che si muove nell'area riceve sentieri e appigli artificiali dai fili. Dopo 3 turni i fili si ritirano"
  },
  {
    "name": "Aku no Hana",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Quando rabbia, odio o anche il più piccolo fastidio mettono radici nella mente dell'Ikiryō, attorno a lui sbocciano fiori dagli steli color ombra, dai petali simili a ciocche di capelli, con un grande occhio sulla sommità del pistillo.",
    "poolId": "aku-no-hana",
    "effect": "Passiva · CS 0, keystone. Mentre è in preda a un'emozione torva, l'Ikiryō emana costantemente una coltre di polline nero — Emanazione Gassosa di 6 m — che lo segue ovunque si muova. Chi vi rimane dentro perde gradualmente convinzione: al 1° turno non succede nulla; all'inizio del 2° turno, perde gli status Beatitudine o Ira se ne è afflitto; all'inizio del 3° turno, chi è ancora presente viene afflitto da Tristezza. Il polline è vulnerabile alle waza Elementali Vento: se l'Ikiryō viene colpito da una di esse, a prescindere dalla potenza, la passiva si disattiva per 2 turni."
  },
  {
    "name": "Dokushu",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Al tocco dell'Ikiryō, la vegetazione circostante si infetta del suo polline — e gli restituisce, in cambio, un po' della propria energia vitale.",
    "poolId": "dokushu",
    "effect": "Passiva · CS 0. A contatto con la natura, può spendere 1/4 per rigenerare 2 CS, fino a un massimo di 4/4 per 8 CS totali. Non utilizzabile più volte nella stessa zona, né durante il combattimento."
  },
  {
    "name": "Jagan no Niwashi",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Ogni fiore che l'Ikiryō ha creato porta un occhio — e quell'occhio è anche il suo, se solo si concede di chiudere i propri.",
    "poolId": "jagan-no-niwashi",
    "effect": "Passiva · CS 0. Chiudendo gli occhi e concentrandosi per 1/4, può osservare il campo di battaglia attraverso gli occhi dei propri fiori, entro 15 m da ciascuno. Ogni bersaglio affetto da Tristezza o Disperazione risulta sempre visibile attraverso questi occhi, anche se nascosto da nubi gassose, ripari solidi o specchi d'acqua. Attive"
  },
  {
    "name": "Chōkafun",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Concentrando la Jigo-Ka in bocca e saturandola di polline, l'Ikiryō esala davanti a sé una coltre funerea che si attacca ai polmoni di chi la respira.",
    "poolId": "chokafun",
    "effect": "Attiva · [Propagazione Conica][Gassosa] · Tier base 2 · CS 2 · 1/4. Cono di polline lungo 8 m: danno = tier a ogni bersaglio investito. Chi perde un confronto d'Indice contro l'Ikiryō viene afflitto da Tristezza."
  },
  {
    "name": "Himawari no Kushi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il polline scava in silenzio sotto i piedi del bersaglio, e quando trova il punto giusto sboccia dal basso verso l'alto.",
    "poolId": "himawari-no-kushi",
    "effect": "Attiva · [Solido][Costrutto] · Tier base 2 · CS 2 · 1/4. Il polline scava sottoterra per 10 m verso un bersaglio: alla fine del tragitto sboccia in un macabro girasole, Costrutto Solido di taglia Media, Resistenza scala-tier, che impala il bersaglio dal basso (danno = tier). Se il bersaglio è affetto da Tristezza, il girasole apre l'occhio sul pistillo ed emette un'Emanazione a 71"
  },
  {
    "name": "Ibara no Batsu",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il polline affonda nel terreno e ne risale come un groviglio di spine, deciso a far pagare a chiunque lo tocchi.",
    "poolId": "ibara-no-batsu",
    "effect": "Attiva · [Solido][Costrutto] · Tier base 2 · CS 2 · 1/4. Erge un muro di rovi, Costrutto Solido di taglia Media, Resistenza scala-tier, davanti a sé. Ogni attacco corpo a corpo o waza a Contatto diretti contro il muro rimanda danno = tier al mittente; lo stesso accade a chi viene bloccato dal muro nel movimento, o lo termina a ridosso di esso."
  },
  {
    "name": "Bara no Shokei",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un campo di rose macabre sboccia dal nulla, e punisce chiunque osi attraversarne i confini.",
    "poolId": "bara-no-shokei",
    "effect": "Attiva · [Propagazione][Solido] · Tier base 2 · CS 2 · 1/4. Crea un campo di rose in un'area di 8 m attorno a sé, immobile, che non può essere spostata in alcun modo. Chiunque entri o esca dall'area diventa bersaglio, una volta a turno, di una tempesta di spine (Proiettile Solido, danno = tier). Se il bersaglio colpito è affetto da Tristezza, le spine restano conficcate e impongono −2 Nintai finché non vengono rimosse (1/4, o una waza Emanazione). Il campo dura al massimo 3 turni, poi marcisce."
  },
  {
    "name": "Tanpopo no Noroi",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Centinaia di denti di leone fluttuano sospesi nell'aria, in attesa di un solo comando per abbattersi come pioggia.",
    "poolId": "tanpopo-no-noroi",
    "effect": "Attiva · [Propagazione][Solido] · Tier base 2 · CS 2 · 1/4. Fa sbocciare centinaia di denti di leone sospesi a 6 m da terra; a comando, si abbattono in un'area di 6 m davanti all'Ikiryō, infliggendo danno = tier. Se il bersaglio colpito è affetto da Tristezza, i fiori mettono radice nel suo corpo: −2 Kairyoku e 1 CS drenata a turno, finché non se ne libera (1/4, o una waza Emanazione)."
  },
  {
    "name": "Chōkafunsō",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Il polline viene espulso con violenza in ogni direzione, una burrasca color pece che cerca di travolgere tutto ciò che incontra.",
    "poolId": "chokafunso",
    "effect": "Attiva · [Emanazione][Gassosa] · Tier base 3 · CS 3 · 1/4. Burrasca di polline che investe un'area di 6 m attorno all'Ikiryō: danno = tier. Se colpisce un bersaglio affetto da Tristezza, il polline germoglia sulla sua pelle in fiori parassiti: −2 Shakai Kaikyū e 2 HP drenati a turno, finché non se ne libera (1/4, o una waza Emanazione)."
  },
  {
    "name": "Bochi no Hasami",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Attingendo al proprio odio più ossessivo, l'Ikiryō compatta il polline in una forbice nera come il carbone e sfuggente come il fumo.",
    "poolId": "bochi-no-hasami",
    "effect": "Attiva · [Contatto][Gassoso] · Tier base 3 · CS 3 · 1/4. Plasma fra le mani un paio di cesoie, Costrutto Gassoso di taglia Media, Resistenza scala-tier — ma vulnerabile come tutto il polline dell'Ikiryō alle waza Elementali Vento, da cui subisce +1 tier di danno. Le lame infliggono danno = tier, +1 danno per ogni malus unico che affligge il bersaglio (fino a 5 malus, uno per Skiru 72"
  },
  {
    "name": "Yume ga Saku",
    "rank": "T3",
    "styleId": null,
    "isPassive": false,
    "description": "Nella mente dell'Ikiryō, fra le sue emozioni più irruenti, sboccia un fiore: il punto in cui psiche e Jigo-Ka smettono di essere due cose distinte. Una macabra corona di fiori adorna il suo capo — il simbolo della sua illuminazione.",
    "poolId": "yume-ga-saku",
    "effect": "Attiva · [Emanazione] · Tier base 5 · CS 6 · 1/4. Toccando il terreno, infesta un'area di 12 m attorno a sé: il campo di battaglia fiorisce per 3 turni. Individui e Costrutti altrui che perdono un confronto d'Indice contro l'Ikiryō diventano ospiti della sua prole floreale: danno = tier a turno, −2 CS a turno, liberabili con una waza Emanazione o 2/4. Finché il campo è in fiore, l'Ikiryō può lanciare le waza di questa Madoshō da qualunque punto dell'area, mantenendone pieno controllo a distanza. Ogni bersaglio affetto da Tristezza o Disperazione perde −1 a una Skiru primaria a scelta ogni volt"
  },
  {
    "name": "Patto Sbagliato",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Il Komonoire non regala armi: le presta. Ogni mattina il dado demoniaco rotola nel piccolo scrigno e offre qualcosa da impugnare — finché non decidi se accettare il patto di quel turno o pagare il rifiuto.",
    "poolId": "komonoire-patto-sbagliato",
    "effect": "Passiva · CS 0, keystone. A inizio turno dichiari `[komonoire:tira:N]` (N 1–6) per ricevere l'arma del dado. Finché la impugni, le tue waza con arma a [Contatto] ottengono +1 tier. `[komonoire:accetta]` conferma il patto; `[komonoire:rifiuta]` o `[komonoire:opposizione]` ti affligge [Debitore] e l'arma svanisce."
  },
  {
    "name": "Scrigno Chiuso",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Il reliquiario è più stretto di quanto sembri: ciò che entra non esce senza permesso, e le mani altrui scivolano quando cercano di strapparti ciò che il patto ti ha prestato.",
    "poolId": "komonoire-scrigno-chiuso",
    "effect": "Passiva · CS 0. Non puoi essere disarmato finché impugni l'arma del dado demoniaco. Se possiedi [Debitore], ottieni +1 all'Indice difensivo contro waza a [Contatto]."
  },
  {
    "name": "Interesse Crescente",
    "rank": null,
    "styleId": null,
    "isPassive": true,
    "description": "Il debito non dorme: anche quando non lo guardi, continua a maturare interessi invisibili che si scaricano nel momento in cui finalmente colpisci.",
    "poolId": "komonoire-interesse-crescente",
    "effect": "Passiva · CS 0. Se possiedi almeno 1 stack di [Debitore], la tua prima waza offensiva di ogni turno ottiene +1 tier di danno (cumulabile una sola volta per turno)."
  },
  {
    "name": "Kuchizuke Oni",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Un bacio di Jigo-Ka demoniaca sul metallo prestato: l'arma sussurra il nome del bersaglio e corre a cercarlo.",
    "poolId": "komonoire-kuchizuke-oni",
    "effect": "Attiva · [Contatto][Energetica] · Tier base 1 · CS 1 · 1/4. Richiede l'arma del dado attiva. Colpo singolo a [Contatto] (danno = tier). Se il bersaglio possiede [Debitore], +1 tier."
  },
  {
    "name": "Shibari del Debito",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Fili invisibili di patto si avvolgono al polso nemico: non stringono la carne, stringono l'obbligo.",
    "poolId": "komonoire-shibari-debito",
    "effect": "Attiva · [Contatto][Nessuna] · Tier base 2 · CS 2 · 1/4. Colpo a [Contatto] (danno = tier). Se colpisci un bersaglio con [Debitore], la sua prossima waza costa +1 CS."
  },
  {
    "name": "Shihai della Lama",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "L'arma prestata non vuole restare ferma: l'analista la scaglia e il patto la richiama, già pronta per un secondo morso.",
    "poolId": "komonoire-shihai-katana",
    "effect": "Attiva · [Proiettile][Energetica] · Tier base 2 · CS 2 · 1/4. Richiede arma del dado. Lanci l'arma in linea retta per 12 m (danno = tier al primo bersaglio); l'arma torna in mano a fine waza."
  },
  {
    "name": "Senrei Imposta",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Non si chiede favore: si impone una clausola. Il bersaglio può piegarsi o portare sulle spalle un debito che non aveva chiesto.",
    "poolId": "komonoire-senrei-imposta",
    "effect": "Attiva · [Nessuna][Contatto] · CS 2 · 1/4. A [Contatto], imponi un patto minore: il bersaglio accetta (nessun effetto meccanico) o rifiuta e ottiene 1 stack di [Debitore]. Una volta per bersaglio per combattimento."
  },
  {
    "name": "Kaishū — Riscossione",
    "rank": "T2",
    "styleId": null,
    "isPassive": false,
    "description": "Quando riscuoti, non chiedi gentilezza: tratti il corpo del debitore come cauzione liquida.",
    "poolId": "komonoire-kaishu-riscossione",
    "effect": "Attiva · [Contatto][Energetica] · Tier base 3 · CS 3 · 1/4. Colpo a [Contatto] (danno = tier). Se il bersaglio ha [Debitore], il danno sale di 1 tier per stack (max +2 tier)."
  },
  {
    "name": "Yakusoku Spezzato",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Spezzare un patto costa sangue — ma a volte il sangue è più economico del debito.",
    "poolId": "komonoire-yakusoku-spezza",
    "effect": "Attiva · [Nessuna][Potenziamento] · CS 1 · 1/4. Rimuovi tutti i tuoi stack di [Debitore] e subisci 4 danno diretti (non mitigabile da Itami)."
  },
  {
    "name": "Nemuri dello Scrigno",
    "rank": "T1",
    "styleId": null,
    "isPassive": false,
    "description": "Il Komonoire si spalanca un istante e inghiotte un frammento di volontà altrui: non una prigione di carne, ma un sonno contrattuale.",
    "poolId": "komonoire-nemuri-scrigno",
    "effect": "Attiva · [Nessuna][Contatto] · Tier base 2 · CS 2 · 1/4. A [Contatto], se prevali nello scambio d'Indice, il bersaglio non può dichiarare waza offensive fino all'inizio del suo prossimo turno (può muoversi e difendersi)."
  },
  {
    "name": "Deai con l'Akuma",
    "rank": "T3",
    "styleId": null,
    "isPassive": false,
    "description": "Per un battito il mondo si contrae nel volume del reliquiario: il demone mostra ciò che avrebbe preso se il patto fosse stato accettato senza riserve.",
    "poolId": "komonoire-akuma-no-deai",
    "effect": "Attiva · [Emanazione][Energetica] · Tier base 4 · CS 5 · 1/4. Emanazione 5 m attorno a te; danno = tier a ogni bersaglio nell'area (te escluso). I bersagli con [Debitore] subiscono +1 tier. Dopo la waza, l'arma del dado svanisce comunque."
  }
] as const
