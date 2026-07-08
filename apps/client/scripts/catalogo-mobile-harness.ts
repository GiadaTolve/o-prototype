/**
 * Harness di anteprima mobile (solo screenshot di sviluppo) del CatalogoWaza.
 * Riproduce il layout a card impilate + barra filtri a scomparsa con i token
 * Dark Arcane. Non fa parte del bundle dell'app.
 *
 *   bun run scripts/catalogo-mobile-harness.ts [larghezza_px] > /tmp/catalogo-mobile.html
 */
const VIEWPORT_W = Number(process.argv[2]) || 390;
import {
  WAZA_CATEGORIA_LABELS,
  WAZA_STATO_CODIFICA_META,
  WAZA_VERSIONE_STATO_LABELS,
} from "../src/components/sviluppo/waza/waza-admin-ui";

type Item = {
  categoria: keyof typeof WAZA_CATEGORIA_LABELS;
  genitore: string | null;
  tipo: "attiva" | "passiva";
  tier: number | null;
  cs: number;
  stato: keyof typeof WAZA_VERSIONE_STATO_LABELS;
  statoCodifica: keyof typeof WAZA_STATO_CODIFICA_META;
  nomeRomaji: string;
  nomeItaliano: string;
  kanji: string | null;
  kanjiVerificato: boolean;
  tags: string[];
};

const items: Item[] = [
  {
    categoria: "do",
    genitore: "Tōka-dō",
    tipo: "attiva",
    tier: 2,
    cs: 2,
    stato: "bozza",
    statoCodifica: "ibrida",
    nomeRomaji: "Hōshutsu",
    nomeItaliano: "Rilascio della Fiamma",
    kanji: "放出",
    kanjiVerificato: true,
    tags: ["Energetica", "Fuoco"],
  },
  {
    categoria: "madosho",
    genitore: "Gōkaon",
    tipo: "attiva",
    tier: 3,
    cs: 4,
    stato: "validata",
    statoCodifica: "automatica",
    nomeRomaji: "Kyōmei",
    nomeItaliano: "Risonanza Fragorosa",
    kanji: "共鳴",
    kanjiVerificato: false,
    tags: ["Sonora"],
  },
  {
    categoria: "generica",
    genitore: null,
    tipo: "passiva",
    tier: null,
    cs: 0,
    stato: "bozza",
    statoCodifica: "da_codificare",
    nomeRomaji: "Kamae",
    nomeItaliano: "Postura di Guardia",
    kanji: null,
    kanjiVerificato: true,
    tags: [],
  },
];

const badge =
  "font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid var(--border-color);color:#9a9aa3;white-space:nowrap;";
const badgeViolet =
  "font-size:10px;padding:2px 6px;border-radius:4px;border:1px solid color-mix(in srgb,var(--accent-violet) 40%,transparent);color:var(--accent-violet-light);white-space:nowrap;";

function card(it: Item): string {
  const cod = WAZA_STATO_CODIFICA_META[it.statoCodifica];
  return `
  <article class="card">
    <div class="card-head">
      <div class="card-title">
        <div class="nome">${it.nomeItaliano}</div>
        <div class="romaji">${it.nomeRomaji}${it.kanji ? ` · ${it.kanji}` : ""}${
          it.kanji && !it.kanjiVerificato ? ` <span class="warn">「?」</span>` : ""
        }</div>
      </div>
      ${it.tier ? `<span class="tier">T${it.tier}</span>` : ""}
    </div>
    <div class="row">
      <span style="${badge}">${WAZA_CATEGORIA_LABELS[it.categoria]}</span>
      ${it.genitore ? `<span style="${badgeViolet}">${it.genitore}</span>` : ""}
      <span style="${badge};text-transform:capitalize;">${it.tipo}</span>
      <span style="${badge}">CS ${it.cs}</span>
    </div>
    <div class="row">
      <span style="${badgeViolet};text-transform:uppercase;letter-spacing:.06em;">${
        WAZA_VERSIONE_STATO_LABELS[it.stato]
      }</span>
      <span style="${badge}">${cod.emoji} ${cod.label}</span>
    </div>
    ${
      it.tags.length
        ? `<div class="row">${it.tags.map((t) => `<span style="${badge}">${t}</span>`).join("")}</div>`
        : ""
    }
    <div class="actions">
      <a class="btn-open">Apri</a>
      <button class="btn">Duplica</button>
      <button class="btn">${it.stato ? "Archivia" : "Archivia"}</button>
    </div>
  </article>`;
}

process.stdout.write(`<!doctype html>
<html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{--background:#050508;--foreground:#e5e5e5;--accent-gold:#d4af37;--accent-violet:#7c3aed;--accent-violet-light:#a78bfa;--panel-bg:#0f0f12;--border-color:#2a2a32;}
  *{box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;}
  html,body{margin:0;background:#000;}
  .viewport{width:${VIEWPORT_W}px;background:var(--background);padding:14px;color:var(--foreground);overflow-x:hidden;}
  .header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px;}
  h1{color:var(--accent-gold);font-size:19px;margin:0;}
  .sub{font-size:12px;color:var(--accent-violet-light);margin:4px 0 0;}
  .head-btns{display:flex;flex-wrap:wrap;gap:8px;}
  .head-btns a,.head-btns button{font-size:12px;padding:6px 12px;border-radius:6px;border:1px solid var(--border-color);color:#9a9aa3;background:transparent;}
  .head-btns .crea{border-color:color-mix(in srgb,var(--accent-gold) 50%,transparent);color:var(--accent-gold);}
  .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
  .chip{display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:4px 8px;border-radius:6px;border:1px solid var(--border-color);background:color-mix(in srgb,var(--background) 60%,transparent);}
  .chip b{color:var(--accent-gold);font-weight:600;}
  .chip span{color:var(--accent-violet-light);}
  .filtri{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:6px;border:1px solid var(--border-color);color:var(--accent-violet-light);font-size:14px;background:transparent;margin-bottom:12px;}
  .filtri .count{margin-left:8px;font-size:10px;padding:2px 6px;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent-gold) 50%,transparent);color:var(--accent-gold);}
  .filtri .state{font-size:12px;color:#8a8a93;}
  .cards{display:flex;flex-direction:column;gap:8px;}
  .card{border:1px solid var(--border-color);background:color-mix(in srgb,var(--panel-bg) 50%,transparent);border-radius:8px;padding:12px;display:flex;flex-direction:column;gap:8px;}
  .card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;}
  .nome{font-size:15px;color:var(--foreground);}
  .romaji{font-size:12px;color:#8a8a93;}
  .warn{color:var(--accent-gold);}
  .tier{flex-shrink:0;font-size:10px;padding:2px 8px;border-radius:6px;border:1px solid color-mix(in srgb,var(--accent-gold) 40%,transparent);color:var(--accent-gold);}
  .row{display:flex;flex-wrap:wrap;gap:4px;}
  .actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px;padding-top:4px;}
  .btn-open{grid-column:1 / -1;text-align:center;font-size:12px;padding:10px 12px;border-radius:6px;border:1px solid color-mix(in srgb,var(--accent-gold) 50%,transparent);color:var(--accent-gold);}
  .btn{min-width:0;font-size:12px;padding:10px 12px;border-radius:6px;border:1px solid var(--border-color);color:#9a9aa3;background:transparent;}
</style></head>
<body>
  <div class="viewport">
  <div class="header">
    <div>
      <h1>Catalogo Waza</h1>
      <p class="sub">Authoring a blocchi per il manuale di gioco.</p>
    </div>
    <div class="head-btns">
      <a>← Sviluppo</a>
      <button class="crea">+ Crea</button>
      <button>⟳ Aggiorna</button>
    </div>
  </div>

  <div class="chips">
    <span class="chip"><b>1</b><span>codificate</span></span>
    <span class="chip"><b>1</b><span>ibride</span></span>
    <span class="chip"><b>0</b><span>manuali</span></span>
    <span class="chip"><b>1</b><span>da fare</span></span>
  </div>

  <button class="filtri">
    <span>🔍 Filtri <span class="count">2</span></span>
    <span class="state">Mostra</span>
  </button>

  <div class="cards">
    ${items.map(card).join("")}
  </div>
  </div>
</body></html>`);
