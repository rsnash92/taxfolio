import { jsPDF } from 'jspdf'

export interface DashboardReportData {
  taxYear: string
  generatedAt: string
  userName: string

  summary: {
    totalIncome: number
    totalExpenses: number
    netProfit: number
    profitMargin: number
    totalTaxDue: number
    effectiveTaxRate: number
    incomeTax: number
    nationalInsurance: number
  }

  comparison?: {
    previousYear: string
    incomeChange: number
    incomeChangePercent: number
    expensesChange: number
    expensesChangePercent: number
    profitChange: number
    profitChangePercent: number
  }

  expensesByCategory: {
    category: string
    amount: number
    percentage: number
  }[]

  deductions: {
    mileage?: { miles: number; amount: number }
    useOfHome?: { amount: number }
  }

  actionItems: { title: string; completed: boolean }[]
}

/**
 * Generate PDF report from dashboard data
 */
export function generateDashboardPDF(data: DashboardReportData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 20

  // Helper functions
  const formatMoney = (amount: number) =>
    `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const addLine = (yPos: number) => {
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPos, pageWidth - margin, yPos)
  }

  // ===== HEADER =====
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(21, 228, 158) // Brand green
  doc.text('TaxFolio', margin, y)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Tax Year ${data.taxYear}`, margin, y + 8)
  doc.text(`Generated ${data.generatedAt}`, margin, y + 14)

  y += 30
  addLine(y)
  y += 15

  // ===== EXECUTIVE SUMMARY =====
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('Summary', margin, y)
  y += 12

  // Summary boxes
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const summaryItems = [
    { label: 'Total Income', value: formatMoney(data.summary.totalIncome), color: [0, 0, 0] as [number, number, number] },
    { label: 'Total Expenses', value: formatMoney(data.summary.totalExpenses), color: [0, 0, 0] as [number, number, number] },
    { label: 'Net Profit', value: formatMoney(data.summary.netProfit), color: (data.summary.netProfit >= 0 ? [34, 197, 94] : [239, 68, 68]) as [number, number, number] },
    { label: 'Total Tax Due', value: formatMoney(data.summary.totalTaxDue), color: [245, 158, 11] as [number, number, number] },
  ]

  const colWidth = (pageWidth - margin * 2) / 4

  summaryItems.forEach((item, index) => {
    const x = margin + index * colWidth

    doc.setTextColor(100, 100, 100)
    doc.text(item.label, x, y)

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(item.color[0], item.color[1], item.color[2])
    doc.text(item.value, x, y + 7)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
  })

  y += 20

  // Tax breakdown line
  doc.setTextColor(100, 100, 100)
  doc.text(
    `Income Tax: ${formatMoney(data.summary.incomeTax)}  •  National Insurance: ${formatMoney(data.summary.nationalInsurance)}  •  Effective Rate: ${data.summary.effectiveTaxRate.toFixed(1)}%`,
    margin,
    y
  )

  y += 15
  addLine(y)
  y += 15

  // ===== YEAR COMPARISON =====
  if (data.comparison) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(`vs Previous Year (${data.comparison.previousYear})`, margin, y)
    y += 12

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const formatChange = (change: number, percent: number) => {
      const sign = change >= 0 ? '+' : ''
      return `${sign}${formatMoney(change)} (${sign}${percent.toFixed(0)}%)`
    }

    const comparisonItems = [
      { label: 'Income', change: data.comparison.incomeChange, percent: data.comparison.incomeChangePercent },
      { label: 'Expenses', change: data.comparison.expensesChange, percent: data.comparison.expensesChangePercent },
      { label: 'Profit', change: data.comparison.profitChange, percent: data.comparison.profitChangePercent },
    ]

    comparisonItems.forEach((item, index) => {
      const x = margin + index * 60
      doc.setTextColor(100, 100, 100)
      doc.text(item.label, x, y)

      const isPositive = item.label === 'Expenses' ? item.change < 0 : item.change >= 0
      doc.setTextColor(isPositive ? 34 : 239, isPositive ? 197 : 68, isPositive ? 94 : 68)
      doc.text(formatChange(item.change, item.percent), x, y + 6)
    })

    y += 20
    addLine(y)
    y += 15
  }

  // ===== EXPENSES BY CATEGORY =====
  if (data.expensesByCategory.length > 0) {
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Expenses by Category', margin, y)
    y += 12

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    data.expensesByCategory.slice(0, 8).forEach((cat) => {
      doc.setTextColor(60, 60, 60)
      doc.text(cat.category, margin, y)

      doc.setTextColor(0, 0, 0)
      doc.text(formatMoney(cat.amount), margin + 100, y)

      doc.setTextColor(100, 100, 100)
      doc.text(`${cat.percentage}%`, margin + 140, y)

      y += 6
    })

    y += 10
  }

  // ===== ADDITIONAL DEDUCTIONS =====
  if (data.deductions.mileage || data.deductions.useOfHome) {
    addLine(y)
    y += 15

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Additional Deductions', margin, y)
    y += 12

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    if (data.deductions.mileage) {
      doc.setTextColor(60, 60, 60)
      doc.text(`Mileage (${data.deductions.mileage.miles.toLocaleString()} miles)`, margin, y)
      doc.setTextColor(0, 0, 0)
      doc.text(formatMoney(data.deductions.mileage.amount), margin + 100, y)
      y += 6
    }

    if (data.deductions.useOfHome) {
      doc.setTextColor(60, 60, 60)
      doc.text('Use of Home', margin, y)
      doc.setTextColor(0, 0, 0)
      doc.text(formatMoney(data.deductions.useOfHome.amount), margin + 100, y)
      y += 6
    }

    y += 10
  }

  // ===== ACTION ITEMS =====
  if (data.actionItems.length > 0) {
    // Check if we need a new page
    if (y > 240) {
      doc.addPage()
      y = 20
    }

    addLine(y)
    y += 15

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text('Before You File', margin, y)
    y += 12

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    data.actionItems.forEach((item) => {
      const checkbox = item.completed ? '[x]' : '[ ]'
      doc.setTextColor(item.completed ? 100 : 60, item.completed ? 100 : 60, item.completed ? 100 : 60)
      doc.text(`${checkbox}  ${item.title}`, margin, y)
      y += 6
    })

    y += 10
  }

  // ===== FOOTER =====
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.setTextColor(150, 150, 150)
  doc.text(
    `Generated by TaxFolio • ${data.generatedAt} • This is not official HMRC documentation`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  )

  return doc
}
