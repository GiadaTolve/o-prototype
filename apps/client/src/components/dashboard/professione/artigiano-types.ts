export type ArtigianoBlueprint = {
  id: string
  name: string
  description: string
  kind: string
  materials: Array<{ materialId: string; quantity: number }>
  dailyBudgetCost: number
  catalogKey?: string
  isProcedure: boolean
}

export type ArtigianoToolStatus = {
  dayKey: string
  dailyBudget: { max: number; used: number; remaining: number }
  blueprints: ArtigianoBlueprint[]
}

export type ArtigianoRepairRow = {
  id: string
  item: { name: string }
  canRepair: boolean
  repairBlockReason?: string
  integrityCurrent: number
  integrityMax: number
}
