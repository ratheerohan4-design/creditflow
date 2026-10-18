import { jsPDF } from 'jspdf'
import type { Agreement, Lender, Merchant } from '@/data/types'
import { formatDate, formatNumber } from '@/lib/format'

/**
 * jsPDF's built-in fonts cannot draw the rupee sign, so documents spell out
 * "Rs." and keep the full Indian grouping (Rs. 2,30,000, never 2.3L).
 */
export function money(value: number): string {
  return `Rs. ${formatNumber(value)}`
}

const NAVY: [number, number, number] = [13, 43, 69]
const AMBER: [number, number, number] = [245, 166, 35]
const INK: [number, number, number] = [26, 26, 46]
const MUTED: [number, number, number] = [91, 100, 117]
const LINE: [number, number, number] = [227, 230, 236]

function header(doc: jsPDF, title: string, subtitle: string) {
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, 210, 26, 'F')
  doc.setFillColor(...AMBER)
  doc.rect(0, 26, 210, 1.4, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('CreditFlow', 16, 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(title, 16, 19)
  doc.setTextColor(...MUTED)
  doc.setFontSize(8)
  doc.text(subtitle, 194, 19, { align: 'right' })
  doc.setTextColor(...INK)
}

function section(doc: jsPDF, label: string, y: number): number {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text(label.toUpperCase(), 16, y)
  doc.setDrawColor(...LINE)
  doc.line(16, y + 1.8, 194, y + 1.8)
  doc.setTextColor(...INK)
  return y + 8
}

function row(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...MUTED)
  doc.text(label, 16, y)
  doc.setTextColor(...INK)
  doc.text(value, 92, y)
  return y + 6
}

function footer(doc: jsPDF, text: string) {
  doc.setDrawColor(...LINE)
  doc.line(16, 278, 194, 278)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text(text, 16, 283)
  doc.text('Amounts in Indian Rupees (Rs.). Full figures, no abbreviations.', 16, 287)
}

export function agreementPdf(
  agreement: Agreement,
  merchant: Merchant,
  lender: Lender,
): jsPDF {
  const doc = new jsPDF()
  header(doc, 'Credit agreement', `Agreement ${agreement.id}`)

  let y = section(doc, 'Parties', 42)
  y = row(doc, 'Merchant', merchant.name, y)
  y = row(doc, 'Shop', `${merchant.shopType}, ${merchant.city}`, y)
  y = row(doc, 'Lender', lender.name, y)
  y = row(doc, 'Lender contact', lender.contactPerson, y)

  y = section(doc, 'Terms', y + 4)
  y = row(doc, 'Credit amount', money(agreement.creditAmount), y)
  y = row(doc, 'Disbursed on', formatDate(agreement.disbursedDate), y)
  y = row(doc, 'Repayment rate', `${Math.round(agreement.rate * 100)}% of each sale`, y)
  y = row(doc, 'Minimum daily repayment', money(agreement.minDailyFloor), y)
  y = row(doc, 'Grace days', `${agreement.graceDays} days`, y)
  y = row(doc, 'Target completion', formatDate(agreement.endDate), y)
  y = row(doc, 'Amount you still owe', money(agreement.outstanding), y)

  y = section(doc, 'Penalty terms', y + 4)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const notes = doc.splitTextToSize(agreement.penaltyTerms, 178)
  doc.text(notes, 16, y)
  y += notes.length * 5 + 6

  y = section(doc, 'Consent', y)
  y = row(doc, 'Consent given on', formatDate(agreement.consentDate), y)
  y = row(doc, 'Onboarding agent', agreement.onboardingAgent, y)
  y = row(doc, 'Merchant UPI ID', merchant.upiId, y)

  footer(
    doc,
    'CreditFlow is the repayment layer between merchant and lender. It is not a lender, bank or wallet.',
  )
  return doc
}

export function agreementStatement(
  merchant: Merchant,
  agreement: Agreement,
  lines: Array<{
    date: string
    ref: string
    sale: number
    repayment: number
    payout: number
  }>,
  from: string,
  to: string,
): jsPDF {
  const doc = new jsPDF()
  header(doc, 'Repayment statement', `${formatDate(from)} to ${formatDate(to)}`)

  let y = section(doc, 'Account', 42)
  y = row(doc, 'Merchant', merchant.name, y)
  y = row(doc, 'Agreement', agreement.id, y)

  y = section(doc, 'Transactions', y + 4)
  doc.setFontSize(8)
  doc.setTextColor(...MUTED)
  doc.text('DATE', 16, y)
  doc.text('REFERENCE', 42, y)
  doc.text('SALE', 108, y, { align: 'right' })
  doc.text('TO LENDER', 146, y, { align: 'right' })
  doc.text('YOU RECEIVE', 194, y, { align: 'right' })
  y += 4
  doc.setDrawColor(...LINE)
  doc.line(16, y, 194, y)
  y += 5

  doc.setTextColor(...INK)
  for (const line of lines) {
    if (y > 266) {
      doc.addPage()
      y = 24
    }
    doc.setFontSize(8.5)
    doc.text(formatDate(line.date), 16, y)
    doc.text(line.ref, 42, y)
    doc.text(money(line.sale), 108, y, { align: 'right' })
    doc.text(money(line.repayment), 146, y, { align: 'right' })
    doc.text(money(line.payout), 194, y, { align: 'right' })
    y += 5.4
  }

  footer(doc, 'Statement generated from CreditFlow records.')
  return doc
}

export function closureCertificate(
  agreement: Agreement,
  merchant: Merchant,
  lender: Lender,
): jsPDF {
  const doc = new jsPDF()
  header(doc, 'Repayment complete', `Certificate for ${agreement.id}`)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...NAVY)
  doc.text('This certifies that', 105, 62, { align: 'center' })
  doc.setFontSize(26)
  doc.text(merchant.name, 105, 78, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...INK)
  const intro = doc.splitTextToSize(
    `has fully repaid trade credit of ${money(agreement.creditAmount)} provided by ${lender.name}.`,
    150,
  )
  doc.text(intro, 105, 94, { align: 'center' })

  let y = section(doc, 'Summary', 124)
  y = row(doc, 'Credit amount', money(agreement.creditAmount), y)
  y = row(doc, 'Total repaid', money(agreement.creditAmount - agreement.outstanding), y)
  y = row(doc, 'Started on', formatDate(agreement.startDate), y)
  y = row(
    doc,
    'Completed on',
    formatDate(agreement.completedDate ?? agreement.endDate),
    y,
  )
  y = row(doc, 'Repayment rate', `${Math.round(agreement.rate * 100)}% of each sale`, y)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(...MUTED)
  doc.text(
    'Thank you for repaying on time. Your next credit can be larger.',
    105,
    y + 10,
    {
      align: 'center',
    },
  )

  footer(doc, 'Issued by CreditFlow Operations.')
  return doc
}

export function savePdf(doc: jsPDF, filename: string) {
  doc.save(filename)
}
