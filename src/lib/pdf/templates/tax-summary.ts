import { wrapTemplate } from './base'
import { formatCurrency, getTaxYearDates } from '../generator'

interface CategoryBreakdown {
  name: string
  code: string
  hmrc_box: string | null
  amount: number
}

interface TaxSummaryData {
  tax_year: string
  summary: {
    total_income: number
    total_expenses: number
    net_profit: number
    income_tax: number
    class2_ni: number
    class4_ni: number
    total_tax: number
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
  transaction_counts: {
    total: number
    pending: number
    confirmed: number
    personal_excluded: number
    reviewed_percentage: number
  }
}

export function generateTaxSummaryHTML(data: TaxSummaryData): string {
  const { start, end } = getTaxYearDates(data.tax_year)

  const content = `
    <div class="section">
      <div class="highlight-box">
        <div class="highlight-title">Estimated Tax Liability for ${data.tax_year}</div>
        <div class="highlight-value">${formatCurrency(data.summary.total_tax)}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Financial Summary (${start} - ${end})</div>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-title">Total Income</div>
          <div class="card-value income">${formatCurrency(data.summary.total_income)}</div>
        </div>
        <div class="card">
          <div class="card-title">Total Expenses</div>
          <div class="card-value expense">${formatCurrency(data.summary.total_expenses)}</div>
        </div>
        <div class="card">
          <div class="card-title">Net Profit</div>
          <div class="card-value">${formatCurrency(data.summary.net_profit)}</div>
        </div>
        <div class="card">
          <div class="card-title">Total Tax Due</div>
          <div class="card-value">${formatCurrency(data.summary.total_tax)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Tax Breakdown</div>
      <table>
        <thead>
          <tr>
            <th>Tax Type</th>
            <th class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Income Tax</td>
            <td class="text-right">${formatCurrency(data.summary.income_tax)}</td>
          </tr>
          <tr>
            <td>Class 2 National Insurance</td>
            <td class="text-right">${formatCurrency(data.summary.class2_ni)}</td>
          </tr>
          <tr>
            <td>Class 4 National Insurance</td>
            <td class="text-right">${formatCurrency(data.summary.class4_ni)}</td>
          </tr>
          <tr class="summary-row">
            <td><strong>Total Tax Due</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.summary.total_tax)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="grid grid-2">
      <div class="section">
        <div class="section-title">Income Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>HMRC Ref</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.income_breakdown.length > 0 ? data.income_breakdown.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="hmrc-ref">${item.hmrc_box || '-'}</td>
                <td class="text-right">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('') : '<tr><td colspan="3" class="text-center">No income recorded</td></tr>'}
            ${data.income_breakdown.length > 0 ? `
              <tr class="summary-row">
                <td colspan="2"><strong>Total Income</strong></td>
                <td class="text-right"><strong>${formatCurrency(data.summary.total_income)}</strong></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Expenses Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>HMRC Ref</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${data.expenses_breakdown.length > 0 ? data.expenses_breakdown.map(item => `
              <tr>
                <td>${item.name}</td>
                <td class="hmrc-ref">${item.hmrc_box || '-'}</td>
                <td class="text-right">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('') : '<tr><td colspan="3" class="text-center">No expenses recorded</td></tr>'}
            ${data.expenses_breakdown.length > 0 ? `
              <tr class="summary-row">
                <td colspan="2"><strong>Total Expenses</strong></td>
                <td class="text-right"><strong>${formatCurrency(data.summary.total_expenses)}</strong></td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Additional Deductions</div>
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title">Mileage Allowance (${data.mileage.trip_count} trips, ${data.mileage.total_miles.toLocaleString()} miles)</div>
          <div class="card-value">${formatCurrency(data.mileage.total_allowance)}</div>
          <div class="hmrc-ref">SA103 Box 20</div>
        </div>
        <div class="card">
          <div class="card-title">Use of Home${data.home_office.method ? ` (${data.home_office.method === 'simplified' ? 'Simplified Method' : 'Actual Costs'})` : ''}</div>
          <div class="card-value">${formatCurrency(data.home_office.deduction)}</div>
          <div class="hmrc-ref">SA103 Box 20</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Transaction Review Status</div>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-title">Total Transactions</div>
          <div class="card-value">${data.transaction_counts.total.toLocaleString()}</div>
        </div>
        <div class="card">
          <div class="card-title">Confirmed</div>
          <div class="card-value income">${data.transaction_counts.confirmed.toLocaleString()}</div>
        </div>
        <div class="card">
          <div class="card-title">Pending Review</div>
          <div class="card-value" style="color: #f59e0b;">${data.transaction_counts.pending.toLocaleString()}</div>
        </div>
        <div class="card">
          <div class="card-title">Review Progress</div>
          <div class="card-value">${data.transaction_counts.reviewed_percentage}%</div>
        </div>
      </div>
    </div>

    ${data.transaction_counts.pending > 0 ? `
      <div class="notes">
        <div class="notes-title">Action Required</div>
        <div class="notes-content">
          You have ${data.transaction_counts.pending} transactions pending review.
          Review and confirm all transactions before submitting your tax return to ensure accuracy.
        </div>
      </div>
    ` : ''}
  `

  return wrapTemplate(content, 'Tax Summary Report', data.tax_year)
}
