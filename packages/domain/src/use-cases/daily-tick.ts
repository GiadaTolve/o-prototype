import { Rem } from '../types/money'
import { earn, spend } from '../ledger/transaction'
import { calculateSalary } from '../ledger/rules/salary'
import { evaluateMonthlyRent } from '../ledger/rules/monthly-rent'
import { resolveBanPermissions, BanState } from '../ban/ban-rule'

export interface DailyTickContext {
    today: Date
  
    balance: Rem
    banState: BanState
  
    // stipendio
    salary: {
      base: Rem
      mode: 'DAILY' | 'MONTHLY'
      dailyRent?: Rem
    }
  
    // affitto mensile
    housing?: {
      dueDate: Date
      rentAmount: Rem
      hasPaid: boolean
      daysOverdue: number
    }
  }
  
  export interface DailyTickResult {
    newBalance: Rem
  
    salary?: {
      amount: Rem
      reason: string
    }
  
    rent?: {
      status: 'OK' | 'OVERDUE' | 'EVICTED'
      warningMessageIndex?: number
    }
  
    lostHouse?: boolean
  }
  
  export function processDailyTick(
    ctx: DailyTickContext
  ): DailyTickResult {
  
    let balance = ctx.balance
    let salaryPaid: Rem | null = null

  
    /* =========================
       BAN PERMISSIONS
    ========================= */
  
    const permissions = resolveBanPermissions({
      banState: ctx.banState
    })
  
    /* =========================
       SALARY
    ========================= */
  
    if (permissions.canReceiveSalary) {
      const salaryResult = calculateSalary({
        currentBalance: balance,
        baseSalary: ctx.salary.base,
        mode: ctx.salary.mode,
        banState: ctx.banState,
        dailyRent: ctx.salary.dailyRent
      })
  
      if (salaryResult.ok) {
        const earned = earn(balance, salaryResult.amount)
        balance = earned.newBalance
        salaryPaid = salaryResult.amount
      }
    }
  
    /* =========================
       MONTHLY RENT
    ========================= */
  
    let rentResult
  
    if (ctx.housing) {
      rentResult = evaluateMonthlyRent({
        today: ctx.today,
        dueDate: ctx.housing.dueDate,
        rentAmount: ctx.housing.rentAmount,
        hasPaid: ctx.housing.hasPaid,
        daysOverdue: ctx.housing.daysOverdue
      })
    }
  
    /* =========================
       RESULT
    ========================= */
  
    return {
      newBalance: balance,
  
      salary: salaryPaid
  ? {
      amount: salaryPaid,
      reason: 'Daily processing'
    }
  : undefined,

  
      rent: rentResult
        ? {
            status: rentResult.status,
            warningMessageIndex:
              rentResult.status === 'OVERDUE'
                ? rentResult.messageIndex
                : undefined
          }
        : undefined,
  
      lostHouse:
        rentResult?.status === 'EVICTED'
          ? true
          : undefined
    }
  }
  