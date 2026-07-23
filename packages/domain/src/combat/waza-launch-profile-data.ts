import type { WazaLaunchFlags } from './waza-tag-preview'

/**
 * Mappa poolId → flag UI pannello di lancio.
 * Fonte di verità per le waza che richiedono controlli aggiuntivi al lancio.
 * Migrazione al JSON sorgente del generatore = passo futuro.
 */
/** True se la waza è attiva narrativa (niente IR/danno in card chat). */
export function isNarrativaLaunchFlags(flags?: WazaLaunchFlags | null): boolean {
  return Boolean(flags?.isNarrativa || flags?.masterOnlyCard)
}

export const WAZA_LAUNCH_PROFILE_DATA: Record<string, WazaLaunchFlags> = {
  // ── Attive narrative (nessun confronto IR/Danno in chat) ─────────────────
  'kakucho-espansione-della-luce':          { masterOnlyCard: true, isNarrativa: true },
  'kaeribi-fiamma-del-ritorno':             { masterOnlyCard: true, isNarrativa: true },
  'fuin-no-hi-sigillo-della-fiamma':        { needsDelayedEffect: true, masterOnlyCard: true, isNarrativa: true },
  'omocha-il-giocattolo':                   { masterOnlyCard: true, isNarrativa: true },
  'gangushi-il-giocattolaio':               { masterOnlyCard: true, isNarrativa: true },
  'shokushin-lettura-corpo':                { masterOnlyCard: true, isNarrativa: true },
  'generiche-ippuku-gestione-pressione':    { masterOnlyCard: true, isNarrativa: true },
  'generiche-ukenagashi-parata-perfetta':   { masterOnlyCard: true, isNarrativa: true },
  'generiche-shukuchi-scatto-potenziato':   { masterOnlyCard: true, isNarrativa: true },
  'generiche-choyaku-salto-potenziato':     { masterOnlyCard: true, isNarrativa: true },
  'uzu':                                    { needsQuarto: true, masterOnlyCard: true, isNarrativa: true },
  // ── Controlli strutturati ────────────────────────────────────────────────
  'rensa-catena-fili':                      { needsQuarto: true, needsDelayedEffect: true },
  'rensa-baku-detonazione-catena':          { needsQuarto: true },
  'kankatsu-giurisdizione':                 { needsGiurisdizioneCategory: true, allowsSurprise: true },
  'nagori-principio-instabilita':           { needsNagoriShift: true, allowsSurprise: true },
  'chokurei-decreto':                       { needsDecreto: true, allowsSurprise: true },
  'hogo-sutura-ego':                        { needsSuturaKind: true, needsTarget: true, masterOnlyCard: true, isNarrativa: true },
  'mugen-shihai-dominazione-onirica':       { allowsSurprise: true },
  'meisaku-opera-prima':                    { needsMeisakuLabel: true },
  'shakkin-indebitamento':                  { needsTarget: true, needsDebitoTag: true },
  'yobimodoshi':                            { needsMacchiatoSpend: true },
  // ── Naikan: potenziamento fibra/settore ──────────────────────────────────
  'seni-gake-avvolgimento-fibre':           { needsSeniGake: true },
  // ── Waza trasforma tag ───────────────────────────────────────────────────
  'someito-filo-tinto': {
    masterOnlyCard: true,
    isNarrativa: true,
    needsTrasformaTag: true,
    trasformaDimensione: 'consistenza',
    trasformaFromOptions: ['Solido', 'Liquido', 'Gassoso', 'Sonoro', 'Elementale', 'Energetico'],
    trasformaToOptions:   ['Solido', 'Liquido', 'Gassoso', 'Sonoro', 'Elementale', 'Energetico'],
  },
  'yugami-filo-deforme': {
    masterOnlyCard: true,
    isNarrativa: true,
    needsTrasformaTag: true,
    trasformaDimensione: 'categoria',
    trasformaFromOptions: ['Emanazione', 'Propagazione', 'Propagazione Conica'],
    trasformaToOptions:   ['Emanazione', 'Propagazione', 'Propagazione Conica'],
  },
  'michishirube-luce-guida': {
    needsTrasformaTag: true,
    trasformaDimensione: 'categoria',
    trasformaFromOptions: ['Contatto'],
    trasformaToOptions:   ['Proiettile'],
  },
  'igyo-rensei-insegnamenti-tucker': {
    needsTrasformaTag: true,
    trasformaDimensione: 'consistenza',
    trasformaFromOptions: ['Solido', 'Liquido', 'Gassoso', 'Sonoro', 'Elementale', 'Energetico'],
    trasformaToOptions:   ['Solido', 'Liquido', 'Gassoso', 'Elementale'],
  },
}
