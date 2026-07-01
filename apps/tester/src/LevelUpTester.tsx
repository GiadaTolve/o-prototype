import { useState } from 'react'
import {
  LEVELS,
  LEVEL_CAP,
  getLevelUpProgress,
  getTotalKeysAtLevel,
  getKeysAwardedAtLevel,
  getGradeForLevel,
  getKeysPerLevel,
  formatLevelLabel,
} from './levelsConfig'
import { LevelUpBanner } from './LevelUpBanner'
import {
  EXP_PER_500_CHARS,
  DAILY_EXP_CAP,
  expFromChars,
  EXAMPLE_EXP_PER_GAME,
  EXAMPLE_GAMES_PER_WEEK,
  EXAMPLE_EXP_PER_WEEK,
} from './expGainConfig'

const PHASE_COLORS: Record<string, string> = {
  'EARLY-GAME': '#22c55e',
  'MID-GAME': '#eab308',
  'CORE': '#ef4444',
}

const GRADI_LORE = [
  { name: 'Nemuribito', def: 'Sognatore. Ha appena aperto il terzo occhio, deve destreggiarsi fra ordini e potenzialità.' },
  { name: 'Hakyō', def: 'Lo specchio infranto. Cadetto: ha scelto l\'ordine e si è iniziato allo studio della manipolazione dell\'Ego.' },
  { name: 'Bunsekikan', def: 'Analista affermato, riconosciuto come abile nella manipolazione. Corrispettivo del soldato.' },
  { name: 'Sentatsu Bunsekikan', def: 'Analista Superiore, specializzato in almeno un ramo. In grado di grandi cose nel proprio settore.' },
  { name: 'Kanteikan', def: 'Analista Esecutivo alle vette della carriera. Spesso a capo di settori e battaglioni.' },
  { name: "Shin'enkan", def: "Guardiano dell'Abisso. Ufficiali per cui il mondo onirico non ha più segreti. Comandano legioni." },
  { name: 'Akumu Zankyō', def: "L'eco dell'Incubo. Non più Analista né persona; parte del cosmo onirico. Titolo unico (nome di psicopatologia)." },
] as const

function LevelUpTester() {
  const [expTotal, setExpTotal] = useState(500)
  const progress = getLevelUpProgress(expTotal)
  const keysThisLevel = getKeysAwardedAtLevel(progress.currentLevel)
  const gradeLabel = getGradeForLevel(progress.currentLevel)
  const [showFullTable, setShowFullTable] = useState(false)
  const [showGradiLore, setShowGradiLore] = useState(false)
  const [showSpecialStates, setShowSpecialStates] = useState(false)
  const [simChars, setSimChars] = useState(6000)
  const simExp = expFromChars(simChars)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [showSkiruHint, setShowSkiruHint] = useState(false)

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto' }}>
      {/* Colonna sinistra — contenuto principale */}
      <div style={{ flex: 1, minWidth: 0, maxWidth: 720 }}>
      <header
        style={{
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '1rem',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#c9a84a' }}>
          Level Up Tester
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
          Curva EXP legacy (LEVELING_DESIGN, cap {LEVEL_CAP}) · Premi v3: Key + EXP spendibile (Skiru/skill).
        </p>
      </header>

      {/* Input EXP */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '0.75rem' }}>
          Esperienza Totale
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 80 }}>EXP totale</span>
            <input
              type="number"
              min={0}
              max={100000}
              value={expTotal}
              onChange={(e) => setExpTotal(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={inputStyle}
            />
          </label>
          <button
            type="button"
            onClick={() => setExpTotal((p) => p + 100)}
            style={btnAddStyle}
          >
            +100 EXP
          </button>
          <button
            type="button"
            onClick={() => setExpTotal((p) => p + 500)}
            style={btnAddStyle}
          >
            +500 EXP
          </button>
          <button
            type="button"
            onClick={() => setExpTotal((p) => p + 24)}
            style={{ ...btnAddStyle, background: 'rgba(234,179,8,0.2)', borderColor: '#eab308', color: '#eab308' }}
            title="+24 EXP = 1 giocata tipo (6 azioni × 1000 char)"
          >
            +24 (1 giocata)
          </button>
        </div>
      </section>

      {/* Simulatore EXP Gain */}
      <section style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.25)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '0.75rem' }}>
          Simulatore EXP Gain (modalità crociera)
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
          {EXP_PER_500_CHARS} EXP ogni 500 caratteri · Cap giornaliero {DAILY_EXP_CAP} EXP · Esempio: 6 azioni × 1000 char = {EXAMPLE_EXP_PER_GAME} EXP/giocata
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ minWidth: 100 }}>Caratteri</span>
            <input
              type="number"
              min={0}
              value={simChars}
              onChange={(e) => setSimChars(Math.max(0, parseInt(e.target.value, 10) || 0))}
              style={inputStyle}
            />
          </label>
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            → {simExp} EXP
          </span>
          <button
            type="button"
            onClick={() => setExpTotal((p) => p + simExp)}
            style={btnAddStyle}
          >
            Aggiungi a EXP totale
          </button>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
          Simulazione matura: {EXAMPLE_GAMES_PER_WEEK} giocate/settimana × {EXAMPLE_EXP_PER_GAME} EXP = <strong>{EXAMPLE_EXP_PER_WEEK} EXP/settimana</strong>
        </p>
      </section>

      {/* Mostrina / Risultato */}
      <section
        style={{
          marginBottom: '1.5rem',
          padding: '1.25rem',
          background: 'rgba(0,0,0,0.35)',
          borderRadius: 12,
          border: '1px solid rgba(212,175,55,0.3)',
        }}
      >
        <h2 style={{ fontSize: '1rem', color: '#a270ff', marginBottom: '1rem' }}>
          Mostrina Level Up
        </h2>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Livello attuale — distintivo */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(212,175,55,0.3), rgba(162,112,255,0.2))',
              border: '2px solid rgba(212,175,55,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 800,
              color: '#c9a84a',
              textShadow: '0 0 12px rgba(212,175,55,0.5)',
            }}
          >
            {progress.currentLevel}
          </div>

          {/* Progresso e dettagli */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.35rem' }}>
              {progress.phase && (
                <span
                  style={{
                    color: PHASE_COLORS[progress.phase] ?? '#888',
                    marginRight: '0.5rem',
                  }}
                >
                  {progress.phase}
                </span>
              )}
              <span style={{ color: progress.paragon > 0 ? '#a270ff' : '#c9a84a', fontWeight: 600 }}>
                {formatLevelLabel(progress.currentLevel, progress.paragon)}
              </span>
              {progress.atLevelCap && progress.paragon === 0 && (
                <span style={{ color: '#a270ff', marginLeft: '0.5rem' }}>CAP</span>
              )}
              {' · '}
              Grado indic.: <strong style={{ color: '#22c55e' }}>{gradeLabel}</strong>
              {' · '}
              Key: <strong style={{ color: '#c9a84a' }}>{getTotalKeysAtLevel(progress.currentLevel)}</strong>
              {' · '}
              Key questo lv.: <strong style={{ color: '#c9a84a' }}>{keysThisLevel}</strong>
            </div>
            {progress.progressPct != null && progress.expNeededForNext != null ? (
              <>
                <div
                  style={{
                    height: 10,
                    background: 'rgba(0,0,0,0.5)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    marginBottom: '0.5rem',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress.progressPct ?? 0}%`,
                      background: progress.atLevelCap
                        ? 'linear-gradient(90deg, #7c3aed, #a270ff)'
                        : 'linear-gradient(90deg, #22c55e, #c9a84a)',
                      borderRadius: 5,
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                  {progress.expTotal - progress.expAtCurrentLevel} / {progress.expNeededForNext} EXP
                  {' '}
                  {progress.atLevelCap ? (
                    <>verso Paragon <strong>★{progress.paragon + 1}</strong></>
                  ) : (
                    <>verso livello <strong>{progress.nextLevel}</strong></>
                  )}
                </div>
              </>
            ) : progress.atLevelCap && progress.paragon === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#22c55e' }}>
                Livello cap ({LEVEL_CAP}) raggiunto — oltre: Paragon.
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: '#a270ff' }}>
                Paragon <strong>{progress.paragon}</strong> — massimo tabella raggiunto.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabella soglie */}
      <section style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#a270ff', margin: 0 }}>
            Scala Livelli (Exp Δ, Exp tot.)
          </h2>
          <button
            type="button"
            onClick={() => setShowFullTable((v) => !v)}
            style={btnMutedStyle}
          >
            {showFullTable ? 'Mostra meno' : 'Mostra tabella completa'}
          </button>
        </div>
        <div
          style={{
            padding: '0.75rem',
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.08)',
            overflowX: 'auto',
            maxHeight: showFullTable ? 420 : 200,
            overflowY: showFullTable ? 'auto' : 'hidden',
          }}
        >
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <th style={thStyle}>Liv.</th>
                <th style={thStyle}>Exp Δ</th>
                <th style={thStyle}>Exp tot.</th>
                <th style={thStyle}>Grado</th>
                <th style={thStyle}>Key Δ</th>
                <th style={thStyle}>Fase</th>
              </tr>
            </thead>
            <tbody>
              {(showFullTable ? LEVELS : LEVELS.filter((_, i) => i < 10 || i % 5 === 0 || i === LEVELS.length - 1)).map(
                (row) => {
                  const isCurrent = row.level === progress.currentLevel
                  return (
                    <tr
                      key={row.level}
                      style={{
                        background: isCurrent ? 'rgba(212,175,55,0.12)' : undefined,
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <td style={tdStyle}>
                        {row.level}
                        {isCurrent && (
                          <span style={{ marginLeft: 4, color: '#c9a84a' }}>←</span>
                        )}
                      </td>
                      <td style={tdStyle}>{row.expDelta ?? '—'}</td>
                      <td style={tdStyle}>{row.expTotal.toLocaleString()}</td>
                      <td style={tdStyle}>{row.grade}</td>
                      <td style={tdStyle}>{getKeysPerLevel(row.level) || '—'}</td>
                      <td style={tdStyle}>
                        {row.phase && (
                          <span style={{ color: PHASE_COLORS[row.phase] ?? '#888' }}>
                            {row.phase}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                }
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Gradi — assegnati dal Consiglio */}
      <section style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#a270ff', margin: 0 }}>
            Carriera Militare Analisti
          </h2>
          <button type="button" onClick={() => setShowGradiLore((v) => !v)} style={btnMutedStyle}>
            {showGradiLore ? 'Nascondi definizioni' : 'Mostra definizioni'}
          </button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.75rem' }}>
          I gradi sono assegnati dal <strong>Consiglio di gestione a sua discrezione</strong>. Non vincolati al livello. Scelta ordine all&apos;Hakyō; non si può cambiare.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {GRADI_LORE.map((g) => (
            <span
              key={g.name}
              style={{
                padding: '0.35rem 0.6rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6,
                fontSize: '0.8rem',
                color: '#888',
              }}
            >
              {g.name}
            </span>
          ))}
        </div>
        {showGradiLore && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, fontSize: '0.8rem', color: '#bbb', lineHeight: 1.6 }}>
            {GRADI_LORE.map((g) => (
              <div key={g.name} style={{ marginBottom: '0.75rem' }}>
                <strong style={{ color: '#c9a84a' }}>{g.name}</strong> — {g.def}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Stati speciali: Benriya, Suteru */}
      <section style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1rem', color: '#a270ff', margin: 0 }}>
            Stati speciali
          </h2>
          <button type="button" onClick={() => setShowSpecialStates((v) => !v)} style={btnMutedStyle}>
            {showSpecialStates ? 'Nascondi' : 'Mostra Benriya / Suteru'}
          </button>
        </div>
        {showSpecialStates && (
          <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.85rem', color: '#bbb', lineHeight: 1.7 }}>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#eab308' }}>Benriya (Tuttofare)</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                Chi cambia ordine dopo averlo scelto viene marchiato Benriya — titolo divenuto dispregiativo. Trattati come reietti, ma non disertori. <em>Giocabile</em>: libero professionista, crescita troncata come da regolamento.
              </p>
            </div>
            <div>
              <strong style={{ color: '#ef4444' }}>Suteru</strong>
              <p style={{ margin: '0.35rem 0 0' }}>
                Termine per &quot;disertore&quot; (gettare la spazzatura). Dichiarazione rarissima, corrisponde alla morte al 99%. Richiede conferma di tutte le alte cariche. <em>Non giocabile</em>: il personaggio è concluso.
              </p>
            </div>
          </div>
        )}
      </section>
      </div>

      {/* Colonna destra — Banner Level Up (fuori, più grande, animato) */}
      <aside
        style={{
          flexShrink: 0,
          position: 'sticky',
          top: '1.5rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.5)',
          borderRadius: 12,
          border: '1px solid rgba(122,91,50,0.4)',
          boxShadow: '0 0 30px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: '#7a5b32', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '0.1em' }}>
          BANNER LEVEL UP
        </div>
        {bannerDismissed ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>Banner nascosto. Verrà mostrato al prossimo login.</p>
            <button
              type="button"
              onClick={() => setBannerDismissed(false)}
              style={btnAddStyle}
            >
              Simula login
            </button>
          </div>
        ) : (
          <div className="level-up-banner-animated">
            <LevelUpBanner
              level={progress.currentLevel}
              grade={progress.paragon > 0 ? `Paragon ${progress.paragon}` : gradeLabel}
              expCurrent={progress.expTotal - progress.expAtCurrentLevel}
              expNeeded={progress.expNeededForNext ?? 0}
              keys={keysThisLevel}
              expSpendableNote="EXP spendibile ↑ (Skiru / skill)"
              width={300}
              height={540}
              onInvestSkiru={() => setShowSkiruHint(true)}
              onSalta={() => setBannerDismissed(true)}
            />
          </div>
        )}
      </aside>

      {/* Hint investimento Skiru (ex «Aumenta stat») */}
      {showSkiruHint && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowSkiruHint(false)}
        >
          <div
            style={{
              padding: '1.5rem',
              background: 'rgba(20,15,10,0.98)',
              borderRadius: 12,
              border: '1px solid rgba(184,160,120,0.4)',
              maxWidth: 360,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 1rem', color: '#b8a078', fontSize: '1rem' }}>Investi EXP in Skiru</h3>
            <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#aaa', lineHeight: 1.5 }}>
              In v3 non si assegnano più punti F/C/D/M/E al level-up. L&apos;EXP guadagnata diventa{' '}
              <strong style={{ color: '#b8a078' }}>spendibile</strong> nella scheda → tab Skiru (nodi Ten · Chi · Jin)
              o nello shop skill/Waza.
            </p>
            <button
              type="button"
              onClick={() => setShowSkiruHint(false)}
              style={{ ...btnMutedStyle, marginTop: '0.5rem' }}
            >
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: 100,
  padding: '0.4rem',
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 6,
  color: '#fff',
}

const btnAddStyle: React.CSSProperties = {
  padding: '0.4rem 0.75rem',
  background: 'rgba(34,197,94,0.2)',
  border: '1px solid #22c55e',
  borderRadius: 6,
  color: '#22c55e',
  cursor: 'pointer',
  fontSize: '0.8rem',
}

const btnMutedStyle: React.CSSProperties = {
  padding: '0.35rem 0.6rem',
  fontSize: '0.75rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: 4,
  color: '#888',
  cursor: 'pointer',
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '0.4rem 0.5rem',
  color: '#888',
  fontSize: '0.75rem',
}

const tdStyle: React.CSSProperties = {
  padding: '0.35rem 0.5rem',
  color: '#ddd',
}

export default LevelUpTester
