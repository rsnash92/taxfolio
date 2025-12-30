import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ArrowRight, Building2, TrendingUp, TrendingDown, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { TaxSummaryCard } from "@/components/tax-summary-card"
import { PropertyTaxCard } from "@/components/property-tax-card"

interface TransactionData {
  amount: number
  review_status: string
  category: { code: string; name: string; type: string } | null
}

interface AccountData {
  id: string
  name: string
  mask: string | null
  bank_connections: { institution_name: string; last_synced_at: string | null } | null
}

async function getTaxSummary(supabase: Awaited<ReturnType<typeof createClient>>, taxYear: string) {
  const { data } = await supabase
    .from('transactions')
    .select(`
      amount,
      review_status,
      category:categories!transactions_category_id_fkey(code, name, type)
    `)
    .eq('tax_year', taxYear)

  const transactions = data as TransactionData[] | null

  let totalIncome = 0
  let totalExpenses = 0
  let pendingCount = 0
  let confirmedCount = 0

  for (const tx of transactions || []) {
    if (tx.review_status === 'pending') pendingCount++
    if (tx.review_status === 'confirmed') confirmedCount++

    const category = tx.category
    if (tx.review_status === 'confirmed' && category) {
      if (category.type === 'income') {
        totalIncome += Math.abs(tx.amount)
      } else if (category.type === 'expense') {
        totalExpenses += Math.abs(tx.amount)
      }
    }
  }

  const netProfit = totalIncome - totalExpenses
  const totalTransactions = (transactions?.length || 0)
  const reviewProgress = totalTransactions > 0
    ? Math.round((confirmedCount / totalTransactions) * 100)
    : 0

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    pendingCount,
    confirmedCount,
    totalTransactions,
    reviewProgress,
  }
}

interface OtherYearPending {
  tax_year: string
  count: number
}

async function getOtherYearsPending(supabase: Awaited<ReturnType<typeof createClient>>, currentTaxYear: string): Promise<OtherYearPending[]> {
  const { data } = await supabase
    .from('transactions')
    .select('tax_year')
    .eq('review_status', 'pending')
    .neq('tax_year', currentTaxYear)

  if (!data || data.length === 0) return []

  // Count by tax year
  const counts = new Map<string, number>()
  for (const tx of data) {
    counts.set(tx.tax_year, (counts.get(tx.tax_year) || 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([tax_year, count]) => ({ tax_year, count }))
    .sort((a, b) => b.tax_year.localeCompare(a.tax_year))
}

async function getAccounts(supabase: Awaited<ReturnType<typeof createClient>>): Promise<AccountData[]> {
  const { data } = await supabase
    .from('accounts')
    .select('id, name, mask, bank_connections(institution_name, last_synced_at)')
    .eq('is_business_account', true)

  return (data as AccountData[] | null) || []
}

function getCurrentTaxYear(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  if (month > 4 || (month === 4 && day >= 6)) {
    return `${year}-${(year + 1).toString().slice(-2)}`
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`
  }
}

interface PageProps {
  searchParams: Promise<{ tax_year?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const taxYear = params.tax_year || getCurrentTaxYear()
  const [summary, accounts, otherYearsPending] = await Promise.all([
    getTaxSummary(supabase, taxYear),
    getAccounts(supabase),
    getOtherYearsPending(supabase, taxYear),
  ])

  return (
    <div className="space-y-6">
      {/* Other Tax Years Alert */}
      {otherYearsPending.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Transactions in other tax years</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <span>You have pending transactions in previous tax years that need review:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {otherYearsPending.map(({ tax_year, count }) => (
                <Link key={tax_year} href={`/transactions?status=pending`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {tax_year}: {count} pending
                  </Badge>
                </Link>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{summary.totalIncome.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">From confirmed transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{summary.totalExpenses.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Business expenses only</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <Badge variant={summary.netProfit >= 0 ? "default" : "destructive"}>
              {summary.netProfit >= 0 ? "Profit" : "Loss"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">£{summary.netProfit.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Income minus expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Review Progress</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.reviewProgress}%</div>
            <Progress value={summary.reviewProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {summary.confirmedCount} of {summary.totalTransactions} reviewed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Review
            </CardTitle>
            <CardDescription>
              Transactions waiting for your confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {summary.pendingCount > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold">{summary.pendingCount}</span>
                  <Link href="/transactions?status=pending">
                    <Button>
                      Review now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI has suggested categories for these transactions. Review and confirm to update your tax position.
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <p className="font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending transactions to review</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Self-Employment Tax Summary */}
        <TaxSummaryCard taxYear={taxYear} />
      </div>

      {/* Property Income Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PropertyTaxCard taxYear={taxYear} />
      </div>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Your business bank accounts synced with TaxFolio
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.bank_connections?.institution_name} •••• {account.mask}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">Business</Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {account.bank_connections?.last_synced_at
                        ? `Synced ${new Date(account.bank_connections.last_synced_at).toLocaleDateString()}`
                        : 'Not synced'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="font-medium">No accounts connected</p>
              <p className="text-sm text-muted-foreground mb-4">
                Connect your business bank account to start tracking transactions
              </p>
              <Link href="/accounts">
                <Button>
                  <Building2 className="mr-2 h-4 w-4" />
                  Connect Bank
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
