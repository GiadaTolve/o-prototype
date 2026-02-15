export type BanState =
  | 'NONE'
  | 'SHADOW'
  | 'FULL'

export interface BanContext {
  banState: BanState
}

export interface BanPermissions {
    canChat: boolean
    canRollDice: boolean
    canReceiveSalary: boolean
    canReceiveRewards: boolean
    canSpendMoney: boolean
  }
  

  export function resolveBanPermissions(
    ctx: BanContext
  ): BanPermissions {
  
    switch (ctx.banState) {
  
      case 'SHADOW':
        return {
          canChat: false,
          canRollDice: false,
          canReceiveSalary: true,
          canReceiveRewards: true,
          canSpendMoney: true
        }
  
      case 'FULL':
        return {
          canChat: false,
          canRollDice: false,
          canReceiveSalary: false,
          canReceiveRewards: true,
          canSpendMoney: true
        }
  
      case 'NONE':
      default:
        return {
          canChat: true,
          canRollDice: true,
          canReceiveSalary: true,
          canReceiveRewards: true,
          canSpendMoney: true
        }
    }
  }
  