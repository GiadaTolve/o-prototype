import { computeEvictionDate } from './housing-rent-cycle'

const IT_DATE: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

function formatItDate(d: Date): string {
  return d.toLocaleDateString('it-IT', IT_DATE)
}

/** Testi SMS del Locatario — messageIndex 0 = giorno scadenza, 1–7 = escalation morosità. */
export function getRentReminderMessage(args: {
  messageIndex: number
  housingName: string
  rentAmount: number
  dueDate: Date
}): string {
  const { messageIndex, housingName, rentAmount, dueDate } = args
  const dueLabel = formatItDate(dueDate)
  const evictionLabel = formatItDate(computeEvictionDate(dueDate))
  const prefix = '【Affitto】'

  const templates: Record<number, string> = {
    0: `${prefix} Buongiorno. Oggi (${dueLabel}) è il giorno di scadenza dell'affitto per «${housingName}»: ${rentAmount} REM. Puoi saldare dal pannello Mercato → Immobiliare o dalla finestra Housing. Cordiali saluti — Ufficio Locazioni.`,
    1: `${prefix} La scadenza del ${dueLabel} per «${housingName}» non risulta ancora saldata (${rentAmount} REM). Ti preghiamo di regolarizzare al più presto.`,
    2: `${prefix} Secondo avviso: l'affitto di «${housingName}» (${rentAmount} REM) è in ritardo. Il mancato pagamento viene registrato nel fascicolo inquilino.`,
    3: `${prefix} Terzo sollecito per «${housingName}». Importo dovuto: ${rentAmount} REM. Accedi a Mercato → Immobiliare per pagare subito.`,
    4: `${prefix} La morosità su «${housingName}» è ormai evidente. Senza pagamento entro i termini contrattuali scatteranno le procedure di sfratto.`,
    5: `${prefix} Avviso formale: saldo arretrato ${rentAmount} REM per «${housingName}». Ultimi giorni per evitare la revoca del contratto.`,
    6: `${prefix} Penultimo avviso prima dello sfratto programmato per il ${evictionLabel}. Regolarizza «${housingName}» (${rentAmount} REM) immediatamente.`,
    7: `${prefix} ULTIMO AVVISO: domani o al più tardi il ${evictionLabel} il contratto per «${housingName}» verrà rescisso per morosità. ${rentAmount} REM ancora dovuti.`,
  }

  const idx = Math.max(0, Math.min(7, Math.floor(messageIndex)))
  return templates[idx] ?? templates[7]!
}
