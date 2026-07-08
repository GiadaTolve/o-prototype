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
  MANUALE:
    "Scrivi a parole cosa succede, e lo gestisce il master. Si usa quando l'effetto è troppo particolare per i blocchi normali. Non è una scorciatoia di serie B: certe waza è giusto che restino così. Esempio: «ricrea l'oggetto distrutto il turno scorso».",
};

export const ATOMI_IN_ARRIVO: ReadonlyArray<{ label: string; text: string }> = [
  { label: "MANIPOLA_STATUS (in arrivo)", text: "Sposta o consuma status già presenti…" },
  { label: "SCUDO (in arrivo)", text: "Crea una protezione che assorbe il danno…" },
  { label: "MOD_RESISTENZA (in arrivo)", text: "Alza o abbassa la resistenza…" },
  { label: "MOD_COSTO (in arrivo)", text: "Cambia quante CS costa lanciare certe waza…" },
  { label: "MOD_CS (in arrivo)", text: "Tocca le CS come risorsa…" },
  { label: "TRASFORMA_TAG (in arrivo)", text: "Cambia la natura di una waza o costrutto…" },
  { label: "MOD_TRAIETTORIA (in arrivo)", text: "Cambia il percorso di un colpo…" },
  { label: "ZONA (in arrivo)", text: "Crea un'area che resta sul campo…" },
  { label: "STATO_PERSONALE (in arrivo)", text: "Fa ricordare qualcosa al personaggio…" },
  { label: "DIFFERITO (in arrivo)", text: "Prepari qualcosa ora che scatta dopo…" },
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
};

