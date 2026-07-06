export type MedicoHealTarget = {
  id: string
  name: string
  hpCurrent: number
  hpMax: number
  isSelf: boolean
}

export type MedicoBlueprint = {
  id: string
  name: string
  description: string
  materials: Array<{ materialId: string; quantity: number }>
  catalogKey: string
}

export type MedicoStatusResponse = {
  dayKey: string
  dailyBudget: { max: number; used: number; remaining: number }
  blueprints: MedicoBlueprint[]
}

export type MedicoHealResponse = {
  applied: number
  budgetCost: number
  budgetRemaining: number
  budgetMax: number
  target: { id: string; name: string; hpCurrent: number; hpMax: number }
  loggedToRoom: string | null
}

export type MedicoCraftResponse = {
  blueprintId: string
  name: string
  catalogKey?: string
  procedure: boolean
  budgetCost?: number
}
