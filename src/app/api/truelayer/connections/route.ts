import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/truelayer/connections
 * Returns the user's bank connection from cookie
 */
export async function GET(request: NextRequest) {
  const bankConnectionCookie = request.cookies.get('bank_connection')?.value;

  if (!bankConnectionCookie) {
    return NextResponse.json({ connections: [], connected: false });
  }

  try {
    const bankConnection = JSON.parse(bankConnectionCookie);

    // Check if token has expired
    if (bankConnection.expiresAt && Date.now() > bankConnection.expiresAt) {
      return NextResponse.json({
        connections: [],
        connected: false,
        error: 'Token expired',
      });
    }

    return NextResponse.json({
      connections: [
        {
          id: 'cookie-connection',
          provider_id: 'truelayer',
          bank_name: bankConnection.bankName || 'Connected Bank',
          status: 'active',
          created_at: new Date().toISOString(),
          accounts: (bankConnection.accounts || []).map(
            (a: {
              account_id: string;
              display_name?: string;
              account_type?: string;
              provider_name?: string;
            }) => ({
              account_id: a.account_id,
              account_type: a.account_type || 'TRANSACTION',
              display_name: a.display_name || 'Account',
              currency: 'GBP',
            })
          ),
        },
      ],
      connected: true,
    });
  } catch {
    return NextResponse.json({
      connections: [],
      connected: false,
      error: 'Invalid connection data',
    });
  }
}
