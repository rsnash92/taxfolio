import { wrapTemplate } from './base'
import { formatCurrency, getTaxYearDates } from '../generator'

interface CategoryBreakdown {
  name: string
  code: string
  hmrc_box: string | null
  amount: number
}

interface SA103Data {
  tax_year: string
  summary: {
    total_income: number
    total_expenses: number
    net_profit: number
  }
  income_breakdown: CategoryBreakdown[]
  expenses_breakdown: CategoryBreakdown[]
  mileage: {
    total_miles: number
    total_allowance: number
    trip_count: number
  }
  home_office: {
    deduction: number
    method: string | null
  }
}

// Group expenses by HMRC box for SA103
function groupByHMRCBox(items: CategoryBreakdown[]): Record<string, { total: number; items: CategoryBreakdown[] }> {
  const grouped: Record<string, { total: number; items: CategoryBreakdown[] }> = {}

  for (const item of items) {
    const box = item.hmrc_box || 'Other'
    if (!grouped[box]) {
      grouped[box] = { total: 0, items: [] }
    }
    grouped[box].total += item.amount
    grouped[box].items.push(item)
  }

  return grouped
}

export function generateSA103HTML(data: SA103Data): string {
  const { start, end } = getTaxYearDates(data.tax_year)
  const groupedExpenses = groupByHMRCBox(data.expenses_breakdown)

  // SA103 specific boxes
  const boxes: { box: string; label: string; amount: number }[] = [
    { box: 'Box 15', label: 'Turnover - the sales income', amount: data.summary.total_income },
  ]

  // Add expense boxes
  const expenseBoxMapping: Record<string, string> = {
    'SA103 Box 17': 'Cost of goods bought for resale',
    'SA103 Box 18': 'Construction industry subcontractor costs',
    'SA103 Box 19': 'Wages, salaries and other staff costs',
    'SA103 Box 20': 'Car, van and travel expenses',
    'SA103 Box 21': 'Rent, rates, power and insurance costs',
    'SA103 Box 22': 'Repairs and renewals of property and equipment',
    'SA103 Box 23': 'Phone, fax, stationery and other office costs',
    'SA103 Box 24': 'Advertising and business entertainment costs',
    'SA103 Box 25': 'Interest on bank and other loans',
    'SA103 Box 26': 'Bank, credit card and other financial charges',
    'SA103 Box 27': 'Irrecoverable debts written off',
    'SA103 Box 28': 'Accountancy, legal and other professional fees',
    'SA103 Box 29': 'Depreciation and loss/profit on sale of assets',
    'SA103 Box 30': 'Other business expenses',
    'SA103 Box 31': 'Total allowable expenses',
  }

  const content = `
    <div class="section">
      <div class="highlight-box">
        <div class="highlight-title">SA103 Self Employment (Short)</div>
        <div style="font-size: 14px; color: #166534;">Tax Year ${start} to ${end}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Business Income</div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Box</th>
            <th>Description</th>
            <th class="text-right" style="width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Box 15</strong></td>
            <td>Turnover - the annual sales income</td>
            <td class="text-right"><strong>${formatCurrency(data.summary.total_income)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Allowable Business Expenses</div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Box</th>
            <th>Description</th>
            <th class="text-right" style="width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(groupedExpenses).map(([box, data]) => {
            const boxNum = box.replace('SA103 ', '')
            const label = expenseBoxMapping[box] || box
            return `
              <tr>
                <td><strong>${boxNum}</strong></td>
                <td>
                  ${label}
                  ${data.items.length > 1 ? `<div class="hmrc-ref">${data.items.map(i => i.name).join(', ')}</div>` : ''}
                </td>
                <td class="text-right">${formatCurrency(data.total)}</td>
              </tr>
            `
          }).join('')}
          <tr class="summary-row">
            <td><strong>Box 31</strong></td>
            <td><strong>Total allowable expenses</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.summary.total_expenses)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Simplified Expenses (Box 20)</div>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Details</th>
            <th class="text-right" style="width: 120px;">Allowance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mileage Allowance</td>
            <td>
              ${data.mileage.trip_count} trips, ${data.mileage.total_miles.toLocaleString()} miles
              <div class="hmrc-ref">First 10,000 miles @ 45p, remaining @ 25p</div>
            </td>
            <td class="text-right">${formatCurrency(data.mileage.total_allowance)}</td>
          </tr>
          <tr>
            <td>Use of Home</td>
            <td>
              ${data.home_office.method === 'simplified' ? 'Flat Rate Method' : data.home_office.method === 'actual' ? 'Actual Costs Method' : 'Not claimed'}
              <div class="hmrc-ref">Working from home allowance</div>
            </td>
            <td class="text-right">${formatCurrency(data.home_office.deduction)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Net Profit Calculation</div>
      <table>
        <thead>
          <tr>
            <th style="width: 80px;">Box</th>
            <th>Description</th>
            <th class="text-right" style="width: 120px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Box 15</td>
            <td>Total turnover</td>
            <td class="text-right">${formatCurrency(data.summary.total_income)}</td>
          </tr>
          <tr>
            <td>Box 31</td>
            <td>Less: Total allowable expenses</td>
            <td class="text-right">(${formatCurrency(data.summary.total_expenses)})</td>
          </tr>
          <tr class="summary-row">
            <td><strong>Box 32</strong></td>
            <td><strong>Net profit (or loss)</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.summary.net_profit)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="notes">
      <div class="notes-title">Important Notes</div>
      <div class="notes-content">
        <ul style="margin: 0; padding-left: 16px;">
          <li>This report is based on confirmed transactions only</li>
          <li>Verify all figures against your records before submitting to HMRC</li>
          <li>Keep supporting documentation for at least 5 years</li>
          <li>Consider using HMRC's official SA103 form for final submission</li>
        </ul>
      </div>
    </div>
  `

  return wrapTemplate(content, 'SA103 Self Employment Summary', data.tax_year)
}
