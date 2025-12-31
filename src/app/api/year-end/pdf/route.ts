import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateYearEndReport } from '@/lib/year-end'
import PDFDocument from 'pdfkit'

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const taxYear = searchParams.get('tax_year') || getCurrentTaxYear()

  try {
    const report = await generateYearEndReport(user.id, taxYear, {
      useAI: false, // Don't regenerate AI for PDF
      forceRefresh: false,
    })

    // Create PDF
    const doc = new PDFDocument({ margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))

    const formatMoney = (amount: number) =>
      `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('Year-End Tax Summary', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(14).font('Helvetica').fillColor('#666')
      .text(`Tax Year ${report.taxYear}`, { align: 'center' })
    doc.moveDown(0.3)
    doc.fontSize(10)
      .text(`Generated ${new Date(report.generatedAt).toLocaleDateString('en-GB')}`, { align: 'center' })
    doc.moveDown(2)

    // Executive Summary
    doc.fillColor('#000').fontSize(16).font('Helvetica-Bold').text('Executive Summary')
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica')

    const summaryData = [
      ['Total Income', formatMoney(report.summary.totalIncome)],
      ['Total Expenses', formatMoney(report.summary.totalExpenses)],
      ['Net Profit', formatMoney(report.summary.netProfit)],
      ['Profit Margin', `${report.summary.profitMargin.toFixed(1)}%`],
    ]

    summaryData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`)
    })

    doc.moveDown(1.5)

    // Tax Summary
    doc.fontSize(16).font('Helvetica-Bold').text('Tax Position')
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica')

    const taxData = [
      ['Taxable Profit', formatMoney(report.tax.taxableProfit)],
      ['Personal Allowance Used', formatMoney(report.tax.personalAllowanceUsed)],
      ['Income Tax', formatMoney(report.tax.incomeTax.total)],
      ['National Insurance', formatMoney(report.tax.nationalInsurance.total)],
      ['Total Tax Due', formatMoney(report.tax.totalTaxDue)],
      ['Effective Tax Rate', `${report.tax.effectiveTaxRate.toFixed(1)}%`],
    ]

    taxData.forEach(([label, value]) => {
      doc.text(`${label}: ${value}`)
    })

    doc.moveDown(1.5)

    // Income Tax Breakdown
    doc.fontSize(14).font('Helvetica-Bold').text('Income Tax Breakdown')
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica')

    if (report.tax.incomeTax.basicRate.amount > 0) {
      doc.text(`Basic Rate (20%): ${formatMoney(report.tax.incomeTax.basicRate.amount)} @ 20% = ${formatMoney(report.tax.incomeTax.basicRate.tax)}`)
    }
    if (report.tax.incomeTax.higherRate.amount > 0) {
      doc.text(`Higher Rate (40%): ${formatMoney(report.tax.incomeTax.higherRate.amount)} @ 40% = ${formatMoney(report.tax.incomeTax.higherRate.tax)}`)
    }
    if (report.tax.incomeTax.additionalRate.amount > 0) {
      doc.text(`Additional Rate (45%): ${formatMoney(report.tax.incomeTax.additionalRate.amount)} @ 45% = ${formatMoney(report.tax.incomeTax.additionalRate.tax)}`)
    }

    doc.moveDown(1.5)

    // National Insurance Breakdown
    doc.fontSize(14).font('Helvetica-Bold').text('National Insurance Breakdown')
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica')

    if (report.tax.nationalInsurance.class2 > 0) {
      doc.text(`Class 2: ${formatMoney(report.tax.nationalInsurance.class2)}`)
    }
    if (report.tax.nationalInsurance.class4Lower > 0) {
      doc.text(`Class 4 (6%): ${formatMoney(report.tax.nationalInsurance.class4Lower)}`)
    }
    if (report.tax.nationalInsurance.class4Upper > 0) {
      doc.text(`Class 4 (2%): ${formatMoney(report.tax.nationalInsurance.class4Upper)}`)
    }

    doc.moveDown(1.5)

    // Deductions
    if (report.deductions.totalAdditional > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Additional Deductions')
      doc.moveDown(0.5)
      doc.fontSize(11).font('Helvetica')

      if (report.deductions.mileage) {
        doc.text(`Mileage: ${report.deductions.mileage.miles.toLocaleString()} miles = ${formatMoney(report.deductions.mileage.amount)}`)
      }
      if (report.deductions.useOfHome) {
        doc.text(`Use of Home: ${formatMoney(report.deductions.useOfHome.amount)} (${report.deductions.useOfHome.method})`)
      }
      doc.text(`Total Additional Deductions: ${formatMoney(report.deductions.totalAdditional)}`)

      doc.moveDown(1.5)
    }

    // Payments on Account
    if (report.tax.paymentsOnAccount.required) {
      doc.fontSize(16).font('Helvetica-Bold').text('Payments on Account')
      doc.moveDown(0.5)
      doc.fontSize(11).font('Helvetica')
      doc.text(`First Payment (31 Jan): ${formatMoney(report.tax.paymentsOnAccount.firstPayment)}`)
      doc.text(`Second Payment (31 Jul): ${formatMoney(report.tax.paymentsOnAccount.secondPayment)}`)
      doc.moveDown(1.5)
    }

    // Expense Categories
    if (report.expenses.byCategory.length > 0) {
      doc.addPage()
      doc.fontSize(16).font('Helvetica-Bold').text('Expense Breakdown by Category')
      doc.moveDown(0.5)
      doc.fontSize(11).font('Helvetica')

      report.expenses.byCategory.slice(0, 10).forEach(cat => {
        doc.text(`${cat.category}: ${formatMoney(cat.amount)} (${cat.percentage}%)`)
      })

      doc.moveDown(1.5)
    }

    // AI Insights
    if (report.insights.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Key Insights')
      doc.moveDown(0.5)

      report.insights.forEach(insight => {
        doc.fontSize(12).font('Helvetica-Bold').text(`• ${insight.title}`)
        doc.fontSize(11).font('Helvetica').text(insight.description)
        doc.moveDown(0.5)
      })

      doc.moveDown(1)
    }

    // Action Items
    if (report.actionItems.length > 0) {
      doc.fontSize(16).font('Helvetica-Bold').text('Action Items')
      doc.moveDown(0.5)

      report.actionItems.forEach(item => {
        const priority = item.priority === 'high' ? '[HIGH]' : item.priority === 'medium' ? '[MED]' : '[LOW]'
        doc.fontSize(11).font('Helvetica')
          .text(`${priority} ${item.title}${item.deadline ? ` - Due: ${item.deadline}` : ''}`)
        doc.fontSize(10).fillColor('#666').text(item.description)
        doc.fillColor('#000').moveDown(0.3)
      })
    }

    // Footer
    doc.moveDown(2)
    doc.fontSize(9).fillColor('#999')
      .text('Generated by TaxFolio - www.taxfol.io', { align: 'center' })
    doc.text('This is an estimate only. Please consult a qualified accountant for tax advice.', { align: 'center' })

    doc.end()

    // Wait for PDF generation to complete
    await new Promise<void>((resolve) => doc.on('end', resolve))

    const pdfBuffer = Buffer.concat(chunks)

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TaxFolio-Year-End-${taxYear}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
