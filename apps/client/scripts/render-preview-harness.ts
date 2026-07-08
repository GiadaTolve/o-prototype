/**
 * Harness di anteprima (solo per screenshot di sviluppo): genera un HTML che
 * riproduce il pannello "Come si legge la waza" usando le STRINGHE REALI
 * prodotte da renderBloccoMeccanico, con i token Dark Arcane. Non fa parte del
 * bundle dell'app.
 *
 *   bun run scripts/render-preview-harness.ts > /tmp/waza-render-preview.html
 */
import {
  BLOCCO_MODELLI,
  BLOCCO_TIPO_LABELS,
  createBloccoDaModello,
  type BloccoTipo,
} from "../src/components/sviluppo/waza/editor/effetti-schema";
import {
  ATOMO_DESCRIZIONI,
  renderBloccoMeccanico,
} from "../src/components/sviluppo/waza/editor/waza-blocco-render";

const esempi: { blocco: Record<string, unknown>; tierFlat?: number }[] = [
  {
    blocco: {
      tipo: "DANNO",
      trigger: "AL_LANCIO",
      bersaglio: "CONO",
      durata: { tipo: "ISTANTANEA" },
      valore: { tipo: "TIER" },
      area: { forma: "cono", profondita_m: 6 },
    },
    tierFlat: 6,
  },
  {
    blocco: {
      tipo: "MOD_DANNO",
      trigger: "AL_LANCIO",
      bersaglio: "SE_STESSO",
      durata: { tipo: "ISTANTANEA" },
      valore: { tipo: "TIER_DELTA", n: 1 },
      condizione: "toro.batteria == true",
    },
  },
  {
    blocco: {
      tipo: "APPLICA_STATUS",
      trigger: "ALL_IMPATTO",
      bersaglio: "BERSAGLIO_SINGOLO",
      durata: { tipo: "TURNI", n: 3 },
      status: "Incendiato",
      stack: 2,
    },
  },
  { blocco: createBloccoDaModello("potenziamento-durata") },
  {
    blocco: {
      tipo: "MANUALE",
      testo: "Il Tōrō può disintegrarsi in mille lucciole di cenere.",
    },
  },
];

const righe = esempi
  .map((e, i) => {
    const tipo = String(e.blocco.tipo) as BloccoTipo;
    const frase = renderBloccoMeccanico(e.blocco, e.tierFlat ?? null);
    return `
      <li class="riga">
        <span class="num">${i + 1}.</span>
        <span class="frase"><span class="tag">${BLOCCO_TIPO_LABELS[tipo]}</span>${frase}</span>
      </li>`;
  })
  .join("");

const menu = (Object.keys(ATOMO_DESCRIZIONI) as BloccoTipo[])
  .map(
    (t) => `
      <div class="voce">
        <span class="voce-label">${BLOCCO_TIPO_LABELS[t]}</span>
        <span class="voce-desc">${ATOMO_DESCRIZIONI[t]}</span>
      </div>`,
  )
  .join("");

const modelli = BLOCCO_MODELLI.map(
  (m) => `<button class="modello" title="${m.descrizione}">${m.label}</button>`,
).join("");

process.stdout.write(`<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<style>
  :root{--background:#050508;--accent-gold:#d4af37;--accent-violet:#7c3aed;--accent-violet-light:#a78bfa;--panel-bg:#0f0f12;--border-color:#2a2a32;}
  *{box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;}
  body{background:var(--background);margin:0;padding:28px;color:#e5e5e5;width:760px;}
  h2{color:var(--accent-gold);font-size:15px;margin:0;}
  h3{color:var(--accent-violet-light);font-size:14px;margin:0;}
  .head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:12px;}
  .toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
  .modello{font-size:11px;padding:6px 10px;border-radius:6px;background:transparent;color:var(--accent-violet-light);border:1px solid color-mix(in srgb,var(--accent-violet) 40%,transparent);cursor:pointer;}
  .add{font-size:12px;padding:6px 12px;border-radius:6px;color:var(--accent-gold);border:1px solid color-mix(in srgb,var(--accent-gold) 50%,transparent);background:transparent;}
  .menu{margin:10px 0 18px;width:320px;border:1px solid var(--border-color);background:var(--panel-bg);border-radius:6px;padding:4px 0;box-shadow:0 8px 24px rgba(0,0,0,.5);}
  .voce{padding:8px 12px;}
  .voce:hover{background:rgba(0,0,0,.3);}
  .voce-label{display:block;font-size:12px;color:var(--accent-violet-light);}
  .voce-desc{display:block;font-size:10px;color:#8a8a93;line-height:1.35;}
  .panel{border:1px solid color-mix(in srgb,var(--accent-violet) 30%,transparent);background:color-mix(in srgb,var(--panel-bg) 60%,transparent);border-radius:8px;padding:16px;}
  .panel p.desc{font-size:10px;color:#8a8a93;line-height:1.5;margin:6px 0 12px;}
  ol{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;}
  .riga{display:flex;gap:8px;font-size:14px;line-height:1.4;}
  .num{font-family:ui-monospace,monospace;font-size:10px;color:color-mix(in srgb,var(--accent-gold) 70%,transparent);margin-top:2px;}
  .frase{color:color-mix(in srgb,var(--accent-violet-light) 90%,white);}
  .tag{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#8a8a93;margin-right:6px;}
  .cap{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8a8a93;}
  .sec-title{color:var(--accent-gold);font-size:13px;margin:0 0 8px;}
</style></head>
<body>
  <p class="sec-title">Menu «+ Aggiungi effetto» — con descrizioni in italiano piano</p>
  <div class="head">
    <h2>Blocchi effetto</h2>
    <div class="toolbar">${modelli}<button class="add">+ Aggiungi effetto</button></div>
  </div>
  <div class="menu">${menu}</div>

  <div class="panel">
    <div class="head"><h3>Come si legge la waza</h3><span class="cap">anteprima meccanica</span></div>
    <p class="desc">Traduzione automatica dei blocchi in linguaggio piano. Serve a controllare la codifica, non è il testo mostrato in gioco.</p>
    <ol>${righe}</ol>
  </div>
</body></html>`);
