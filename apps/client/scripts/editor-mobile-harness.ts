/**
 * Harness di anteprima mobile (solo screenshot di sviluppo) dell'EditorWaza.
 * Riproduce i tre stati chiave con i token Dark Arcane e le frasi reali del
 * render meccanico. Non fa parte del bundle dell'app.
 *
 *   bun run scripts/editor-mobile-harness.ts <stato> <larghezza> > out.html
 *   stato: blocchi | skiru | validazione
 */
import { BLOCCO_TIPO_LABELS } from "../src/components/sviluppo/waza/editor/effetti-schema";
import { renderBloccoMeccanico } from "../src/components/sviluppo/waza/editor/waza-blocco-render";
import { SKIRU_BRANCHES, SKIRU_CATALOG } from "@domain/skiru/catalog";

const STATE = (process.argv[2] ?? "blocchi") as "blocchi" | "skiru" | "validazione";
const W = Number(process.argv[3]) || 390;

const TIER_DMG = 6;
const effetti: Record<string, unknown>[] = [
  {
    tipo: "DANNO",
    trigger: "AL_LANCIO",
    bersaglio: "BERSAGLIO_SINGOLO",
    durata: { tipo: "ISTANTANEA" },
    valore: { tipo: "TIER" },
  },
  {
    tipo: "BUFF_SKIRU",
    trigger: "AL_LANCIO",
    bersaglio: "SE_STESSO",
    durata: { tipo: "TURNI", n: 2 },
    valore: { tipo: "FISSO", n: 2 },
    skiru: "kensei",
  },
];
const righe = effetti.map((b) => renderBloccoMeccanico(b, TIER_DMG));

const tabSwitch = `
  <div class="tabs-wrap">
    <div class="tabs">
      <button class="tab ${STATE !== "x" ? "active-mod" : ""}">Modifica</button>
      <button class="tab-ant">Anteprima <span class="mut">(2)</span><span class="dot"></span></button>
    </div>
  </div>`;

function cardBloccoAperta(): string {
  return `
  <article class="card-blocco">
    <header class="card-blocco-head">
      <p class="bl-title">Blocco 1 — ${BLOCCO_TIPO_LABELS.DANNO}</p>
      <div class="bl-actions">
        <button class="mini">↑</button><button class="mini">↓</button>
        <button class="mini">Duplica</button><button class="mini danger">Elimina</button>
      </div>
    </header>
    <div class="card-blocco-body">
      <label class="fld"><span class="lbl">Quando scatta</span>
        <select class="sel"><option>AL_LANCIO</option></select></label>
      <label class="fld"><span class="lbl">Su chi/dove</span>
        <select class="sel"><option>BERSAGLIO_SINGOLO</option></select></label>
      <label class="fld"><span class="lbl">Per quanto dura</span>
        <div class="grid3"><select class="sel"><option>ISTANTANEA</option></select></div></label>
      <label class="fld"><span class="lbl">Danno</span>
        <div class="valore-box">
          <span class="lbl">Tipo valore</span>
          <select class="sel"><option>Danno tier (piatto)</option></select>
          <p class="hint">Danno piatto tier: <b>${TIER_DMG}</b></p>
        </div>
      </label>
    </div>
  </article>

  <article class="card-blocco">
    <header class="card-blocco-head">
      <p class="bl-title">Blocco 2 — ${BLOCCO_TIPO_LABELS.BUFF_SKIRU}</p>
      <div class="bl-actions">
        <button class="mini">↑</button><button class="mini">↓</button>
        <button class="mini">Duplica</button><button class="mini danger">Elimina</button>
      </div>
    </header>
    <div class="card-blocco-body">
      <label class="fld"><span class="lbl">Su chi/dove</span>
        <select class="sel"><option>SE_STESSO</option></select></label>
      <label class="fld"><span class="lbl">Skiru</span>
        <select class="sel"><option>kensei</option></select></label>
    </div>
  </article>`;
}

function miniPreview(): string {
  return `
  <button class="mini-preview">
    <span class="mp-head">
      <span class="lbl">Come si legge — ultima riga</span>
      <span class="mp-link">vedi tutto →</span>
    </span>
    <span class="mp-body">${righe[righe.length - 1]}</span>
  </button>`;
}

function blocchiSection(): string {
  return `
  <section class="sec">
    <div class="sec-head">
      <h2 class="sec-title">Blocchi effetto</h2>
      <button class="add-btn">+ Aggiungi effetto</button>
    </div>
    ${cardBloccoAperta()}
    ${miniPreview()}
  </section>`;
}

function stickyBar(err: number, avv: number): string {
  const cls = err > 0 ? "count-err" : avv > 0 ? "count-avv" : "count-ok";
  return `
  <div class="sticky-bar">
    <button class="act gold">Salva</button>
    <button class="act violet">Valida</button>
    <button class="count ${cls}">${err} err · ${avv} avv</button>
  </div>`;
}

function validazionePanel(): string {
  return `
  <aside class="valida">
    <h3 class="valida-title">Validazione</h3>
    <p class="v-info">Validazione fallita: correggi gli errori.</p>
    <ul class="v-list">
      <li class="v-err"><span class="v-path">[effetti/0/valore]</span> Il valore TIER richiede un tier impostato in anagrafica.</li>
      <li class="v-err"><span class="v-path">[nomeItaliano]</span> Il nome italiano è obbligatorio.</li>
    </ul>
    <ul class="v-list">
      <li class="v-avv">Le waza attive dovrebbero dichiarare almeno una Skiru papabile per l'IR.</li>
    </ul>
  </aside>`;
}

function skiruSheet(): string {
  const groups = SKIRU_BRANCHES.map((b) => {
    const items = SKIRU_CATALOG.filter((s) => s.branchId === b.id).slice(0, 4);
    if (items.length === 0) return "";
    const domain = b.domain === "ten" ? "Ten" : b.domain === "chi" ? "Chi" : "Jin";
    const rows = items
      .map((s, i) => {
        const active = s.id === "kensei" || i === 0;
        const label = s.nameRomaji ? `${s.name} (${s.nameRomaji})` : s.name;
        return `<label class="sk-row">
          <input type="checkbox" ${active ? "checked" : ""} class="sk-cb"/>
          <span class="sk-lbl"><span class="${active ? "sk-on" : "sk-off"}">${label}</span>
          <span class="sk-id">${s.id}</span></span></label>`;
      })
      .join("");
    return `<div class="sk-group"><button class="sk-head">${domain} · ${
      b.labelRomaji ?? b.label
    } · ${b.label}<span class="chev">▾</span></button>${rows}</div>`;
  }).join("");

  return `
  <div class="sheet-overlay">
    <div class="sheet">
      <div class="sheet-head">
        <h3 class="sheet-title">Skiru papabili per l'IR</h3>
        <button class="sheet-x">✕</button>
      </div>
      <div class="sheet-search"><input class="search" placeholder="Cerca Skiru…" value=""/></div>
      <div class="sheet-body">${groups}</div>
    </div>
  </div>`;
}

const css = `
  :root{--background:#050508;--foreground:#e5e5e5;--accent-gold:#d4af37;--accent-violet:#7c3aed;--accent-violet-light:#a78bfa;--panel-bg:#0f0f12;--border-color:#2a2a32;}
  *{box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;}
  html,body{margin:0;background:#000;}
  .vp{width:${W}px;background:var(--background);min-height:800px;color:var(--foreground);position:relative;padding-bottom:64px;}
  .top{padding:14px 14px 0;}
  h1{color:var(--accent-gold);font-size:18px;margin:2px 0 0;}
  .slug{font-size:11px;color:#7a7a83;font-family:monospace;margin:2px 0 0;}
  .status{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.06em;padding:2px 8px;border-radius:6px;border:1px solid color-mix(in srgb,var(--accent-violet) 40%,transparent);color:var(--accent-violet-light);margin-top:8px;}
  .tabs-wrap{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--background) 95%,transparent);padding:10px 13px;}
  .tabs{display:grid;grid-template-columns:1fr 1fr;gap:4px;border:1px solid var(--border-color);border-radius:8px;padding:4px;}
  .tab,.tab-ant{min-height:40px;border-radius:6px;font-size:14px;border:1px solid transparent;background:transparent;color:#8a8a93;position:relative;}
  .active-mod{background:var(--panel-bg);color:var(--accent-gold);border-color:color-mix(in srgb,var(--accent-gold) 40%,transparent);}
  .tab-ant .mut{color:#7a7a83;font-size:10px;}
  .dot{position:absolute;top:6px;right:10px;width:8px;height:8px;border-radius:999px;background:var(--accent-gold);}
  .sec{padding:0 14px;}
  .sec-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0 10px;}
  .sec-title{font-size:14px;color:var(--accent-gold);margin:0;}
  .add-btn{min-height:44px;padding:0 12px;border-radius:6px;border:1px solid color-mix(in srgb,var(--accent-gold) 50%,transparent);color:var(--accent-gold);background:transparent;font-size:14px;}
  .card-blocco{border:1px solid var(--border-color);border-radius:8px;background:color-mix(in srgb,var(--panel-bg) 60%,transparent);overflow:hidden;box-shadow:inset 3px 0 0 var(--accent-gold);margin-bottom:12px;}
  .card-blocco-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px;padding:8px 12px;background:rgba(0,0,0,.3);border-bottom:1px solid color-mix(in srgb,var(--border-color) 60%,transparent);}
  .bl-title{font-size:12px;color:var(--accent-gold);margin:0;}
  .bl-actions{display:flex;flex-wrap:wrap;gap:4px;}
  .mini{font-size:10px;padding:2px 8px;border-radius:4px;border:1px solid var(--border-color);color:#9a9aa3;background:transparent;}
  .mini.danger{color:#f87171cc;}
  .card-blocco-body{padding:12px;display:flex;flex-direction:column;gap:12px;}
  .fld{display:flex;flex-direction:column;gap:4px;}
  .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#7a7a83;}
  .sel{width:100%;min-height:44px;padding:0 10px;border-radius:6px;border:1px solid var(--border-color);background:var(--background);color:var(--foreground);font-size:14px;}
  .grid3{display:grid;grid-template-columns:1fr;gap:8px;}
  .valore-box{border:1px solid color-mix(in srgb,var(--border-color) 70%,transparent);background:rgba(0,0,0,.2);border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:6px;}
  .hint{font-size:12px;color:var(--accent-violet-light);margin:0;}
  .hint b{color:var(--accent-gold);}
  .mini-preview{display:block;width:100%;text-align:left;border:1px solid color-mix(in srgb,var(--accent-violet) 30%,transparent);background:color-mix(in srgb,var(--panel-bg) 40%,transparent);border-radius:6px;padding:8px 12px;margin-top:2px;}
  .mp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
  .mp-link{font-size:10px;color:var(--accent-gold);}
  .mp-body{display:block;font-size:14px;color:color-mix(in srgb,var(--accent-violet-light) 90%,transparent);line-height:1.35;margin-top:4px;}
  .valida{margin:14px;border:1px solid var(--border-color);border-radius:8px;background:color-mix(in srgb,var(--background) 95%,transparent);padding:12px;box-shadow:0 0 12px rgba(124,58,237,.25);}
  .valida-title{font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent-violet-light);margin:0 0 6px;}
  .v-info{font-size:12px;color:var(--accent-violet-light);margin:0 0 6px;}
  .v-list{list-style:none;margin:0 0 6px;padding:0;display:flex;flex-direction:column;gap:4px;}
  .v-err{font-size:12px;color:#fca5a5;}
  .v-path{font-family:monospace;font-size:10px;color:#f8717199;margin-right:4px;}
  .v-avv{font-size:12px;color:color-mix(in srgb,var(--accent-gold) 80%,transparent);}
  .sticky-bar{position:fixed;bottom:0;left:0;width:${W}px;z-index:30;border-top:1px solid var(--border-color);background:color-mix(in srgb,var(--background) 95%,transparent);padding:8px 12px;display:flex;align-items:center;gap:8px;}
  .act{flex:1;min-height:44px;border-radius:6px;font-size:14px;background:transparent;}
  .act.gold{border:1px solid color-mix(in srgb,var(--accent-gold) 60%,transparent);color:var(--accent-gold);}
  .act.violet{border:1px solid color-mix(in srgb,var(--accent-violet) 50%,transparent);color:var(--accent-violet-light);}
  .count{min-height:44px;padding:0 12px;border-radius:6px;font-size:12px;white-space:nowrap;background:transparent;}
  .count-err{border:1px solid #f8717180;color:#fca5a5;}
  .count-avv{border:1px solid color-mix(in srgb,var(--accent-gold) 50%,transparent);color:var(--accent-gold);}
  .count-ok{border:1px solid var(--border-color);color:#9a9aa3;}
  .sheet-overlay{position:fixed;top:0;left:0;width:${W}px;height:100%;z-index:50;display:flex;flex-direction:column;justify-content:flex-end;background:rgba(0,0,0,.6);}
  .sheet{background:var(--panel-bg);border-top:1px solid var(--border-color);border-radius:16px 16px 0 0;max-height:85%;display:flex;flex-direction:column;}
  .sheet-head{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid color-mix(in srgb,var(--border-color) 60%,transparent);}
  .sheet-title{font-size:14px;color:var(--accent-gold);margin:0;}
  .sheet-x{width:44px;height:44px;background:transparent;border:none;color:#9a9aa3;font-size:16px;}
  .sheet-search{padding:12px 16px;border-bottom:1px solid color-mix(in srgb,var(--border-color) 40%,transparent);}
  .search{width:100%;min-height:44px;padding:0 12px;border-radius:6px;border:1px solid var(--border-color);background:var(--background);color:var(--foreground);font-size:14px;}
  .sheet-body{overflow-y:auto;padding:8px 16px 16px;}
  .sk-group{border-top:1px solid color-mix(in srgb,var(--border-color) 40%,transparent);padding-top:6px;}
  .sk-head{width:100%;text-align:left;min-height:44px;background:transparent;border:none;font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--accent-gold);display:flex;align-items:center;justify-content:space-between;}
  .chev{color:#7a7a83;}
  .sk-row{display:flex;align-items:flex-start;gap:12px;min-height:44px;padding:8px 4px;}
  .sk-cb{width:20px;height:20px;margin-top:2px;}
  .sk-lbl{font-size:14px;line-height:1.3;}
  .sk-on{color:var(--accent-gold);}
  .sk-off{color:var(--accent-violet-light);}
  .sk-id{display:block;font-size:10px;color:#7a7a83;font-family:monospace;}
`;

let body = "";
if (STATE === "blocchi") {
  body = `${tabSwitch}${blocchiSection()}${stickyBar(0, 1)}`;
} else if (STATE === "validazione") {
  body = `${tabSwitch}<section class="sec"><div class="sec-head"><h2 class="sec-title">Blocchi effetto</h2><button class="add-btn">+ Aggiungi effetto</button></div>${miniPreview()}</section>${validazionePanel()}${stickyBar(2, 1)}`;
} else {
  body = `${tabSwitch}${blocchiSection()}${stickyBar(0, 1)}${skiruSheet()}`;
}

process.stdout.write(`<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>${css}</style></head>
<body><div class="vp">
  <div class="top">
    <p class="slug">← Catalogo Waza</p>
    <h1>Rilascio della Fiamma</h1>
    <p class="slug">do/toka-do/rilascio-della-fiamma</p>
    <span class="status">Bozza · v1</span>
  </div>
  ${body}
</div></body></html>`);
