/**
 * Harness di anteprima mobile (solo screenshot di sviluppo) del tab «Altro»
 * con la nuova sezione Staff (Gestionale / Sviluppo / Shinigami).
 *   bun run scripts/altro-mobile-harness.ts [larghezza] > out.html
 */
const W = Number(process.argv[2]) || 390;

const tiles = [
  ["🛒", "Mercato"],
  ["🏦", "Banca"],
  ["⚡", "Skiru & Waza"],
  ["📜", "Ordine"],
  ["🏆", "Bestiario"],
  ["👥", "Presenti"],
  ["🎮", "Spazio Eventi"],
  ["🔔", "Notifiche"],
];

process.stdout.write(`<!doctype html><html lang="it"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root{--background:#050508;--foreground:#e5e5e5;--accent-gold:#d4af37;--accent-violet:#7c3aed;--accent-violet-light:#a78bfa;--panel-bg:#0f0f12;--border-color:#2a2a32;}
  *{box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;}
  html,body{margin:0;background:#000;}
  .vp{width:${W}px;background:var(--background);color:var(--foreground);min-height:820px;display:flex;flex-direction:column;}
  .topbar{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--border-color);background:var(--panel-bg);}
  .topbar h1{font-size:14px;color:var(--accent-gold);margin:0;}
  .pane{flex:1;padding:16px;display:flex;flex-direction:column;gap:16px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  .tile{padding:16px 12px;border-radius:10px;border:1px solid var(--border-color);background:var(--panel-bg);display:flex;flex-direction:column;align-items:center;gap:8px;}
  .tile.staff{border-color:color-mix(in srgb,var(--accent-gold) 40%,transparent);}
  .tile.staff.violet{border-color:color-mix(in srgb,var(--accent-violet) 40%,transparent);}
  .ico{font-size:22px;}
  .lbl{font-size:12px;color:var(--accent-violet-light);}
  .staff-label{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:color-mix(in srgb,var(--accent-gold) 70%,transparent);margin:0;}
  .logout{width:100%;padding:12px;border-radius:10px;border:1px solid var(--border-color);color:rgba(167,139,250,.8);background:transparent;font-size:14px;}
  .bottom{display:flex;justify-content:space-around;border-top:1px solid var(--border-color);background:var(--panel-bg);padding:6px 4px;}
  .nav{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px;min-width:56px;border-radius:8px;color:rgba(167,139,250,.7);font-size:10px;}
  .nav.active{color:var(--accent-gold);background:color-mix(in srgb,var(--panel-bg) 75%,black);border:1px solid color-mix(in srgb,var(--accent-gold) 35%,var(--border-color));}
  .nav .ni{font-size:18px;}
</style></head>
<body><div class="vp">
  <div class="topbar"><h1>Oyasumi <span style="font-size:9px;color:rgba(167,139,250,.65)">dev</span></h1><span style="color:rgba(167,139,250,.8)">⎋</span></div>
  <div class="pane">
    <div class="grid">
      ${tiles.map(([i, l]) => `<div class="tile"><span class="ico">${i}</span><span class="lbl">${l}</span></div>`).join("")}
    </div>

    <div>
      <p class="staff-label">Staff</p>
      <div class="grid" style="margin-top:8px">
        <div class="tile staff"><span class="ico">⚙️</span><span class="lbl">Gestionale</span></div>
        <div class="tile staff"><span class="ico">✏️</span><span class="lbl">Sviluppo</span></div>
        <div class="tile staff violet"><span class="ico">◉</span><span class="lbl">Shinigami</span></div>
      </div>
    </div>

    <button class="logout">⎋ Esci</button>
  </div>
  <div class="bottom">
    <div class="nav"><span class="ni">👤</span>Scheda</div>
    <div class="nav"><span class="ni">✉️</span>SMS</div>
    <div class="nav"><span class="ni">🗺️</span>Mappa</div>
    <div class="nav"><span class="ni">📟</span>Beeper</div>
    <div class="nav active"><span class="ni">📺</span>Altro</div>
  </div>
</div></body></html>`);
