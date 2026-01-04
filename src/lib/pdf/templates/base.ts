export const baseStyles = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    color: #1a1a1a;
    background: white;
  }

  .container {
    padding: 0;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 20px;
    border-bottom: 2px solid #00e3ec;
    margin-bottom: 30px;
  }

  .logo {
    font-size: 24px;
    font-weight: 700;
    color: #00e3ec;
  }

  .logo-sub {
    font-size: 12px;
    color: #666;
    margin-top: 4px;
  }

  .report-info {
    text-align: right;
  }

  .report-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .report-date {
    font-size: 11px;
    color: #666;
    margin-top: 4px;
  }

  /* Section */
  .section {
    margin-bottom: 24px;
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 12px;
  }

  /* Cards */
  .card {
    background: #f9fafb;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .card-title {
    font-size: 11px;
    font-weight: 500;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .card-value {
    font-size: 20px;
    font-weight: 600;
    color: #1a1a1a;
  }

  .card-value.income {
    color: #00e3ec;
  }

  .card-value.expense {
    color: #ef4444;
  }

  /* Grid */
  .grid {
    display: grid;
    gap: 12px;
  }

  .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  .grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;
  }

  th, td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e5e5e5;
  }

  th {
    background: #f9fafb;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.5px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  .text-right {
    text-align: right;
  }

  .text-center {
    text-align: center;
  }

  /* Summary row */
  .summary-row {
    background: #f0fdf4;
    font-weight: 600;
  }

  .summary-row td {
    border-top: 2px solid #00e3ec;
    padding-top: 12px;
    padding-bottom: 12px;
  }

  /* Status badges */
  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
  }

  .badge-income {
    background: #dcfce7;
    color: #166534;
  }

  .badge-expense {
    background: #fef2f2;
    color: #991b1b;
  }

  .badge-personal {
    background: #f3f4f6;
    color: #374151;
  }

  /* Footer */
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e5e5;
    font-size: 10px;
    color: #666;
    text-align: center;
  }

  .footer-disclaimer {
    margin-top: 12px;
    font-style: italic;
    color: #999;
  }

  /* Page break */
  .page-break {
    page-break-before: always;
  }

  /* HMRC Box reference */
  .hmrc-ref {
    font-size: 9px;
    color: #888;
    margin-top: 2px;
  }

  /* Highlight box */
  .highlight-box {
    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
  }

  .highlight-title {
    font-size: 12px;
    color: #166534;
    font-weight: 500;
    margin-bottom: 8px;
  }

  .highlight-value {
    font-size: 28px;
    font-weight: 700;
    color: #15803d;
  }

  /* Notes section */
  .notes {
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;
  }

  .notes-title {
    font-size: 11px;
    font-weight: 600;
    color: #92400e;
    margin-bottom: 8px;
  }

  .notes-content {
    font-size: 11px;
    color: #78350f;
  }
`

export function wrapTemplate(content: string, title: string, taxYear: string): string {
  const now = new Date()
  const generatedDate = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(now)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - TaxFolio</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <div class="logo">TaxFolio</div>
        <div class="logo-sub">Self Assessment Made Simple</div>
      </div>
      <div class="report-info">
        <div class="report-title">${title}</div>
        <div class="report-date">Tax Year ${taxYear} | Generated ${generatedDate}</div>
      </div>
    </div>

    ${content}

    <div class="footer">
      <div>Generated by TaxFolio | taxfolio.io</div>
      <div class="footer-disclaimer">
        This report is for informational purposes only. Please verify all figures before submitting to HMRC.
        TaxFolio is not a registered tax advisor. Consult a qualified accountant for professional tax advice.
      </div>
    </div>
  </div>
</body>
</html>
`
}
