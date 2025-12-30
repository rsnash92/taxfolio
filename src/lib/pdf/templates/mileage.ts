import { wrapTemplate } from './base'
import { formatCurrency, formatDate, getTaxYearDates } from '../generator'

interface MileageTrip {
  id: string
  date: string
  from_location: string
  to_location: string
  miles: number
  purpose: string | null
  is_round_trip: boolean
}

interface MileageData {
  tax_year: string
  trips: MileageTrip[]
  summary: {
    total_miles: number
    total_allowance: number
    trip_count: number
    first_10k_miles: number
    first_10k_allowance: number
    remaining_miles: number
    remaining_allowance: number
  }
}

export function generateMileageHTML(data: MileageData): string {
  const { start, end } = getTaxYearDates(data.tax_year)

  // Group trips by month
  const byMonth: Record<string, MileageTrip[]> = {}
  for (const trip of data.trips) {
    const date = new Date(trip.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = []
    }
    byMonth[monthKey].push(trip)
  }

  const sortedMonths = Object.keys(byMonth).sort()

  const content = `
    <div class="section">
      <div class="highlight-box">
        <div class="highlight-title">Total Mileage Allowance Claim</div>
        <div class="highlight-value">${formatCurrency(data.summary.total_allowance)}</div>
        <div style="font-size: 12px; color: #166534; margin-top: 8px;">
          ${data.summary.total_miles.toLocaleString()} miles across ${data.summary.trip_count} trips
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Allowance Calculation (${start} - ${end})</div>
      <table>
        <thead>
          <tr>
            <th>Rate Band</th>
            <th class="text-right">Miles</th>
            <th class="text-right">Rate</th>
            <th class="text-right">Allowance</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>First 10,000 miles</td>
            <td class="text-right">${data.summary.first_10k_miles.toLocaleString()}</td>
            <td class="text-right">45p/mile</td>
            <td class="text-right">${formatCurrency(data.summary.first_10k_allowance)}</td>
          </tr>
          <tr>
            <td>Miles over 10,000</td>
            <td class="text-right">${data.summary.remaining_miles.toLocaleString()}</td>
            <td class="text-right">25p/mile</td>
            <td class="text-right">${formatCurrency(data.summary.remaining_allowance)}</td>
          </tr>
          <tr class="summary-row">
            <td><strong>Total</strong></td>
            <td class="text-right"><strong>${data.summary.total_miles.toLocaleString()}</strong></td>
            <td></td>
            <td class="text-right"><strong>${formatCurrency(data.summary.total_allowance)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Monthly Summary</div>
      <div class="grid grid-4">
        ${sortedMonths.map(monthKey => {
          const monthTrips = byMonth[monthKey]
          const date = new Date(monthKey + '-01')
          const monthName = date.toLocaleDateString('en-GB', { month: 'short' })
          const totalMiles = monthTrips.reduce((sum, t) => sum + t.miles, 0)
          return `
            <div class="card" style="text-align: center;">
              <div class="card-title">${monthName}</div>
              <div style="font-size: 16px; font-weight: 600;">${totalMiles.toLocaleString()} mi</div>
              <div style="font-size: 10px; color: #666;">${monthTrips.length} trips</div>
            </div>
          `
        }).join('')}
      </div>
    </div>

    ${sortedMonths.length > 0 ? `
      <div class="page-break"></div>
      <div class="section">
        <div class="section-title">Detailed Trip Log</div>
        ${sortedMonths.map(monthKey => {
          const monthTrips = byMonth[monthKey]
          const date = new Date(monthKey + '-01')
          const monthName = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
          const monthMiles = monthTrips.reduce((sum, t) => sum + t.miles, 0)

          return `
            <div style="margin-bottom: 20px;">
              <div style="font-size: 12px; font-weight: 600; color: #1a1a1a; margin-bottom: 8px; display: flex; justify-content: space-between;">
                <span>${monthName}</span>
                <span style="font-weight: normal; color: #666;">${monthMiles.toLocaleString()} miles</span>
              </div>
              <table>
                <thead>
                  <tr>
                    <th style="width: 70px;">Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Purpose</th>
                    <th class="text-center" style="width: 60px;">Type</th>
                    <th class="text-right" style="width: 70px;">Miles</th>
                  </tr>
                </thead>
                <tbody>
                  ${monthTrips.map(trip => `
                    <tr>
                      <td>${formatDate(trip.date)}</td>
                      <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${trip.from_location}
                      </td>
                      <td style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${trip.to_location}
                      </td>
                      <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                        ${trip.purpose || '-'}
                      </td>
                      <td class="text-center">
                        <span class="badge ${trip.is_round_trip ? 'badge-income' : 'badge-personal'}">
                          ${trip.is_round_trip ? 'Return' : 'Single'}
                        </span>
                      </td>
                      <td class="text-right">${trip.miles.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `
        }).join('')}
      </div>
    ` : `
      <div class="section">
        <div class="card">
          <div class="text-center" style="padding: 20px; color: #666;">
            No mileage trips recorded for this tax year
          </div>
        </div>
      </div>
    `}

    <div class="notes">
      <div class="notes-title">HMRC Mileage Rates (2024-25)</div>
      <div class="notes-content">
        <table style="width: auto; margin-bottom: 12px;">
          <tr>
            <td style="border: none; padding: 4px 16px 4px 0;">Cars and vans (first 10,000 miles)</td>
            <td style="border: none; padding: 4px 0; font-weight: 600;">45p per mile</td>
          </tr>
          <tr>
            <td style="border: none; padding: 4px 16px 4px 0;">Cars and vans (over 10,000 miles)</td>
            <td style="border: none; padding: 4px 0; font-weight: 600;">25p per mile</td>
          </tr>
          <tr>
            <td style="border: none; padding: 4px 16px 4px 0;">Motorcycles</td>
            <td style="border: none; padding: 4px 0; font-weight: 600;">24p per mile</td>
          </tr>
          <tr>
            <td style="border: none; padding: 4px 16px 4px 0;">Bicycles</td>
            <td style="border: none; padding: 4px 0; font-weight: 600;">20p per mile</td>
          </tr>
        </table>
        <p style="margin-top: 8px;">This log should be kept for at least 5 years. Include odometer readings where available for additional verification.</p>
      </div>
    </div>
  `

  return wrapTemplate(content, 'Mileage Log Report', data.tax_year)
}
