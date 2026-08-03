import { useCallback, useState } from 'react'
import LevelUpTester from './LevelUpTester'
import CombatTester from './CombatTester'
import DamagePipelineTester from './DamagePipelineTester'
import StatusEffectsTester from './StatusEffectsTester'
import WazaBrowser from './WazaBrowser'
import MadoshoBrowser from './MadoshoBrowser'
import SkiruBrowser from './SkiruBrowser'
import IdeeESviluppo from './IdeeESviluppo'
import SvgMapEditor from './SvgMapEditor'
import { canPersistAuthoringToPool, deleteOyasumiPoolEntry } from './authoringApi'
import { useRuntimeWaza } from './RuntimeWazaContext'
import type { WazaDef } from './wazaPool'

type TabId = 'levelup' | 'combat' | 'damage' | 'status' | 'waza' | 'madosho' | 'skiru' | 'idee' | 'svg'

const TAB_IDS: TabId[] = ['levelup', 'combat', 'damage', 'status', 'waza', 'madosho', 'skiru', 'idee', 'svg']

function tabFromUrl(): TabId {
  try {
    const q = new URLSearchParams(window.location.search).get('tab')
    if (q && TAB_IDS.includes(q as TabId)) return q as TabId
  } catch {
    /* ignore */
  }
  return 'levelup'
}

function App() {
  const { refetch: refetchRuntimeWaza } = useRuntimeWaza()
  const [activeTab, setActiveTab] = useState<TabId>(tabFromUrl)
  const [wazaEditPayload, setWazaEditPayload] = useState<{ w: WazaDef; key: number } | null>(null)

  const selectTab = useCallback((tab: TabId) => {
    setActiveTab(tab)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url)
    } catch {
      /* ignore */
    }
  }, [])

  const handleConsumedWazaEditPayload = useCallback(() => {
    setWazaEditPayload(null)
  }, [])

  const handleEditWazaFromBrowser = useCallback((w: WazaDef) => {
    setWazaEditPayload({ w, key: Date.now() })
    selectTab('idee')
  }, [selectTab])

  const handleDeleteWazaFromBrowser = useCallback(async (w: WazaDef) => {
    if (!canPersistAuthoringToPool()) {
      window.alert('Salvataggio non disponibile: avvia npm run dev sul tester o imposta VITE_TESTER_API_URL.')
      return
    }
    if (!window.confirm(`Eliminare dal pool la Waza «${w.name}» (id: ${w.id})?`)) return
    try {
      await deleteOyasumiPoolEntry('waza', w.id)
      await refetchRuntimeWaza()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e))
    }
  }, [refetchRuntimeWaza])

  return (
    <div style={{ maxWidth: activeTab === 'svg' ? 1600 : 1120, margin: '0 auto', padding: activeTab === 'svg' ? '0 0.5rem' : undefined }}>
      <header
        style={{
          marginBottom: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          paddingBottom: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => selectTab('levelup')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'levelup'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'levelup' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'levelup' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Level Up
          </button>
          <button
            type="button"
            onClick={() => selectTab('combat')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'combat'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'combat' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'combat' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Combat Tester
          </button>
          <button
            type="button"
            onClick={() => selectTab('damage')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'damage'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'damage' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'damage' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Danno
          </button>
          <button
            type="button"
            onClick={() => selectTab('status')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'status'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'status' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'status' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Status
          </button>
          <button
            type="button"
            onClick={() => selectTab('waza')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'waza'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'waza' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'waza' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Tecniche
          </button>
          <button
            type="button"
            onClick={() => selectTab('madosho')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'madosho'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'madosho' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'madosho' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Madōshō
          </button>
          <button
            type="button"
            onClick={() => selectTab('skiru')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'skiru'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'skiru' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'skiru' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Skiru
          </button>
          <button
            type="button"
            onClick={() => selectTab('idee')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'idee'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'idee' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'idee' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Idee e sviluppo
          </button>
          <button
            type="button"
            onClick={() => selectTab('svg')}
            style={{
              padding: '0.5rem 1rem',
              background:
                activeTab === 'svg'
                  ? 'rgba(162,112,255,0.25)'
                  : 'rgba(255,255,255,0.05)',
              border: `1px solid ${
                activeTab === 'svg' ? '#a270ff' : 'rgba(255,255,255,0.2)'
              }`,
              borderRadius: 6,
              color: activeTab === 'svg' ? '#fff' : '#888',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}
          >
            Mappa
          </button>
        </div>
        <h1 style={{ margin: 0, fontSize: '1.4rem', color: '#c9a84a' }}>
          Oyasumi Tester
        </h1>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#888' }}>
          {activeTab === 'levelup' && 'Scala level-up, progresso EXP, mostrina.'}
          {activeTab === 'combat' && 'Simula combattimento automatico fra due build (senza Master).'}
          {activeTab === 'damage' && 'Calcolatore pipeline danno: tier, Scudo, Itami, milestone +15%.'}
          {activeTab === 'status' && 'Motore status: stack, decay, modificatori CS/danno/IR (emotivi, elementali, Madoshō).'}
          {activeTab === 'waza' && 'Lista tecniche Waza per ramo. Click per descrizione.'}
          {activeTab === 'madosho' && 'Catalogo waza Madoshō per lignaggio (Parte IV PDF).'}
          {activeTab === 'skiru' && 'Lista competenze e abilità Skiru per categoria.'}
          {activeTab === 'idee' && 'Authoring: Waza, Madōsho, Patti, Skiru, categorie e tassonomie.'}
          {activeTab === 'svg' && 'Step 2: renderer Canvas stile Watabou (Millhaven).'}
        </p>
      </header>

      {activeTab === 'levelup' && <LevelUpTester />}
      {activeTab === 'combat' && <CombatTester />}
      {activeTab === 'damage' && <DamagePipelineTester />}
      {activeTab === 'status' && <StatusEffectsTester />}
      {activeTab === 'waza' && (
        <WazaBrowser onEditWaza={handleEditWazaFromBrowser} onDeleteWaza={handleDeleteWazaFromBrowser} />
      )}
      {activeTab === 'madosho' && <MadoshoBrowser />}
      {activeTab === 'skiru' && <SkiruBrowser />}
      {activeTab === 'idee' && (
        <IdeeESviluppo
          wazaEditPayload={wazaEditPayload}
          onConsumedWazaEditPayload={handleConsumedWazaEditPayload}
        />
      )}
      {activeTab === 'svg' && <SvgMapEditor />}
    </div>
  )
}

export default App
