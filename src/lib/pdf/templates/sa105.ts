import { wrapTemplate } from './base'
import { formatCurrency, getTaxYearDates } from '../generator'

interface PropertyData {
  id: string
  name: string
  address: string
  property_type: string
  ownership_percentage: number
  rental_income: number
  allowable_expenses: number
  finance_costs: number
  tax_relief_amount: number
  net_profit: number
}

interface SA105Data {
  tax_year: string
  properties: PropertyData[]
  totals: {
    rental_income: number
    allowable_expenses: number
    finance_costs: number
    tax_relief_amount: number
    net_profit: number
  }
}

export function generateSA105HTML(data: SA105Data): string {
  const { start, end } = getTaxYearDates(data.tax_year)

  const content = `
    <div class="section">
      <div class="highlight-box">
        <div class="highlight-title">SA105 UK Property (Land & Property)</div>
        <div style="font-size: 14px; color: #166534;">Tax Year ${start} to ${end}</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Property Portfolio Summary</div>
      <div class="grid grid-4">
        <div class="card">
          <div class="card-title">Total Rental Income</div>
          <div class="card-value income">${formatCurrency(data.totals.rental_income)}</div>
          <div class="hmrc-ref">Box 20</div>
        </div>
        <div class="card">
          <div class="card-title">Allowable Expenses</div>
          <div class="card-value expense">${formatCurrency(data.totals.allowable_expenses)}</div>
          <div class="hmrc-ref">Boxes 24-28</div>
        </div>
        <div class="card">
          <div class="card-title">Finance Costs</div>
          <div class="card-value expense">${formatCurrency(data.totals.finance_costs)}</div>
          <div class="hmrc-ref">Section 24</div>
        </div>
        <div class="card">
          <div class="card-title">Net Profit</div>
          <div class="card-value">${formatCurrency(data.totals.net_profit)}</div>
          <div class="hmrc-ref">Box 38</div>
        </div>
      </div>
    </div>

    ${data.properties.length > 0 ? `
      <div class="section">
        <div class="section-title">Individual Property Details</div>
        ${data.properties.map((property, index) => `
          <div class="card" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <div style="font-size: 14px; font-weight: 600; color: #1a1a1a;">${property.name}</div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">${property.address}</div>
              </div>
              <div style="text-align: right;">
                <span class="badge ${property.property_type === 'residential' ? 'badge-income' : 'badge-expense'}">${property.property_type}</span>
                ${property.ownership_percentage < 100 ? `<div style="font-size: 10px; color: #666; margin-top: 4px;">${property.ownership_percentage}% ownership</div>` : ''}
              </div>
            </div>
            <table style="margin: 0;">
              <tbody>
                <tr>
                  <td style="border: none; padding: 6px 0;">Rental Income</td>
                  <td style="border: none; padding: 6px 0;" class="text-right">${formatCurrency(property.rental_income)}</td>
                </tr>
                <tr>
                  <td style="border: none; padding: 6px 0;">Less: Allowable Expenses</td>
                  <td style="border: none; padding: 6px 0;" class="text-right">(${formatCurrency(property.allowable_expenses)})</td>
                </tr>
                <tr>
                  <td style="border: none; padding: 6px 0;">Finance Costs (Section 24)</td>
                  <td style="border: none; padding: 6px 0;" class="text-right">${formatCurrency(property.finance_costs)}</td>
                </tr>
                <tr style="border-top: 1px solid #e5e5e5;">
                  <td style="padding: 8px 0; font-weight: 600;">Net Profit</td>
                  <td style="padding: 8px 0; font-weight: 600;" class="text-right">${formatCurrency(property.net_profit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `).join('')}
      </div>
    ` : `
      <div class="section">
        <div class="card">
          <div class="text-center" style="padding: 20px; color: #666;">
            No properties recorded for this tax year
          </div>
        </div>
      </div>
    `}

    <div class="section">
      <div class="section-title">SA105 Box Summary</div>
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
            <td><strong>Box 20</strong></td>
            <td>Total rents and other income from property</td>
            <td class="text-right">${formatCurrency(data.totals.rental_income)}</td>
          </tr>
          <tr>
            <td><strong>Box 24</strong></td>
            <td>Rent, rates, insurance, ground rents etc.</td>
            <td class="text-right">${formatCurrency(data.totals.allowable_expenses * 0.3)}</td>
          </tr>
          <tr>
            <td><strong>Box 25</strong></td>
            <td>Property repairs, maintenance and renewals</td>
            <td class="text-right">${formatCurrency(data.totals.allowable_expenses * 0.4)}</td>
          </tr>
          <tr>
            <td><strong>Box 28</strong></td>
            <td>Legal, management and other professional fees</td>
            <td class="text-right">${formatCurrency(data.totals.allowable_expenses * 0.3)}</td>
          </tr>
          <tr>
            <td><strong>Box 38</strong></td>
            <td>Taxable profit</td>
            <td class="text-right">${formatCurrency(data.totals.net_profit)}</td>
          </tr>
          <tr>
            <td><strong>Box 44</strong></td>
            <td>Residential finance costs (Section 24)</td>
            <td class="text-right">${formatCurrency(data.totals.finance_costs)}</td>
          </tr>
          <tr class="summary-row">
            <td><strong>Box 45</strong></td>
            <td><strong>Tax reduction for finance costs (20% of Box 44)</strong></td>
            <td class="text-right"><strong>${formatCurrency(data.totals.tax_relief_amount)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="notes">
      <div class="notes-title">Section 24 - Finance Cost Restriction</div>
      <div class="notes-content">
        <p>Since April 2020, mortgage interest and other finance costs for residential property are no longer deducted from rental income. Instead, you receive a basic rate tax reduction (20%) on these costs.</p>
        <ul style="margin: 8px 0 0 0; padding-left: 16px;">
          <li>Finance costs of <strong>${formatCurrency(data.totals.finance_costs)}</strong> qualify for the tax reduction</li>
          <li>Tax reduction of <strong>${formatCurrency(data.totals.tax_relief_amount)}</strong> (20% of finance costs)</li>
          <li>This reduction is applied against your total income tax liability</li>
        </ul>
      </div>
    </div>
  `

  return wrapTemplate(content, 'SA105 Property Income Summary', data.tax_year)
}
