import { describe, expect, it } from 'vitest'
import {
  depositInvestimento,
  openInvestimento,
  readInvestimentoFromMeta,
  tickInvestimentoEndOfTurn,
  cashOutInvestimento,
} from '../styles/hado/investimento.ts'
import {
  openShakkinDebt,
  applyShakkinInterest,
  collectShakkinDebts,
  repayShakkinDebt,
} from '../styles/hado/debito-shakkin.ts'
import {
  extractInvestimentoDepositAmount,
  formatAdvancedCombatSegments,
  processWazaChatAutomation,
  resolveParticipantBySpec,
} from './waza-chat-automation.ts'
import { buildWazaTagIndex } from './waza-tag-preview.ts'
import { createStatusContainer, applyStatus } from './status/engine.ts'

const CATALOG_ENTRIES = [
  { name: 'Tōshi (投資) — Investimento Energetico', poolId: 'toshi-investimento-energetico', rank: 'T3', styleId: 'hado', isPassive: false },
  { name: 'Kōmei (抗命) — Chi lo ha deciso', poolId: 'komei-chi-lo-ha-deciso', rank: 'T3', styleId: 'naikan', isPassive: false },
  { name: 'Shokushin (触診) — Lettura del Corpo', poolId: 'shokushin-lettura-corpo', rank: 'T2', styleId: 'naikan', isPassive: false },
  { name: 'Nagori (名残) — Principio di Instabilità', poolId: 'nagori-principio-instabilita', rank: 'T3', styleId: 'hensei', isPassive: false },
  { name: 'Kankatsu (管轄) — Giurisdizione', poolId: 'kankatsu-giurisdizione', rank: 'T3', styleId: 'ito', isPassive: false },
  { name: 'Chokurei (勅令) — Decreto', poolId: 'chokurei-decreto', rank: 'T3', styleId: 'ito', isPassive: false },
  { name: 'Rakuen (楽園) — Eden', poolId: 'rakuen-eden', rank: 'T3', styleId: 'genzai', isPassive: false },
  { name: "Hōgō (縫合) — Sutura dell'Ego", poolId: 'hogo-sutura-ego', rank: 'T3', styleId: 'naikan', isPassive: false },
] as const

describe('Investimento Tōshi', () => {
  it('apre, versa e riscuote', () => {
    let meta = openInvestimento({})
    expect(readInvestimentoFromMeta(meta).active).toBe(true)

    const dep = depositInvestimento(meta, 4)
    meta = dep.meta
    expect(readInvestimentoFromMeta(meta).poolCs).toBe(4)

    const cash = cashOutInvestimento(meta)
    expect(cash.flatDamage).toBe(8)
    expect(cash.rangeBonusM).toBe(4)
    expect(readInvestimentoFromMeta(cash.meta).active).toBe(false)
  })

  it('perde investimento se non versa nel turno', () => {
    let meta = openInvestimento({})
    meta = depositInvestimento(meta, 2).meta
    const tick = tickInvestimentoEndOfTurn(meta)
    expect(tick.lost).toBe(false)
    meta = tick.meta
    const tick2 = tickInvestimentoEndOfTurn(meta)
    expect(tick2.lost).toBe(true)
  })
})

describe('Shakkin Debito', () => {
  it('accumula interessi e riscuote', () => {
    let meta = openShakkinDebt({}, 'debtor-1').meta
    meta = applyShakkinInterest(meta).meta
    expect(meta.hadoDebts?.[0]?.stacks).toBe(3)

    const col = collectShakkinDebts(meta)
    expect(col.collections[0]?.damage).toBe(15)
    expect(col.meta.hadoDebts).toHaveLength(0)
  })

  it('restituzione riduce stack', () => {
    let meta = openShakkinDebt({}, 'debtor-1').meta
    meta = repayShakkinDebt(meta, 'debtor-1').meta
    expect(meta.hadoDebts?.[0]?.stacks).toBe(1)
  })
})

describe('waza chat automation', () => {
  const emptyContainer = createStatusContainer()
  const index = buildWazaTagIndex(CATALOG_ENTRIES)

  it('rileva deposito investimento', () => {
    expect(extractInvestimentoDepositAmount('foo [investimento:+3] bar')).toBe(3)
  })

  it('processa apertura Tōshi da tag waza', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Tōshi (投資) — Investimento Energetico]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'investimento_open')).toBe(true)
    expect(r.csDelta).toBe(-2)
  })

  it('risolve bersaglio debito per nome', () => {
    const target = resolveParticipantBySpec(
      { nameQuery: 'Maria' },
      [{ characterId: 'b', name: 'Maria', surname: 'Rossi' }],
      'a',
    )
    expect(target?.characterId).toBe('b')
  })

  it('attiva Kōmei rimuovendo status negativi', () => {
    let container = applyStatus(emptyContainer, 'emorragia', { stacks: 2 })
    const r = processWazaChatAutomation({
      content: '[waza:Kōmei (抗命) — Chi lo ha deciso]',
      meta: {},
      statusContainer: container,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'komei_activated')).toBe(true)
    expect(r.statusContainer.statuses.some((s) => s.id === 'emorragia')).toBe(false)
    expect(r.csDelta).toBe(-6)
  })

  it('registra lettura Shokushin', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Shokushin (触診) — Lettura del Corpo] [lettura:Maria]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
      roomParticipants: [{ characterId: 'b', name: 'Maria', surname: 'Rossi' }],
    })
    expect(r.effects.some((e) => e.kind === 'shokushin_read')).toBe(true)
    expect(r.meta.naikanReadTarget?.characterId).toBe('b')
  })

  it('attiva Nagori e registra shift consistenza', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Nagori (名残) — Principio di Instabilità] [yuragi:liquido→solido]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'nagori_activated')).toBe(true)
    expect(r.effects.some((e) => e.kind === 'nagori_shift')).toBe(true)
    const segments = formatAdvancedCombatSegments(r.meta)
    expect(segments.some((s) => s.includes('Nagori'))).toBe(true)
  })

  it('attiva Giurisdizione con categoria e reclamo', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Kankatsu (管轄) — Giurisdizione] [giurisdizione:Proiettile]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'giurisdizione_activated')).toBe(true)
    expect(r.csDelta).toBe(-4)
    expect(r.meta.itoGiurisdizione?.category).toBe('proiettile')

    const claim = processWazaChatAutomation({
      content: '[giurisdizione:reclama]',
      meta: r.meta,
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(claim.effects.some((e) => e.kind === 'giurisdizione_claim')).toBe(true)
    expect(claim.csDelta).toBe(-2)
  })

  it('impone Decreto Chokurei', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Chokurei (勅令) — Decreto] [decreto: Quella Proiettile torna al mittente]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'decreto_imposed')).toBe(true)
    expect(r.meta.itoDecreto?.text).toContain('Proiettile')
  })

  it('applica sutura Hōgō su bersaglio', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Hōgō (縫合) — Sutura dell\'Ego] [sutura:Maria:stile]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
      roomParticipants: [{ characterId: 'b', name: 'Maria', surname: 'Rossi' }],
    })
    expect(r.effects.some((e) => e.kind === 'sutura_applied')).toBe(true)
    expect(r.csDelta).toBe(-7)
  })

  it('attiva Eden', () => {
    const r = processWazaChatAutomation({
      content: '[waza:Rakuen (楽園) — Eden]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'eden_activated')).toBe(true)
    expect(formatAdvancedCombatSegments(r.meta).some((s) => s.includes('Eden'))).toBe(true)
  })

  it('Eden rigenera costrutti con tag dedicato', () => {
    const r = processWazaChatAutomation({
      content: '[eden:rigenera:2]',
      meta: {
        genzaiEden: { turnsLeft: 3 },
        genzaiEdenDestroyedQueue: [
          { label: 'Pilastro', wazaTier: 3, size: 'media', stationary: true },
          { label: 'Muro', wazaTier: 4, size: 'grande', stationary: true },
        ],
      },
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.csDelta).toBe(-4)
    expect(r.effects.some((e) => e.kind === 'eden_regen')).toBe(true)
    const regen = r.effects.find((e) => e.kind === 'eden_regen')
    expect(regen && regen.kind === 'eden_regen' && regen.constructs).toHaveLength(2)
  })

  it('Investimento riscosso applica flat damage al prossimo colpo', () => {
    let meta = openInvestimento({})
    meta = depositInvestimento(meta, 3).meta
    const cash = cashOutInvestimento(meta)
    const r = processWazaChatAutomation({
      content: '[waza:Shoken] [tier:2] [hit:1] [target:Maria]',
      meta: cash.meta,
      statusContainer: emptyContainer,
      wazaIndex: buildWazaTagIndex([
        ...CATALOG_ENTRIES,
        {
          name: 'Shoken',
          poolId: 'generiche-shoken-eco-pugno',
          rank: 'T1',
          styleId: null,
          isPassive: false,
        },
      ]),
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
      roomParticipants: [{ characterId: 'b', name: 'Maria', surname: 'Rossi' }],
    })
    const dmg = r.effects.find((e) => e.kind === 'waza_launch_damage')
    expect(dmg && dmg.kind === 'waza_launch_damage' && dmg.flatBonus).toBe(6)
    expect(readInvestimentoFromMeta(r.meta).payoutPending).toBeNull()
  })

  it('Mugen dominio reclama genera tensione', () => {
    const r = processWazaChatAutomation({
      content: '[dominio:reclama]',
      meta: { itoMugenShihai: { turnsLeft: 3 } },
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'mugen_dominio_claim')).toBe(true)
    expect(r.meta.itoTension).toBe(1)
  })

  it('Shinryaku contatto infligge danno tier 5', () => {
    const shinryakuName = 'Shinryaku (侵略) — Invasione'
    const shinIndex = buildWazaTagIndex([
      ...CATALOG_ENTRIES,
      {
        name: shinryakuName,
        poolId: 'shinryaku-invasione',
        rank: 'T5',
        styleId: 'genzai',
        isPassive: false,
      },
    ])
    const r = processWazaChatAutomation({
      content: `[waza:${shinryakuName}] [shinryaku:contatto:Maria]`,
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: shinIndex,
      chronoCsAvailable: 20,
      actorCharacterId: 'a',
      roomParticipants: [{ characterId: 'b', name: 'Maria', surname: 'Rossi' }],
    })
    const hit = r.effects.find((e) => e.kind === 'shinryaku_contact_damage')
    expect(hit).toBeTruthy()
    if (hit?.kind === 'shinryaku_contact_damage') {
      expect(hit.damage).toBe(23)
      expect(hit.victimCharacterId).toBe('b')
    }
  })

  it('attiva Omocha e Gangushi', () => {
    const omochaIndex = buildWazaTagIndex([
      ...CATALOG_ENTRIES,
      {
        name: 'Omocha (玩具) — Il Giocattolo',
        poolId: 'omocha-il-giocattolo',
        rank: 'T4',
        styleId: 'toka',
        isPassive: false,
      },
    ])
    const omocha = processWazaChatAutomation({
      content: '[waza:Omocha (玩具) — Il Giocattolo] [omocha:Spada]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: omochaIndex,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(omocha.effects.some((e) => e.kind === 'omocha_activated')).toBe(true)
    expect(omocha.csDelta).toBe(-5)
  })

  it('registra Igyō-Rensei', () => {
    const wazaName = 'Igyō-Rensei (異形錬成) — Insegnamenti di Tucker'
    const igyoIndex = buildWazaTagIndex([
      ...CATALOG_ENTRIES,
      {
        name: wazaName,
        poolId: 'igyo-rensei-insegnamenti-tucker',
        rank: 'T4',
        styleId: 'hensei',
        isPassive: false,
      },
    ])
    const r = processWazaChatAutomation({
      content: `[waza:${wazaName}] [igyo:liquido]`,
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: igyoIndex,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.effects.some((e) => e.kind === 'igyo_consistency_forced')).toBe(true)
    expect(formatAdvancedCombatSegments(r.meta).some((s) => s.includes('Igyō'))).toBe(true)
  })

  it('Ippuku rigenera +3 CS', () => {
    const wazaName = 'Ippuku (一服) — Gestione della Pressione'
    const index = buildWazaTagIndex([
      ...CATALOG_ENTRIES,
      {
        name: wazaName,
        poolId: 'generiche-ippuku-gestione-pressione',
        rank: 'T1',
        styleId: 'generiche',
        isPassive: false,
      },
    ])
    const r = processWazaChatAutomation({
      content: `[waza:${wazaName}]`,
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
    })
    expect(r.csDelta).toBe(3)
    expect(r.log.some((l) => l.includes('Ippuku'))).toBe(true)
  })

  it('Generiche status su bersaglio colpito', () => {
    const wazaName = 'Suishin (水針) — Acupressione Liquida'
    const index = buildWazaTagIndex([
      ...CATALOG_ENTRIES,
      {
        name: wazaName,
        poolId: 'generiche-suishin-acupressione-liquida',
        rank: 'T2',
        styleId: 'generiche',
        isPassive: false,
      },
    ])
    const r = processWazaChatAutomation({
      content: `[waza:${wazaName}] [generiche:colpito:Yuki]`,
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
      roomParticipants: [
        { characterId: 'b', name: 'Yuki', surname: 'Sato' },
      ],
    })
    expect(r.effects).toEqual([
      expect.objectContaining({
        kind: 'generiche_status_applied',
        victimCharacterId: 'b',
        statusId: 'emorragia',
      }),
    ])
  })

  it('Komonoire dado e Debitore su rifiuto', () => {
    const r = processWazaChatAutomation({
      content: '[komonoire:tira:2] [komonoire:rifiuta]',
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: buildWazaTagIndex([...CATALOG_ENTRIES]),
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
      madoshoId: 'komonoire',
    })
    expect(r.effects.some((e) => e.kind === 'komonoire_weapon')).toBe(true)
    expect(r.effects.some((e) => e.kind === 'komonoire_debitore')).toBe(true)
    expect(r.statusContainer.statuses.some((s) => s.id === 'debitore')).toBe(true)
    expect(formatAdvancedCombatSegments(r.meta).some((s) => s.includes('Komonoire'))).toBe(false)
  })

  it('Kyōshin vibrazione e consumo CS', () => {
    const wazaName = 'Kyōshin (共振) — Frequenza Disarmante'
    const index = buildWazaTagIndex([
      ...CATALOG_ENTRIES,
      {
        name: wazaName,
        poolId: 'generiche-kyoshin-frequenza-disarmante',
        rank: 'T2',
        styleId: 'generiche',
        isPassive: false,
      },
    ])
    const hit = processWazaChatAutomation({
      content: `[waza:${wazaName}] [generiche:colpito:Yuki]`,
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'a',
      roomParticipants: [{ characterId: 'b', name: 'Yuki' }],
    })
    expect(hit.effects.some((e) => e.kind === 'kyoshin_vibration_applied')).toBe(true)

    const victimUse = processWazaChatAutomation({
      content: `[waza:${wazaName}]`,
      meta: { genericheKyoshin: { tier: 2 } },
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 10,
      actorCharacterId: 'b',
    })
    expect(victimUse.csDelta).toBe(-2)
    expect(victimUse.meta.genericheKyoshin).toBeNull()
  })

  it('applies Gojū elemental status when actor has affinity and waza is Elementale', () => {
    const wazaName = 'Genso-Ya (元素矢) — Dardo Elementale'
    const index = buildWazaTagIndex([
      {
        name: wazaName,
        poolId: 'genso-ya-dardo-elementale',
        rank: 'T1',
        styleId: 'honshitsu',
        isPassive: false,
        effect: 'Attiva · [Proiettile][Elementale] · Tier base 1',
      },
    ])
    const r = processWazaChatAutomation({
      content: `[waza:${wazaName}] [Elementale] [generiche:colpito:Yuki]`,
      meta: {},
      statusContainer: emptyContainer,
      wazaIndex: index,
      chronoCsAvailable: 5,
      actorCharacterId: 'a',
      actorSkiruSheet: { tenkan: 1, 'goju-fuoco': 1 },
      roomParticipants: [{ characterId: 'b', name: 'Yuki' }],
    })
    const goju = r.effects.find((e) => e.kind === 'sokaiju_goju_status_applied')
    expect(goju).toBeDefined()
    if (goju?.kind === 'sokaiju_goju_status_applied') {
      expect(goju.statusId).toBe('incendiato')
      expect(goju.victimCharacterId).toBe('b')
    }
    expect(r.log.some((l) => l.includes('Gojū'))).toBe(true)
  })
})
