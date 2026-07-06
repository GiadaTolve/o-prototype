export type PactLeverage = 'formale' | 'popolare' | 'sotterranea' | 'neutro'

export type PoliticoPactRow = {
  id: string
  templateId: string
  templateName: string
  counterpartyName: string
  counterpartyCharacterId: string | null
  weight: number
  leverage: PactLeverage
  status: 'active' | 'spent' | 'expired'
  notes: string | null
  createdAt: string | null
  spentAt: string | null
}

export type PoliticoStatusResponse = {
  dayKey: string
  allowedLeverages: PactLeverage[]
  limits: { maxWeight: number; maxActive: number; activeCount: number }
  dailyBudget: {
    pactActive: { max: number; used: number; remaining: number }
    pactWeight: { max: number; used: number; remaining: number }
  }
  templates: Array<{ id: string; name: string; description: string; weight: number }>
  pacts: PoliticoPactRow[]
}
