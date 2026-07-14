import React, { useState, useMemo } from "react";

// ─────────────────────────────────────────────────────────────
// MOCKUP v2 · Pannello Combattimento — "Lancio Waza"
// Vista giocatore. Dati d'esempio. Nessun calcolo reale.
// Novità v2: dichiarazione d'uso (impugni/Tōrō), ricerca+filtri+preferiti,
// waza non-lanciabili spente, controlli costrutto (taglia+sticker, Batteria -5CS).
// ─────────────────────────────────────────────────────────────

const C = {
  bg: "#0e0b14", panel: "#171320", panelSoft: "#1f1a2b", line: "#2c2438",
  ink: "#ece7f5", muted: "#8b8199", ember: "#e8763a", emberSoft: "#3a2519",
  jigo: "#a583e0", jigoSoft: "#241d33", ok: "#5fbf8f", hp: "#d9556b", cs: "#5aa9e6",
  off: "#4a4356",
};
const font = {
  display: "'Iowan Old Style','Palatino Linotype',Palatino,Georgia,serif",
  body: "'Avenir Next','Segoe UI',system-ui,sans-serif",
  data: "'SF Mono','JetBrains Mono',ui-monospace,monospace",
};

const PG = {
  nome: "Botan", hp: [58, 80], cs: 7,
  impugna: ["Rivoltella intarsiata", "Coltello rituale"], // dichiarati in scheda, qui li "usa"
  status: [
    { nome: "Metamorfosi", stack: 3, tono: C.jigo },
    { nome: "Pressione", stack: 5, tono: C.ember },
  ],
};

// fonte: stile | madosho | ordine | generica | premio
const WAZA = [
  { id: "hoshutsu", nome: "Hōshutsu", it: "Rilascio della Fiamma", fonte: "stile", stile: "Tōka-dō", tier: 2, cs: 2, tags: ["Prop. Conica", "Energetica"], costrutto: false, fav: true },
  { id: "kotsudan", nome: "Kotsudan", it: "Proiettile Osseo", fonte: "madosho", stile: "Gōkaon", tier: 1, cs: 1, tags: ["Proiettile", "Solido"], costrutto: true, fav: true, reqStack: { nome: "Metamorfosi", n: 1 } },
  { id: "ukabu", nome: "Ukabu Tōrō", it: "Lanterna Fluttuante", fonte: "stile", stile: "Tōka-dō", tier: 2, cs: 2, tags: ["Costrutto"], costrutto: true, fav: false },
  { id: "kyomei", nome: "Kyōmei", it: "Risonanza della Fiamma", fonte: "stile", stile: "Tōka-dō", tier: 2, cs: 2, tags: ["Contatto"], costrutto: false, fav: false },
  { id: "suishin", nome: "Suishin", it: "Spinta d'Acqua", fonte: "generica", stile: "Generiche", tier: 1, cs: 1, tags: ["Raggio", "Liquido"], costrutto: false, fav: false },
  { id: "oni-ago", nome: "Oni no Ago", it: "Mascella dell'Ogre", fonte: "madosho", stile: "Gōkaon", tier: 2, cs: 2, tags: ["Contatto", "Solido"], costrutto: false, fav: false, reqCs: 2 },
];

const FONTI = [
  { k: "tutte", label: "Tutte" },
  { k: "stile", label: "Stili" },
  { k: "madosho", label: "Madoshō" },
  { k: "ordine", label: "Ordine" },
  { k: "generica", label: "Generiche" },
  { k: "premio", label: "Premi" },
];
const FONTE_COL = { stile: C.ember, madosho: C.jigo, ordine: "#c9a24b", generica: "#6fae8f", premio: "#d97fae" };

const PAPABILI = { hoshutsu: ["Kensei", "Jūsei", "Kenka-Ō", "Seimitsu"], ukabu: ["Kensei", "Jūsei", "Kenka-Ō", "Kongen"], kotsudan: ["Nintai", "Gojū (Proiettile)", "Seimitsu"] };
const TAGLIE = ["Piccola", "Media", "Grande", "Enorme"];

export default function LancioWazaV2() {
  const [q, setQ] = useState("");
  const [fonte, setFonte] = useState("tutte");
  const [soloLanciabili, setSoloLanciabili] = useState(false);
  const [sel, setSel] = useState("kotsudan");
  const [skiruA, setSkiruA] = useState("Nintai");
  const [skiruB, setSkiruB] = useState("Gojū (Proiettile)");
  const [dett, setDett] = useState(false);
  const [taglia, setTaglia] = useState("Media");
  const [stk, setStk] = useState({ Batteria: false, Personale: false, "Tōrō": false });
  const [toroAttivi, setToroAttivi] = useState(["Rivoltella intarsiata"]);

  const lanciabile = (w) => {
    if (w.reqCs && PG.cs < w.reqCs) return false;
    if (w.reqStack) { const s = PG.status.find((x) => x.nome === w.reqStack.nome); if (!s || s.stack < w.reqStack.n) return false; }
    if (PG.cs < w.cs) return false;
    return true;
  };

  const lista = useMemo(() => {
    let l = WAZA.filter((w) =>
      (fonte === "tutte" || w.fonte === fonte) &&
      (q === "" || (w.nome + w.it + w.stile).toLowerCase().includes(q.toLowerCase()))
    );
    if (soloLanciabili) l = l.filter(lanciabile);
    // lanciabili prima, non-lanciabili in fondo
    return l.sort((a, b) => (lanciabile(b) ? 1 : 0) - (lanciabile(a) ? 1 : 0));
  }, [q, fonte, soloLanciabili]);

  const favoriti = WAZA.filter((w) => w.fav);
  const w = WAZA.find((x) => x.id === sel);
  const valSkiru = { Kensei: 6, "Jūsei": 6, "Kenka-Ō": 3, Seimitsu: 4, Nintai: 5, "Gojū (Proiettile)": 3, Kongen: 3 };
  const irBase = ((valSkiru[skiruA] + valSkiru[skiruB]) / 2);
  const ir = irBase.toFixed(1);
  const tierVal = { 1: 4, 2: 8, 3: 12, 4: 17, 5: 23 }[w.tier];
  const dannoBonus = PG.status.find((s) => s.nome === "Metamorfosi") ? 4 : 0;
  const dannoLordo = tierVal + dannoBonus;
  const csEffettivo = PG.cs - w.cs - (stk.Batteria ? 5 : 0);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: font.body, color: C.ink, padding: 12, display: "flex", flexDirection: "column", gap: 10, maxWidth: 460, margin: "0 auto" }}>

      {/* ── CRUSCOTTO ── */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontFamily: font.display, fontSize: 17 }}>{PG.nome}</span>
          <button style={{ fontSize: 11, color: C.jigo, background: "transparent", border: `1px solid ${C.jigo}44`, borderRadius: 7, padding: "3px 9px", cursor: "pointer", fontFamily: font.body }}>Campo ▸</button>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <Stat label="HP" val={`${PG.hp[0]}/${PG.hp[1]}`} col={C.hp} pct={PG.hp[0] / PG.hp[1]} />
          <Stat label="CS" val={PG.cs} col={C.cs} pct={PG.cs / 12} />
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
          <Chip k="IR" v="5" /><Chip k="CAC" v="3" /><Chip k="CAD" v="4" /><Chip k="Mov" v="6m" />
          <Chip k="Schivata" v="7" accent={C.jigo} /><Chip k="Parata" v="6" accent={C.jigo} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {PG.status.map((s) => (
            <span key={s.nome} style={{ fontSize: 11, fontFamily: font.data, background: C.panelSoft, border: `1px solid ${s.tono}44`, color: s.tono, borderRadius: 20, padding: "3px 9px" }}>{s.nome} <b>×{s.stack}</b></span>
          ))}
        </div>
      </div>

      {/* ── DICHIARAZIONE D'USO: cosa impugni ORA / cos'è Tōrō ORA ── */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "10px 12px" }}>
        <Label>In uso ora <span style={{ color: C.muted, textTransform: "none", letterSpacing: 0 }}>— cosa impugni e cos'è Tōrō (equipaggi in scheda)</span></Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {PG.impugna.map((arma) => {
            const isToro = toroAttivi.includes(arma);
            return (
              <div key={arma} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panelSoft, border: `1px solid ${isToro ? C.ember : C.line}`, borderRadius: 9, padding: "7px 11px" }}>
                <span style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 6, background: isToro ? C.ember : C.off }} />
                  {arma}
                  {arma.includes("Rivoltella") && <span style={{ fontSize: 10, fontFamily: font.data, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 5, padding: "1px 5px" }}>munizioni 4</span>}
                </span>
                <button onClick={() => setToroAttivi(isToro ? toroAttivi.filter((t) => t !== arma) : [...toroAttivi, arma])} style={{ fontSize: 11, fontFamily: font.body, background: isToro ? C.emberSoft : "transparent", color: isToro ? C.ember : C.muted, border: `1px solid ${isToro ? C.ember : C.line}`, borderRadius: 7, padding: "3px 10px", cursor: "pointer" }}>
                  {isToro ? "Tōrō ✓" : "rendi Tōrō"}
                </button>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 7, fontStyle: "italic" }}>Più oggetti possono essere Tōrō insieme. Le munizioni contano solo per gli spari normali, non per le waza.</div>
      </div>

      {/* ── LANCIO WAZA ── */}
      <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: 14, padding: "12px 14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: 9, background: C.ember, boxShadow: `0 0 8px ${C.ember}` }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>Lancio Waza</span>
        </div>

        {/* ricerca */}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca una waza…" style={{ width: "100%", boxSizing: "border-box", background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 9, padding: "9px 12px", color: C.ink, fontFamily: font.body, fontSize: 13, marginBottom: 9 }} />

        {/* filtri fonte */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }}>
          {FONTI.map((f) => (
            <button key={f.k} onClick={() => setFonte(f.k)} style={{ fontSize: 11.5, fontFamily: font.body, background: fonte === f.k ? C.jigo : C.panelSoft, color: fonte === f.k ? "#160f22" : C.muted, border: `1px solid ${fonte === f.k ? C.jigo : C.line}`, borderRadius: 20, padding: "4px 11px", cursor: "pointer", fontWeight: fonte === f.k ? 700 : 400 }}>{f.label}</button>
          ))}
          <button onClick={() => setSoloLanciabili(!soloLanciabili)} style={{ fontSize: 11.5, fontFamily: font.body, background: soloLanciabili ? C.ok : C.panelSoft, color: soloLanciabili ? "#0d1a13" : C.muted, border: `1px solid ${soloLanciabili ? C.ok : C.line}`, borderRadius: 20, padding: "4px 11px", cursor: "pointer", fontWeight: soloLanciabili ? 700 : 400 }}>lanciabili ora</button>
        </div>

        {/* preferiti */}
        {q === "" && fonte === "tutte" && (
          <>
            <Label>Preferiti</Label>
            <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
              {favoriti.map((x) => (
                <button key={x.id} onClick={() => setSel(x.id)} style={{ fontSize: 12.5, fontFamily: font.display, background: sel === x.id ? C.jigoSoft : C.panelSoft, border: `1px solid ${sel === x.id ? C.jigo : C.line}`, color: C.ink, borderRadius: 8, padding: "6px 11px", cursor: "pointer" }}>★ {x.nome}</button>
              ))}
            </div>
          </>
        )}

        {/* elenco */}
        <Label>{soloLanciabili ? "Lanciabili ora" : "Tutte le waza"}</Label>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {lista.map((x) => {
            const on = x.id === sel;
            const canCast = lanciabile(x);
            return (
              <button key={x.id} onClick={() => canCast && setSel(x.id)} disabled={!canCast} style={{ textAlign: "left", background: on ? C.jigoSoft : C.panelSoft, border: `1px solid ${on ? C.jigo : C.line}`, borderRadius: 10, padding: "8px 11px", cursor: canCast ? "pointer" : "not-allowed", color: canCast ? C.ink : C.off, opacity: canCast ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontFamily: font.display, fontSize: 15 }}>
                    {x.nome} <span style={{ color: canCast ? C.muted : C.off, fontSize: 12, fontFamily: font.body }}>· {x.it}</span>
                  </span>
                  <span style={{ fontFamily: font.data, fontSize: 10.5, color: canCast ? C.muted : C.off }}>T{x.tier} · {x.cs} CS</span>
                </div>
                <div style={{ display: "flex", gap: 5, marginTop: 5, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 9.5, fontFamily: font.data, color: FONTE_COL[x.fonte], border: `1px solid ${FONTE_COL[x.fonte]}44`, borderRadius: 5, padding: "1px 6px" }}>{x.stile}</span>
                  {x.tags.map((t) => <span key={t} style={{ fontSize: 9.5, fontFamily: font.data, color: canCast ? C.jigo : C.off, border: `1px solid ${canCast ? C.jigo : C.off}33`, borderRadius: 5, padding: "1px 6px" }}>{t}</span>)}
                  {!canCast && x.reqStack && <span style={{ fontSize: 9.5, color: C.hp, fontFamily: font.body }}>· serve {x.reqStack.nome} ×{x.reqStack.n}</span>}
                  {!canCast && x.reqCs && PG.cs < x.reqCs && <span style={{ fontSize: 9.5, color: C.hp, fontFamily: font.body }}>· CS insufficienti</span>}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── configurazione della waza scelta ── */}
        <div style={{ borderTop: `1px solid ${C.line}`, paddingTop: 14 }}>
          <Label>Configura · {w.nome}</Label>

          <div style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>Skiru per l'Indice (due papabili)</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <Select value={skiruA} onChange={setSkiruA} options={PAPABILI[sel] || PAPABILI.hoshutsu} />
            <span style={{ alignSelf: "center", color: C.muted }}>+</span>
            <Select value={skiruB} onChange={setSkiruB} options={PAPABILI[sel] || PAPABILI.hoshutsu} />
          </div>

          {/* controlli COSTRUTTO — solo se la waza evoca */}
          {w.costrutto && (
            <div style={{ background: C.jigoSoft, border: `1px solid ${C.jigo}44`, borderRadius: 10, padding: "10px 11px", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: C.jigo, marginBottom: 8, fontFamily: font.data }}>▚ Evoca un costrutto</div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Taglia</div>
              <div style={{ display: "flex", gap: 5, marginBottom: 10 }}>
                {TAGLIE.map((t) => (
                  <button key={t} onClick={() => setTaglia(t)} style={{ flex: 1, fontSize: 11, fontFamily: font.body, background: taglia === t ? C.jigo : C.panelSoft, color: taglia === t ? "#160f22" : C.muted, border: `1px solid ${taglia === t ? C.jigo : C.line}`, borderRadius: 7, padding: "5px 0", cursor: "pointer", fontWeight: taglia === t ? 700 : 400 }}>{t}</button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 5 }}>Sticker</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
                {Object.keys(stk).map((s) => (
                  <button key={s} onClick={() => setStk({ ...stk, [s]: !stk[s] })} style={{ fontSize: 11.5, fontFamily: font.body, background: stk[s] ? C.emberSoft : C.panelSoft, color: stk[s] ? C.ember : C.muted, border: `1px solid ${stk[s] ? C.ember : C.line}`, borderRadius: 7, padding: "4px 11px", cursor: "pointer" }}>{stk[s] ? "✓ " : ""}{s}</button>
                ))}
              </div>
              {/* parametri derivati dalla taglia */}
              <div style={{ display: "flex", gap: 12, fontSize: 11, fontFamily: font.data, color: C.muted, borderTop: `1px solid ${C.jigo}22`, paddingTop: 8 }}>
                <span>Resistenza <b style={{ color: C.ink }}>{taglia === "Grande" ? 7 : taglia === "Media" ? 5 : taglia === "Enorme" ? 10 : 2}</b></span>
                <span>Mov <b style={{ color: C.ink }}>{taglia === "Media" ? "6m" : taglia === "Piccola" ? "8m" : taglia === "Grande" ? "4m" : "2m"}</b></span>
                {stk.Batteria && <span style={{ color: C.ember }}>Batteria −5 CS →al costrutto</span>}
              </div>
            </div>
          )}

          {/* anteprima card */}
          <div style={{ background: C.panelSoft, border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 13px" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>Anteprima in chat</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span style={{ fontFamily: font.display, fontSize: 18 }}>{w.nome}</span>
              <span style={{ fontSize: 11, color: C.muted }}>{w.it}</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <BigNum label="Indice" val={ir} col={C.jigo} />
              <BigNum label="Danno" val={dannoLordo} col={C.ember} />
            </div>
            <button onClick={() => setDett(!dett)} style={{ marginTop: 10, background: "transparent", border: `1px solid ${C.line}`, color: C.muted, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontFamily: font.data }}>{dett ? "− nascondi calcoli" : "+ mostra calcoli"}</button>
            {dett && (
              <div style={{ marginTop: 10, fontSize: 12.5, fontFamily: font.data, color: C.muted, lineHeight: 1.7, borderTop: `1px solid ${C.line}`, paddingTop: 9 }}>
                <div style={{ color: C.jigo }}>Indice</div>
                <div>({skiruA} {valSkiru[skiruA]} + {skiruB} {valSkiru[skiruB]}) ÷ 2 = {ir}</div>
                <div style={{ color: C.ember, marginTop: 8 }}>Danno</div>
                <div>Tier {w.tier} = {tierVal}{dannoBonus ? ` + ${dannoBonus} (Metamorfosi ×3)` : ""} → {dannoLordo}</div>
                <div style={{ fontSize: 11, marginTop: 6, fontStyle: "italic", fontFamily: font.body }}>Ridotto da scudo e mitigazione del bersaglio, se il colpo entra.</div>
              </div>
            )}
          </div>

          {/* bersaglio + lancia */}
          <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
            <Select value="Creatura di cenere" onChange={() => {}} options={["Creatura di cenere", "Sagoma minore", "Nessun bersaglio"]} grow />
            <button style={{ background: C.ember, color: "#1a0e07", border: "none", borderRadius: 10, padding: "10px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer", boxShadow: `0 0 16px ${C.ember}55` }}>Lancia</button>
          </div>
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 7, textAlign: "right", fontFamily: font.data }}>CS dopo il lancio: {csEffettivo}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 10.5, color: C.muted, fontFamily: font.data }}>mockup v2 · dati d'esempio · nessun calcolo reale</div>
    </div>
  );
}

function Stat({ label, val, col, pct }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: C.muted, fontFamily: font.data }}>{label}</span>
        <span style={{ color: col, fontFamily: font.data, fontWeight: 600 }}>{val}</span>
      </div>
      <div style={{ height: 5, background: "#0000004d", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 1) * 100}%`, height: "100%", background: col, borderRadius: 4 }} />
      </div>
    </div>
  );
}
function Chip({ k, v, accent }) {
  return <span style={{ fontSize: 11, fontFamily: font.data, background: C.panelSoft, border: `1px solid ${accent ? accent + "55" : C.line}`, borderRadius: 7, padding: "3px 8px" }}><span style={{ color: C.muted }}>{k} </span><b style={{ color: accent || C.ink }}>{v}</b></span>;
}
function Label({ children }) {
  return <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: "uppercase", color: C.muted, margin: "0 0 8px" }}>{children}</div>;
}
function Select({ value, onChange, options, grow }) {
  return <select value={value} onChange={(e) => onChange(e.target.value)} style={{ flex: grow ? 1 : "unset", background: C.panelSoft, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 9, padding: "8px 10px", fontFamily: font.body, fontSize: 13, cursor: "pointer" }}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
}
function BigNum({ label, val, col }) {
  return <div style={{ flex: 1, background: C.bg, border: `1px solid ${col}33`, borderRadius: 10, padding: "10px 12px" }}><div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", color: C.muted, marginBottom: 3 }}>{label}</div><div style={{ fontFamily: font.data, fontSize: 26, fontWeight: 700, color: col, lineHeight: 1 }}>{val}</div></div>;
}
