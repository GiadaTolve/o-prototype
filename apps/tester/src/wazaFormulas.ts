/**
 * Formule Waza — Ramo Dō (Le vie)
 * Tutte le formule usano floor() per arrotondamento per difetto.
 */

import type { StatsMap } from './types'

const floor = Math.floor

export interface WazaResult {
  name: string
  type: 'passive' | 'active'
  cost?: number
  x?: number
  xLabel?: string
  x2?: number
  x2Label?: string
  formula?: string
}

export function calcWazaFormulas(stats: StatsMap): WazaResult[] {
  const { D, M, E } = stats
  const LVL = stats.LVL ?? 1

  return [
    // ─── PASSIVE ───
    {
      name: 'Arma psichica',
      type: 'passive',
      cost: 5 + floor(M / 4),
      formula: '5 + floor($M/4)',
    },
    {
      name: 'Ordine!',
      type: 'passive',
      x: 2 + floor(M * 0.15) + floor(D * 0.1) + LVL * 2,
      xLabel: 'Gittata (m)',
      formula: '2 + floor($M*0.15) + floor($D*0.1) + $LVL*2',
    },
    {
      name: 'Ottimizzazione',
      type: 'passive',
      x: 1 + floor(M / 6) + LVL,
      xLabel: 'Sconto Jigo-ka',
      formula: '1 + floor($M/6) + $LVL',
    },
    {
      name: 'Traccia elementale',
      type: 'passive',
      cost: 8 + floor(M / 3),
      formula: '8 + floor($M/3)',
    },
    {
      name: 'Legare i frammenti',
      type: 'passive',
      cost: 12 + floor(E * 1.2) + floor(M / 4),
      formula: '12 + floor($E*1.2) + floor($M/4)',
    },
    {
      name: 'Impatto Jigo-ka',
      type: 'passive',
      x: 1 + floor(M / 5) + LVL,
      xLabel: 'N° armi + bonus danno',
      cost: (1 + floor(M / 5) + LVL) * (4 + floor(M / 5)),
      formula: 'X = 1 + floor($M/5) + $LVL, Costo = X * (4 + floor($M/5))',
    },
    // ─── ATTIVE ───
    {
      name: 'Estensione',
      type: 'active',
      x: 1 + floor(M / 5) + LVL,
      xLabel: 'Estensione (m)',
      cost: 6 + (1 + floor(M / 5) + LVL) * 2,
      formula: 'X = 1 + floor($M/5) + $LVL, Costo = 6 + X*2',
    },
    {
      name: 'Sfogo Jigo-ka',
      type: 'active',
      x: 3 + floor(M / 4) + LVL * 2,
      xLabel: 'Gittata cono (m)',
      cost: 10 + floor(M / 2),
      formula: 'X = 3 + floor($M/4) + $LVL*2, Costo = 10 + floor($M/2)',
    },
    {
      name: 'Laser psichico',
      type: 'active',
      x: 5 + floor(M / 3) + LVL * 3,
      xLabel: 'Lunghezza raggio (m)',
      cost: 14 + floor(M * 0.8),
      formula: 'X = 5 + floor($M/3) + $LVL*3, Costo = 14 + floor($M*0.8)',
    },
    {
      name: 'Arma animata',
      type: 'active',
      x: 4 + floor(M / 4) + LVL * 2,
      xLabel: 'Gittata (m)',
      x2: 2 + floor(E / 5) + LVL,
      x2Label: 'Durata (turni)',
      cost: 16 + floor(M / 2) + floor(E / 3),
      formula: 'Gittata = 4 + floor($M/4) + $LVL*2, Durata = 2 + floor($E/5) + $LVL',
    },
    {
      name: 'Sorpresa',
      type: 'active',
      x: 1 + floor(M / 8) + floor(LVL * 0.5),
      xLabel: 'Dimensione proiettile (m)',
      x2: 6 + floor(M / 3) + LVL * 3,
      x2Label: 'Gittata (m)',
      cost: 8 + floor(M / 4),
      formula: 'Dimensione = 1 + floor($M/8) + floor($LVL*0.5), Gittata = 6 + floor($M/3) + $LVL*3',
    },
    {
      name: 'Risonanza della lama',
      type: 'active',
      cost: 12 + floor(M / 3),
      formula: '12 + floor($M/3)',
    },
  ]
}
