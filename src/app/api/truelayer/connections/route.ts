import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/truelayer/connections
 * Returns the user's bank connections from Supabase (preferred) or cookie (fallback)
 */
export async function GET(request: NextRequest) {
  // Try Supabase first
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: dbConnection } = await supabase
      .from('bank_connections')
      .select('id, institution_name, status, last_synced_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (dbConnection) {
      const { data: dbAccounts } = await supabase
        .from('accounts')
        .select('external_account_id, name, type')
        .eq('bank_connection_id', dbConnection.id);

      return NextResponse.json({
        connections: [
          {
            id: dbConnection.id,
            provider_id: 'truelayer',
            bank_name: dbConnection.institution_name || 'Connected Bank',
            status: dbConnection.status,
            created_at: dbConnection.created_at,
            last_synced_at: dbConnection.last_synced_at,
            persisted: true,
            accounts: (dbAccounts || []).map((a) => ({
              account_id: a.external_account_id,
              account_type: a.type || 'TRANSACTION',
              display_name: a.name || 'Account',
              currency: 'GBP',
            })),
          },
        ],
        connected: true,
      });
    }
  }

  // Fallback to cookie
  const bankConnectionCookie = request.cookies.get('bank_connection')?.value;

  if (!bankConnectionCookie) {
    return NextResponse.json({ connections: [], connected: false });
  }

  try {
    const bankConnection = JSON.parse(bankConnectionCookie);

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
          persisted: false,
          accounts: (bankConnection.accounts || []).map(
            (a: {
              account_id: string;
              display_name?: string;
              account_type?: string;
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
