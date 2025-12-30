import { wrapTemplate } from './base'
import { formatCurrency, formatDate, getTaxYearDates } from '../generator'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category_name: string | null
  category_type: string | null
  account_name: string | null
  review_status: string
}

interface TransactionsData {
  tax_year: string
  transactions: Transaction[]
  summary: {
    total_income: number
    total_expenses: number
    total_personal: number
    transaction_count: number
  }
}

export function generateTransactionsHTML(data: TransactionsData): string {
  const { start, end } = getTaxYearDates(data.tax_year)

  // Group transactions by month
  const byMonth: Record<string, Transaction[]> = {}
  for (const tx of data.transactions) {
    const date = new Date(tx.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = []
    }
    byMonth[monthKey].push(tx)
  }

  const sortedMonths = Object.keys(byMonth).sort()

  const content = `
    <div class="section">
      <div class="section-title">Transaction Summary (${start} - ${end})</div>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-title">Total Transactions</div>
          <div class="card-value">${data.summary.transaction_count.toLocaleString()}</div>
        </div>
        <div class="card">
          <div class="card-title">Business Income</div>
          <div class="card-value income">${formatCurrency(data.summary.total_income)}</div>
        </div>
        <div class="card">
          <div class="card-title">Business Expenses</div>
          <div class="card-value expense">${formatCurrency(data.summary.total_expenses)}</div>
        </div>
        <div class="card">
          <div class="card-title">Personal (Excluded)</div>
          <div class="card-value">${formatCurrency(data.summary.total_personal)}</div>
        </div>
      </div>
    </div>

    ${sortedMonths.map((monthKey, index) => {
      const monthTxs = byMonth[monthKey]
      const date = new Date(monthKey + '-01')
      const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

      const monthIncome = monthTxs
        .filter(tx => tx.category_type === 'income')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

      const monthExpenses = monthTxs
        .filter(tx => tx.category_type === 'expense')
        .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

      return `
        ${index > 0 && index % 3 === 0 ? '<div class="page-break"></div>' : ''}
        <div class="section">
          <div class="section-title" style="display: flex; justify-content: space-between;">
            <span>${monthName}</span>
            <span style="font-weight: normal; color: #666;">
              Income: ${formatCurrency(monthIncome)} | Expenses: ${formatCurrency(monthExpenses)}
            </span>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 80px;">Date</th>
                <th>Description</th>
                <th style="width: 120px;">Category</th>
                <th style="width: 100px;">Account</th>
                <th class="text-right" style="width: 100px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${monthTxs.map(tx => {
                const isIncome = tx.category_type === 'income'
                const isPersonal = tx.category_name?.toLowerCase() === 'personal'
                return `
                  <tr>
                    <td>${formatDate(tx.date)}</td>
                    <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      ${tx.description}
                    </td>
                    <td>
                      <span class="badge ${isIncome ? 'badge-income' : isPersonal ? 'badge-personal' : 'badge-expense'}">
                        ${tx.category_name || 'Uncategorized'}
                      </span>
                    </td>
                    <td style="font-size: 10px; color: #666;">${tx.account_name || '-'}</td>
                    <td class="text-right" style="color: ${isIncome ? '#15803d' : isPersonal ? '#666' : '#dc2626'};">
                      ${isIncome ? '' : '-'}${formatCurrency(Math.abs(tx.amount))}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
      `
    }).join('')}

    <div class="notes">
      <div class="notes-title">Notes</div>
      <div class="notes-content">
        <ul style="margin: 0; padding-left: 16px;">
          <li>Transactions marked as "Personal" are excluded from tax calculations</li>
          <li>All amounts are shown in GBP</li>
          <li>Keep original receipts and invoices for at least 5 years</li>
        </ul>
      </div>
    </div>
  `

  return wrapTemplate(content, 'Transaction Report', data.tax_year)
}
