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
      // Try with is_visible column; fall back without it if column doesn't exist yet
      let dbAccounts: { id: string; external_account_id: string; name: string; type: string; is_visible?: boolean }[] | null = null;
      const { data: withVisible, error: visErr } = await supabase
        .from('accounts')
        .select('id, external_account_id, name, type, is_visible')
        .eq('bank_connection_id', dbConnection.id);

      if (visErr) {
        // Column probably doesn't exist yet — query without it
        const { data: withoutVisible } = await supabase
          .from('accounts')
          .select('id, external_account_id, name, type')
          .eq('bank_connection_id', dbConnection.id);
        dbAccounts = withoutVisible;
      } else {
        dbAccounts = withVisible;
      }

      // Get transaction counts per account
      const txCountMap = new Map<string, number>();
      if (dbAccounts && dbAccounts.length > 0) {
        const accountIds = dbAccounts.map((a) => a.id);
        const { data: txCounts } = await supabase
          .from('transactions')
          .select('account_id')
          .eq('user_id', user.id)
          .in('account_id', accountIds);

        for (const row of txCounts || []) {
          txCountMap.set(row.account_id, (txCountMap.get(row.account_id) || 0) + 1);
        }
      }

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
              id: a.id,
              account_id: a.external_account_id,
              account_type: a.type || 'TRANSACTION',
              display_name: a.name || 'Account',
              currency: 'GBP',
              is_visible: a.is_visible ?? true,
              transaction_count: txCountMap.get(a.id) || 0,
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
