import { parseCondizioneCanonica } from "./condizione-constants";
import type { BloccoTipo } from "./effetti-schema";

/**
 * Render meccanico (anticipo minimo dello Sprint 3): traduce un blocco effetto
 * compilato in una frase in italiano piano, così l'autore capisce a colpo
 * d'occhio se sta codificando ciò che intende.
 *
 * È volutamente tollerante ai blocchi incompleti: descrive quel che c'è e
 * segnala con «…» i pezzi mancanti, senza mai lanciare eccezioni.
 */

type Blocco = Record<string, unknown>;

/** Descrizioni brevi in italiano piano per il menu «+ Aggiungi effetto». */
export const ATOMO_DESCRIZIONI: Record<BloccoTipo, string> = {
  DANNO: "la waza infligge danno",
  MOD_DANNO: "modifica il danno di altri colpi",
  BUFF_SKIRU: "potenzia (o riduce) una Skiru",
  APPLICA_STATUS: "applica uno status al bersaglio",
  EVOCA_COSTRUTTO: "evoca un costrutto controllabile",
  MOD_COSTO: "modifica il costo in CS di certe waza",
  STATO_PERSONALE: "scrive o legge uno stato personale",
  MOD_RESISTENZA: "modifica la resistenza propria o di un costrutto",
  TRASFORMA_TAG: "cambia categoria o consistenza di waza e costrutti",
  SCUDO: "crea una protezione che assorbe danni prima degli HP",
  ZONA: "crea un'area persistente con effetti a ingresso o turno",
  MANUALE: "testo libero per il master, non eseguito dal motore",
};

const TRIGGER_FRASI: Record<string, string> = {
  AL_LANCIO: "al lancio",
  PRE_COSTO: "prima di pagare il costo",
  PRE_LANCIO: "prima del lancio",
  ALL_IMPATTO: "all'impatto",
  QUANDO_SUBISCI_DANNO: "quando subisci danno",
  QUANDO_SUBISCI_STATUS: "quando subisci uno status",
  INIZIO_TURNO: "a inizio turno",
  FINE_TURNO: "a fine turno",
  A_COMANDO: "a comando",
  A_SCADENZA: "alla scadenza",
  ENTRA_IN_ZONA: "quando qualcuno entra nella zona",
  SU_DISTRUZIONE: "alla distruzione",
  SU_MOVIMENTO: "durante il movimento",
};

const BERSAGLIO_FRASI: Record<string, string> = {
  SE_STESSO: "su te stesso",
  BERSAGLIO_SINGOLO: "a un bersaglio singolo",
  AREA: "in un'area",
  CONO: "in un cono",
  LINEA: "in linea",
  PROPRIO_COSTRUTTO: "sul tuo costrutto",
  COSTRUTTO_NEMICO: "su un costrutto nemico",
  TORO: "sul Tōrō",
  ZONA_TERRENO: "su una zona di terreno",
  TUTTI_IN_AREA: "a tutti nell'area",
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function signed(n: number): string {
  return n >= 0 ? `+${n}` : `−${Math.abs(n)}`;
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0]!.toUpperCase() + s.slice(1) : s;
}

/** «pari a X», con contrazione «pari al …» quando il valore inizia per «il ». */
function pariA(valoreText: string): string {
  // «il tier …» → «pari al tier …»
  return valoreText.startsWith("il ") ? `pari a${valoreText.slice(1)}` : `pari a ${valoreText}`;
}

/** Traduce un blocco `valore` (FISSO, TIER, …) in testo. */
export function renderValore(value: unknown, tierFlatDamage?: number | null): string {
  if (!value || typeof value !== "object") return "un valore…";
  const v = value as Blocco;
  switch (String(v.tipo)) {
    case "FISSO": {
      const n = num(v.n);
      return n == null ? "un valore fisso…" : `${n}`;
    }
    case "TIER":
      return tierFlatDamage != null ? `il tier (${tierFlatDamage})` : "il tier della waza";
    case "TIER_DELTA": {
      const n = num(v.n);
      return n == null ? "il tier…" : `${signed(n)} tier`;
    }
    case "TIER_PER_STACK": {
      const status = str(v.status);
      return status ? `il tier per ogni stack di ${status}` : "il tier per ogni stack…";
    }
    case "SOMMA_BOOST":
      return "la somma dei boost attivi";
    case "TIER_COLPO_SUBITO":
      return "il tier del colpo subito";
    case "FORMULA": {
      const base = num(v.base);
      const perPunto = num(v.per_punto);
      const skiru = str(v.skiru);
      if (base == null || perPunto == null || !skiru) return "una formula su Skiru…";
      return `${base} ${signed(perPunto)} per ogni punto di ${skiru}`;
    }
    case "MOLT": {
      const x = num(v.x);
      return x == null ? "un moltiplicatore…" : `×${x}`;
    }
    case "SCALA": {
      const passi = Array.isArray(v.passi) ? (v.passi as number[]) : [];
      const cap = num(v.cap);
      const passiTxt = passi.length > 0 ? passi.join(", ") : "…";
      return `a scala (${passiTxt})${cap != null ? ` fino a ${cap}` : ""}`;
    }
    default:
      return "un valore…";
  }
}

/** Bersaglio + eventuale dimensione area (es. «in un cono di 6 m»). */
function renderBersaglioConArea(blocco: Blocco): string {
  const bersaglio = String(blocco.bersaglio ?? "");
  const base = BERSAGLIO_FRASI[bersaglio] ?? "su un bersaglio…";
  const area = blocco.area && typeof blocco.area === "object" ? (blocco.area as Blocco) : null;
  if (!area) return base;

  const raggio = num(area.raggio_m);
  const profondita = num(area.profondita_m);
  if (bersaglio === "CONO" && profondita != null) return `in un cono di ${profondita} m`;
  if (bersaglio === "AREA" && raggio != null) return `in un'area di raggio ${raggio} m`;
  if (raggio != null) return `${base} di raggio ${raggio} m`;
  if (profondita != null) return `${base} di ${profondita} m`;
  return base;
}

function renderDurata(blocco: Blocco): string {
  const durata =
    blocco.durata && typeof blocco.durata === "object" ? (blocco.durata as Blocco) : null;
  if (!durata) return "";
  switch (String(durata.tipo)) {
    case "ISTANTANEA":
      return "";
    case "TURNI": {
      const n = num(durata.n);
      return n == null ? " per alcuni turni" : ` per ${n} turni`;
    }
    case "PERSISTENTE":
      return " in modo persistente";
    case "FINO_A_CONDIZIONE": {
      const cond = str(durata.condizione_fine);
      return cond ? ` fino a quando: ${cond}` : " fino a una condizione…";
    }
    case "COMBATTIMENTO":
      return " per tutto il combattimento";
    default:
      return "";
  }
}

/** Traduce la condizione canonica in una frase «se …». */
export function renderCondizione(raw: unknown): string {
  const cond = str(raw);
  if (!cond) return "";
  const parsed = parseCondizioneCanonica(cond);

  if (parsed.soggettoId === "toro.batteria") {
    return parsed.valore === "true"
      ? "se il Tōrō ha la Batteria attiva"
      : "se il Tōrō non ha la Batteria";
  }
  if (parsed.soggettoId === "toro.lanciata") {
    return parsed.valore === "true"
      ? "se lanciata dal Tōrō"
      : "se non lanciata dal Tōrō";
  }
  if (parsed.soggettoId === "stack(status)" && parsed.statusNome) {
    return `se ci sono ${parsed.operatore} ${parsed.valore} stack di ${parsed.statusNome}`;
  }
  if (parsed.soggettoId === "grado_pg") {
    return `se il grado del PG è ${parsed.operatore === "!=" ? "diverso da " : ""}${parsed.valore}`;
  }
  if (parsed.soggettoId === "cs_correnti") {
    return `se i CS correnti sono ${parsed.operatore} ${parsed.valore}`;
  }
  if (parsed.soggettoId === "hp_pct") {
    return `se gli HP residui sono ${parsed.operatore} ${parsed.valore}%`;
  }
  return `se ${cond}`;
}

function renderCostoExtra(blocco: Blocco): string {
  const costo =
    blocco.costo_extra && typeof blocco.costo_extra === "object"
      ? (blocco.costo_extra as Blocco)
      : null;
  if (!costo) return "";
  const cs = num(costo.cs);
  const hp = num(costo.hp);
  if (cs != null) return ` (costo extra: ${cs} CS)`;
  if (hp != null) return ` (costo extra: ${hp} HP)`;
  return "";
}

function suffix(blocco: Blocco): string {
  return `${renderDurata(blocco)}${withCondizione(blocco)}${renderCostoExtra(blocco)}`;
}

function withCondizione(blocco: Blocco): string {
  const c = renderCondizione(blocco.condizione);
  return c ? ` ${c}` : "";
}

function triggerPrefix(blocco: Blocco): string {
  const trigger = String(blocco.trigger ?? "AL_LANCIO");
  if (trigger === "AL_LANCIO") return "";
  const frase = TRIGGER_FRASI[trigger];
  return frase ? `${capitalize(frase)}: ` : "";
}

function renderCorpo(blocco: Blocco, tierFlatDamage?: number | null): string {
  const tipo = String(blocco.tipo ?? "") as BloccoTipo;
  switch (tipo) {
    case "DANNO":
      return `infligge danno ${pariA(renderValore(blocco.valore, tierFlatDamage))} ${renderBersaglioConArea(
        blocco,
      )}${suffix(blocco)}`;
    case "MOD_DANNO": {
      const filtro =
        blocco.filtro_waza && typeof blocco.filtro_waza === "object"
          ? (blocco.filtro_waza as Blocco)
          : null;
      const tag = filtro && Array.isArray(filtro.tag) ? (filtro.tag as string[]) : [];
      const tagTxt = tag.length > 0 ? ` alle waza con tag ${tag.map((t) => `[${t}]`).join(", ")}` : "";
      return `modifica il danno di ${renderValore(blocco.valore, tierFlatDamage)}${tagTxt}${suffix(blocco)}`;
    }
    case "BUFF_SKIRU": {
      const skiru = str(blocco.skiru);
      return `modifica la Skiru ${skiru ?? "…"} di ${renderValore(
        blocco.valore,
        tierFlatDamage,
      )} ${BERSAGLIO_FRASI[String(blocco.bersaglio ?? "")] ?? "su un bersaglio…"}${suffix(blocco)}`;
    }
    case "APPLICA_STATUS": {
      const status = str(blocco.status);
      const stack = num(blocco.stack);
      const stackTxt = stack != null && stack > 1 ? ` (${stack} stack)` : "";
      return `applica lo status ${status ?? "…"}${stackTxt} ${
        BERSAGLIO_FRASI[String(blocco.bersaglio ?? "")] ?? "a un bersaglio…"
      }${suffix(blocco)}`;
    }
    case "EVOCA_COSTRUTTO": {
      const taglia = str(blocco.taglia);
      const consistenza = str(blocco.consistenza);
      const danno = blocco.danno ? `, danno ${renderValore(blocco.danno, tierFlatDamage)}` : "";
      const comp = str(blocco.comportamento);
      const compTxt = comp ? `, comportamento ${comp.toLowerCase().replace(/_/g, " ")}` : "";
      return `evoca un costrutto ${taglia ?? "…"}${consistenza ? ` di ${consistenza}` : ""}${danno}${compTxt}${suffix(
        blocco,
      )}`;
    }
    case "MOD_COSTO": {
      const delta = num(blocco.delta_cs);
      const minimo = num(blocco.minimo_cs);
      const filtro =
        blocco.filtro_waza && typeof blocco.filtro_waza === "object"
          ? (blocco.filtro_waza as Blocco)
          : null;
      const famiglia = str(filtro?.famiglia);
      const cond = renderCondizione(filtro?.condizione);
      const scope = [
        famiglia ? `famiglia ${famiglia}` : "",
        cond ? cond.replace(/^se\s+/, "") : "",
      ]
        .filter(Boolean)
        .join(" e ");
      const scopeTxt = scope ? ` (${scope})` : "";
      const base = `modifica il costo di ${delta == null ? "…" : `${signed(delta)} CS`}${scopeTxt}`;
      const minimoTxt = minimo != null ? `, minimo ${minimo}` : "";
      return `${base}${minimoTxt}${suffix(blocco)}`;
    }
    case "STATO_PERSONALE": {
      const op = String(blocco.operazione ?? "");
      const chiave = str(blocco.chiave) ?? "…";
      const scadenza = num(blocco.scadenza_turni);
      const consuma = Boolean(blocco.consuma);
      if (op === "SCRIVI") {
        const valoreRaw = blocco.valore;
        const valore =
          typeof valoreRaw === "string"
            ? `“${valoreRaw}”`
            : typeof valoreRaw === "number" || typeof valoreRaw === "boolean"
              ? String(valoreRaw)
              : "…";
        const exp = scadenza != null ? ` per ${scadenza} turni` : "";
        return `scrive nello stato personale ${chiave} = ${valore}${exp}${suffix(blocco)}`;
      }
      const exp = scadenza != null ? ` (valido entro ${scadenza} turni)` : "";
      const consumeTxt = consuma ? " e lo consuma" : "";
      return `legge dallo stato personale ${chiave}${exp}${consumeTxt}${suffix(blocco)}`;
    }
    case "MOD_RESISTENZA": {
      const delta = num(blocco.delta_resistenza);
      const filtro = str(blocco.filtro_consistenza);
      const bersaglio = BERSAGLIO_FRASI[String(blocco.bersaglio ?? "")] ?? "su un bersaglio…";
      const filtroTxt = filtro ? ` (solo consistenza ${filtro})` : "";
      return `modifica la resistenza di ${delta == null ? "…" : signed(delta)} ${bersaglio}${filtroTxt}${suffix(
        blocco,
      )}`;
    }
    case "TRASFORMA_TAG": {
      const dimensione = str(blocco.dimensione);
      const from = str(blocco.da_tag);
      const to = str(blocco.a_tag);
      const oggetto = str(blocco.oggetto);
      const effetti = str(blocco.effetti_collaterali);
      const oggettoTxt =
        oggetto === "WAZA_PROPRIA"
          ? "della tua waza"
          : oggetto === "COSTRUTTO"
            ? "del costrutto"
            : "dell'oggetto";
      const base = `trasforma ${dimensione === "consistenza" ? "la consistenza" : "la categoria"} ${oggettoTxt} da ${from ?? "…"} a ${to ?? "…"}`;
      const extra = effetti ? ` (effetti collaterali: ${effetti})` : "";
      return `${base}${extra}${suffix(blocco)}`;
    }
    case "SCUDO": {
      const res = blocco.resistenza_scudo
        ? renderValore(blocco.resistenza_scudo, tierFlatDamage)
        : "…";
      const mitigazione = num(blocco.mitigazione_extra);
      const mitigTxt = mitigazione != null ? `, mitigazione extra ${signed(mitigazione)}` : "";
      return `crea uno scudo con resistenza ${res}${mitigTxt}${suffix(blocco)}`;
    }
    case "ZONA": {
      const forma = str(blocco.forma_zona);
      const raggio = num(blocco.raggio_zona_m);
      const ancoraggio = str(blocco.ancoraggio);
      const immunita = Array.isArray(blocco.immunita) ? (blocco.immunita as string[]) : [];
      const effetti =
        blocco.effetti_zona && typeof blocco.effetti_zona === "object"
          ? (blocco.effetti_zona as Blocco)
          : null;
      const hooks: string[] = [];
      if (effetti?.quando_entra) hooks.push("quando entra");
      if (effetti?.a_inizio_turno) hooks.push("a inizio turno");
      const hooksTxt = hooks.length > 0 ? hooks.join(" + ") : "senza effetti interni";
      const ancoraggioTxt =
        ancoraggio === "SEGUE_ANALISTA"
          ? "segue l'analista"
          : ancoraggio === "SEGUE_COSTRUTTO"
            ? "segue un costrutto"
            : "fissa";
      const immunitaTxt = immunita.length > 0 ? `, immuni: ${immunita.join(", ")}` : "";
      return `crea una zona ${forma ?? "…"}${raggio != null ? ` (raggio ${raggio} m)` : ""}, ancoraggio ${ancoraggioTxt}, effetti ${hooksTxt}${immunitaTxt}${suffix(
        blocco,
      )}`;
    }
    case "MANUALE": {
      const testo = str(blocco.testo);
      const mostra = String(blocco.mostra_a ?? "MASTER");
      const chi = mostra === "TUTTI" ? "Testo mostrato a tutti" : "Nota per il master (non eseguita dal motore)";
      return `${chi}: «${testo ?? "…"}»`;
    }
    default:
      return "effetto non riconosciuto";
  }
}

/** Frase completa in italiano piano per un blocco. */
export function renderBloccoMeccanico(
  blocco: Blocco | null | undefined,
  tierFlatDamage?: number | null,
): string {
  if (!blocco || typeof blocco !== "object") return "Blocco vuoto.";
  const tipo = String(blocco.tipo ?? "");
  if (!tipo) return "Blocco senza tipo.";

  if (tipo === "MANUALE") {
    return `${renderCorpo(blocco, tierFlatDamage)}.`;
  }

  const prefix = triggerPrefix(blocco);
  const corpo = renderCorpo(blocco, tierFlatDamage);
  return `${prefix}${prefix ? corpo : capitalize(corpo)}.`;
}
