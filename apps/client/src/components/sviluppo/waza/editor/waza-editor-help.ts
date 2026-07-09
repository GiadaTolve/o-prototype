import type { BloccoTipo } from "./effetti-schema";

export const BLOCCO_INFO_TESTI: Record<BloccoTipo, string> = {
  DANNO:
    "Fa male a un bersaglio. Scegli quanto (di solito «usa la forza della waza», cioè il tier) e a chi (una persona, un'area, un cono). Il sistema calcola da solo scudo e resistenza al dolore. Esempio: Hōshutsu fa danno in un cono davanti a te.",
  MOD_DANNO:
    "Da solo non fa male: cambia quanto fanno male altri colpi. Un bonus o un malus, quasi sempre con un «solo se». Esempio: +1 gradino di danno contro i costrutti.",
  BUFF_SKIRU:
    "Alza o abbassa una Skiru per qualche turno. È il blocco dei potenziamenti. Scegli quale Skiru, di quanto, per quanti turni. Esempio: +2 Agilità per 2 turni.",
  APPLICA_STATUS:
    "Mette addosso a qualcuno uno stato: incendiato, avvelenato, stordito. Scegli lo status e quante volte si accumula (se non dici niente, è 1). Esempio: Incendiato a chi entra nella nube.",
  EVOCA_COSTRUTTO:
    "Crea qualcosa sul campo: un'arma animata, una colonna, un globo. Ha una sua resistenza, una durata, e a volte si muove o attacca. Esempio: la lanterna fluttuante che ti segue per 3 turni.",
  MOD_COSTO:
    "Cambia quante CS costa lanciare certe waza: puoi fare uno sconto (con minimo) o un sovrapprezzo. Esempi: Shōka, Kioku-Mei.",
  STATO_PERSONALE:
    "Scrive o legge un valore sul personaggio, con scadenza in turni. Utile per ricordare e consumare stati personali come elemento residuo o batterie. Esempi: Nokuribi, Chikuden.",
  MOD_RESISTENZA:
    "Alza o abbassa la resistenza tua o di un costrutto, anche filtrando per consistenza. Esempi: Kōchiku, Junnō.",
  TRASFORMA_TAG:
    "Cambia categoria o consistenza di una waza o di un costrutto (es. Contatto -> Proiettile). Puoi aggiungere effetti collaterali come variazioni di gittata. Esempi: Michishirube, Genso-Ka, Yugami, Someito.",
  SCUDO:
    "Crea una protezione con resistenza propria: il danno passa prima da qui e solo dopo sugli HP, finché lo scudo non si rompe. Puoi aggiungere mitigazione extra. Esempi: Tōki, Shoheki, Datsui-Tate.",
  ZONA:
    "Crea un'area persistente sul campo (fissa o in movimento) con effetti quando qualcuno entra o a inizio turno. Puoi indicare immunità (es. l'analista). Esempi: Jiban, Yōki no Iki, Rōei.",
  MOD_CS:
    "Agisce sulle CS come risorsa: drena, fa recuperare, deposita o blocca la rigenerazione per alcuni turni. Esempi: Bōgai, Chikuden, Balsamo dell'Anima.",
  MOD_TRAIETTORIA:
    "Cambia il percorso del colpo: devia, rimbalza, sospende, sdoppia, penetra, ancora o spinge. Esempi: Tazuna, Wakeito, Fukitobashi, Kantsū.",
  MANIPOLA_STATUS:
    "Sposta, trasmuta o consuma status già presenti su un bersaglio. Esempi: Hada-Yuzuri, Tenka, Kunō-Baku.",
  DIFFERITO:
    "Prepara ora e rilascia dopo: definisci una finestra di turni e uno o più rilasci (impatto, comando, scadenza) che contengono altri blocchi. Esempi: Fuin no Hi, Maikomi, Tameru.",
  MANUALE:
    "Scrivi a parole cosa succede, e lo gestisce il master. Si usa quando l'effetto è troppo particolare per i blocchi normali. Non è una scorciatoia di serie B: certe waza è giusto che restino così. Esempio: «ricrea l'oggetto distrutto il turno scorso».",
};

export const ATOMI_IN_ARRIVO: ReadonlyArray<{ label: string; text: string }> = [
];

export const FIELD_HELP_TEXT: Record<string, string> = {
  trigger:
    "Decide il momento in cui parte l’effetto. Opzioni: al lancio, all’impatto, quando subisci danno, a inizio turno, a fine turno, a comando.",
  bersaglio:
    "Indica su chi o dove agisce il blocco: te stesso, un bersaglio, un’area (con raggio), un cono o una linea.",
  valore:
    "Quanto vale l’effetto. Puoi usare: forza della waza (tier, es. T2 = 8), numero fisso, un gradino più forte/debole (tier ±1) o altre formule guidate.",
  danno:
    "Quanto danno produce questo blocco o costrutto: scegli il tipo di calcolo e il numero finale.",
  resistenza: "Quanta tenuta ha il costrutto o l’effetto prima di rompersi.",
  durata:
    "Per quanto resta attivo: istantanea, per un certo numero di turni oppure persistente finché non finisce una condizione.",
  condizione:
    "Serve a far scattare l’effetto solo in certi casi. Costruiscila con i tre menu: soggetto, confronto e valore.",
  stack: "Quante accumulazioni di status applichi in un colpo (se non lo imposti, vale 1).",
  taglia: "Dimensione del costrutto evocato, utile per comportamento e limiti in scena.",
  skiru: "La Skiru che viene modificata o usata da questo blocco.",
  status: "Lo status da applicare o controllare (incendiato, avvelenato, stordito, ecc.).",
  area: "Forma e misura dell’area: raggio, profondità o altre dimensioni in metri.",
  costo_extra: "Costo aggiuntivo opzionale (CS o HP) oltre al costo base della waza.",
  testo: "Testo libero gestito dal master: usalo per effetti particolari non codificabili con gli altri blocchi.",
  mostra_a: "Per il blocco manuale: decide chi vede il testo (solo master o tutti).",
  comportamento: "Modo in cui il costrutto si comporta dopo l’evocazione.",
  delta_cs: "Variazione in CS applicata al costo della waza (negativo = sconto, positivo = sovrapprezzo).",
  minimo_cs: "Costo minimo in CS dopo lo sconto, per evitare che scenda troppo.",
  filtro_waza: "Filtro opzionale: limita l'effetto alle waza di una famiglia o che rispettano una condizione.",
  famiglia: "Famiglia waza su cui applicare il filtro (es. shoka, kioku-mei).",
  operazione: "Scegli se scrivere un valore nello stato personale o leggerlo.",
  chiave: "Nome della variabile personale da usare (es. elemento_residuo, batteria).",
  scadenza_turni: "Numero di turni dopo cui il valore personale scade.",
  consuma: "Se attivo, quando leggi il valore lo consumi/rimuovi.",
  delta_resistenza: "Quanto alzare o abbassare la resistenza (negativo = riduzione, positivo = aumento).",
  filtro_consistenza: "Filtro opzionale sulla consistenza del costrutto da colpire.",
  dimensione: "Scegli se trasformare la categoria della waza o la consistenza del costrutto.",
  da_tag: "Valore di partenza da sostituire (es. Contatto, Solido, Liquido).",
  a_tag: "Nuovo valore dopo la trasformazione.",
  oggetto: "Indica se la trasformazione colpisce la tua waza o un costrutto.",
  effetti_collaterali:
    "Lista di effetti secondari strutturati: scegli tipo (gittata/raggio/durata) e valore con lo stesso sistema «Quanto» (anche Formula su Skiru).",
  forma_zona: "Forma dell'area persistente (cerchio, cono, linea, ecc.).",
  raggio_zona_m: "Raggio/estensione della zona in metri.",
  ancoraggio: "La zona resta fissa o segue analista/costrutto.",
  effetti_zona: "Blocchi interni della zona: cosa succede quando si entra o a inizio turno.",
  quando_entra: "Blocco effetto che scatta quando qualcuno entra nella zona.",
  a_inizio_turno: "Blocco effetto che scatta a inizio turno finché la zona resta attiva.",
  immunita: "Chi ignora gli effetti della zona (es. analista, alleati).",
  resistenza_scudo: "Quanta resistenza ha lo scudo prima di rompersi.",
  mitigazione_extra: "Riduzione/addizione extra al danno assorbito dallo scudo.",
  operazione: "Azione principale del blocco (es. drena, devia, trasferisci).",
  quantita: "Quanto vale l'effetto su CS/status, con lo stesso sistema «Quanto».",
  durata_blocco_turni: "Se blocchi la rigenerazione CS, per quanti turni resta attivo.",
  direzione: "Direzione/verso della deviazione o spinta.",
  status_da: "Status di origine da trasferire/consumare/rimuovere.",
  status_a: "Status di destinazione nella trasmutazione.",
  finestra_turni: "Numero di turni entro cui il rilascio differito può attivarsi.",
  rilasci: "Elenco dei rilasci differiti (impatto/comando/scadenza) con i blocchi da eseguire.",
  modo: "Quando si attiva questo rilascio.",
  blocchi: "Blocchi da eseguire al rilascio.",
  waza_slug: "Slug della waza di riferimento (tipo valore RIFERIMENTO).",
};

