export type CacciatoreTrack = {
  id: string
  name: string
  description: string
  gatherUnits: number
  gatherRequires: Array<{ materialId: string; quantity: number }>
  yieldsPreview: string
  needsScene: boolean
}

export type CacciatoreStatusResponse = {
  dayKey: string
  dailyBudget: { max: number; used: number; remaining: number }
  tracks: CacciatoreTrack[]
}

export type CacciatoreGatherResponse = {
  blueprintId: string
  name: string
  gatherCost: number
  budgetRemaining: number
  budgetMax: number
  granted: Array<{ materialId: string; quantity: number }>
  loggedToRoom: string | null
  needsScene: boolean
}
