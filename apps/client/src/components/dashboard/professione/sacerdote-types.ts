export type SacerdoteOfudaRow = {
  id: string
  blueprintId: string
  blueprintName: string
  bearerCharacterId: string
  power: number
  status: 'active' | 'consumed'
  notes: string | null
  createdAt: string | null
  consumedAt: string | null
}

export type SacerdoteRite = {
  id: string
  name: string
  description: string
  power: number
  materials: Array<{ materialId: string; quantity: number }>
  inInventory: number
}

export type SacerdoteStatusResponse = {
  dayKey: string
  pathHints: { requiresConsecratedPlace: boolean; yumetokiDoubleTime: boolean }
  limits: { maxPower: number; maxActive: number; activeCount: number }
  dailyBudget: {
    ofudaActive: { max: number; used: number; remaining: number }
    ofudaPower: { max: number; used: number; remaining: number }
  }
  rites: SacerdoteRite[]
  ofuda: SacerdoteOfudaRow[]
}
