import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export interface PDFOptions {
  html: string
  filename: string
  landscape?: boolean
}

export async function generatePDF({ html, landscape = false }: PDFOptions): Promise<Buffer> {
  // Disable graphics for faster PDF generation
  chromium.setGraphicsMode = false

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1200, height: 1600 },
    executablePath: await chromium.executablePath(),
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      landscape,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function getTaxYearDates(taxYear: string): { start: string; end: string } {
  const [startYear] = taxYear.split('-').map(Number)
  return {
    start: `6 April ${startYear}`,
    end: `5 April ${startYear + 1}`,
  }
}
