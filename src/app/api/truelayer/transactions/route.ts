import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/truelayer/client';
import { getMtdCategory } from '@/lib/mtd/category-mapping';
import type { MtdTransaction } from '@/types/mtd';

interface TrueLayerTransaction {
  transaction_id: string;
  timestamp: string;
  description: string;
  amount: number;
  currency: string;
  transaction_type: string;
  transaction_category: string;
  merchant_name?: string;
}

/**
 * POST /api/truelayer/transactions
 * Fetch transactions for a given period from connected bank accounts
 * Body: { connectionId?, fromDate, toDate, businessType? }
 */
export async function POST(request: NextRequest) {
  const bankConnectionCookie = request.cookies.get('bank_connection')?.value;

  if (!bankConnectionCookie) {
    return NextResponse.json(
      { error: 'No bank connection found. Please connect your bank first.' },
      { status: 400 }
    );
  }

  let bankConnection;
  try {
    bankConnection = JSON.parse(bankConnectionCookie);
  } catch {
    return NextResponse.json(
      { error: 'Invalid bank connection data' },
      { status: 400 }
    );
  }

  // Check if token has expired
  if (bankConnection.expiresAt && Date.now() > bankConnection.expiresAt) {
    return NextResponse.json(
      { error: 'Bank connection expired. Please reconnect your bank.' },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { fromDate, toDate, businessType, accountIds } = body as {
    fromDate?: string;
    toDate?: string;
    businessType?: 'self-employment' | 'uk-property';
    accountIds?: string[];
  };

  if (!fromDate || !toDate) {
    return NextResponse.json(
      { error: 'fromDate and toDate are required' },
      { status: 400 }
    );
  }

  // Use provided account IDs or all accounts
  const accountsToFetch = accountIds
    ? bankConnection.accounts.filter((a: { account_id: string }) =>
        accountIds.includes(a.account_id)
      )
    : bankConnection.accounts;

  if (!accountsToFetch || accountsToFetch.length === 0) {
    return NextResponse.json(
      { error: 'No accounts to fetch from' },
      { status: 400 }
    );
  }

  const allTransactions: MtdTransaction[] = [];
  const errors: string[] = [];
  const bt = businessType || 'self-employment';

  for (const account of accountsToFetch) {
    try {
      const response = await getTransactions(
        bankConnection.accessToken,
        account.account_id,
        fromDate,
        toDate
      );

      if (response.error) {
        errors.push(`${account.display_name}: ${response.error}`);
        continue;
      }

      const transactions = response.results || [];

      const transformed = transactions.map(
        (tx: TrueLayerTransaction, idx: number) => {
          const isIncome = tx.transaction_type === 'CREDIT';
          const description = tx.description || tx.merchant_name || 'Transaction';
          const amount = isIncome ? Math.abs(tx.amount) : -Math.abs(tx.amount);
          const mtdCategory = getMtdCategory(description, bt);

          return {
            id: tx.transaction_id || `tl-${account.account_id}-${idx}`,
            date: tx.timestamp.split('T')[0],
            description,
            amount,
            merchantName: tx.merchant_name,
            accountId: account.account_id,
            accountName: account.display_name || 'Bank Account',
            category: tx.transaction_category || description,
            mtdCategory: mtdCategory as MtdTransaction['mtdCategory'],
            isExcluded: false,
            isManual: false,
          } satisfies MtdTransaction;
        }
      );

      allTransactions.push(...transformed);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`${account.display_name}: ${errorMsg}`);
    }
  }

  // Sort by date ascending
  allTransactions.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return NextResponse.json({
    transactions: allTransactions,
    count: allTransactions.length,
    accountCount: accountsToFetch.length,
    errors: errors.length > 0 ? errors : undefined,
    bankName: bankConnection.bankName,
  });
}
